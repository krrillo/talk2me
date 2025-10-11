import express from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { db } from "@/lib/db";
import { progress, dailyProgress, users, stories, exercises } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { evaluationService } from "../services/ai/evaluationService";
import { authService } from "../services/auth/authService";

const router = express.Router();

// Get user progress summary
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get user basic info
    const user = await authService.getUserById(userId);
    if (!user) {
      return res.status(404).json(createErrorResponse('User not found'));
    }

    // Get progress statistics
    const progressStats = await db
      .select({
        totalGames: sql<number>`count(*)`,
        averageScore: sql<number>`avg(${progress.score})`,
        correctCount: sql<number>`count(*) filter (where ${progress.correct} = true)`,
      })
      .from(progress)
      .where(eq(progress.userId, userId));

    const stats = progressStats[0] || { totalGames: 0, averageScore: 0, correctCount: 0 };

    // Calculate streak (simplified - days with activity)
    const streakQuery = await db
      .select({
        date: sql<string>`date(${progress.completedAt})`,
      })
      .from(progress)
      .where(eq(progress.userId, userId))
      .groupBy(sql`date(${progress.completedAt})`)
      .orderBy(desc(sql`date(${progress.completedAt})`))
      .limit(30);

    const streakDays = this.calculateStreak(streakQuery.map(r => r.date));

    // Get user badges
    const badges = await authService.calculateUserBadges(userId);

    const progressSummary = {
      totalGamesPlayed: Number(stats.totalGames) || 0,
      averageScore: Math.round(Number(stats.averageScore) || 0),
      streakDays,
      level: user.level,
      experiencePoints: user.experiencePoints,
      badges,
    };

    res.json(createSuccessResponse(progressSummary));

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch progress'));
  }
});

// Get weekly progress data for charts
router.get('/weekly', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const daysBack = 7;

    // Get daily progress for the last week
    const weeklyData = await db
      .select({
        date: sql<string>`date(${progress.completedAt})`,
        gamesPlayed: sql<number>`count(*)`,
        averageScore: sql<number>`avg(${progress.score})`,
        totalTimeSpent: sql<number>`sum(${progress.timeSpent})`,
      })
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          gte(progress.completedAt, sql`current_date - interval '${daysBack} days'`)
        )
      )
      .groupBy(sql`date(${progress.completedAt})`)
      .orderBy(sql`date(${progress.completedAt})`);

    // Fill in missing days with zeros
    const filledData = this.fillMissingDays(weeklyData, daysBack);

    res.json(createSuccessResponse(filledData));

  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch weekly progress'));
  }
});

// Get detailed progress by story/exercise
router.get('/detailed', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const detailedProgress = await db
      .select({
        progress: {
          id: progress.id,
          score: progress.score,
          correct: progress.correct,
          timeSpent: progress.timeSpent,
          attempts: progress.attempts,
          completedAt: progress.completedAt,
        },
        story: {
          id: stories.id,
          title: stories.title,
          theme: stories.theme,
          level: stories.level,
        },
        exercise: {
          id: exercises.id,
          gameType: exercises.gameType,
        },
      })
      .from(progress)
      .innerJoin(stories, eq(progress.storyId, stories.id))
      .innerJoin(exercises, eq(progress.exerciseId, exercises.id))
      .where(eq(progress.userId, userId))
      .orderBy(desc(progress.completedAt))
      .limit(limit);

    res.json(createSuccessResponse(detailedProgress));

  } catch (error) {
    console.error('Get detailed progress error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch detailed progress'));
  }
});

// Get performance analysis
router.get('/analysis', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const analysis = await evaluationService.getUserPerformanceAnalysis(userId);
    
    res.json(createSuccessResponse(analysis));

  } catch (error) {
    console.error('Get performance analysis error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch performance analysis'));
  }
});

// Submit progress entry (for manual tracking)
router.post('/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { exerciseId, storyId, score, correct, timeSpent, attempts, responseData } = req.body;

    const progressData = {
      userId,
      exerciseId,
      storyId,
      score: score || 0,
      correct: correct || false,
      timeSpent: timeSpent || 0,
      attempts: attempts || 1,
      responseData: responseData || {},
    };

    const [savedProgress] = await db
      .insert(progress)
      .values(progressData)
      .returning();

    res.json(createSuccessResponse({
      progressId: savedProgress.id,
      message: 'Progress recorded successfully',
    }));

  } catch (error) {
    console.error('Submit progress error:', error);
    res.status(500).json(createErrorResponse('Failed to submit progress'));
  }
});

// Get progress by date range
router.get('/range', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!startDate || !endDate) {
      return res.status(400).json(createErrorResponse('start_date and end_date are required'));
    }

    const rangeProgress = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.userId, userId),
          gte(progress.completedAt, new Date(startDate)),
          gte(new Date(endDate), progress.completedAt)
        )
      )
      .orderBy(progress.completedAt);

    res.json(createSuccessResponse(rangeProgress));

  } catch (error) {
    console.error('Get progress range error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch progress range'));
  }
});

// Helper methods (would normally be in a separate utility class)
function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date(today);
  
  for (const dateStr of dates) {
    const progressDate = new Date(dateStr);
    const daysDiff = Math.floor((currentDate.getTime() - progressDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Go back one day
    } else {
      break;
    }
  }
  
  return streak;
}

function fillMissingDays(data: any[], daysBack: number): any[] {
  const filledData = [];
  const today = new Date();
  
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayData = data.find(d => d.date === dateStr);
    filledData.push({
      date: dateStr,
      score: dayData ? Math.round(dayData.averageScore) : 0,
      gamesPlayed: dayData ? dayData.gamesPlayed : 0,
      timeSpent: dayData ? Math.round(dayData.totalTimeSpent / 60) : 0, // Convert to minutes
    });
  }
  
  return filledData;
}

export default router;
