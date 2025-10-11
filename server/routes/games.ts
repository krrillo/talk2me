import express from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { exerciseGeneratorService } from "../services/ai/exerciseGenerator";

const router = express.Router();

router.get('/:gameId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;

    const exercise = await exerciseGeneratorService.getExerciseById(gameId);
    
    if (!exercise) {
      return res.status(404).json(createErrorResponse('Game not found'));
    }

    res.json(createSuccessResponse({
      id: exercise.id,
      storyId: exercise.storyId,
      gameType: exercise.gameType,
      level: exercise.level,
      exerciseData: exercise.exerciseData,
      correctAnswer: exercise.correctAnswer,
      hints: exercise.hints,
    }));

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch game'));
  }
});

export default router;
