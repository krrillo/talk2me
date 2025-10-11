import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "./routes/auth";
import storyRoutes from "./routes/stories";
import exerciseRoutes from "./routes/exercises";
import progressRoutes from "./routes/progress";
import evaluationRoutes from "./routes/evaluation";
import ttsRoutes from "./routes/tts";
import gamesRoutes from "./routes/games";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/stories', storyRoutes);
  app.use('/api/exercises', exerciseRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/evaluation', evaluationRoutes);
  app.use('/api/tts', ttsRoutes);
  app.use('/api/games', gamesRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
