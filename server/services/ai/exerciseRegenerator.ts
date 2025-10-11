/**
 * Sistema de Regeneración con Feedback
 * Detecta fallos de validación y regenera ejercicios con instrucciones mejoradas
 */

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { 
  validateOrderSentence, 
  validateCompleteWords, 
  validateDragWords,
  validateMultiChoice 
} from '../validators/grammarValidator.js';
import {
  validateOrderSentenceCoherence,
  validateCompleteWordsCoherence,
  validateDragWordsCoherence,
  validateMultiChoiceCoherence
} from '../validators/coherenceValidator.js';
import {
  validateOrderSentencePedagogy,
  validateCompleteWordsPedagogy,
  validateDragWordsPedagogy,
  validateMultiChoicePedagogy
} from '../validators/pedagogicalValidator.js';

const MAX_REGENERATION_ATTEMPTS = 3;

export interface RegenerationContext {
  gameType: string;
  level: number;
  storyText: string;
  previousAttempt: any;
  validationErrors: {
    grammar: string[];
    coherence: string[];
    pedagogical: string[];
  };
}

export interface RegenerationResult {
  success: boolean;
  exercise: any;
  attempts: number;
  finalScore: number;
}

/**
 * Regenera un ejercicio con feedback de validación
 */
export async function regenerateExerciseWithFeedback(
  context: RegenerationContext
): Promise<RegenerationResult> {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    openAIApiKey: process.env.OPENAI_API_KEY,
    maxTokens: 2000,
    temperature: 0.5, // Menor temperatura para mayor precisión
  });

  const parser = new JsonOutputParser();
  let attempts = 0;
  let exercise = null;
  let finalScore = 0;

  while (attempts < MAX_REGENERATION_ATTEMPTS) {
    attempts++;
    
    // Construir feedback específico
    const feedback = buildDetailedFeedback(context);
    
    // Prompt de regeneración con feedback
    const prompt = PromptTemplate.fromTemplate(`
      Eres un experto en generación de ejercicios educativos de español.
      
      CONTEXTO DEL ERROR:
      Tipo de ejercicio: {gameType}
      Nivel: {level}
      
      INTENTO ANTERIOR QUE FALLÓ:
      {previousAttempt}
      
      PROBLEMAS DETECTADOS:
      {feedback}
      
      TEXTO DE LA HISTORIA (FUENTE OBLIGATORIA):
      {storyText}
      
      INSTRUCCIONES DE CORRECCIÓN:
      1. EXTRAE oraciones EXACTAMENTE como aparecen en el texto de la historia
      2. NO inventes información que no esté en el texto
      3. Asegúrate de que la oración sea gramaticalmente correcta
      4. Verifica alineación con objetivos pedagógicos del nivel {level}
      5. Sigue las reglas gramaticales del español
      6. FORMATO CRÍTICO para complete_words: Usa ___ (tres guiones bajos) SIN ESPACIOS alrededor. Ejemplo CORRECTO: "El gato___rápido" NO "El gato ___ rápido"
      
      Genera un ejercicio corregido en JSON siguiendo estas reglas ESTRICTAMENTE.
      
      Formato de salida JSON:
      {outputFormat}
    `);

    const chain = RunnableSequence.from([prompt, llm, parser]);
    
    try {
      const result = await chain.invoke({
        gameType: context.gameType,
        level: context.level,
        previousAttempt: JSON.stringify(context.previousAttempt, null, 2),
        feedback,
        storyText: context.storyText,
        outputFormat: getOutputFormat(context.gameType)
      });

      // Validar el resultado
      const validation = await validateExercise(result, context);
      
      if (validation.isValid) {
        exercise = result;
        finalScore = validation.score;
        break;
      } else {
        // Actualizar contexto con nuevos errores
        context.previousAttempt = result;
        context.validationErrors = validation.errors;
      }
      
    } catch (error) {
      console.error(`[Regeneration] Attempt ${attempts} failed:`, error);
    }
  }

  return {
    success: exercise !== null,
    exercise,
    attempts,
    finalScore
  };
}

/**
 * Construye feedback detallado de los errores
 */
function buildDetailedFeedback(context: RegenerationContext): string {
  const feedback: string[] = [];
  
  if (context.validationErrors.grammar.length > 0) {
    feedback.push("ERRORES GRAMATICALES:");
    context.validationErrors.grammar.forEach(err => {
      feedback.push(`  - ${err}`);
    });
  }
  
  if (context.validationErrors.coherence.length > 0) {
    feedback.push("\nERRORES DE COHERENCIA (no está en el texto):");
    context.validationErrors.coherence.forEach(err => {
      feedback.push(`  - ${err}`);
    });
  }
  
  if (context.validationErrors.pedagogical.length > 0) {
    feedback.push("\nERRORES PEDAGÓGICOS:");
    context.validationErrors.pedagogical.forEach(err => {
      feedback.push(`  - ${err}`);
    });
  }
  
  return feedback.join('\n');
}

