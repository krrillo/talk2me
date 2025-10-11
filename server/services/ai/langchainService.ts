import { OpenAI } from "openai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { StoryGenerateRequest, GameSpec, EvaluationResponse, Theme, Level } from "@shared/types";
import { validateContentSafety } from "@shared/validation";
import { getLevelConfig, getWordRangeForLevel, getGrammarFocusForLevel } from "../../config/levels.js";
import { buildEnhancedExercisesTemplate } from "../../config/enhancedExerciseTemplates.js";
import { analyzeText, findSuitableSentences } from "../linguistic/sentenceExtractor.js";
import { validateOrderSentence, validateCompleteWords, validateMultiChoice } from "../validators/grammarValidator.js";
import { validateOrderSentenceCoherence, validateCompleteWordsCoherence, validateMultiChoiceCoherence } from "../validators/coherenceValidator.js";
import { validateOrderSentencePedagogy, validateCompleteWordsPedagogy, validateMultiChoicePedagogy } from "../validators/pedagogicalValidator.js";
import { regenerateExerciseWithFeedback } from "./exerciseRegenerator.js";
import { getFallbackExercise, adaptFallbackToStory } from "../../data/fallbackExercises.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class LangChainOrchestrator {
  private llm: ChatOpenAI;
  private parser: JsonOutputParser;

  constructor() {
    this.llm = new ChatOpenAI({
      model: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxTokens: 4000,
      temperature: 0.7,
    });
    
    this.parser = new JsonOutputParser();
  }

  async generateStoryWithExercises(request: StoryGenerateRequest): Promise<{
    story: {
      title: string;
      pages: Array<{ text: string; image?: string }>;
      theme: string;
      level: number;
    };
    exercises: GameSpec[];
  }> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a specialized educational content creator for Spanish language learning for children and young learners (ages 6-16) with hearing difficulties (hipoacusia neurosensorial bilateral).

      Create a story and educational exercises with these requirements:
      - Theme: {theme}
      - Level: {level} (1-10 scale, from beginner to master)
      - Target word count: {wordCount} words
      - Language: Spanish (Spain)
      - Content must be safe, positive, and age-appropriate

      LEVEL {level} SPECIFICATIONS (1-10 scale):
      - Level 1 (Inicial): Simple sentences (SVO), concrete vocabulary, no complex conjugations. Goal: Recognize subject-verb-object
      - Level 2 (Básico): Adjectives, definite/indefinite articles, simple present tense. Goal: Use articles and basic agreement
      - Level 3 (Intermedio): Simple connectors (y, pero, porque), present/past tenses. Goal: Build ideas with connectors
      - Level 4 (Avanzado): Common irregular verbs, plurals, gender agreement. Goal: Reinforce basic spelling
      - Level 5 (Experto): Brief subordinate clauses, pronouns, compound tenses. Goal: Basic subordinate structures
      - Level 6 (Intermedio Alto): Complex connectors, perfect tenses, adverbs of manner and time. Goal: Temporal narrative coherence
      - Level 7 (Avanzado Alto): Compound sentences, precise prepositions. Goal: Master cohesion and connectors
      - Level 8 (Profesional): Idioms, simple metaphors, descriptive style. Goal: Expressive and creative language use
      - Level 9 (Literario): Passive voice, indirect speech, style variations. Goal: Advanced analysis and writing
      - Level 10 (Maestro): Multiple subordinates, mixed tenses, abstract vocabulary. Goal: Free production with style and complete orthographic correction

      Generate content that helps with:
      - Reading comprehension
      - Grammar (gender/number agreement, articles, verb conjugation, complex structures)
      - Vocabulary expansion (from concrete to abstract based on level)
      - Sentence structure and cohesion
      - Spelling and accentuation (increasingly important at higher levels)

      VOCABULARY PRE-TEACHING (CRITICAL for children with hearing difficulties):
      - Select 3-5 KEY words from the story that are essential for comprehension
      - Prioritize words that appear multiple times or are central to the story
      - Provide simple, child-friendly definitions (max 10 words)
      - Create example sentences that differ from the story but use the same word
      - Choose ONE appropriate emoji that visually represents each word (objects: 🐕🌸🏠, actions: 🏃💤🎨, emotions: 😊😢❤️)

      IMPORTANT: Return ONLY valid JSON in this exact format:

      {{
        "story": {{
          "title": "Story title in Spanish",
          "pages": [
            {{"text": "First page text (engaging opening)", "imagePrompt": "DALL-E prompt for illustration"}},
            {{"text": "Second page text (story development)", "imagePrompt": "DALL-E prompt for illustration"}},
            {{"text": "Final page text (satisfying conclusion)", "imagePrompt": "DALL-E prompt for illustration"}}
          ],
          "vocabulary": [
            {{
              "word": "palabra clave",
              "definition": "Definición simple para niños",
              "example": "Frase de ejemplo usando la palabra",
              "emoji": "🌟"
            }}
          ],
          "theme": "{theme}",
          "level": {level}
        }},
        "exercises": [
          {exercisesTemplate}
        ]
      }}

      Focus on these grammar points for level {level}:
      {grammarFocus}

      IMPORTANT: Generate exercises using ONLY these game types appropriate for level {level}:
      {gameTypes}

      EXERCISE TYPE GUIDELINES:
      - drag_words: Extract a sentence from the story, replace ONE word with ___, provide 3 options (1 correct, 2 wrong)
      - order_sentence: Provide 6-8 words from the story that need to be arranged into a correct sentence
      - complete_words: Extract ONE sentence, replace ONE word with ___ (exactly 3 underscores), provide the missing word as "correct"
      - multi_choice: Create a comprehension question with 4 choices about the story
      - free_writing: Open-ended question that requires written response (minLength-maxLength words)

      Advanced game types (if applicable):
      - rewrite_sentence: Provide a sentence with errors for the student to rewrite correctly
      - find_error: Present a sentence and ask student to identify the grammatical error
      - contextual_choice: Multiple choice question requiring deep contextual understanding
    `);

    const levelConfig = getLevelConfig(request.level);
    const grammarFocus = getGrammarFocusForLevel(request.level);
    const wordCount = getWordRangeForLevel(request.level);
    const gameTypes = levelConfig.gameTypes.join(", ");
    const { minLength, maxLength } = this.getWritingLengthForLevel(request.level);
    const exercisesTemplate = buildEnhancedExercisesTemplate(levelConfig.gameTypes, request.level, minLength, maxLength);

    const chain = RunnableSequence.from([prompt, this.llm, this.parser]);

    try {
      const result = await chain.invoke({
        theme: request.theme,
        level: request.level,
        wordCount,
        grammarFocus,
        gameTypes,
        exercisesTemplate,
        minLength,
        maxLength,
      });

      // Validate content safety
      const storyText = result.story.pages.map((p: any) => p.text).join(' ');
      if (!validateContentSafety(storyText)) {
        throw new Error("Generated content failed safety checks");
      }

      // PIPELINE DE CALIDAD PEDAGÓGICA
      console.log('[LangChain] Iniciando validación pedagógica de ejercicios...');
      
      // Analizar texto de la historia
      const textAnalysis = analyzeText(storyText);
      console.log(`[LangChain] Texto analizado: ${textAnalysis.sentenceCount} oraciones, ${textAnalysis.averageWords} palabras promedio`);
      
      // Validar y regenerar ejercicios si es necesario
      const validatedExercises = await this.validateAndRegenerateExercises(
        result.exercises,
        storyText,
        request.level,
        result.story.title
      );
      
      return {
        story: result.story,
        exercises: validatedExercises
      };
    } catch (error) {
      console.error("Error generating story with exercises:", error);
      throw new Error("Failed to generate educational content");
    }
  }

  async evaluateAnswer(exerciseId: string, userAnswer: any, correctAnswer: any, level: number): Promise<EvaluationResponse> {
    const prompt = PromptTemplate.fromTemplate(`
      You are a friendly Spanish language teacher evaluating a child's answer.

      Exercise context:
      - Student level: {level}
      - Correct answer: {correctAnswer}
      - Student answer: {userAnswer}

      Provide encouraging feedback that:
      1. Indicates if the answer is correct or incorrect
      2. Explains why (focus on grammar rules for this level)
      3. Gives specific hints for improvement
      4. Suggests what to study next
      5. Uses encouraging, child-friendly language

      Level {level} focus areas: {grammarFocus}

      Return ONLY valid JSON:
      {{
        "correct": true/false,
        "score": 0-100,
        "message": "Encouraging feedback message in Spanish",
        "hints": ["Helpful hint 1", "Helpful hint 2"],
        "nextSuggestion": "What to practice next",
        "grammarFeedback": ["Specific grammar point 1", "Specific grammar point 2"]
      }}
    `);

    const grammarFocus = getGrammarFocusForLevel(level);
    const chain = RunnableSequence.from([prompt, this.llm, this.parser]);

    try {
      const result = await chain.invoke({
        level,
        correctAnswer: JSON.stringify(correctAnswer),
        userAnswer: JSON.stringify(userAnswer),
        grammarFocus,
      });

      return result;
    } catch (error) {
      console.error("Error evaluating answer:", error);
      // Return fallback response
      const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
      return {
        correct: isCorrect,
        score: isCorrect ? 100 : 0,
        message: isCorrect ? "¡Correcto! ¡Muy bien!" : "No es correcto, pero sigue intentando.",
        hints: ["Revisa la gramática", "Piensa en el contexto de la historia"],
        nextSuggestion: "Practica más ejercicios de este nivel",
      };
    }
  }

  async generateImage(prompt: string, style: string = "flat-illustration"): Promise<string> {
    try {
      const enhancedPrompt = `${prompt}. Style: ${style}, child-friendly, colorful, safe content, no text embedded in image, educational illustration for Spanish learning for children with hearing difficulties, accessible high contrast colors, simple clear composition, vibrant but not overwhelming`;

      console.log(`Generating DALL-E image with prompt: ${enhancedPrompt.substring(0, 100)}...`);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error("No image URL returned from DALL-E");
      }

      console.log(`Successfully generated image: ${imageUrl.substring(0, 50)}...`);
      return imageUrl;
    } catch (error) {
      console.error("Error generating image with DALL-E:", error);
      // Don't throw - return empty string to allow story generation to continue without images
      return "";
    }
  }

  // Removed - now using centralized level config from ../config/levels.ts

  private getWritingLengthForLevel(level: number): { minLength: number; maxLength: number } {
    const lengths = {
      1: { minLength: 30, maxLength: 150 },
      2: { minLength: 50, maxLength: 250 },
      3: { minLength: 80, maxLength: 350 },
      4: { minLength: 100, maxLength: 450 },
      5: { minLength: 120, maxLength: 500 },
      6: { minLength: 150, maxLength: 600 },
      7: { minLength: 180, maxLength: 700 },
      8: { minLength: 200, maxLength: 800 },
      9: { minLength: 250, maxLength: 900 },
      10: { minLength: 300, maxLength: 1000 },
    };
    
    return lengths[level as keyof typeof lengths] || lengths[1];
  }

  async generateAdaptiveContent(userId: string, performanceHistory: any[]): Promise<{
    recommendedLevel: number;
    focusAreas: string[];
    nextExercises: string[];
  }> {
    const prompt = PromptTemplate.fromTemplate(`
      You are an adaptive learning AI analyzing a student's performance history.

      Performance data: {performanceHistory}

      Based on this data, determine:
      1. What level the student should work on next
      2. Which grammar areas need more focus
      3. What types of exercises would be most beneficial

      Consider:
      - Recent scores and trends
      - Time spent on exercises
      - Common error patterns
      - Progression through levels

      Return ONLY valid JSON:
      {{
        "recommendedLevel": 1-10,
        "focusAreas": ["grammar area 1", "grammar area 2"],
        "nextExercises": ["exercise type 1", "exercise type 2", "exercise type 3"],
        "reasoning": "Brief explanation of recommendations"
      }}
    `);

    const chain = RunnableSequence.from([prompt, this.llm, this.parser]);

    try {
      const result = await chain.invoke({
        performanceHistory: JSON.stringify(performanceHistory.slice(-10)) // Last 10 results
      });

      return result;
    } catch (error) {
      console.error("Error generating adaptive content:", error);
      // Return safe defaults
      return {
        recommendedLevel: 1,
        focusAreas: ["articles", "basic vocabulary"],
        nextExercises: ["drag_words", "multi_choice"],
      };
    }
  }

  async validateWriting(text: string, level: number, rubric: string[] = []): Promise<{
    isValid: boolean;
    score: number;
    errors: Array<{
      type: string;
      message: string;
      suggestion?: string;
    }>;
    strengths: string[];
    correctedText?: string;
  }> {
    const grammarFocus = getGrammarFocusForLevel(level);
    const rubricText = rubric.length > 0 ? rubric.join(', ') : 'coherencia, ortografía, gramática';

    const prompt = PromptTemplate.fromTemplate(`
      Eres un profesor de español que revisa la redacción de un niño de nivel {level}.

      Texto del estudiante: "{text}"

      Criterios de evaluación: {rubricText}

      Aspectos gramaticales del nivel {level}: {grammarFocus}

      Analiza el texto y proporciona:
      1. Errores gramaticales específicos (género, concordancia, verbos, ortografía)
      2. Sugerencias concretas para cada error
      3. Aspectos positivos del texto (qué hizo bien el estudiante)
      4. Puntuación de 0-100 basada en la calidad

      Criterios de puntuación:
      - 90-100: Excelente, sin errores o errores muy menores
      - 70-89: Bueno, algunos errores pero buen esfuerzo
      - 50-69: Regular, varios errores a corregir
      - 30-49: Necesita mejorar, muchos errores
      - 0-29: Necesita mucha práctica

      Devuelve SOLO JSON válido en este formato:
      {{
        "isValid": true/false,
        "score": 0-100,
        "errors": [
          {{
            "type": "Tipo de error (género, verbo, ortografía, etc.)",
            "message": "Descripción clara del error",
            "suggestion": "Cómo corregirlo"
          }}
        ],
        "strengths": [
          "Aspecto positivo 1",
          "Aspecto positivo 2"
        ],
        "correctedText": "Versión corregida del texto del estudiante (solo si hay errores, sino el texto original)"
      }}

      IMPORTANTE:
      - Sé constructivo y alentador
      - Señala máximo 5 errores principales (prioriza los más importantes)
      - Siempre encuentra al menos 1 aspecto positivo
      - Usa lenguaje simple para niños
      - Si hay errores, proporciona el texto completamente corregido en correctedText
    `);

    const chain = RunnableSequence.from([prompt, this.llm, this.parser]);

    try {
      const result = await chain.invoke({
        text,
        level,
        grammarFocus,
        rubricText,
      });

      // Safely extract errors array
      const errors = Array.isArray(result.errors) ? result.errors : [];
      
      // Ensure at least one strength even if AI doesn't provide any
      const strengths = Array.isArray(result.strengths) && result.strengths.length > 0
        ? result.strengths
        : ["¡Buen esfuerzo en tu redacción!"];

      // Use nullish check to preserve legitimate 0 scores
      const rawScore = typeof result.score === "number" ? result.score : 70;

      return {
        isValid: errors.length === 0,
        score: Math.min(100, Math.max(0, rawScore)),
        errors,
        strengths,
        correctedText: result.correctedText || text,
      };
    } catch (error) {
      console.error("Error validating writing:", error);
      // Return a failure state so user knows validation didn't work
      return {
        isValid: false,
        score: 50,
        errors: [{
          type: "Error del sistema",
          message: "No pudimos revisar tu texto en este momento. Intenta de nuevo.",
          suggestion: "Revisa tu ortografía y gramática manualmente.",
        }],
        strengths: ["¡Buen intento! Tu esfuerzo es importante."],
        correctedText: text,
      };
    }
  }

  /**
   * Pipeline de validación y regeneración de ejercicios
   * Aplica validación triple: gramática → coherencia → pedagogía
   * Regenera con feedback si falla, usa respaldo si todo falla
   */
  private async validateAndRegenerateExercises(
    exercises: any[],
    storyText: string,
    level: number,
    storyTitle: string
  ): Promise<GameSpec[]> {
    const validatedExercises: GameSpec[] = [];
    
    for (const exercise of exercises) {
      const gameType = exercise.gameType;
      console.log(`[Validación] Validando ejercicio: ${gameType}`);
      
      // Validar según tipo
      const validationResult = await this.validateSingleExercise(
        exercise,
        storyText,
        level
      );
      
      if (validationResult.isValid && validationResult.score >= 70) {
        console.log(`[Validación] ✅ Ejercicio ${gameType} aprobado (score: ${validationResult.score})`);
        validatedExercises.push(exercise);
      } else {
        console.log(`[Validación] ❌ Ejercicio ${gameType} falló (score: ${validationResult.score})`);
        console.log(`[Validación] Errores: ${JSON.stringify(validationResult.errors)}`);
        
        // Intentar regenerar
        const regenerationResult = await regenerateExerciseWithFeedback({
          gameType,
          level,
          storyText,
          previousAttempt: exercise,
          validationErrors: validationResult.errors
        });
        
        if (regenerationResult.success && regenerationResult.finalScore >= 70) {
          console.log(`[Validación] ✅ Ejercicio regenerado exitosamente (intentos: ${regenerationResult.attempts}, score: ${regenerationResult.finalScore})`);
          validatedExercises.push(regenerationResult.exercise);
        } else {
          console.log(`[Validación] ⚠️  Regeneración falló, usando ejercicio de respaldo`);
          
          // Usar ejercicio de respaldo
          const fallback = getFallbackExercise(level, gameType);
          if (fallback) {
            const adapted = adaptFallbackToStory(fallback, storyTitle);
            validatedExercises.push(adapted as GameSpec);
            console.log(`[Validación] ✅ Ejercicio de respaldo usado para ${gameType}`);
          } else {
            console.log(`[Validación] ⚠️  No hay ejercicio de respaldo para ${gameType} nivel ${level}`);
            // Como último recurso, usar el ejercicio original
            validatedExercises.push(exercise);
          }
        }
      }
    }
    
    return validatedExercises;
  }

  /**
   * Valida un ejercicio individual aplicando las tres capas
   */
  private async validateSingleExercise(
    exercise: any,
    storyText: string,
    level: number
  ): Promise<{
    isValid: boolean;
    score: number;
    errors: {
      grammar: string[];
      coherence: string[];
      pedagogical: string[];
    };
  }> {
    const errors = {
      grammar: [] as string[],
      coherence: [] as string[],
      pedagogical: [] as string[]
    };

    let grammarScore = 0;
    let coherenceScore = 0;
    let pedagogyScore = 0;

    const payload = exercise.exercise?.payload || exercise.payload;
    
    if (exercise.gameType === 'order_sentence') {
      const grammarResult = validateOrderSentence(
        payload.words,
        payload.correct
      );
      const coherenceResult = validateOrderSentenceCoherence(
        payload.words,
        payload.correct,
        storyText
      );
      const pedagogyResult = validateOrderSentencePedagogy(
        payload.words,
        payload.correct,
        level
      );

      errors.grammar = grammarResult.errors;
      errors.coherence = coherenceResult.errors;
      errors.pedagogical = pedagogyResult.misalignment;
      
      grammarScore = grammarResult.score;
      coherenceScore = coherenceResult.score;
      pedagogyScore = pedagogyResult.score;
    } 
    else if (exercise.gameType === 'complete_words') {
      const grammarResult = validateCompleteWords(
        payload.sentence,
        payload.correct
      );
      const coherenceResult = validateCompleteWordsCoherence(
        payload.sentence,
        payload.correct,
        storyText
      );
      const pedagogyResult = validateCompleteWordsPedagogy(
        payload.sentence,
        payload.correct,
        level
      );

      errors.grammar = grammarResult.errors;
      errors.coherence = coherenceResult.errors;
      errors.pedagogical = pedagogyResult.misalignment;
      
      grammarScore = grammarResult.score;
      coherenceScore = coherenceResult.score;
      pedagogyScore = pedagogyResult.score;
    }
    else if (exercise.gameType === 'multi_choice') {
      const grammarResult = validateMultiChoice(
        payload.question,
        payload.choices,
        payload.correctIndex
      );
      const coherenceResult = validateMultiChoiceCoherence(
        payload.question,
        payload.choices,
        payload.correctIndex,
        storyText
      );
      const pedagogyResult = validateMultiChoicePedagogy(
        payload.question,
        payload.choices,
        payload.correctIndex,
        level,
        storyText
      );

      errors.grammar = grammarResult.errors;
      errors.coherence = coherenceResult.errors;
      errors.pedagogical = pedagogyResult.misalignment;
      
      grammarScore = grammarResult.score;
      coherenceScore = coherenceResult.score;
      pedagogyScore = pedagogyResult.score;
    } else {
      // Para otros tipos, considerar válido por defecto
      return {
        isValid: true,
        score: 80,
        errors: {
          grammar: [],
          coherence: [],
          pedagogical: []
        }
      };
    }

    // Calcular score promedio
    const avgScore = (grammarScore + coherenceScore + pedagogyScore) / 3;
    const isValid = avgScore >= 70 && 
                    errors.grammar.length === 0 && 
                    errors.coherence.length === 0;

    return { isValid, score: avgScore, errors };
  }
}

export const langchainService = new LangChainOrchestrator();
