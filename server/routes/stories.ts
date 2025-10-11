import express from "express";
import { requireAuth, validateBody, rateLimit, AuthRequest } from "../middleware/auth";
import { CreateStoryRequestSchema } from "@shared/validation";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { storyGeneratorService } from "../services/ai/storyGenerator";
import { exerciseGeneratorService } from "../services/ai/exerciseGenerator";

const router = express.Router();

// Apply rate limiting to story generation (expensive operation)
router.use('/generate', rateLimit(5, 60000)); // 5 requests per minute

// Generate new story
router.post('/generate', 
  requireAuth, 
  validateBody(CreateStoryRequestSchema), 
  async (req: AuthRequest, res) => {
    try {
      const { theme, level, locale, constraints } = req.body;

      console.log(`Generating story for user ${req.user?.username}: ${theme}, level ${level}`);

      // Generate story
      const story = await storyGeneratorService.generateStory({
        theme,
        level,
        locale: locale || 'es-ES',
        constraints,
      });

      // Generate exercises for the story
      const exercises = await exerciseGeneratorService.generateExercisesForStory(story.storyId);

      res.json(createSuccessResponse({
        storyId: story.storyId,
        title: story.title,
        level: story.level,
        theme: story.theme,
        exercises: exercises.map(ex => ({
          id: ex.id,
          gameType: ex.gameType,
          title: ex.title,
        })),
      }));

    } catch (error) {
      console.error('Story generation error:', error);
      res.status(500).json(createErrorResponse(
        'Failed to generate story',
        error instanceof Error ? error.message : 'Unknown error'
      ));
    }
  }
);

// Get story by ID
router.get('/:storyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storyId } = req.params;

    const story = await storyGeneratorService.getStoryById(storyId);
    
    if (!story) {
      return res.status(404).json(createErrorResponse('Story not found'));
    }

    res.json(createSuccessResponse({
      id: story.id,
      title: story.title,
      level: story.level,
      theme: story.theme,
      pages: story.pages,
      createdAt: story.createdAt,
    }));

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch story'));
  }
});

// Get stories by level
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const level = parseInt(req.query.level as string);
    const theme = req.query.theme as string;
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);

    let stories;
    
    if (theme) {
      stories = await storyGeneratorService.getStoriesByTheme(theme, limit);
    } else if (level && level >= 1 && level <= 5) {
      stories = await storyGeneratorService.getStoriesByLevel(level, limit);
    } else {
      // Default to user's level
      const userLevel = req.user?.level || 1;
      stories = await storyGeneratorService.getStoriesByLevel(userLevel, limit);
    }

    res.json(createSuccessResponse(stories));

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch stories'));
  }
});

// Get story with associated game
router.get('/:storyId/game', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storyId } = req.params;

    // Get exercises for this story
    const exercises = await exerciseGeneratorService.getExercisesByStoryId(storyId);
    
    if (exercises.length === 0) {
      return res.status(404).json(createErrorResponse('No game found for this story'));
    }

    // Return the first exercise as the main game
    const mainGame = exercises[0];
    
    res.json(createSuccessResponse(mainGame));

  } catch (error) {
    console.error('Get story game error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch story game'));
  }
});

// Get story themes and variations
router.get('/themes/variations', requireAuth, async (req: AuthRequest, res) => {
  try {
    const theme = req.query.theme as string;
    const level = parseInt(req.query.level as string) || 1;

    if (!theme) {
      return res.status(400).json(createErrorResponse('Theme parameter required'));
    }

    const variations = await storyGeneratorService.generateThemeVariations(theme as any, level);
    
    res.json(createSuccessResponse({
      theme,
      level,
      variations,
    }));

  } catch (error) {
    console.error('Get theme variations error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch theme variations'));
  }
});

// Validate story quality (internal endpoint)
router.post('/:storyId/validate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { storyId } = req.params;
    
    const story = await storyGeneratorService.getStoryById(storyId);
    if (!story) {
      return res.status(404).json(createErrorResponse('Story not found'));
    }

    const storyText = story.pages.map((p: any) => p.text).join(' ');
    const validation = await storyGeneratorService.validateStoryQuality(storyText, story.level);
    
    res.json(createSuccessResponse(validation));

  } catch (error) {
    console.error('Story validation error:', error);
    res.status(500).json(createErrorResponse('Failed to validate story'));
  }
});

export default router;
