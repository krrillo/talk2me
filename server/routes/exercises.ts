import express from "express";
import { requireAuth, validateBody, rateLimit, AuthRequest } from "../middleware/auth";
import { CreateExerciseRequestSchema, SubmitAnswerRequestSchema } from "@shared/validation";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { exerciseGeneratorService } from "../services/ai/exerciseGenerator";
import { evaluationService } from "../services/ai/evaluationService";

const router = express.Router();

// Rate limiting for exercise generation
router.use('/generate', rateLimit(10, 60000)); // 10 requests per minute

// Generate exercises for a story
router.post('/generate', 
  requireAuth, 
  validateBody(CreateExerciseRequestSchema), 
  async (req: AuthRequest, res) => {
    try {
      const { storyId, gameType, level, customPrompts } = req.body;

      let exercises;
      
      if (gameType) {
        // Generate specific exercise type
        const exercise = await exerciseGeneratorService.generateCustomExercise(
          storyId, 
          gameType, 
          customPrompts
        );
        exercises = [exercise];
      } else {
        // Generate all exercise types for story
        exercises = await exerciseGeneratorService.generateExercisesForStory(storyId);
      }

      res.json(createSuccessResponse({
        exercises: exercises.map(ex => ({
          id: ex.id,
          gameType: ex.gameType,
          title: ex.title,
          level: ex.level,
        })),
      }));

    } catch (error) {
      console.error('Exercise generation error:', error);
      res.status(500).json(createErrorResponse(
        'Failed to generate exercises',
        error instanceof Error ? error.message : 'Unknown error'
      ));
    }
  }
);

// Get exercise by ID (game data)
router.get('/:exerciseId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await exerciseGeneratorService.getExerciseById(exerciseId);
    
    if (!exercise) {
      return res.status(404).json(createErrorResponse('Exercise not found'));
    }

    res.json(createSuccessResponse(exercise));

  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch exercise'));
  }
});

// Get exercises for a story
router.get('/story/:storyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storyId } = req.params;

    const exercises = await exerciseGeneratorService.getExercisesByStoryId(storyId);
    
    res.json(createSuccessResponse(exercises));

  } catch (error) {
    console.error('Get story exercises error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch story exercises'));
  }
});

// Submit answer for evaluation
router.post('/evaluate', 
  requireAuth, 
  validateBody(SubmitAnswerRequestSchema), 
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const evaluationRequest = {
        exerciseId: req.body.exerciseId,
        userAnswer: req.body.responseData || req.body.userAnswer,
        context: {
          level: req.user!.level,
          attempts: req.body.attempts || 1,
        },
      };

      const evaluation = await evaluationService.evaluateAnswer(evaluationRequest, userId);
      
      res.json(createSuccessResponse(evaluation));

    } catch (error) {
      console.error('Answer evaluation error:', error);
      res.status(500).json(createErrorResponse(
        'Failed to evaluate answer',
        error instanceof Error ? error.message : 'Unknown error'
      ));
    }
  }
);

// Get exercise performance stats
router.get('/:exerciseId/performance', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { exerciseId } = req.params;
    const userId = req.query.user_only === 'true' ? req.user!.id : undefined;

    const performance = await evaluationService.getExercisePerformance(exerciseId, userId);
    
    res.json(createSuccessResponse(performance));

  } catch (error) {
    console.error('Get exercise performance error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch exercise performance'));
  }
});

// Validate exercise difficulty
router.post('/:exerciseId/validate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { exerciseId } = req.params;
    
    const exercise = await exerciseGeneratorService.getExerciseById(exerciseId);
    if (!exercise) {
      return res.status(404).json(createErrorResponse('Exercise not found'));
    }

    const validation = await exerciseGeneratorService.validateExerciseDifficulty(
      exercise.exercise, 
      exercise.level
    );
    
    res.json(createSuccessResponse(validation));

  } catch (error) {
    console.error('Exercise validation error:', error);
    res.status(500).json(createErrorResponse('Failed to validate exercise'));
  }
});

// Get adaptive recommendations for user
router.get('/recommendations/adaptive', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const analysis = await evaluationService.getUserPerformanceAnalysis(userId);
    
    res.json(createSuccessResponse(analysis));

  } catch (error) {
    console.error('Get adaptive recommendations error:', error);
    res.status(500).json(createErrorResponse('Failed to get recommendations'));
  }
});

export default router;
