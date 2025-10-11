export interface User {
  id: string;
  username: string;
  level: number;
  experiencePoints: number;
  createdAt: Date;
}

export interface Story {
  id: string;
  title: string;
  level: number;
  theme: string;
  pages: StoryPage[];
  createdAt: Date;
  completed?: boolean;
  score?: number;
}

export interface StoryPage {
  text: string;
  image?: string;
  imageUrl?: string;
}

export interface GameSpec {
  id: string;
  storyId: string;
  title: string;
  level: number;
  theme: string;
  gameType: "drag_words" | "order_sentence" | "complete_words" | "multi_choice";
  story?: string;
  exercise: {
    type: string;
    payload: {
      sentence?: string;
      options?: string[];
      correct?: string;
      words?: string[];
      question?: string;
      choices?: string[];
      correctIndex?: number;
      explanation?: string;
      hints?: string[];
    };
  };
  uiHints?: {
    contrast?: string;
    fontScale?: number;
    animations?: Record<string, string>;
  };
}

export interface ExerciseResult {
  gameId: string;
  userId: string;
  correct: boolean;
  score: number;
  timeSpent: number;
  attempts: number;
  completedAt: Date;
}

export interface ProgressData {
  userId: string;
  date: string;
  score: number;
  gamesPlayed: number;
  timeSpent: number;
}
