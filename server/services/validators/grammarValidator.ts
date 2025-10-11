/**
 * Validador Gramatical
 * Verifica coherencia gramatical de oraciones y ejercicios en español
 */

import { analyzeSentence, SentenceAnalysis } from '../linguistic/sentenceExtractor.js';

export interface GrammarValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
}

/**
 * Valida una oración para order_sentence
 */
export function validateOrderSentence(
  words: string[],
  correctSentence: string
): GrammarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Verificar que la oración correcta sea gramaticalmente válida
  const analysis = analyzeSentence(correctSentence);
  
  // Regla 1: Debe tener verbo
  if (!analysis.hasVerb) {
    errors.push('La oración no contiene un verbo conjugado');
  }
  
  // Regla 2: Debe tener sujeto (explícito o implícito)
  if (!analysis.hasSubject && analysis.words.length < 3) {
    errors.push('La oración no tiene sujeto claro');
  }
  
  // Regla 3: Las palabras deben formar exactamente la oración correcta
  const wordsInSentence = correctSentence.split(/\s+/);
  if (words.length !== wordsInSentence.length) {
    errors.push(`Las palabras (${words.length}) no coinciden con la oración correcta (${wordsInSentence.length} palabras)`);
  }
  
  // Regla 4: Todas las palabras deben estar en la oración correcta
  const sentenceWords = wordsInSentence.map(w => w.toLowerCase().replace(/[.,!?]/g, ''));
  const exerciseWords = words.map(w => w.toLowerCase().replace(/[.,!?]/g, ''));
  
  exerciseWords.forEach(word => {
    if (!sentenceWords.includes(word)) {
      errors.push(`La palabra "${word}" no está en la oración correcta`);
    }
  });
  
  // Regla 5: Verificar estructura básica (simplificado)
  const hasPunctuation = correctSentence.match(/[.!?]$/);
  if (!hasPunctuation) {
    warnings.push('La oración correcta debería terminar con puntuación');
  }
  
  // Regla 6: Verificar longitud razonable
  if (words.length < 3) {
    errors.push('La oración es demasiado corta (menos de 3 palabras)');
  }
  
  if (words.length > 15) {
    warnings.push('La oración es muy larga (más de 15 palabras), puede ser difícil para el nivel');
  }
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Valida un ejercicio de complete_words
 */
export function validateCompleteWords(
  sentence: string,
  correctWord: string
): GrammarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Regla 1: La oración debe contener exactamente un espacio en blanco
  const blanks = sentence.match(/___/g);
  if (!blanks || blanks.length === 0) {
    errors.push('La oración no contiene el espacio en blanco (___) para completar');
  } else if (blanks.length > 1) {
    errors.push('La oración contiene más de un espacio en blanco');
  }
  
  // Regla 2: La palabra correcta no debe estar vacía
  if (!correctWord || correctWord.trim().length === 0) {
    errors.push('La palabra correcta está vacía');
  }
  
  // Regla 3: Reconstruir y validar oración completa
  const completeSentence = sentence.replace('___', correctWord);
  const analysis = analyzeSentence(completeSentence);
  
  if (!analysis.hasVerb) {
    errors.push('La oración completada no contiene un verbo');
  }
  
  // Regla 4: La palabra correcta debe ser significativa
  const trivialWords = ['el', 'la', 'los', 'las', 'un', 'una', 'y', 'o'];
  if (trivialWords.includes(correctWord.toLowerCase())) {
    warnings.push('La palabra a completar es demasiado trivial (artículo o conector simple)');
  }
  
  // Regla 5: La palabra debe tener longitud mínima
  if (correctWord.length < 2) {
    errors.push('La palabra correcta es demasiado corta');
  }
  
  // Regla 6: Verificar que la oración con el blank tenga sentido parcial
  const partialSentence = sentence.replace('___', '').trim();
  if (partialSentence.split(/\s+/).length < 3) {
    errors.push('La oración sin la palabra faltante es demasiado corta');
  }
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Valida un ejercicio de drag_words
 */
export function validateDragWords(
  sentence: string,
  options: string[],
  correct: string
): GrammarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Regla 1: Debe haber exactamente un blank
  const blanks = sentence.match(/___/g);
  if (!blanks || blanks.length !== 1) {
    errors.push('Debe haber exactamente un espacio en blanco (___)');
  }
  
  // Regla 2: La palabra correcta debe estar en las opciones
  if (!options.includes(correct)) {
    errors.push('La palabra correcta no está en las opciones');
  }
  
  // Regla 3: Debe haber al menos 3 opciones
  if (options.length < 3) {
    errors.push('Debe haber al menos 3 opciones');
  }
  
  // Regla 4: Las opciones deben ser diferentes
  const uniqueOptions = [...new Set(options)];
  if (uniqueOptions.length !== options.length) {
    errors.push('Hay opciones duplicadas');
  }
  
  // Regla 5: Validar oración completa
  const completeSentence = sentence.replace('___', correct);
  const analysis = analyzeSentence(completeSentence);
  
  if (!analysis.hasVerb) {
    errors.push('La oración completada no tiene verbo');
  }
  
  // Regla 6: Las opciones incorrectas no deben crear oraciones gramaticalmente correctas
  const incorrectOptions = options.filter(opt => opt !== correct);
  incorrectOptions.forEach(option => {
    const testSentence = sentence.replace('___', option);
    const testAnalysis = analyzeSentence(testSentence);
    
    // Si la opción incorrecta también crea una oración válida, advertir
    if (testAnalysis.hasVerb && testAnalysis.hasSubject && testAnalysis.hasComplement) {
      warnings.push(`La opción incorrecta "${option}" también forma una oración gramaticalmente válida`);
    }
  });
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Calcula score basado en errores y advertencias
 */
function calculateScore(errors: string[], warnings: string[]): number {
  if (errors.length === 0 && warnings.length === 0) return 100;
  if (errors.length > 0) return Math.max(0, 100 - (errors.length * 25));
  return Math.max(50, 100 - (warnings.length * 10));
}

/**
 * Valida ejercicio multi_choice
 */
export function validateMultiChoice(
  question: string,
  choices: string[],
  correctIndex: number
): GrammarValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Regla 1: La pregunta debe terminar con signo de interrogación
  if (!question.match(/\?$/)) {
    warnings.push('La pregunta debería terminar con signo de interrogación');
  }
  
  // Regla 2: Debe haber 4 opciones
  if (choices.length !== 4) {
    errors.push(`Debe haber exactamente 4 opciones (hay ${choices.length})`);
  }
  
  // Regla 3: El índice correcto debe ser válido
  if (correctIndex < 0 || correctIndex >= choices.length) {
    errors.push('El índice de la respuesta correcta es inválido');
  }
  
  // Regla 4: Las opciones deben ser diferentes
  const uniqueChoices = [...new Set(choices)];
  if (uniqueChoices.length !== choices.length) {
    errors.push('Hay opciones duplicadas');
  }
  
  // Regla 5: Las opciones deben tener longitud razonable
  choices.forEach((choice, idx) => {
    if (choice.length < 3) {
      warnings.push(`La opción ${idx + 1} es muy corta`);
    }
    if (choice.length > 100) {
      warnings.push(`La opción ${idx + 1} es muy larga`);
    }
  });
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}
