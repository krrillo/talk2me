import { z } from "zod";

// Story generation request/response types
export const StoryGenerateRequestSchema = z.object({
  theme: z.string().min(1),
  level: z.number().min(1).max(5),
  locale: z.string().default("es-ES"),
  constraints: z.object({
    maxWords: z.number().optional(),
    targetVocabulary: z.array(z.string()).optional(),
    avoidTopics: z.array(z.string()).optional(),
  }).optional(),
});

export type StoryGenerateRequest = z.infer<typeof StoryGenerateRequestSchema>;

// Story page structure
export const StoryPageSchema = z.object({
  text: z.string(),
  image: z.string().optional(),
  audioUrl: z.string().optional(),
});

export type StoryPage = z.infer<typeof StoryPageSchema>;

// Game specification types
export const GameSpecSchema = z.object({
  id: z.string(),
  storyId: z.string(),
  title: z.string(),
  level: z.number(),
  theme: z.string(),
  gameType: z.enum(["drag_words", "order_sentence", "complete_words", "multi_choice"]),
  story: z.string().optional(),
  exercise: z.object({
    type: z.string(),
    payload: z.record(z.any()),
  }),
  uiHints: z.object({
    contrast: z.string().optional(),
    fontScale: z.number().optional(),
    animations: z.record(z.string()).optional(),
  }).optional(),
});

export type GameSpec = z.infer<typeof GameSpecSchema>;

// Exercise result types
export const ExerciseResultSchema = z.object({
  exerciseId: z.string(),
  userId: z.string(),
  correct: z.boolean(),
  score: z.number().min(0).max(100),
  timeSpent: z.number().min(0), // seconds
  attempts: z.number().min(1),
  responseData: z.record(z.any()).optional(),
});

export type ExerciseResult = z.infer<typeof ExerciseResultSchema>;

// Progress data for charts
export const ProgressDataSchema = z.object({
  date: z.string(),
  score: z.number(),
  gamesPlayed: z.number(),
  timeSpent: z.number(), // minutes
});

export type ProgressData = z.infer<typeof ProgressDataSchema>;

// User progress summary
export const UserProgressSchema = z.object({
  totalGamesPlayed: z.number(),
  averageScore: z.number(),
  streakDays: z.number(),
  level: z.number(),
  experiencePoints: z.number(),
  badges: z.array(z.string()),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;

// AI Generation metadata
export const AIMetadataSchema = z.object({
  model: z.string(),
  promptHash: z.string().optional(),
  generatedAt: z.string(),
  parameters: z.record(z.any()).optional(),
  tokens: z.object({
    prompt: z.number().optional(),
    completion: z.number().optional(),
  }).optional(),
});

export type AIMetadata = z.infer<typeof AIMetadataSchema>;

// Asset generation types
export const AssetGenerateRequestSchema = z.object({
  type: z.enum(["image", "sprite", "background"]),
  theme: z.string(),
  style: z.string().default("flat-illustration"),
  description: z.string(),
  size: z.enum(["1024x1024", "512x512", "256x256"]).default("1024x1024"),
});

export type AssetGenerateRequest = z.infer<typeof AssetGenerateRequestSchema>;

// Evaluation request/response
export const EvaluateAnswerRequestSchema = z.object({
  exerciseId: z.string(),
  userAnswer: z.any(),
  context: z.object({
    level: z.number(),
    attempts: z.number(),
  }).optional(),
});

export type EvaluateAnswerRequest = z.infer<typeof EvaluateAnswerRequestSchema>;

export const EvaluationResponseSchema = z.object({
  correct: z.boolean(),
  score: z.number().min(0).max(100),
  message: z.string(),
  hints: z.array(z.string()).optional(),
  nextSuggestion: z.string().optional(),
  grammarFeedback: z.array(z.string()).optional(),
});

export type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;

// Theme definitions
export const THEMES = {
  animals: { name: "Animales", emoji: "🐾", keywords: ["perro", "gato", "pájaro", "pez"] },
  family: { name: "Familia", emoji: "👨‍👩‍👧‍👦", keywords: ["mamá", "papá", "hermano", "abuela"] },
  nature: { name: "Naturaleza", emoji: "🌳", keywords: ["árbol", "flor", "río", "montaña"] },
  adventure: { name: "Aventuras", emoji: "🏔️", keywords: ["explorar", "viaje", "tesoro", "mapa"] },
  friendship: { name: "Amistad", emoji: "🤝", keywords: ["amigo", "jugar", "compartir", "ayudar"] },
  school: { name: "Escuela", emoji: "📚", keywords: ["maestro", "clase", "aprender", "libro"] },
} as const;

export type Theme = keyof typeof THEMES;

// Level definitions
export const LEVELS = {
  1: { name: "Inicial", wordRange: [50, 80], description: "Oraciones simples" },
  2: { name: "Básico", wordRange: [80, 100], description: "Vocabulario amplio" },
  3: { name: "Intermedio", wordRange: [100, 130], description: "Gramática media" },
  4: { name: "Avanzado", wordRange: [130, 160], description: "Estructuras complejas" },
  5: { name: "Experto", wordRange: [150, 200], description: "Subordinadas" },
} as const;

export type Level = keyof typeof LEVELS;
