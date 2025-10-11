import express from "express";
import passport from "passport";
import { validateBody } from "../middleware/auth";
import { LoginRequestSchema } from "@shared/validation";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { authService } from "../services/auth/authService";

const router = express.Router();

// Simple login - creates or gets user by username
router.post('/login', validateBody(LoginRequestSchema), async (req, res) => {
  try {
    const { username } = req.body;

    // Create or get user
    const user = await authService.createOrGetUser(username);
    
    // Generate simple session token
    const token = authService.generateUserToken(user);
    const sessionId = authService.generateSessionId(user);

    res.json(createSuccessResponse({
      user: {
        id: user.id,
        username: user.username,
        level: user.level,
        experiencePoints: user.experiencePoints,
        preferences: user.preferences,
      },
      token,
      sessionId,
    }));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Login failed'));
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;
    
    let userInfo = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.decodeUserToken(token);
      if (decoded) {
        userInfo = await authService.getUserById(decoded.id);
      }
    } else if (sessionId) {
      const decoded = authService.decodeUserToken(sessionId);
      if (decoded) {
        userInfo = await authService.getUserById(decoded.id);
      }
    }

    if (userInfo) {
      res.json(createSuccessResponse({
        id: userInfo.id,
        username: userInfo.username,
        level: userInfo.level,
        experiencePoints: userInfo.experiencePoints,
        preferences: userInfo.preferences,
      }));
    } else {
      res.status(401).json(createErrorResponse('Not authenticated'));
    }

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json(createErrorResponse('Failed to get user info'));
  }
});

// Update user preferences
router.patch('/preferences', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createErrorResponse('Authentication required'));
    }

    const token = authHeader.substring(7);
    const decoded = authService.decodeUserToken(token);
    if (!decoded) {
      return res.status(401).json(createErrorResponse('Invalid token'));
    }

    const success = await authService.updateUserPreferences(decoded.id, req.body);
    
    if (success) {
      res.json(createSuccessResponse({ message: 'Preferences updated successfully' }));
    } else {
      res.status(500).json(createErrorResponse('Failed to update preferences'));
    }

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json(createErrorResponse('Failed to update preferences'));
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/',
    session: false
  }),
  (req, res) => {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect('/?error=auth_failed');
    }

    const token = authService.generateUserToken(user);
    const sessionId = authService.generateSessionId(user);
    
    res.redirect(`/?token=${token}&sessionId=${sessionId}&newUser=${!user.emailVerified}`);
  }
);

// Logout (simple - just acknowledge)
router.post('/logout', (req, res) => {
  res.json(createSuccessResponse({ message: 'Logged out successfully' }));
});

export default router;
