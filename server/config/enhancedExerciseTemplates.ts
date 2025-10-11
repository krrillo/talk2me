/**
 * Templates Pedagógicos Mejorados con Ejemplos Concretos por Nivel
 * Estos templates proporcionan ejemplos específicos en lugar de instrucciones abstractas
 */

import { getLevelConfig } from './levels.js';

interface ExerciseTemplate {
  instruction: string;
  examples: string[];
  rules: string[];
}

/**
 * Templates específicos por nivel para order_sentence
 */
export const ORDER_SENTENCE_BY_LEVEL: Record<number, ExerciseTemplate> = {
  1: {
    instruction: "Extraer UNA oración completa y simple (SVO) del texto. Dividir en palabras para ordenar.",
    examples: [
      "Texto: 'El gato come pescado.' → words: ['El', 'gato', 'come', 'pescado'] → correct: 'El gato come pescado.'",
      "Texto: 'Ana lee un libro.' → words: ['Ana', 'lee', 'un', 'libro'] → correct: 'Ana lee un libro.'"
    ],
    rules: [
      "DEBE ser oración que existe literalmente en el texto",
      "Estructura simple: Sujeto + Verbo + Complemento",
      "4-6 palabras máximo",
      "Sin conectores"
    ]
  },
  2: {
    instruction: "Extraer oración simple con artículo y adjetivo del texto.",
    examples: [
      "Texto: 'La niña pequeña juega.' → words: ['La', 'niña', 'pequeña', 'juega'] → correct: 'La niña pequeña juega.'",
      "Texto: 'Un perro negro corre.' → words: ['Un', 'perro', 'negro', 'corre'] → correct: 'Un perro negro corre.'"
    ],
    rules: [
      "DEBE existir literalmente en el texto",
      "Incluir artículo (el/la/un/una) y adjetivo",
      "5-7 palabras",
      "Sin conectores complejos"
    ]
  },
  3: {
    instruction: "Extraer oración con conector simple (porque, y, pero) del texto.",
    examples: [
      "Texto: 'Pedro juega porque está feliz.' → words: ['Pedro', 'juega', 'porque', 'está', 'feliz'] → correct: 'Pedro juega porque está feliz.'",
      "Texto: 'Ana lee y escribe bien.' → words: ['Ana', 'lee', 'y', 'escribe', 'bien'] → correct: 'Ana lee y escribe bien.'"
    ],
    rules: [
      "DEBE existir exactamente así en el texto",
      "DEBE incluir conector: porque, y, pero, cuando",
      "6-8 palabras",
      "Enseña uso de conectores básicos"
    ]
  },
  4: {
    instruction: "Extraer oración con verbo en pasado o concordancia de género/número del texto.",
    examples: [
      "Texto: 'Los niños jugaron en el parque.' → words: ['Los', 'niños', 'jugaron', 'en', 'el', 'parque'] → correct: 'Los niños jugaron en el parque.'",
      "Texto: 'Las flores están bonitas.' → words: ['Las', 'flores', 'están', 'bonitas'] → correct: 'Las flores están bonitas.'"
    ],
    rules: [
      "DEBE ser literal del texto",
      "Incluir plural o verbo en pasado",
      "Enseñar concordancia de género/número",
      "6-10 palabras"
    ]
  },
  5: {
    instruction: "Extraer oración compuesta con subordinada del texto.",
    examples: [
      "Texto: 'María estudia mucho porque quiere aprender.' → words: ['María', 'estudia', 'mucho', 'porque', 'quiere', 'aprender'] → correct: 'María estudia mucho porque quiere aprender.'",
      "Texto: 'El niño que lee es inteligente.' → words: ['El', 'niño', 'que', 'lee', 'es', 'inteligente'] → correct: 'El niño que lee es inteligente.'"
    ],
    rules: [
      "Extraer literalmente del texto",
      "Incluir subordinada con 'que', 'porque', 'cuando'",
      "7-10 palabras",
      "Enseñar estructura de subordinadas"
    ]
  },
  // Niveles 6-10 siguen patrón similar con mayor complejidad
  6: {
    instruction: "Extraer oración con tiempo perfecto o adverbio temporal del texto.",
    examples: [
      "Texto: 'Pedro ha terminado su trabajo.' → words: ['Pedro', 'ha', 'terminado', 'su', 'trabajo']",
      "Texto: 'Ana siempre estudia por la tarde.' → words: ['Ana', 'siempre', 'estudia', 'por', 'la', 'tarde']"
    ],
    rules: ["Literal del texto", "Incluir tiempo perfecto o adverbio", "8-12 palabras"]
  },
  7: {
    instruction: "Extraer oración compleja con múltiples conectores del texto.",
    examples: [
      "Texto: 'Aunque llovía, Pedro salió porque tenía prisa.' → extraer literal"
    ],
    rules: ["Literal del texto", "Múltiples conectores", "10-14 palabras"]
  },
  8: {
    instruction: "Extraer oración con lenguaje figurado o modismo del texto.",
    examples: ["Literal del texto con metáfora o modismo"],
    rules: ["Extraer exactamente del texto", "10-15 palabras"]
  },
  9: {
    instruction: "Extraer oración en voz pasiva o discurso indirecto del texto.",
    examples: ["Literal del texto con estructura avanzada"],
    rules: ["Extraer exactamente", "12-16 palabras"]
  },
  10: {
    instruction: "Extraer oración compleja con subordinadas múltiples del texto.",
    examples: ["Literal del texto, máxima complejidad"],
    rules: ["Extraer exactamente", "12-18 palabras"]
  }
};

