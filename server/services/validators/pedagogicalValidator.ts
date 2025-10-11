/**
 * Validador Pedagógico
 * Verifica alineación con objetivos gramaticales del nivel
 */

import { getLevelConfig } from '../../config/levels.js';
import { analyzeSentence, SentenceAnalysis } from '../linguistic/sentenceExtractor.js';

export interface PedagogicalValidationResult {
  isValid: boolean;
  score: number; // 0-100
  alignment: string[]; // Objetivos alineados
  misalignment: string[]; // Objetivos no cumplidos
  suggestions: string[];
}

/**
 * Valida ejercicio order_sentence pedagógicamente
 */
export function validateOrderSentencePedagogy(
  words: string[],
  correctSentence: string,
  level: number
): PedagogicalValidationResult {
  const config = getLevelConfig(level);
  const analysis = analyzeSentence(correctSentence);
  const alignment: string[] = [];
  const misalignment: string[] = [];
  const suggestions: string[] = [];
  
  // Nivel 1-2: Oraciones simples, SVO
  if (level <= 2) {
    if (analysis.complexity === 'simple' && analysis.hasSubject && analysis.hasVerb) {
      alignment.push('Oración simple con estructura SVO');
    } else {
      misalignment.push('Debería ser una oración simple con estructura SVO clara');
      suggestions.push('Use oraciones simples como "El gato juega" o "Ana lee un libro"');
    }
    
    if (words.length <= 8) {
      alignment.push('Longitud apropiada para el nivel');
    } else {
      misalignment.push('Oración demasiado larga para el nivel');
    }
  }
  
  // Nivel 3-4: Conectores simples
  if (level >= 3 && level <= 4) {
    if (analysis.connectors.length > 0) {
      alignment.push(`Usa conectores: ${analysis.connectors.join(', ')}`);
    } else {
      misalignment.push('Debería incluir conectores (y, pero, porque)');
      suggestions.push('Agregue conectores simples para enseñar cohesión textual');
    }
    
    if (analysis.verbTenses.length > 0) {
      alignment.push(`Usa tiempos verbales: ${analysis.verbTenses.join(', ')}`);
    }
  }
  
  // Nivel 5-7: Subordinadas, tiempos compuestos
  if (level >= 5 && level <= 7) {
    if (analysis.complexity === 'complex') {
      alignment.push('Oración compleja con subordinadas');
    } else {
      misalignment.push('Debería incluir subordinadas');
      suggestions.push('Use oraciones con subordinadas: "Pedro está feliz porque ganó el juego"');
    }
  }
  
  // Nivel 8-10: Complejidad avanzada
  if (level >= 8) {
    if (analysis.complexity === 'complex' && analysis.verbTenses.length >= 2) {
      alignment.push('Complejidad avanzada con múltiples tiempos');
    } else {
      misalignment.push('Debería tener mayor complejidad gramatical');
    }
  }
  
  // Validar cantidad de palabras según nivel
  const expectedWordRange = config.wordRange;
  const wordCountInRange = words.length >= 4 && words.length <= 12;
  
  if (wordCountInRange) {
    alignment.push('Cantidad de palabras apropiada');
  } else {
    misalignment.push(`Cantidad de palabras fuera del rango esperado (4-12)`);
  }
  
  const score = calculatePedagogicalScore(alignment, misalignment);
  const isValid = score >= 70;
  
  return { isValid, score, alignment, misalignment, suggestions };
}

/**
 * Valida ejercicio complete_words pedagógicamente
 */
export function validateCompleteWordsPedagogy(
  sentence: string,
  correctWord: string,
  level: number
): PedagogicalValidationResult {
  const config = getLevelConfig(level);
  const completeSentence = sentence.replace('___', correctWord);
  const analysis = analyzeSentence(completeSentence);
  const alignment: string[] = [];
  const misalignment: string[] = [];
  const suggestions: string[] = [];
  
  const wordLower = correctWord.toLowerCase();
  
  // Nivel 1-2: Verbos o sustantivos básicos
  if (level <= 2) {
    const basicVerbs = ['es', 'está', 'tiene', 'come', 'juega', 'lee'];
    if (basicVerbs.some(v => wordLower.includes(v))) {
      alignment.push('Palabra básica apropiada para el nivel');
    } else {
      misalignment.push('La palabra debería ser un verbo o sustantivo básico');
      suggestions.push('Use verbos comunes como "es", "está", "tiene"');
    }
  }
  
  // Nivel 3-4: Conectores o verbos conjugados
  if (level >= 3 && level <= 4) {
    const connectors = ['porque', 'pero', 'cuando', 'si', 'aunque'];
    const isConnector = connectors.includes(wordLower);
    const isVerb = analysis.verbTenses.length > 0;
    
    if (isConnector) {
      alignment.push('Enseña uso de conectores');
    } else if (isVerb) {
      alignment.push('Enseña conjugación verbal');
    } else {
      misalignment.push('Debería ser un conector o verbo conjugado');
      suggestions.push('Use conectores (porque, pero) o verbos conjugados');
    }
  }
  
  // Nivel 5-7: Palabras de subordinación o tiempos compuestos
  if (level >= 5 && level <= 7) {
    const subordinators = ['que', 'donde', 'cuando', 'como', 'mientras'];
    if (subordinators.includes(wordLower) || analysis.complexity === 'complex') {
      alignment.push('Palabra que contribuye a estructura compleja');
    } else {
      misalignment.push('Debería enseñar subordinación o tiempos compuestos');
    }
  }
  
  // Verificar que no sea trivial
  const trivialWords = ['el', 'la', 'un', 'una', 'y', 'o'];
  if (trivialWords.includes(wordLower)) {
    misalignment.push('Palabra demasiado trivial para enseñanza');
    suggestions.push('Elija palabras más significativas gramaticalmente');
  } else {
    alignment.push('Palabra significativa para aprendizaje');
  }
  
  const score = calculatePedagogicalScore(alignment, misalignment);
  const isValid = score >= 70;
  
  return { isValid, score, alignment, misalignment, suggestions };
}

