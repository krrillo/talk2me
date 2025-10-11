import { langchainService } from "./langchainService";
import { db } from "../../lib/db.js";
import { progress, exercises, users, insertProgressSchema } from "@shared/schema";
import { EvaluateAnswerRequest, EvaluationResponse, ExerciseResult } from "@shared/types";
import { eq, and, desc } from "drizzle-orm";

export class EvaluationService {
  async evaluateAnswer(request: EvaluateAnswerRequest, userId: string): Promise<EvaluationResponse> {
    try {
      // Fetch exercise details
      const [exercise] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, request.exerciseId))
        .limit(1);

      if (!exercise) {
        throw new Error("Exercise not found");
      }

      // Get correct answer from exercise data
      const correctAnswer = exercise.correctAnswer;
      
      // Use AI to evaluate the answer
      const evaluation = await langchainService.evaluateAnswer(
        request.exerciseId,
        request.userAnswer,
        correctAnswer,
        exercise.level
      );

      // Calculate final score based on multiple factors
      const finalScore = await this.calculateScore(
        evaluation.correct,
        exercise.level,
        request.context?.attempts || 1,
        exercise.gameType
      );

      // Record the attempt in progress tracking
      await this.recordProgress({
        userId,
        exerciseId: request.exerciseId,
        storyId: exercise.storyId,
        correct: evaluation.correct,
        score: finalScore,
        timeSpent: 0, // Will be updated from frontend
        attempts: request.context?.attempts || 1,
        responseData: { userAnswer: request.userAnswer, evaluation },
      });

      // Update user experience and level if needed
      await this.updateUserProgress(userId, finalScore, evaluation.correct);

