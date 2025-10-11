import { useQuery } from "@tanstack/react-query";
import { GameSpec } from "@/lib/types";
import { apiRequest } from "@/lib/api";

export function useGameSpec(gameId: string) {
  return useQuery<GameSpec>({
    queryKey: [`/api/games/${gameId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/games/${gameId}`);
      const result = await response.json();
      return result.data;
    },
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