/**
 * Valida ejercicio drag_words pedagógicamente
 */
export function validateDragWordsPedagogy(
  sentence: string,
  options: string[],
  correct: string,
  level: number
): PedagogicalValidationResult {
  // Reutilizar validación de complete_words
  const baseValidation = validateCompleteWordsPedagogy(sentence, correct, level);
  
  // Validaciones adicionales para drag_words
  const alignment = [...baseValidation.alignment];
  const misalignment = [...baseValidation.misalignment];
  const suggestions = [...baseValidation.suggestions];
  
  // Verificar que opciones incorrectas sean distractores pedagógicos
  const incorrectOptions = options.filter(opt => opt !== correct);
  const hasPedagogicalDistractors = incorrectOptions.some(opt => {
    // Son distractores pedagógicos si son del mismo tipo (ej: otros verbos)
    return opt.length > 2 && opt !== correct;
  });
  
  if (hasPedagogicalDistractors) {
    alignment.push('Opciones incorrectas son distractores pedagógicos válidos');
  } else {
    misalignment.push('Las opciones incorrectas deberían ser distractores pedagógicos');
    suggestions.push('Use palabras similares gramaticalmente como distractores');
  }
  
  const score = calculatePedagogicalScore(alignment, misalignment);
  const isValid = score >= 70;
  
  return { isValid, score, alignment, misalignment, suggestions };
}

/**
 * Valida ejercicio multi_choice pedagógicamente
 */
export function validateMultiChoicePedagogy(
  question: string,
  choices: string[],
  correctIndex: number,
  level: number,
  storyText: string
): PedagogicalValidationResult {
  const config = getLevelConfig(level);
  const alignment: string[] = [];
  const misalignment: string[] = [];
  const suggestions: string[] = [];
  
  // Nivel 1-2: Comprensión literal simple
  if (level <= 2) {
    if (question.includes('¿Qué') || question.includes('¿Quién') || question.includes('¿Dónde')) {
      alignment.push('Pregunta de comprensión literal apropiada');
    } else {
      misalignment.push('Debería ser pregunta literal simple (Qué, Quién, Dónde)');
    }
  }
  
  // Nivel 3-5: Comprensión inferencial básica
  if (level >= 3 && level <= 5) {
    if (question.includes('¿Por qué') || question.includes('¿Cómo')) {
      alignment.push('Pregunta que requiere inferencia básica');
    } else {
      suggestions.push('Considere preguntas de causa-efecto (¿Por qué?)');
    }
  }
  
  // Nivel 6-10: Comprensión profunda y análisis
  if (level >= 6) {
    if (question.includes('¿Cuál es') || question.includes('significado') || question.includes('opinas')) {
      alignment.push('Pregunta de análisis o reflexión');
    } else {
      suggestions.push('Use preguntas que requieran análisis o reflexión');
    }
  }
  
  // Verificar que respuesta correcta sea específica
  const correctAnswer = choices[correctIndex];
  if (correctAnswer.length > 10 && correctAnswer.includes('porque')) {
    alignment.push('Respuesta correcta es específica y detallada');
  } else if (correctAnswer.length < 5) {
    misalignment.push('Respuesta correcta es demasiado breve');
    suggestions.push('La respuesta correcta debe ser específica y completa');
  }
  
  const score = calculatePedagogicalScore(alignment, misalignment);
  const isValid = score >= 70;
  
  return { isValid, score, alignment, misalignment, suggestions };
}

/**
 * Calcula score pedagógico
 */
function calculatePedagogicalScore(
  alignment: string[],
  misalignment: string[]
): number {
  const alignmentPoints = alignment.length * 20;
  const misalignmentPenalty = misalignment.length * 15;
  
  const score = Math.max(0, Math.min(100, alignmentPoints - misalignmentPenalty + 40));
  return Math.round(score);
}
