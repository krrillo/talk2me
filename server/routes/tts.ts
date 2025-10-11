import express from "express";
import { requireAuth, validateBody, AuthRequest } from "../middleware/auth";
import { createSuccessResponse, createErrorResponse } from "@shared/validation";
import { ttsService, TTSVoice, TTSModel } from "../services/ai/ttsService";
import { z } from "zod";

const router = express.Router();

const GenerateSpeechSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
  model: z.enum(["tts-1", "tts-1-hd"]).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
});

router.post(
  "/generate",
  requireAuth,
  validateBody(GenerateSpeechSchema),
  async (req: AuthRequest, res) => {
    try {
      const { text, voice, model, speed } = req.body;

      const audioBuffer = await ttsService.generateSpeech(text, {
        voice: voice as TTSVoice,
        model: model as TTSModel,
        speed,
        format: "mp3",
      });

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS generation error:", error);
      res.status(500).json(
        createErrorResponse("Failed to generate speech", "TTS_ERROR")
      );
    }
  }
);

router.post(
  "/generate-stream",
  requireAuth,
  validateBody(GenerateSpeechSchema),
  async (req: AuthRequest, res) => {
    try {
      const { text, voice, model, speed } = req.body;

      const stream = await ttsService.generateSpeechStream(text, {
        voice: voice as TTSVoice,
        model: model as TTSModel,
        speed,
        format: "mp3",
      });

      res.set({
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      });

      const reader = stream.getReader();
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          res.end();
        } catch (error) {
          console.error("Stream processing error:", error);
          res.end();
        }
      };

      await processStream();
    } catch (error) {
      console.error("TTS streaming error:", error);
      res.status(500).json(
        createErrorResponse("Failed to stream speech", "TTS_STREAM_ERROR")
      );
    }
  }
);

const GenerateStoryAudioSchema = z.object({
  storyId: z.string().uuid(),
  pageIndex: z.number().int().min(0),
  pageText: z.string().min(1).max(4096),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
});

router.post(
  "/story-page",
  requireAuth,
  validateBody(GenerateStoryAudioSchema),
  async (req: AuthRequest, res) => {
    try {
      const { storyId, pageIndex, pageText, voice, speed } = req.body;

      const audioBuffer = await ttsService.generateStoryPageAudio(
        pageText,
        pageIndex,
        storyId,
        {
          voice: voice as TTSVoice,
          speed,
        }
      );

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600",
      });

      res.send(audioBuffer);
    } catch (error) {
      console.error("Story audio generation error:", error);
      res.status(500).json(
        createErrorResponse("Failed to generate story audio", "STORY_AUDIO_ERROR")
      );
    }
  }
);

export default router;
