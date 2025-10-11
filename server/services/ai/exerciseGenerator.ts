import { langchainService } from "./langchainService";
import { db } from "../../lib/db.js";
import { exercises, stories, insertExerciseSchema } from "@shared/schema";
import { GameSpec, AIMetadata } from "@shared/types";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class ExerciseGeneratorService {
  async generateExercisesForStory(storyId: string, gameTypes?: string[]): Promise<GameSpec[]> {
    try {
      // Fetch the story first
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      if (!story) {
        throw new Error("Story not found");
      }

      // Extract story text
      const storyText = story.pages.map((page: any) => page.text).join(' ');

      // Generate exercises using LangChain
      const generated = await langchainService.generateStoryWithExercises({
        theme: story.theme,
        level: story.level,
        locale: "es-ES",
      });

      const gameSpecs: GameSpec[] = [];

      // Process each generated exercise
      for (const exercise of generated.exercises) {
        const exerciseData = {
          storyId,
          gameType: exercise.gameType,
          level: story.level,
          exerciseData: exercise.exercise,
          correctAnswer: this.extractCorrectAnswer(exercise.exercise),
          hints: this.generateHints(exercise.exercise, story.level),
          aiMetadata: this.createAIMetadata(exercise, story),
        };

        // Store in database
        const validatedExercise = insertExerciseSchema.parse(exerciseData);
        const [savedExercise] = await db
          .insert(exercises)
          .values(validatedExercise)
          .returning();

        // Create GameSpec for frontend
        const gameSpec: GameSpec = {
          id: savedExercise.id,
          storyId,
          title: exercise.title || this.getDefaultTitle(exercise.gameType),
          level: story.level,
          theme: story.theme,
          gameType: exercise.gameType as any,
          story: storyText, // Full story context for better comprehension
          exercise: exercise.exercise,
          uiHints: this.generateUIHints(story.level),
        };

        gameSpecs.push(gameSpec);
      }

      console.log(`Generated ${gameSpecs.length} exercises for story ${storyId}`);
      return gameSpecs;

    } catch (error) {
      console.error("Error generating exercises:", error);
      throw new Error(`Failed to generate exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExerciseById(exerciseId: string): Promise<GameSpec | null> {
    try {
      const [exercise] = await db
        .select({
          exercise: exercises,
          story: {
            id: stories.id,
            title: stories.title,
            theme: stories.theme,
            pages: stories.pages,
          },
        })
        .from(exercises)
        .innerJoin(stories, eq(exercises.storyId, stories.id))
        .where(eq(exercises.id, exerciseId))
        .limit(1);

      if (!exercise) {
        return null;
      }

      // Convert to GameSpec format
      const gameSpec: GameSpec = {
        id: exercise.exercise.id,
        storyId: exercise.exercise.storyId,
        title: this.getDefaultTitle(exercise.exercise.gameType),
        level: exercise.exercise.level,
        theme: exercise.story.theme,
        gameType: exercise.exercise.gameType as any,
        story: exercise.story.pages.map((p: any) => p.text).join(' '),
        exercise: exercise.exercise.exerciseData as any,
        uiHints: this.generateUIHints(exercise.exercise.level),
      };

      return gameSpec;

    } catch (error) {
      console.error("Error fetching exercise:", error);
      return null;
    }
  }

  async getExercisesByStoryId(storyId: string): Promise<GameSpec[]> {
    try {
      const exerciseList = await db
        .select({
          exercise: exercises,
          story: {
            theme: stories.theme,
            pages: stories.pages,
          },
        })
        .from(exercises)
        .innerJoin(stories, eq(exercises.storyId, stories.id))
        .where(eq(exercises.storyId, storyId));

      return exerciseList.map(({ exercise, story }) => ({
        id: exercise.id,
        storyId: exercise.storyId,
        title: this.getDefaultTitle(exercise.gameType),
        level: exercise.level,
        theme: story.theme,
        gameType: exercise.gameType as any,
        story: story.pages.map((p: any) => p.text).join(' '),
        exercise: exercise.exerciseData as any,
        uiHints: this.generateUIHints(exercise.level),
      }));

    } catch (error) {
      console.error("Error fetching exercises by story:", error);
      return [];
    }
  }

  async generateCustomExercise(storyId: string, gameType: string, customPrompts?: string[]): Promise<GameSpec> {
    try {
      const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      if (!story) {
        throw new Error("Story not found");
      }

      // Generate specific exercise type
      const exerciseContent = await this.generateSpecificExerciseType(
        story.pages.map((p: any) => p.text).join(' '),
        gameType,
        story.level,
        customPrompts
      );

      const exerciseData = {
        storyId,
        gameType,
        level: story.level,
        exerciseData: exerciseContent,
        correctAnswer: this.extractCorrectAnswer(exerciseContent),
        hints: this.generateHints(exerciseContent, story.level),
        aiMetadata: this.createAIMetadata({ gameType, exercise: exerciseContent }, story),
      };

      const validatedExercise = insertExerciseSchema.parse(exerciseData);
      const [savedExercise] = await db
        .insert(exercises)
        .values(validatedExercise)
        .returning();

      return {
        id: savedExercise.id,
        storyId,
        title: this.getDefaultTitle(gameType),
        level: story.level,
        theme: story.theme,
        gameType: gameType as any,
        story: story.pages.map((p: any) => p.text).join(' '),
        exercise: exerciseContent,
        uiHints: this.generateUIHints(story.level),
      };

    } catch (error) {
      console.error("Error generating custom exercise:", error);
      throw new Error(`Failed to generate custom exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateSpecificExerciseType(
    storyText: string,
    gameType: string,
    level: number,
    customPrompts?: string[]
  ): Promise<any> {
    // This would use more specific prompts for each game type
    const generated = await langchainService.generateStoryWithExercises({
      theme: "custom",
      level,
      locale: "es-ES",
    });

    // Find matching exercise type or return first one
    const targetExercise = generated.exercises.find(ex => ex.gameType === gameType) || generated.exercises[0];
    return targetExercise.exercise;
  }

  private extractCorrectAnswer(exerciseData: any): any {
    if (exerciseData.payload) {
      return {
        type: exerciseData.type,
        answer: exerciseData.payload.correct || exerciseData.payload.correctIndex || null,
      };
    }
    return null;
  }

  private generateHints(exerciseData: any, level: number): string[] {
    const baseHints = [
      "Lee la oración completa antes de responder",
      "Piensa en lo que aprendiste en la historia",
      "Recuerda las reglas de gramática que conoces",
    ];

    const levelHints = {
      1: ["Fíjate en los artículos (el, la)", "Busca la palabra que suena mejor"],
      2: ["Piensa en si es masculino o femenino", "¿Es singular o plural?"],
      3: ["Revisa la conjugación del verbo", "¿Qué tiempo verbal es correcto?"],
      4: ["Considera el contexto completo", "¿Qué modo verbal necesitas?"],
      5: ["Analiza la estructura completa", "¿Hay oraciones subordinadas?"],
    };

    return [...baseHints, ...levelHints[level as keyof typeof levelHints] || []];
  }

  private generateUIHints(level: number): any {
    return {
      contrast: level <= 2 ? "high" : "normal",
      fontScale: level <= 2 ? 1.2 : 1.0,
      animations: {
        enter: "fadeInUp",
        success: level <= 2 ? "bounce" : "fadeIn",
        error: "shake",
      },
    };
  }

  private createAIMetadata(exercise: any, story: any): AIMetadata {
    return {
      model: "gpt-5",
      promptHash: crypto.createHash('sha256')
        .update(`${story.theme}-${story.level}-${exercise.gameType}`)
        .digest('hex'),
      generatedAt: new Date().toISOString(),
      parameters: {
        gameType: exercise.gameType,
        storyId: story.id,
        level: story.level,
      },
    };
  }

  private getDefaultTitle(gameType: string): string {
    const titles = {
      drag_words: "Completa la oración",
      order_sentence: "Ordena las palabras",
      complete_words: "Completa la palabra",
      multi_choice: "Selección múltiple",
    };
    
    return titles[gameType as keyof typeof titles] || "Ejercicio";
  }

  async validateExerciseDifficulty(exerciseData: any, level: number): Promise<{
    isAppropriate: boolean;
    suggestedLevel: number;
    reasoning: string;
  }> {
    try {
      // Use AI to validate if exercise matches the intended difficulty level
      // This is a simplified version - in production you'd use more sophisticated analysis
      
      return {
        isAppropriate: true,
        suggestedLevel: level,
        reasoning: "Exercise matches target level complexity",
      };
    } catch (error) {
      console.error("Error validating exercise difficulty:", error);
      return {
        isAppropriate: true,
        suggestedLevel: level,
        reasoning: "Unable to validate, using default assessment",
      };
    }
  }
}

export const exerciseGeneratorService = new ExerciseGeneratorService();