      return {
        ...evaluation,
        score: finalScore,
      };

    } catch (error) {
      console.error("Error evaluating answer:", error);
      throw new Error(`Failed to evaluate answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExercisePerformance(exerciseId: string, userId?: string): Promise<{
    totalAttempts: number;
    successRate: number;
    averageScore: number;
    commonMistakes: string[];
  }> {
    try {
      const query = db
        .select()
        .from(progress)
        .where(eq(progress.exerciseId, exerciseId));

      if (userId) {
        query.where(and(eq(progress.exerciseId, exerciseId), eq(progress.userId, userId)));
      }

      const results = await query;

      if (results.length === 0) {
        return {
          totalAttempts: 0,
          successRate: 0,
          averageScore: 0,
          commonMistakes: [],
        };
      }

      const totalAttempts = results.length;
      const correctAnswers = results.filter(r => r.correct).length;
      const successRate = (correctAnswers / totalAttempts) * 100;
      const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalAttempts;

      // Analyze common mistakes from response data
      const commonMistakes = await this.analyzeCommonMistakes(results);

      return {
        totalAttempts,
        successRate,
        averageScore,
        commonMistakes,
      };

    } catch (error) {
      console.error("Error getting exercise performance:", error);
      return {
        totalAttempts: 0,
        successRate: 0,
        averageScore: 0,
        commonMistakes: [],
      };
    }
  }

  async getUserPerformanceAnalysis(userId: string): Promise<{
    overallLevel: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    progressTrend: 'improving' | 'stable' | 'declining';
  }> {
    try {
      // Get recent performance data (last 20 attempts)
      const recentProgress = await db
        .select()
        .from(progress)
        .where(eq(progress.userId, userId))
        .orderBy(desc(progress.completedAt))
        .limit(20);

      if (recentProgress.length === 0) {
        return {
          overallLevel: 1,
          strengths: [],
          weaknesses: [],
          recommendations: ["Comienza con ejercicios básicos"],
          progressTrend: 'stable',
        };
      }

      // Calculate current performance metrics
      const averageScore = recentProgress.reduce((sum, p) => sum + p.score, 0) / recentProgress.length;
      const successRate = recentProgress.filter(p => p.correct).length / recentProgress.length;

      // Determine appropriate level
      let overallLevel = 1;
      if (averageScore >= 80 && successRate >= 0.7) overallLevel = Math.min(5, Math.floor(averageScore / 15));

      // Analyze performance trends
      const progressTrend = this.analyzeProgressTrend(recentProgress);

      // Use AI to generate personalized recommendations
      const aiAnalysis = await langchainService.generateAdaptiveContent(userId, recentProgress);

      return {
        overallLevel,
        strengths: this.identifyStrengths(recentProgress),
        weaknesses: this.identifyWeaknesses(recentProgress),
        recommendations: aiAnalysis.nextExercises,
        progressTrend,
      };

    } catch (error) {
      console.error("Error analyzing user performance:", error);
      return {
        overallLevel: 1,
        strengths: [],
        weaknesses: ["Necesita más práctica"],
        recommendations: ["Continúa practicando ejercicios básicos"],
        progressTrend: 'stable',
      };
    }
  }

  private async calculateScore(
    isCorrect: boolean,
    exerciseLevel: number,
    attempts: number,
    gameType: string
  ): Promise<number> {
    if (!isCorrect) return 0;

    let baseScore = 100;
    
    // Reduce score for multiple attempts
    const attemptPenalty = Math.min(30, (attempts - 1) * 10);
    baseScore -= attemptPenalty;

    // Level bonus (harder exercises get slight bonus)
    const levelBonus = exerciseLevel * 2;
    baseScore += levelBonus;

    // Game type modifiers
    const gameTypeMultipliers = {
      'drag_words': 1.0,
      'order_sentence': 1.1,
      'complete_words': 1.2,
      'multi_choice': 0.9,
    };
    
    const multiplier = gameTypeMultipliers[gameType as keyof typeof gameTypeMultipliers] || 1.0;
    baseScore *= multiplier;

    return Math.max(10, Math.min(100, Math.round(baseScore)));
  }

  private async recordProgress(progressData: any): Promise<void> {
    try {
      const validatedProgress = insertProgressSchema.parse(progressData);
      await db.insert(progress).values(validatedProgress);
    } catch (error) {
      console.error("Error recording progress:", error);
      // Don't throw - progress recording failure shouldn't break evaluation
    }
  }

  private async updateUserProgress(userId: string, score: number, correct: boolean): Promise<void> {
    try {
      // Calculate experience points earned
      let experienceGained = Math.floor(score / 10); // 10 XP per 10 points scored
      if (correct) experienceGained += 5; // Bonus for correct answers

      // Get current user data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return;

      const newExperiencePoints = user.experiencePoints + experienceGained;
      const newLevel = Math.min(5, Math.floor(newExperiencePoints / 100) + 1);

      // Update user
      await db
        .update(users)
        .set({
          experiencePoints: newExperiencePoints,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

    } catch (error) {
      console.error("Error updating user progress:", error);
      // Don't throw - user update failure shouldn't break evaluation
    }
  }

  private async analyzeCommonMistakes(progressResults: any[]): Promise<string[]> {
    const mistakes: string[] = [];
    
    // Simple analysis of response data to identify patterns
    const incorrectResponses = progressResults
      .filter(p => !p.correct && p.responseData?.userAnswer)
      .map(p => p.responseData.userAnswer);

    // This would be more sophisticated in production
    if (incorrectResponses.length > 0) {
      mistakes.push("Errores frecuentes en la selección de respuestas");
      
      // Could analyze specific error patterns here
      const commonWords = this.findCommonWords(incorrectResponses);
      if (commonWords.length > 0) {
        mistakes.push(`Confusión frecuente con: ${commonWords.join(', ')}`);
      }
    }

    return mistakes;
  }

  private findCommonWords(responses: any[]): string[] {
    // Simple implementation to find commonly confused words
    // In production, this would be more sophisticated
    return [];
  }

  private analyzeProgressTrend(progressData: any[]): 'improving' | 'stable' | 'declining' {
    if (progressData.length < 5) return 'stable';

    // Compare first half vs second half of recent attempts
    const midPoint = Math.floor(progressData.length / 2);
    const firstHalf = progressData.slice(midPoint);
    const secondHalf = progressData.slice(0, midPoint);

    const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.score, 0) / secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;

    if (difference > 10) return 'improving';
    if (difference < -10) return 'declining';
    return 'stable';
  }

  private identifyStrengths(progressData: any[]): string[] {
    const strengths: string[] = [];
    
    // Analyze by game type performance
    const gameTypePerformance = new Map();
    progressData.forEach(p => {
      const gameType = p.responseData?.gameType || 'unknown';
      if (!gameTypePerformance.has(gameType)) {
        gameTypePerformance.set(gameType, { total: 0, correct: 0 });
      }
      const stats = gameTypePerformance.get(gameType);
      stats.total++;
      if (p.correct) stats.correct++;
    });

    // Identify strong game types
    for (const [gameType, stats] of gameTypePerformance) {
      if (stats.correct / stats.total >= 0.8) {
        const gameNames = {
          'drag_words': 'completar oraciones',
          'order_sentence': 'ordenar palabras',
          'complete_words': 'completar palabras',
          'multi_choice': 'selección múltiple',
        };
        strengths.push(`Excelente en ${gameNames[gameType] || gameType}`);
      }
    }

    return strengths;
  }

  private identifyWeaknesses(progressData: any[]): string[] {
    const weaknesses: string[] = [];
    
    // Similar analysis as strengths but for poor performance
    const gameTypePerformance = new Map();
    progressData.forEach(p => {
      const gameType = p.responseData?.gameType || 'unknown';
      if (!gameTypePerformance.has(gameType)) {
        gameTypePerformance.set(gameType, { total: 0, correct: 0 });
      }
      const stats = gameTypePerformance.get(gameType);
      stats.total++;
      if (p.correct) stats.correct++;
    });

    // Identify weak game types
    for (const [gameType, stats] of gameTypePerformance) {
      if (stats.total >= 3 && stats.correct / stats.total <= 0.5) {
        const gameNames = {
          'drag_words': 'completar oraciones',
          'order_sentence': 'ordenar palabras', 
          'complete_words': 'completar palabras',
          'multi_choice': 'selección múltiple',
        };
        weaknesses.push(`Necesita práctica en ${gameNames[gameType] || gameType}`);
      }
    }

    return weaknesses;
  }
}

export const evaluationService = new EvaluationService();
