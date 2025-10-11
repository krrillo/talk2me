import { Request, Response, NextFunction } from "express";
import { validateRequest, createErrorResponse } from "@shared/validation";
import { LoginRequestSchema } from "@shared/validation";

// Extended Request interface to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    level: number;
  };
}

// Simple session-based auth middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // In a simple implementation, we'll check for a basic session
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;
    
    if (!authHeader && !sessionId) {
      return res.status(401).json(createErrorResponse("Authentication required"));
    }

    // For demo purposes, we'll extract user from basic auth or session
    // In production, this would validate JWT tokens or session data
    let user;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Simple token format: Bearer username:id:level
      const token = authHeader.substring(7);
      const [username, id, level] = token.split(':');
      user = { id, username, role: 'student', level: parseInt(level) || 1 };
    } else if (sessionId) {
      // For session-based auth, you'd look up the session in your store
      // For now, we'll decode from the session ID
      try {
        const decoded = Buffer.from(sessionId, 'base64').toString('utf-8');
        const [username, id, level] = decoded.split(':');
        user = { id, username, role: 'student', level: parseInt(level) || 1 };
      } catch {
        return res.status(401).json(createErrorResponse("Invalid session"));
      }
    }

    if (!user || !user.id) {
      return res.status(401).json(createErrorResponse("Invalid authentication"));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json(createErrorResponse("Authentication error"));
  }
}

// Optional auth middleware - doesn't fail if no auth provided
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const [username, id, level] = token.split(':');
      req.user = { id, username, role: 'student', level: parseInt(level) || 1 };
    } else if (sessionId) {
      try {
        const decoded = Buffer.from(sessionId, 'base64').toString('utf-8');
        const [username, id, level] = decoded.split(':');
        req.user = { id, username, role: 'student', level: parseInt(level) || 1 };
      } catch {
        // Ignore invalid sessions in optional auth
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without auth
  }
}

// Role-based authorization
export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createErrorResponse("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createErrorResponse("Insufficient permissions"));
    }

    next();
  };
}

// Validate request body middleware
export function validateBody<T>(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validateRequest(schema, req.body);
      next();
    } catch (error) {
      res.status(400).json(createErrorResponse(error instanceof Error ? error.message : "Validation failed"));
    }
  };
}

// Rate limiting middleware (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    const record = requestCounts.get(key);
    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      next();
    } else if (record.count < maxRequests) {
      record.count++;
      next();
    } else {
      res.status(429).json(createErrorResponse("Too many requests"));
    }
  };
}
