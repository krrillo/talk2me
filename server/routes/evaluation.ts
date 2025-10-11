import express from "express";
import { requireAuth, validateBody, AuthRequest } from "../middleware/auth";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { evaluationService } from "../services/ai/evaluationService";
import { z } from "zod";

const router = express.Router();

const EvaluateAnswerSchema = z.object({
  exerciseId: z.string().uuid(),
  userAnswer: z.any(),
  context: z.object({
    attempts: z.number().optional(),
    timeSpent: z.number().optional(),
  }).optional(),
});

router.post('/evaluate', 
  requireAuth,
  validateBody(EvaluateAnswerSchema),
  async (req: AuthRequest, res) => {
    try {
      const { exerciseId, userAnswer, context } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(createErrorResponse('User not authenticated'));
      }

      console.log(`[Evaluation] Evaluating exercise ${exerciseId} for user ${userId}`);

      const evaluation = await evaluationService.evaluateAnswer({
        exerciseId,
        userAnswer,
        context,
      }, userId);

      res.json(createSuccessResponse(evaluation));

    } catch (error) {
      console.error('[Evaluation] Error:', error);
      res.status(500).json(createErrorResponse(
        'Failed to evaluate answer',
        error instanceof Error ? error.message : 'Unknown error'
      ));
    }
  }
);

router.get('/exercise/:exerciseId/performance',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { exerciseId } = req.params;
      const userId = req.user?.id;

      const performance = await evaluationService.getExercisePerformance(exerciseId, userId);

      res.json(createSuccessResponse(performance));

    } catch (error) {
      console.error('[Evaluation] Error getting performance:', error);
      res.status(500).json(createErrorResponse('Failed to get exercise performance'));
    }
  }
);

router.get('/user/:userId/analysis',
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      if (req.user?.id !== userId && req.user?.role !== 'parent' && req.user?.role !== 'therapist') {
        return res.status(403).json(createErrorResponse('Access denied'));
      }

      const analysis = await evaluationService.getUserPerformanceAnalysis(userId);

      res.json(createSuccessResponse(analysis));

    } catch (error) {
      console.error('[Evaluation] Error getting analysis:', error);
      res.status(500).json(createErrorResponse('Failed to get performance analysis'));
    }
  }
);

export default router;
