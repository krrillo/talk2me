import { z } from "zod";
import { StoryGenerateRequestSchema, GameSpecSchema, ExerciseResultSchema, EvaluateAnswerRequestSchema } from "./types";

// API request validation schemas
export const LoginRequestSchema = z.object({
  username: z.string().min(1, "Username is required").max(100, "Username too long"),
});

export const CreateStoryRequestSchema = StoryGenerateRequestSchema;

export const CreateExerciseRequestSchema = z.object({
  storyId: z.string().uuid(),
  gameType: z.enum(["drag_words", "order_sentence", "complete_words", "multi_choice"]),
  level: z.number().min(1).max(5),
  customPrompts: z.array(z.string()).optional(),
});

export const SubmitAnswerRequestSchema = ExerciseResultSchema;

export const GetProgressRequestSchema = z.object({
  userId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
});

// Response validation schemas
export const ApiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export const PaginatedResponseSchema = <T>(itemSchema: z.ZodSchema<T>) =>
  z.object({
    success: z.boolean(),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
    error: z.string().optional(),
  });

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message,
  };
}

export function createErrorResponse(error: string, message?: string) {
  return {
    success: false,
    error,
    message,
  };
}

// Content safety validation
export const ContentSafetySchema = z.object({
  text: z.string(),
  checkFor: z.array(z.enum(["violence", "inappropriate", "adult"])).default(["violence", "inappropriate", "adult"]),
});

export function validateContentSafety(text: string): boolean {
  // Simple content filtering - in production would use more sophisticated filtering
  const prohibitedWords = [
    "violencia", "muerte", "sangre", "guerra", "pelea", "golpe",
    "arma", "pistola", "cuchillo", "matar", "morir", "lastimar"
  ];
  
  const lowerText = text.toLowerCase();
  return !prohibitedWords.some(word => lowerText.includes(word));
}

// Grammar validation helpers
export const GrammarPatternSchema = z.object({
  pattern: z.string(),
  level: z.number(),
  description: z.string(),
});

export const GRAMMAR_PATTERNS = [
  { pattern: "article + noun", level: 1, description: "Artículo y sustantivo (la casa, el perro)" },
  { pattern: "subject + verb", level: 1, description: "Sujeto y verbo (María corre)" },
  { pattern: "gender agreement", level: 2, description: "Concordancia de género (niña bonita)" },
  { pattern: "number agreement", level: 2, description: "Concordancia de número (gatos grandes)" },
  { pattern: "verb conjugation", level: 3, description: "Conjugación verbal (yo como, tú comes)" },
  { pattern: "adjective placement", level: 3, description: "Posición de adjetivos" },
  { pattern: "subordinate clauses", level: 4, description: "Oraciones subordinadas" },
  { pattern: "conditional mood", level: 5, description: "Modo condicional" },
];

export function validateGrammarLevel(text: string, level: number): string[] {
  const issues: string[] = [];
  
  // Simple grammar validation based on level
  if (level >= 2) {
    // Check for basic gender agreement issues (simplified)
    const genderMismatches = text.match(/(el|un)\s+(niña|casa|mesa|escuela)/gi);
    if (genderMismatches) {
      issues.push("Posible error de concordancia de género");
    }
  }
  
  if (level >= 3) {
    // Check for verb conjugation patterns
    const verbPatterns = text.match(/\b(yo|tú|él|ella|nosotros|vosotros|ellos|ellas)\s+\w+/gi);
    if (!verbPatterns) {
      issues.push("Considera usar pronombres con verbos conjugados");
    }
  }
  
  return issues;
}
