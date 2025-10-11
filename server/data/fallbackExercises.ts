/**
 * Ejercicios de Respaldo Validados Manualmente
 * Se usan cuando la generación automática falla después de 3 intentos
 */

export interface FallbackExercise {
  gameType: string;
  title: string;
  level: number;
  exercise: {
    type: string;
    payload: any;
  };
}

/**
 * Ejercicios de respaldo por nivel y tipo
 */
export const FALLBACK_EXERCISES_BY_LEVEL: Record<number, Record<string, FallbackExercise>> = {
  1: {
    order_sentence: {
      gameType: "order_sentence",
      title: "Ordena las palabras",
      level: 1,
      exercise: {
        type: "order_sentence",
        payload: {
          words: ["El", "gato", "come", "pescado"],
          correct: "El gato come pescado.",
          explanation: "Estructura simple: Sujeto (El gato) + Verbo (come) + Complemento (pescado)",
          hints: ["Piensa en quién realiza la acción", "El verbo es 'come'"]
        }
      }
    },
    complete_words: {
      gameType: "complete_words",
      title: "Completa la palabra",
      level: 1,
      exercise: {
        type: "complete_words",
        payload: {
          sentence: "El perro ___ grande.",
          correct: "es",
          explanation: "Usamos 'es' del verbo SER para describir características permanentes",
          hints: ["Verbo que describe cómo es algo", "Empieza con 'e'"]
        }
      }
    },
    multi_choice: {
      gameType: "multi_choice",
      title: "Pregunta de comprensión",
      level: 1,
      exercise: {
        type: "multi_choice",
        payload: {
          question: "¿Qué hace el gato?",
          choices: ["Come pescado", "Juega con agua", "Duerme todo el día", "Corre rápido"],
          correctIndex: 0,
          explanation: "En la historia dice claramente que el gato come pescado",
          hints: ["Lee la primera oración", "Busca la palabra 'gato'"]
        }
      }
    }
  },
  2: {
    order_sentence: {
      gameType: "order_sentence",
      title: "Ordena las palabras",
      level: 2,
      exercise: {
        type: "order_sentence",
        payload: {
          words: ["La", "niña", "pequeña", "juega", "feliz"],
          correct: "La niña pequeña juega feliz.",
          explanation: "Artículo (La) + Sustantivo (niña) + Adjetivo (pequeña) + Verbo (juega) + Adverbio (feliz)",
          hints: ["Empieza con 'La'", "El adjetivo 'pequeña' va después de 'niña'"]
        }
      }
    },
    complete_words: {
      gameType: "complete_words",
      title: "Completa la palabra",
      level: 2,
      exercise: {
        type: "complete_words",
        payload: {
          sentence: "Un perro ___ ladra fuerte.",
          correct: "grande",
          explanation: "El adjetivo 'grande' describe el tamaño del perro y va antes del verbo",
          hints: ["Es un adjetivo que describe tamaño", "Va entre 'perro' y 'ladra'"]
        }
      }
    },
    multi_choice: {
      gameType: "multi_choice",
      title: "Pregunta de comprensión",
      level: 2,
      exercise: {
        type: "multi_choice",
        payload: {
          question: "¿Cómo es la niña?",
          choices: ["Es pequeña", "Es grande", "Es alta", "Es rápida"],
          correctIndex: 0,
          explanation: "La historia dice 'la niña pequeña', por lo tanto es pequeña",
          hints: ["Busca adjetivos que describan a la niña", "Está en la primera parte"]
        }
      }
    }
  },
  3: {
    order_sentence: {
      gameType: "order_sentence",
      title: "Ordena las palabras",
      level: 3,
      exercise: {
        type: "order_sentence",
        payload: {
          words: ["Pedro", "juega", "porque", "está", "feliz"],
          correct: "Pedro juega porque está feliz.",
          explanation: "Usa el conector 'porque' para unir dos ideas: la acción (juega) y la causa (está feliz)",
          hints: ["El conector 'porque' explica la razón", "Pedro es el sujeto"]
        }
      }
    },
    complete_words: {
      gameType: "complete_words",
      title: "Completa la palabra",
      level: 3,
      exercise: {
        type: "complete_words",
        payload: {
          sentence: "Ana lee ___ escribe bien.",
          correct: "y",
          explanation: "El conector 'y' une dos acciones que realiza Ana: leer y escribir",
          hints: ["Conector que une dos acciones", "Es una letra"]
        }
      }
    },
    multi_choice: {
      gameType: "multi_choice",
      title: "Pregunta de comprensión",
      level: 3,
      exercise: {
        type: "multi_choice",
        payload: {
          question: "¿Por qué juega Pedro?",
          choices: ["Porque está feliz", "Porque tiene hambre", "Porque está cansado", "Porque llueve"],
          correctIndex: 0,
          explanation: "La historia dice 'juega porque está feliz', la felicidad es la razón",
          hints: ["Busca la palabra 'porque'", "La razón está después de 'porque'"]
        }
      }
    }
  },
  4: {
    order_sentence: {
      gameType: "order_sentence",
      title: "Ordena las palabras",
      level: 4,
      exercise: {
        type: "order_sentence",
        payload: {
          words: ["Los", "niños", "jugaron", "en", "el", "parque"],
          correct: "Los niños jugaron en el parque.",
          explanation: "Verbo en pasado 'jugaron' (plural) concuerda con 'Los niños' (plural)",
          hints: ["El verbo está en pasado", "Empieza con 'Los'"]
        }
      }
    },
    complete_words: {
      gameType: "complete_words",
      title: "Completa la palabra",
      level: 4,
      exercise: {
        type: "complete_words",
        payload: {
          sentence: "Las flores ___ bonitas.",
          correct: "están",
          explanation: "El verbo 'están' (plural) concuerda con 'Las flores' (plural femenino)",
          hints: ["Verbo SER o ESTAR en plural", "Describe estado actual"]
        }
      }
    },
    multi_choice: {
      gameType: "multi_choice",
      title: "Pregunta de comprensión",
      level: 4,
      exercise: {
        type: "multi_choice",
        payload: {
          question: "¿Dónde jugaron los niños?",
          choices: ["En el parque", "En la casa", "En la escuela", "En la playa"],
          correctIndex: 0,
          explanation: "La historia dice 'jugaron en el parque'",
          hints: ["Busca la palabra 'en'", "Es un lugar al aire libre"]
        }
      }
    }
  },
  5: {
    order_sentence: {
      gameType: "order_sentence",
      title: "Ordena las palabras",
      level: 5,
      exercise: {
        type: "order_sentence",
        payload: {
          words: ["María", "estudia", "mucho", "porque", "quiere", "aprender"],
          correct: "María estudia mucho porque quiere aprender.",
          explanation: "Oración compuesta con subordinada causal: acción principal + porque + razón con verbo",
          hints: ["La subordinada empieza con 'porque'", "Hay dos verbos: estudia y quiere"]
        }
      }
    },
    complete_words: {
      gameType: "complete_words",
      title: "Completa la palabra",
      level: 5,
      exercise: {
        type: "complete_words",
        payload: {
          sentence: "El niño ___ lee es inteligente.",
          correct: "que",
          explanation: "El pronombre relativo 'que' introduce una subordinada que describe al niño",
          hints: ["Palabra que introduce información adicional", "Pronombre relativo"]
        }
      }
    },
    multi_choice: {
      gameType: "multi_choice",
      title: "Pregunta de comprensión",
      level: 5,
      exercise: {
        type: "multi_choice",
        payload: {
          question: "¿Por qué estudia mucho María?",
          choices: ["Porque quiere aprender", "Porque le gusta jugar", "Porque tiene sueño", "Porque es tarde"],
          correctIndex: 0,
          explanation: "La historia explica que María estudia mucho porque quiere aprender",
          hints: ["La razón está después de 'porque'", "Tiene que ver con el aprendizaje"]
        }
      }
    }
  }
};

/**
 * Obtiene ejercicio de respaldo
 */
export function getFallbackExercise(
  level: number,
  gameType: string
): FallbackExercise | null {
  const levelExercises = FALLBACK_EXERCISES_BY_LEVEL[level];
  if (!levelExercises) {
    // Si no hay para ese nivel exacto, usar nivel más cercano
    const availableLevels = Object.keys(FALLBACK_EXERCISES_BY_LEVEL).map(Number);
    const closestLevel = availableLevels.reduce((prev, curr) => 
      Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev
    );
    return FALLBACK_EXERCISES_BY_LEVEL[closestLevel]?.[gameType] || null;
  }
  
  return levelExercises[gameType] || null;
}

/**
 * Adapta ejercicio de respaldo al contexto de la historia
 */
export function adaptFallbackToStory(
  fallback: FallbackExercise,
  storyTitle: string
): FallbackExercise {
  return {
    ...fallback,
    title: `${fallback.title} - ${storyTitle}`
  };
}
