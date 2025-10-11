import { OpenAI } from "openai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { StoryGenerateRequest, GameSpec, EvaluationResponse, Theme, Level } from "@shared/types";
import { validateContentSafety } from "@shared/validation";

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
      You are a specialized educational content creator for Spanish language learning for children (ages 6-12) with hearing difficulties.

      Create a story and educational exercises with these requirements:
      - Theme: {theme}
      - Level: {level} (1=beginner, 5=advanced)
      - Target word count: {wordCount} words
      - Language: Spanish (Spain)
      - Content must be safe, positive, and age-appropriate

      Level {level} specifications:
      - Level 1: Simple sentences, basic vocabulary, present tense only
      - Level 2: Expanded vocabulary, basic past tense, gender agreement focus
      - Level 3: Complex sentences, multiple tenses, number agreement
      - Level 4: Compound sentences, subjunctive mood, advanced grammar
      - Level 5: Complex narratives, all tenses, subordinate clauses

      Generate content that helps with:
      - Reading comprehension
      - Grammar (gender/number agreement, articles, verb conjugation)
      - Vocabulary expansion
      - Sentence structure

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
          {{
            "gameType": "drag_words",
            "title": "Complete the sentence",
            "exercise": {{
              "type": "drag_words",
              "payload": {{
                "sentence": "Sentence with ___ blank",
                "options": ["correct", "wrong1", "wrong2"],
                "correct": "correct",
                "explanation": "Por qué esta respuesta es correcta (regla gramatical o contexto)",
                "hints": ["Pista 1 sutil", "Pista 2 más específica"]
              }}
            }}
          }},
          {{
            "gameType": "order_sentence",
            "title": "Order the words",
            "exercise": {{
              "type": "order_sentence", 
              "payload": {{
                "words": ["word1", "word2", "word3", "word4"],
                "correct": "word1 word2 word3 word4",
                "explanation": "Explicación del orden correcto (estructura de la oración)",
                "hints": ["Pista sobre el sujeto", "Pista sobre el verbo"]
              }}
            }}
          }},
          {{
            "gameType": "multi_choice",
            "title": "Reading comprehension",
            "exercise": {{
              "type": "multi_choice",
              "payload": {{
                "question": "Comprehension question about the story",
                "choices": ["Option A", "Option B", "Option C", "Option D"],
                "correctIndex": 0,
                "explanation": "Why this answer is correct",
                "hints": ["Pista sobre dónde buscar en la historia", "Pista más directa"]
              }}
            }}
          }},
          {{
            "gameType": "free_writing",
            "title": "Redacción libre",
            "exercise": {{
              "type": "free_writing",
              "payload": {{
                "prompt": "Pregunta abierta sobre la historia que requiera redacción (ej: ¿Qué aprendiste de esta historia? ¿Cómo te sentirías tú en esa situación?)",
                "minLength": {minLength},
                "maxLength": {maxLength},
                "rubric": [
                  "Ortografía correcta",
                  "Concordancia de género y número",
                  "Uso apropiado de verbos",
                  "Coherencia y cohesión"
                ]
              }}
            }}
          }}
        ]
      }}

      Focus on these grammar points for level {level}:
      {grammarFocus}
    `);

    const grammarFocus = this.getGrammarFocusForLevel(request.level);
    const wordCount = this.getWordCountForLevel(request.level);
    const { minLength, maxLength } = this.getWritingLengthForLevel(request.level);

    const chain = RunnableSequence.from([prompt, this.llm, this.parser]);

    try {
      const result = await chain.invoke({
        theme: request.theme,
        level: request.level,
        wordCount,
        grammarFocus,
        minLength,
        maxLength,
      });

      // Validate content safety
      const storyText = result.story.pages.map((p: any) => p.text).join(' ');
      if (!validateContentSafety(storyText)) {
        throw new Error("Generated content failed safety checks");
      }

      return result;
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

    const grammarFocus = this.getGrammarFocusForLevel(level);
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

  private getGrammarFocusForLevel(level: number): string {
    const focuses = {
      1: "Articles (el, la, los, las), basic nouns, present tense verbs",
      2: "Gender agreement (niño/niña), plural forms, past tense introduction", 
      3: "Verb conjugation (yo, tú, él/ella), adjective agreement, future tense",
      4: "Complex sentences, subjunctive mood, prepositions, relative pronouns",
      5: "Advanced grammar, subordinate clauses, conditional mood, literary devices",
      6: "Literary devices, advanced verb moods, nuanced register",
      7: "Academic writing, formal discourse markers, complex argumentation",
      8: "Advanced stylistics, rhetorical structures, sophisticated vocabulary",
      9: "Professional writing, technical precision, genre-specific conventions",
      10: "Expert-level grammar, all linguistic registers, creative language use"
    };
    
    return focuses[level as keyof typeof focuses] || focuses[1];
  }

  private getWordCountForLevel(level: number): string {
    const ranges = {
      1: "50-80",
      2: "80-100", 
      3: "100-130",
      4: "130-160",
      5: "150-200"
    };
    
    return ranges[level as keyof typeof ranges] || "50-80";
  }

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
        "recommendedLevel": 1-5,
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
  }> {
    const grammarFocus = this.getGrammarFocusForLevel(level);
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
        ]
      }}

      IMPORTANTE:
      - Sé constructivo y alentador
      - Señala máximo 5 errores principales (prioriza los más importantes)
      - Siempre encuentra al menos 1 aspecto positivo
      - Usa lenguaje simple para niños
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
      };
    }
  }
}

export const langchainService = new LangChainOrchestrator();
