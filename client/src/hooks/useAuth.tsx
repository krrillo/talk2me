import { useAuthStore } from "@/lib/stores/useAuthStore";

export function useAuth() {
  const { user, login, logout, isLoading } = useAuthStore();
  
  return {
    user,
    login,
    logout,
    loading: isLoading,
    isAuthenticated: !!user,
  };
}
