/**
 * Exercise templates for different game types
 * These are STRUCTURAL GUIDES that instruct the AI what to generate
 * NOT literal placeholder values
 */

export const EXERCISE_TEMPLATES: Record<string, string> = {
  drag_words: `
    {{
      "gameType": "drag_words",
      "title": "[Create a short descriptive title in Spanish]",
      "exercise": {{
        "type": "drag_words",
        "payload": {{
          "sentence": "[Extract a sentence from the story and replace ONE key word with ___ (WITHOUT SPACES - example: 'palabra___palabra' NOT 'palabra ___ palabra'). The missing word should test the grammar focus for this level: {grammarFocus}]",
          "options": ["[correct word]", "[incorrect option 1 - similar but wrong]", "[incorrect option 2 - plausible distractor]"],
          "correct": "[the correct word that fills the blank]",
          "explanation": "[Explain why this answer is correct based on grammar rules for level {level}]",
          "hints": ["[Subtle hint about grammar rule]", "[More specific hint about context]"]
        }}
      }}
    }}`,
  
  order_sentence: `
    {{
      "gameType": "order_sentence",
      "title": "[Create a short title in Spanish]",
      "exercise": {{
        "type": "order_sentence", 
        "payload": {{
          "words": ["[word 1]", "[word 2]", "[word 3]", "[word 4]", "[word 5]", "[word 6]"],
          "correct": "[the correct sentence formed by ordering the words - test sentence structure for level {level}]",
          "explanation": "[Explain the correct word order based on Spanish sentence structure rules]",
          "hints": ["[Hint about sentence structure: subject, verb, object]", "[Hint about specific grammar rule for this level]"]
        }}
      }}
    }}`,
  
  complete_words: `
    {{
      "gameType": "complete_words",
      "title": "[Create a descriptive title in Spanish]",
      "exercise": {{
        "type": "complete_words",
        "payload": {{
          "sentence": "[Extract ONE sentence from the story and replace ONE key word with ___ (three underscores WITHOUT SPACES). Format example: 'El gato___muy rápido' NOT 'El gato ___ muy rápido'. The missing word should test grammar focus for level {level}: {grammarFocus}]",
          "correct": "[the single word that fills the blank - just the word, no punctuation]",
          "explanation": "[Explain why this word is correct based on grammar rules for level {level}]",
          "hints": ["[Subtle hint about grammar rule or word type]", "[More specific hint about context]"]
        }}
      }}
    }}`,
  
  multi_choice: `
    {{
      "gameType": "multi_choice",
      "title": "[Create a title in Spanish about the question topic]",
      "exercise": {{
        "type": "multi_choice",
        "payload": {{
          "question": "[Create a reading comprehension question about the story that tests understanding appropriate for level {level}]",
          "choices": ["[Correct answer with specific details from story]", "[Plausible but incorrect option]", "[Another distractor]", "[Another distractor]"],
          "correctIndex": 0,
          "explanation": "[Explain why the correct answer is right, referencing specific story details]",
          "hints": ["[Hint about where in the story to look]", "[More specific hint about key detail]"]
        }}
      }}
    }}`,
  
  free_writing: `
    {{
      "gameType": "free_writing",
      "title": "[Create a title in Spanish about the writing task]",
      "exercise": {{
        "type": "free_writing",
        "payload": {{
          "prompt": "[Create an open-ended question about the story that requires written response appropriate for level {level}. Examples: ¿Qué aprendiste de esta historia? ¿Cómo te sentirías tú en esa situación? ¿Qué harías diferente?]",
          "minLength": {minLength},
          "maxLength": {maxLength},
          "rubric": [
            "[Evaluation criterion 1 for level {level} - e.g., Ortografía correcta]",
            "[Evaluation criterion 2 - e.g., Concordancia de género y número]",
            "[Evaluation criterion 3 - e.g., Uso apropiado de tiempos verbales para nivel {level}]",
            "[Evaluation criterion 4 - e.g., Coherencia y cohesión textual]"
          ]
        }}
      }}
    }}`,
  
  rewrite_sentence: `
    {{
      "gameType": "rewrite_sentence",
      "title": "[Title in Spanish about correcting the sentence]",
      "exercise": {{
        "type": "rewrite_sentence",
        "payload": {{
          "incorrectSentence": "[Create a sentence from the story but introduce 1-2 grammatical errors related to level {level} focus areas: {grammarFocus}. Make errors realistic and pedagogically useful]",
          "correctSentence": "[The correct version of the sentence above]",
          "errorTypes": ["[specific error type 1: e.g., 'concordancia de género']", "[error type 2 if applicable]"],
          "explanation": "[Explain each error and how to correct it, referencing specific grammar rules]",
          "hints": ["[Hint pointing to first error location]", "[Hint about the grammar rule violated]"]
        }}
      }}
    }}`,
  
  find_error: `
    {{
      "gameType": "find_error",
      "title": "[Title in Spanish about finding the error]",
      "exercise": {{
        "type": "find_error",
        "payload": {{
          "sentence": "[Create a sentence with ONE grammatical error relevant to level {level}. Error should test: {grammarFocus}]",
          "errorPosition": [number representing word position of error, starting from 0],
          "errorWord": "[the incorrect word in the sentence]",
          "correctWord": "[the corrected version of that word]",
          "errorType": "[specific error type: concordancia de género, conjugación verbal, preposición incorrecta, etc.]",
          "explanation": "[Explain why it's an error and how to correct it, with grammar rule reference]",
          "hints": ["[Hint about where to look in the sentence]", "[Hint about what type of error it is]"]
        }}
      }}
    }}`,
  
  contextual_choice: `
    {{
      "gameType": "contextual_choice",
      "title": "[Title in Spanish about contextual understanding]",
      "exercise": {{
        "type": "contextual_choice",
        "payload": {{
          "context": "[Quote a relevant passage from the story that requires deep comprehension]",
          "question": "[Ask a question that requires understanding of register, tone, intention, or inference - appropriate for level {level}]",
          "choices": ["[Option A - correct, with subtle nuances]", "[Option B - plausible but incorrect]", "[Option C - distractor]", "[Option D - distractor]"],
          "correctIndex": [index of correct answer 0-3],
          "explanation": "[Explain why the correct answer is right based on contextual clues, linguistic register, or pragmatic understanding]",
          "hints": ["[Hint about register or tone to consider]", "[Hint about communicative intention or inference needed]"]
        }}
      }}
    }}`
};

/**
 * Build exercises JSON template from game types
 */
export function buildExercisesTemplate(gameTypes: string[], minLength: number, maxLength: number): string {
  const templates = gameTypes
    .map(type => EXERCISE_TEMPLATES[type])
    .filter(Boolean)
    .map(template => template.replace('{minLength}', minLength.toString()).replace('{maxLength}', maxLength.toString()))
    .join(',\n');
  
  return templates;
}
