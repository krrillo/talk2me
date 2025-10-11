import { useMutation } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";

export type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface TTSOptions {
  voice?: TTSVoice;
  speed?: number;
}

interface GenerateSpeechParams {
  text: string;
  options?: TTSOptions;
}

interface GenerateStoryAudioParams {
  storyId: string;
  pageIndex: number;
  pageText: string;
  options?: TTSOptions;
}

export function useGenerateSpeech() {
  return useMutation({
    mutationFn: async ({ text, options = {} }: GenerateSpeechParams) => {
      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          text,
          voice: options.voice || "nova",
          model: "tts-1",
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    },
  });
}

export function useGenerateStoryAudio() {
  return useMutation({
    mutationFn: async ({
      storyId,
      pageIndex,
      pageText,
      options = {},
    }: GenerateStoryAudioParams) => {
      const response = await fetch("/api/tts/story-page", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          storyId,
          pageIndex,
          pageText,
          voice: options.voice || "nova",
          speed: options.speed || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story audio");
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    },
  });
}

export function useTTSPlayer() {
  const { mutateAsync: generateSpeech, isPending } = useGenerateSpeech();
  
  const play = async (text: string, options?: TTSOptions) => {
    const audioUrl = await generateSpeech({ text, options });
    const audio = new Audio(audioUrl);
    
    return new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error("Audio playback failed"));
      };
      audio.play().catch(reject);
    });
  };

  return {
    play,
    isLoading: isPending,
  };
}
