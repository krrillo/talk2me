import express from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { exerciseGeneratorService } from "../services/ai/exerciseGenerator";

const router = express.Router();

router.get('/:gameId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;

    const gameSpec = await exerciseGeneratorService.getExerciseById(gameId);
    
    if (!gameSpec) {
      return res.status(404).json(createErrorResponse('Game not found'));
    }

    console.log('[Games API] GameSpec from service:', JSON.stringify(gameSpec, null, 2));

    // The service already returns a complete GameSpec with exercise.payload structure
    // We just need to ensure it's in the format the frontend expects
    const response = {
      ...gameSpec,
      exercise: {
        type: gameSpec.gameType,
        payload: gameSpec.exercise // This is already the payload data from exerciseData
      }
    };

    console.log('[Games API] Response to frontend:', JSON.stringify(response, null, 2));
    
    res.json(createSuccessResponse(response));

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch game'));
  }
});

export default router;