/**
 * Templates específicos por nivel para complete_words
 */
export const COMPLETE_WORDS_BY_LEVEL: Record<number, ExerciseTemplate> = {
  1: {
    instruction: "Extraer oración del texto, remover verbo básico (es, está, tiene). IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: [
      "Texto: 'El gato es negro.' → sentence: 'El gato___negro.' → correct: 'es'",
      "Texto: 'Ana tiene un perro.' → sentence: 'Ana___un perro.' → correct: 'tiene'"
    ],
    rules: [
      "Oración DEBE existir literalmente en el texto",
      "Remover solo: es, está, tiene, come, juega",
      "Usar exactamente ___ (tres guiones bajos juntos, SIN ESPACIOS antes/después)",
      "La palabra removida es la respuesta correcta",
      "NO inventar palabras"
    ]
  },
  2: {
    instruction: "Extraer oración del texto, remover artículo o adjetivo. IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: [
      "Texto: 'La niña pequeña juega.' → sentence: 'La niña___juega.' → correct: 'pequeña'",
      "Texto: 'Un perro grande ladra.' → sentence: '___perro grande ladra.' → correct: 'Un'"
    ],
    rules: [
      "Oración literal del texto",
      "Remover artículo (el/la/un/una) o adjetivo",
      "Usar exactamente ___ (tres guiones bajos juntos, SIN ESPACIOS)",
      "Enseñar concordancia"
    ]
  },
  3: {
    instruction: "Extraer oración del texto, remover conector (porque, y, pero, cuando). IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: [
      "Texto: 'Pedro juega porque está feliz.' → sentence: 'Pedro juega___está feliz.' → correct: 'porque'",
      "Texto: 'Ana lee y escribe.' → sentence: 'Ana lee___escribe.' → correct: 'y'"
    ],
    rules: [
      "Oración EXACTA del texto",
      "Remover conector que enseñe cohesión",
      "Usar exactamente ___ (tres guiones bajos juntos, SIN ESPACIOS)",
      "La palabra debe estar EN el texto"
    ]
  },
  4: {
    instruction: "Extraer oración del texto, remover verbo conjugado (presente/pasado). IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: [
      "Texto: 'Los niños jugaron ayer.' → sentence: 'Los niños___ayer.' → correct: 'jugaron'",
      "Texto: 'María escribe cartas.' → sentence: 'María___cartas.' → correct: 'escribe'"
    ],
    rules: [
      "Literal del texto",
      "Remover verbo conjugado",
      "Usar exactamente ___ (tres guiones bajos juntos, SIN ESPACIOS)",
      "Enseñar conjugación"
    ]
  },
  5: {
    instruction: "Extraer oración del texto, remover palabra de subordinación (que, donde, cuando). IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: [
      "Texto: 'El niño que lee es inteligente.' → sentence: 'El niño___lee es inteligente.' → correct: 'que'"
    ],
    rules: [
      "Extraer literal",
      "Remover subordinante",
      "Usar exactamente ___ (tres guiones bajos juntos, SIN ESPACIOS)",
      "Enseñar subordinadas"
    ]
  },
  6: {
    instruction: "Extraer oración, remover auxiliar de tiempo compuesto. IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: [
      "Texto: 'Pedro ha terminado.' → sentence: 'Pedro___terminado.' → correct: 'ha'"
    ],
    rules: ["Literal", "Usar ___ sin espacios", "Tiempos compuestos"]
  },
  7: {
    instruction: "Extraer oración, remover preposición o nexo complejo. IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: ["Texto literal, usar ___ sin espacios"],
    rules: ["Preposiciones precisas", "Usar ___ sin espacios"]
  },
  8: {
    instruction: "Extraer oración, remover palabra clave del modismo. IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: ["Texto literal, usar ___ sin espacios"],
    rules: ["Lenguaje figurado", "Usar ___ sin espacios"]
  },
  9: {
    instruction: "Extraer oración, remover elemento de voz pasiva. IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: ["Texto literal, usar ___ sin espacios"],
    rules: ["Voz pasiva", "Usar ___ sin espacios"]
  },
  10: {
    instruction: "Extraer oración compleja, remover nexo subordinante. IMPORTANTE: usar ___ sin espacios alrededor.",
    examples: ["Texto literal, usar ___ sin espacios"],
    rules: ["Subordinadas múltiples", "Usar ___ sin espacios"]
  }
};

