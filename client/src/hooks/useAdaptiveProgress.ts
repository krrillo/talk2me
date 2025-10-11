import { useQuery } from "@tanstack/react-query";

export interface AdaptiveRecommendations {
  recommendedLevel: number;
  focusAreas: string[];
  nextExercises: string[];
  currentLevel: number;
  performanceSummary: {
    averageScore: number;
    recentTrend?: string;
    strongAreas?: string[];
    weakAreas?: string[];
  };
}

export function useAdaptiveRecommendations() {
  return useQuery({
    queryKey: ['adaptive-recommendations'],
    queryFn: async (): Promise<AdaptiveRecommendations> => {
      const response = await fetch('/api/progress/adaptive', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch adaptive recommendations');
      }

      const data = await response.json();
      return data.data;
    },
  });
}

export function useProgressSummary() {
  return useQuery({
    queryKey: ['progress-summary'],
    queryFn: async () => {
      const response = await fetch('/api/progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress summary');
      }

      const data = await response.json();
      return data.data;
    },
  });
}

export function useWeeklyProgress() {
  return useQuery({
    queryKey: ['weekly-progress'],
    queryFn: async () => {
      const response = await fetch('/api/progress/weekly', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weekly progress');
      }

      const data = await response.json();
      return data.data;
    },
  });
}

export function useDetailedProgress(limit: number = 20) {
  return useQuery({
    queryKey: ['detailed-progress', limit],
    queryFn: async () => {
      const response = await fetch(`/api/progress/detailed?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch detailed progress');
      }

      const data = await response.json();
      return data.data;
    },
  });
}

export function usePerformanceAnalysis() {
  return useQuery({
    queryKey: ['performance-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/progress/analysis', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch performance analysis');
      }

      const data = await response.json();
      return data.data;
    },
  });
}
