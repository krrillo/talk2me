import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  level: number;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  
  // Actions
  login: (username: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      
      login: async (username: string) => {
        set({ isLoading: true });
        try {
          // Call backend login endpoint to create/get user
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const result = await response.json();
          const userData = result.data.user;

          const user: User = {
            id: userData.id,
            username: userData.username,
            level: userData.level,
            createdAt: new Date(),
          };
          
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({ user: null });
      },
      
      setUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "hablaconmigo-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