/**
 * Genera template dinámico para order_sentence según nivel
 */
export function buildOrderSentenceTemplate(level: number): string {
  const template = ORDER_SENTENCE_BY_LEVEL[level] || ORDER_SENTENCE_BY_LEVEL[1];
  
  return `
  INSTRUCCIONES OBLIGATORIAS PARA order_sentence (Nivel ${level}):
  
  ${template.instruction}
  
  EJEMPLOS CONCRETOS:
  ${template.examples.map((ex, i) => `  ${i + 1}. ${ex}`).join('\n')}
  
  REGLAS ESTRICTAS:
  ${template.rules.map((rule, i) => `  ${i + 1}. ${rule}`).join('\n')}
  
  FORMATO DE SALIDA:
  {
    "gameType": "order_sentence",
    "title": "Ordena las palabras",
    "exercise": {
      "type": "order_sentence",
      "payload": {
        "words": [array de palabras extraídas de la oración literal],
        "correct": "La oración completa exacta que aparece en el texto",
        "explanation": "Explicación de la estructura gramatical según nivel ${level}",
        "hints": ["Pista sobre estructura", "Pista sobre regla gramatical nivel ${level}"]
      }
    }
  }
  `;
}

/**
 * Genera template dinámico para complete_words según nivel
 */
export function buildCompleteWordsTemplate(level: number): string {
  const template = COMPLETE_WORDS_BY_LEVEL[level] || COMPLETE_WORDS_BY_LEVEL[1];
  
  return `
  INSTRUCCIONES OBLIGATORIAS PARA complete_words (Nivel ${level}):
  
  ${template.instruction}
  
  EJEMPLOS CONCRETOS:
  ${template.examples.map((ex, i) => `  ${i + 1}. ${ex}`).join('\n')}
  
  REGLAS ESTRICTAS:
  ${template.rules.map((rule, i) => `  ${i + 1}. ${rule}`).join('\n')}
  
  FORMATO DE SALIDA:
  {
    "gameType": "complete_words",
    "title": "Completa la palabra",
    "exercise": {
      "type": "complete_words",
      "payload": {
        "sentence": "Oración literal del texto con UNA palabra reemplazada por ___",
        "correct": "La palabra exacta que falta (solo la palabra, sin puntuación)",
        "explanation": "Por qué esta palabra es correcta según gramática nivel ${level}",
        "hints": ["Pista sobre tipo de palabra", "Pista sobre contexto"]
      }
    }
  }
  `;
}

/**
 * Construye template completo de ejercicios con ejemplos por nivel
 */
export function buildEnhancedExercisesTemplate(
  gameTypes: string[],
  level: number,
  minLength: number,
  maxLength: number
): string {
  const templates: string[] = [];
  
  gameTypes.forEach(type => {
    if (type === 'order_sentence') {
      templates.push(buildOrderSentenceTemplate(level));
    } else if (type === 'complete_words') {
      templates.push(buildCompleteWordsTemplate(level));
    } else if (type === 'multi_choice') {
      templates.push(`
      INSTRUCCIONES para multi_choice (Nivel ${level}):
      - Crear pregunta de comprensión basada SOLO en información del texto
      - Respuesta correcta debe incluir detalles específicos del texto
      - Opciones incorrectas plausibles pero claramente distintas
      {
        "gameType": "multi_choice",
        "title": "Pregunta de comprensión",
        "exercise": {
          "type": "multi_choice",
          "payload": {
            "question": "Pregunta sobre el texto",
            "choices": ["Respuesta correcta detallada", "Distractor 1", "Distractor 2", "Distractor 3"],
            "correctIndex": 0,
            "explanation": "Por qué es correcta, con referencia al texto",
            "hints": ["Dónde buscar en el texto", "Detalle clave"]
          }
        }
      }
      `);
    } else if (type === 'free_writing') {
      templates.push(`
      {
        "gameType": "free_writing",
        "title": "Redacción libre",
        "exercise": {
          "type": "free_writing",
          "payload": {
            "prompt": "Pregunta abierta sobre la historia (nivel ${level})",
            "minLength": ${minLength},
            "maxLength": ${maxLength},
            "rubric": ["Ortografía", "Concordancia", "Tiempos verbales nivel ${level}", "Coherencia"]
          }
        }
      }
      `);
    }
  });
  
  return templates.join(',\n');
}
