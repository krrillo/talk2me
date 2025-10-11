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
          // Generate a proper UUID for the user
          const uuid = crypto.randomUUID();
          const user: User = {
            id: uuid,
            username: username,
            level: 1,
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
