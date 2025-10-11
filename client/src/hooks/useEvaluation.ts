import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/auth";

interface EvaluateAnswerRequest {
  exerciseId: string;
  userAnswer: any;
  context?: {
    attempts?: number;
    timeSpent?: number;
  };
}

interface EvaluationResponse {
  correct: boolean;
  score: number;
  feedback?: string;
  suggestions?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

export function useEvaluateAnswer() {
  return useMutation({
    mutationFn: async (request: EvaluateAnswerRequest): Promise<EvaluationResponse> => {
      const response = await fetch('/api/evaluation/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to evaluate answer');
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: (data) => {
      if (data.correct) {
        toast.success(`¡Correcto! Puntuación: ${data.score}`);
      } else {
        toast.error(`Incorrecto. ${data.feedback || 'Intenta de nuevo'}`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al evaluar: ${error.message}`);
    },
  });
}

export function useExercisePerformance(exerciseId: string) {
  return useQuery({
    queryKey: ['exercise-performance', exerciseId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation/exercise/${exerciseId}/performance`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercise performance');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!exerciseId,
  });
}

export function useUserAnalysis(userId: string) {
  return useQuery({
    queryKey: ['user-analysis', userId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluation/user/${userId}/analysis`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user analysis');
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!userId,
  });
}
