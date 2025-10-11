/**
 * Sistema de 10 niveles para HablaConmigo
 * Basado en la Fase 5 de expansión de complejidad narrativa y lingüística
 */

export interface LevelConfig {
  level: number;
  name: string;
  wordRange: { min: number; max: number };
  grammarFeatures: string[];
  learningObjectives: string[];
  complexity: string;
  gameTypes: string[];
}

export const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  1: {
    level: 1,
    name: "Inicial",
    wordRange: { min: 50, max: 80 },
    grammarFeatures: [
      "Oraciones simples (SVO)",
      "Vocabulario concreto",
      "Sin conjugaciones complejas",
      "Artículos básicos (el, la)"
    ],
    learningObjectives: ["Reconocer sujeto-verbo-objeto"],
    complexity: "basic",
    gameTypes: ["drag_words", "multi_choice"]
  },
  2: {
    level: 2,
    name: "Básico",
    wordRange: { min: 80, max: 100 },
    grammarFeatures: [
      "Adjetivos",
      "Artículos definidos/indefinidos",
      "Tiempos presentes simples",
      "Concordancia de género básica"
    ],
    learningObjectives: ["Usar artículos y concordancia básica"],
    complexity: "basic",
    gameTypes: ["drag_words", "multi_choice"]
  },
  3: {
    level: 3,
    name: "Intermedio",
    wordRange: { min: 100, max: 130 },
    grammarFeatures: [
      "Conectores simples (y, pero, porque)",
      "Tiempos presente/pasado",
      "Verbos regulares",
      "Concordancia de número"
    ],
    learningObjectives: ["Construir ideas con conectores"],
    complexity: "intermediate",
    gameTypes: ["order_sentence", "complete_words", "multi_choice"]
  },
  4: {
    level: 4,
    name: "Avanzado",
    wordRange: { min: 130, max: 160 },
    grammarFeatures: [
      "Verbos irregulares comunes",
      "Plurales",
      "Concordancia de género",
      "Ortografía básica"
    ],
    learningObjectives: ["Reforzar ortografía básica"],
    complexity: "intermediate",
    gameTypes: ["complete_words", "order_sentence", "multi_choice"]
  },
  5: {
    level: 5,
    name: "Experto",
    wordRange: { min: 150, max: 200 },
    grammarFeatures: [
      "Subordinadas breves",
      "Pronombres",
      "Tiempos compuestos",
      "Preposiciones básicas"
    ],
    learningObjectives: ["Estructuras subordinadas básicas"],
    complexity: "advanced",
    gameTypes: ["order_sentence", "complete_words", "multi_choice", "free_writing"]
  },
  6: {
    level: 6,
    name: "Intermedio Alto",
    wordRange: { min: 200, max: 250 },
    grammarFeatures: [
      "Nexos complejos",
      "Tiempos perfectos",
      "Adverbios de modo y tiempo",
      "Oraciones coordinadas"
    ],
    learningObjectives: ["Coherencia narrativa temporal"],
    complexity: "advanced",
    gameTypes: ["order_sentence", "complete_words", "multi_choice", "free_writing"]
  },
  7: {
    level: 7,
    name: "Avanzado Alto",
    wordRange: { min: 250, max: 300 },
    grammarFeatures: [
      "Oraciones compuestas",
      "Uso de preposiciones precisas",
      "Conectores de cohesión",
      "Subjuntivo básico"
    ],
    learningObjectives: ["Dominio de cohesión y conectores"],
    complexity: "expert",
    gameTypes: ["order_sentence", "complete_words", "multi_choice", "free_writing"]
  },
  8: {
    level: 8,
    name: "Profesional",
    wordRange: { min: 300, max: 350 },
    grammarFeatures: [
      "Modismos",
      "Metáforas simples",
      "Estilo descriptivo",
      "Vocabulario figurado"
    ],
    learningObjectives: ["Uso expresivo y creativo del lenguaje"],
    complexity: "expert",
    gameTypes: ["order_sentence", "complete_words", "multi_choice", "free_writing"]
  },
  9: {
    level: 9,
    name: "Literario",
    wordRange: { min: 350, max: 400 },
    grammarFeatures: [
      "Voz pasiva",
      "Discurso indirecto",
      "Variaciones de estilo",
      "Registro formal/informal"
    ],
    learningObjectives: ["Análisis y redacción avanzada"],
    complexity: "master",
    gameTypes: ["order_sentence", "complete_words", "multi_choice", "free_writing"]
  },
  10: {
    level: 10,
    name: "Maestro",
    wordRange: { min: 400, max: 500 },
    grammarFeatures: [
      "Subordinadas múltiples",
      "Tiempos mixtos",
      "Vocabulario abstracto",
      "Corrección ortográfica completa",
      "Uso de todos los modos verbales"
    ],
    learningObjectives: ["Producción libre con estilo y corrección ortográfica completa"],
    complexity: "master",
    gameTypes: ["order_sentence", "complete_words", "multi_choice", "free_writing"]
  }
};

/**
 * Get level configuration by level number
 */
export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1];
}

/**
 * Get word count range for a level
 */
export function getWordRangeForLevel(level: number): string {
  const config = getLevelConfig(level);
  return `${config.wordRange.min}-${config.wordRange.max}`;
}

/**
 * Get grammar focus for a level
 */
export function getGrammarFocusForLevel(level: number): string {
  const config = getLevelConfig(level);
  return config.grammarFeatures.join(", ");
}

/**
 * Get appropriate game types for a level
 */
export function getGameTypesForLevel(level: number): string[] {
  const config = getLevelConfig(level);
  return config.gameTypes;
}

/**
 * Validate level is within range
 */
export function isValidLevel(level: number): boolean {
  return level >= 1 && level <= 10;
}

/**
 * Get complexity index (1-10) based on level
 */
export function getComplexityIndex(level: number): number {
  return Math.min(10, Math.max(1, level));
}