/**
 * Valida ejercicio regenerado
 */
async function validateExercise(
  exercise: any,
  context: RegenerationContext
): Promise<{ isValid: boolean; score: number; errors: any }> {
  const errors = {
    grammar: [] as string[],
    coherence: [] as string[],
    pedagogical: [] as string[]
  };

  let grammarScore = 0;
  let coherenceScore = 0;
  let pedagogyScore = 0;

  if (context.gameType === 'order_sentence') {
    const grammarResult = validateOrderSentence(
      exercise.exercise.payload.words,
      exercise.exercise.payload.correct
    );
    const coherenceResult = validateOrderSentenceCoherence(
      exercise.exercise.payload.words,
      exercise.exercise.payload.correct,
      context.storyText
    );
    const pedagogyResult = validateOrderSentencePedagogy(
      exercise.exercise.payload.words,
      exercise.exercise.payload.correct,
      context.level
    );

    errors.grammar = grammarResult.errors;
    errors.coherence = coherenceResult.errors;
    errors.pedagogical = pedagogyResult.misalignment;
    
    grammarScore = grammarResult.score;
    coherenceScore = coherenceResult.score;
    pedagogyScore = pedagogyResult.score;
  } 
  else if (context.gameType === 'complete_words') {
    const grammarResult = validateCompleteWords(
      exercise.exercise.payload.sentence,
      exercise.exercise.payload.correct
    );
    const coherenceResult = validateCompleteWordsCoherence(
      exercise.exercise.payload.sentence,
      exercise.exercise.payload.correct,
      context.storyText
    );
    const pedagogyResult = validateCompleteWordsPedagogy(
      exercise.exercise.payload.sentence,
      exercise.exercise.payload.correct,
      context.level
    );

    errors.grammar = grammarResult.errors;
    errors.coherence = coherenceResult.errors;
    errors.pedagogical = pedagogyResult.misalignment;
    
    grammarScore = grammarResult.score;
    coherenceScore = coherenceResult.score;
    pedagogyScore = pedagogyResult.score;
  }
  else if (context.gameType === 'multi_choice') {
    const grammarResult = validateMultiChoice(
      exercise.exercise.payload.question,
      exercise.exercise.payload.choices,
      exercise.exercise.payload.correctIndex
    );
    const coherenceResult = validateMultiChoiceCoherence(
      exercise.exercise.payload.question,
      exercise.exercise.payload.choices,
      exercise.exercise.payload.correctIndex,
      context.storyText
    );
    const pedagogyResult = validateMultiChoicePedagogy(
      exercise.exercise.payload.question,
      exercise.exercise.payload.choices,
      exercise.exercise.payload.correctIndex,
      context.level,
      context.storyText
    );

    errors.grammar = grammarResult.errors;
    errors.coherence = coherenceResult.errors;
    errors.pedagogical = pedagogyResult.misalignment;
    
    grammarScore = grammarResult.score;
    coherenceScore = coherenceResult.score;
    pedagogyScore = pedagogyResult.score;
  }

  // Calcular score promedio
  const avgScore = (grammarScore + coherenceScore + pedagogyScore) / 3;
  const isValid = avgScore >= 70 && 
                  errors.grammar.length === 0 && 
                  errors.coherence.length === 0;

  return { isValid, score: avgScore, errors };
}

/**
 * Formato de salida según tipo de ejercicio
 */
function getOutputFormat(gameType: string): string {
  switch (gameType) {
    case 'order_sentence':
      return `{
        "gameType": "order_sentence",
        "title": "Ordena las palabras",
        "exercise": {
          "type": "order_sentence",
          "payload": {
            "words": ["palabra1", "palabra2", ...],
            "correct": "Oración completa exacta del texto",
            "explanation": "Explicación de la estructura",
            "hints": ["Pista 1", "Pista 2"]
          }
        }
      }`;
    case 'complete_words':
      return `{
        "gameType": "complete_words",
        "title": "Completa la palabra",
        "exercise": {
          "type": "complete_words",
          "payload": {
            "sentence": "Oración del texto con___ (IMPORTANTE: sin espacios alrededor de ___, ejemplo: palabra___palabra)",
            "correct": "palabra_faltante",
            "explanation": "Por qué es correcta",
            "hints": ["Pista 1", "Pista 2"]
          }
        }
      }`;
    default:
      return "{}";
  }
}
