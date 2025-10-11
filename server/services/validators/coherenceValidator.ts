/**
 * Validador de Coherencia Textual
 * Verifica que los ejercicios usan información literal del texto sin inventar datos
 */

import { analyzeText } from '../linguistic/sentenceExtractor.js';

export interface CoherenceValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
}

/**
 * Valida que una oración existe literalmente en el texto
 */
export function validateSentenceInText(
  sentence: string,
  storyText: string
): CoherenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Normalizar texto para comparación
  const normalizedStory = normalizeText(storyText);
  const normalizedSentence = normalizeText(sentence);
  
  // Regla 1: La oración debe aparecer en el texto
  if (!normalizedStory.includes(normalizedSentence)) {
    // Intentar encontrar coincidencia parcial
    const words = sentence.split(/\s+/).filter(w => w.length > 2);
    const matchedWords = words.filter(word => 
      normalizedStory.includes(normalizeText(word))
    );
    
    const matchPercentage = (matchedWords.length / words.length) * 100;
    
    if (matchPercentage < 50) {
      errors.push('La oración no aparece en el texto de la historia');
    } else if (matchPercentage < 80) {
      warnings.push('La oración solo coincide parcialmente con el texto de la historia');
    }
  }
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Valida ejercicio order_sentence contra el texto
 */
export function validateOrderSentenceCoherence(
  words: string[],
  correctSentence: string,
  storyText: string
): CoherenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Regla 1: La oración correcta debe existir en el texto
  const sentenceCheck = validateSentenceInText(correctSentence, storyText);
  errors.push(...sentenceCheck.errors);
  warnings.push(...sentenceCheck.warnings);
  
  // Regla 2: Todas las palabras deben venir del texto
  const normalizedStory = normalizeText(storyText);
  words.forEach(word => {
    const normalizedWord = normalizeText(word);
    if (normalizedWord.length > 2 && !normalizedStory.includes(normalizedWord)) {
      warnings.push(`La palabra "${word}" no aparece en el texto original`);
    }
  });
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Valida ejercicio complete_words contra el texto
 */
export function validateCompleteWordsCoherence(
  sentence: string,
  correctWord: string,
  storyText: string
): CoherenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Reconstruir oración completa
  const completeSentence = sentence.replace('___', correctWord);
  
  // Regla 1: La oración completa debe existir en el texto
  const sentenceCheck = validateSentenceInText(completeSentence, storyText);
  if (sentenceCheck.errors.length > 0) {
    errors.push('La oración completa no existe en el texto de la historia');
  }
  
  // Regla 2: La palabra a completar debe estar en el texto
  const normalizedStory = normalizeText(storyText);
  const normalizedWord = normalizeText(correctWord);
  
  if (!normalizedStory.includes(normalizedWord)) {
    errors.push(`La palabra "${correctWord}" no aparece en el texto`);
  }
  
  // Regla 3: El fragmento con blank debe existir en el texto
  const beforeBlank = sentence.split('___')[0].trim();
  const afterBlank = sentence.split('___')[1]?.trim() || '';
  
  if (beforeBlank.length > 0 && !normalizedStory.includes(normalizeText(beforeBlank))) {
    warnings.push('El fragmento antes del blank no aparece exactamente en el texto');
  }
  
  if (afterBlank.length > 0 && !normalizedStory.includes(normalizeText(afterBlank))) {
    warnings.push('El fragmento después del blank no aparece exactamente en el texto');
  }
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Valida ejercicio drag_words contra el texto
 */
export function validateDragWordsCoherence(
  sentence: string,
  options: string[],
  correct: string,
  storyText: string
): CoherenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Reutilizar validación de complete_words
  const completeCheck = validateCompleteWordsCoherence(sentence, correct, storyText);
  errors.push(...completeCheck.errors);
  warnings.push(...completeCheck.warnings);
  
  // Regla adicional: Las opciones incorrectas NO deberían formar oraciones del texto
  const incorrectOptions = options.filter(opt => opt !== correct);
  incorrectOptions.forEach(option => {
    const testSentence = sentence.replace('___', option);
    const testCheck = validateSentenceInText(testSentence, storyText);
    
    if (testCheck.isValid) {
      warnings.push(`La opción incorrecta "${option}" también forma una oración que existe en el texto`);
    }
  });
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Valida multi_choice contra el texto
 */
export function validateMultiChoiceCoherence(
  question: string,
  choices: string[],
  correctIndex: number,
  storyText: string
): CoherenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const correctAnswer = choices[correctIndex];
  const normalizedStory = normalizeText(storyText);
  
  // Regla 1: La respuesta correcta debe estar basada en información del texto
  // Extraer palabras clave de la respuesta
  const keywords = extractKeywords(correctAnswer);
  const matchedKeywords = keywords.filter(kw => 
    normalizedStory.includes(normalizeText(kw))
  );
  
  if (matchedKeywords.length === 0) {
    errors.push('La respuesta correcta no está basada en información del texto');
  } else if (matchedKeywords.length < keywords.length / 2) {
    warnings.push('La respuesta correcta solo coincide parcialmente con el texto');
  }
  
  // Regla 2: Las opciones incorrectas NO deben estar explícitamente mencionadas como correctas
  const incorrectChoices = choices.filter((_, idx) => idx !== correctIndex);
  incorrectChoices.forEach(choice => {
    const choiceKeywords = extractKeywords(choice);
    const matched = choiceKeywords.filter(kw => normalizedStory.includes(normalizeText(kw)));
    
    if (matched.length === choiceKeywords.length && choiceKeywords.length > 0) {
      warnings.push(`La opción incorrecta "${choice}" también aparece en el texto`);
    }
  });
  
  const isValid = errors.length === 0;
  const score = calculateScore(errors, warnings);
  
  return { isValid, score, errors, warnings };
}

/**
 * Normaliza texto para comparación
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[.,!?¿¡]/g, ' ') // Remover puntuación
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae palabras clave de un texto
 */
function extractKeywords(text: string): string[] {
  const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'a', 'en', 'y', 'o', 'pero', 'que', 'es', 'son', 'está', 'están'];
  
  return text
    .split(/\s+/)
    .map(w => w.toLowerCase().replace(/[.,!?]/g, ''))
    .filter(w => w.length > 2 && !stopWords.includes(w));
}

/**
 * Calcula score basado en errores y advertencias
 */
function calculateScore(errors: string[], warnings: string[]): number {
  if (errors.length === 0 && warnings.length === 0) return 100;
  if (errors.length > 0) return Math.max(0, 100 - (errors.length * 30));
  return Math.max(50, 100 - (warnings.length * 15));
}
