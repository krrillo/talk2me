import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type TTSModel = "tts-1" | "tts-1-hd";
export type TTSFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

export interface TTSOptions {
  voice?: TTSVoice;
  model?: TTSModel;
  speed?: number;
  format?: TTSFormat;
}

export class TTSService {
  async generateSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<Buffer> {
    const {
      voice = "nova",
      model = "tts-1",
      speed = 1.0,
      format = "mp3",
    } = options;

    if (text.length > 4096) {
      throw new Error("Text exceeds maximum length of 4096 characters");
    }

    if (speed < 0.25 || speed > 4.0) {
      throw new Error("Speed must be between 0.25 and 4.0");
    }

    try {
      const response = await openai.audio.speech.create({
        model,
        voice,
        input: text,
        response_format: format,
        speed,
      });

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("TTS generation error:", error);
      throw new Error("Failed to generate speech");
    }
  }

  async generateSpeechStream(
    text: string,
    options: TTSOptions = {}
  ): Promise<ReadableStream> {
    const {
      voice = "nova",
      model = "tts-1",
      speed = 1.0,
      format = "mp3",
    } = options;

    if (text.length > 4096) {
      throw new Error("Text exceeds maximum length of 4096 characters");
    }

    if (speed < 0.25 || speed > 4.0) {
      throw new Error("Speed must be between 0.25 and 4.0");
    }

    try {
      const response = await openai.audio.speech.create({
        model,
        voice,
        input: text,
        response_format: format,
        speed,
      });

      return response.body as ReadableStream;
    } catch (error) {
      console.error("TTS streaming error:", error);
      throw new Error("Failed to stream speech");
    }
  }

  async generateStoryPageAudio(
    pageText: string,
    pageIndex: number,
    storyId: string,
    options: TTSOptions = {}
  ): Promise<Buffer> {
    const cleanText = pageText.replace(/[#*_]/g, "");
    
    const audioBuffer = await this.generateSpeech(cleanText, {
      ...options,
      voice: "nova",
      model: "tts-1",
    });

    return audioBuffer;
  }
}

export const ttsService = new TTSService();
