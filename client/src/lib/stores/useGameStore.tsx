import { create } from "zustand";
import { GameSpec } from "@/lib/types";

interface GameState {
  currentGame: GameSpec | null;
  gameHistory: Array<{
    gameId: string;
    score: number;
    completedAt: Date;
    correct: boolean;
  }>;
  
  // Actions
  setCurrentGame: (game: GameSpec | null) => void;
  addGameResult: (result: {
    gameId: string;
    score: number;
    correct: boolean;
  }) => void;
  clearHistory: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  gameHistory: [],
  
  setCurrentGame: (game) => set({ currentGame: game }),
  
  addGameResult: (result) => set((state) => ({
    gameHistory: [
      ...state.gameHistory,
      {
        ...result,
        completedAt: new Date(),
      }
    ].slice(-50) // Keep only last 50 results
  })),
  
  clearHistory: () => set({ gameHistory: [] }),
}));
