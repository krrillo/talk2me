/**
 * Extractor Lingüístico para análisis de texto en español
 * Identifica oraciones completas, estructura gramatical y elementos pedagógicos
 */

export interface SentenceAnalysis {
  sentence: string;
  words: string[];
  hasSubject: boolean;
  hasVerb: boolean;
  hasComplement: boolean;
  connectors: string[];
  verbTenses: string[];
  complexity: 'simple' | 'compound' | 'complex';
  grammarFeatures: string[];
}

export interface TextAnalysis {
  sentences: SentenceAnalysis[];
  totalWords: number;
  vocabularyLevel: number;
  mainConnectors: string[];
  dominantTense: string;
}

// Conectores comunes del español
const CONNECTORS = {
  coordinantes: ['y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'sino'],
  subordinantes: ['que', 'porque', 'cuando', 'si', 'aunque', 'mientras', 'como', 'donde'],
  causales: ['porque', 'pues', 'ya que', 'puesto que'],
  temporales: ['cuando', 'mientras', 'antes', 'después'],
  condicionales: ['si', 'aunque', 'a menos que']
};

// Verbos auxiliares y copulativos
const AUXILIARY_VERBS = ['ser', 'estar', 'haber', 'tener'];
const COMMON_VERBS = ['hacer', 'decir', 'poder', 'querer', 'saber', 'ver', 'dar', 'ir', 'venir'];

// Patrones de tiempos verbales básicos
const VERB_PATTERNS = {
  presente: /(?:o|as|a|amos|áis|an|es|e|emos|éis|en)$/,
  preterito: /(?:é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron)$/,
  imperfecto: /(?:aba|abas|aba|ábamos|abais|aban|ía|ías|ía|íamos|íais|ían)$/,
  futuro: /(?:é|ás|á|emos|éis|án)$/,
};

/**
 * Extrae y analiza oraciones del texto
 */
export function extractSentences(text: string): SentenceAnalysis[] {
  // Dividir en oraciones por puntos, signos de exclamación e interrogación
  const rawSentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return rawSentences.map(sentence => analyzeSentence(sentence));
}

/**
 * Analiza una oración individual
 */
export function analyzeSentence(sentence: string): SentenceAnalysis {
  const words = sentence.split(/\s+/).filter(w => w.length > 0);
  const lowerWords = words.map(w => w.toLowerCase());

  // Detectar conectores
  const connectors = detectConnectors(lowerWords);
  
  // Detectar verbos y tiempos
  const verbInfo = detectVerbs(lowerWords);
  
  // Determinar complejidad
  const complexity = determineComplexity(words, connectors);
  
  // Identificar estructura básica SVO
  const hasSubject = hasSubjectIndicator(lowerWords);
  const hasVerb = verbInfo.verbs.length > 0;
  const hasComplement = words.length > 3; // Simplificado

  // Características gramaticales
  const grammarFeatures: string[] = [];
  if (connectors.length > 0) grammarFeatures.push(`Conectores: ${connectors.join(', ')}`);
  if (verbInfo.tenses.length > 0) grammarFeatures.push(`Tiempos: ${verbInfo.tenses.join(', ')}`);
  if (complexity === 'compound') grammarFeatures.push('Oración compuesta');
  if (complexity === 'complex') grammarFeatures.push('Oración compleja');

  return {
    sentence,
    words,
    hasSubject,
    hasVerb,
    hasComplement,
    connectors,
    verbTenses: verbInfo.tenses,
    complexity,
    grammarFeatures
  };
}

/**
 * Detecta conectores en la oración
 */
function detectConnectors(words: string[]): string[] {
  const found: string[] = [];
  const allConnectors = [
    ...CONNECTORS.coordinantes,
    ...CONNECTORS.subordinantes
  ];

  words.forEach(word => {
    if (allConnectors.includes(word)) {
      found.push(word);
    }
  });

  return found;
}

/**
 * Detecta verbos y sus tiempos
 */
function detectVerbs(words: string[]): { verbs: string[], tenses: string[] } {
  const verbs: string[] = [];
  const tenses: string[] = [];

  words.forEach(word => {
    // Detectar auxiliares y verbos comunes
    if (AUXILIARY_VERBS.some(aux => word.includes(aux))) {
      verbs.push(word);
    }
    if (COMMON_VERBS.some(v => word.includes(v))) {
      verbs.push(word);
    }

    // Detectar patrones de conjugación
    for (const [tense, pattern] of Object.entries(VERB_PATTERNS)) {
      if (pattern.test(word) && word.length > 3) {
        verbs.push(word);
        if (!tenses.includes(tense)) {
          tenses.push(tense);
        }
      }
    }
  });

  return { verbs: [...new Set(verbs)], tenses: [...new Set(tenses)] };
}

/**
 * Indica si hay marcadores de sujeto
 */
function hasSubjectIndicator(words: string[]): boolean {
  const subjectIndicators = [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas'
  ];
  
  return words.some(w => subjectIndicators.includes(w));
}

/**
 * Determina complejidad de la oración
 */
function determineComplexity(
  words: string[], 
  connectors: string[]
): 'simple' | 'compound' | 'complex' {
  if (connectors.length === 0) {
    return 'simple';
  }
  
  if (connectors.some(c => CONNECTORS.subordinantes.includes(c))) {
    return 'complex';
  }
  
  if (connectors.some(c => CONNECTORS.coordinantes.includes(c))) {
    return 'compound';
  }
  
  return 'simple';
}

/**
 * Análisis completo del texto
 */
export function analyzeText(text: string): TextAnalysis {
  const sentences = extractSentences(text);
  const totalWords = sentences.reduce((sum, s) => sum + s.words.length, 0);
  
  // Recopilar todos los conectores
  const allConnectors = sentences.flatMap(s => s.connectors);
  const mainConnectors = [...new Set(allConnectors)];
  
  // Determinar tiempo verbal dominante
  const allTenses = sentences.flatMap(s => s.verbTenses);
  const dominantTense = getDominantTense(allTenses);
  
  // Calcular nivel de vocabulario (simplificado)
  const vocabularyLevel = Math.min(10, Math.ceil(totalWords / 50));

  return {
    sentences,
    totalWords,
    vocabularyLevel,
    mainConnectors,
    dominantTense
  };
}

/**
 * Encuentra el tiempo verbal más usado
 */
function getDominantTense(tenses: string[]): string {
  if (tenses.length === 0) return 'presente';
  
  const counts: Record<string, number> = {};
  tenses.forEach(t => {
    counts[t] = (counts[t] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'presente';
}

/**
 * Encuentra oraciones adecuadas para ejercicios según nivel
 */
export function findSuitableSentences(
  text: string, 
  level: number,
  gameType: 'order_sentence' | 'complete_words' | 'drag_words'
): SentenceAnalysis[] {
  const analysis = analyzeText(text);
  
  return analysis.sentences.filter(s => {
    // Nivel 1-2: Oraciones simples
    if (level <= 2) {
      return s.complexity === 'simple' && s.words.length <= 8;
    }
    
    // Nivel 3-4: Conectores básicos
    if (level <= 4) {
      if (gameType === 'order_sentence') {
        return s.connectors.length > 0 && s.words.length <= 10;
      }
      return s.words.length >= 5 && s.words.length <= 10;
    }
    
    // Nivel 5-7: Oraciones compuestas
    if (level <= 7) {
      return s.complexity !== 'simple' && s.words.length <= 15;
    }
    
    // Nivel 8-10: Cualquier complejidad
    return s.words.length >= 8 && s.words.length <= 20;
  });
}

/**
 * Extrae una palabra significativa de una oración para ejercicio de completar
 */
export function extractSignificantWord(sentence: SentenceAnalysis, level: number): {
  word: string;
  index: number;
  type: 'verb' | 'connector' | 'noun' | 'adjective';
} | null {
  const words = sentence.words;
  const lowerWords = words.map(w => w.toLowerCase());
  
  // Nivel 1-2: Sustantivos o verbos simples
  if (level <= 2) {
    for (let i = 0; i < words.length; i++) {
      if (AUXILIARY_VERBS.some(v => lowerWords[i].includes(v))) {
        return { word: words[i], index: i, type: 'verb' };
      }
    }
  }
  
  // Nivel 3-4: Conectores o verbos
  if (level <= 4) {
    // Priorizar conectores
    for (let i = 0; i < words.length; i++) {
      if (sentence.connectors.includes(lowerWords[i])) {
        return { word: words[i], index: i, type: 'connector' };
      }
    }
    // Si no hay conector, usar verbo
    for (let i = 0; i < words.length; i++) {
      if (VERB_PATTERNS.presente.test(lowerWords[i]) || 
          AUXILIARY_VERBS.some(v => lowerWords[i].includes(v))) {
        return { word: words[i], index: i, type: 'verb' };
      }
    }
  }
  
  // Nivel 5+: Cualquier palabra significativa
  for (let i = 1; i < words.length - 1; i++) {
    const word = lowerWords[i];
    if (word.length > 3 && !['el', 'la', 'los', 'las', 'un', 'una'].includes(word)) {
      return { word: words[i], index: i, type: 'noun' };
    }
  }
  
  return null;
}
