import { useQuery } from "@tanstack/react-query";
import { GameSpec } from "@/lib/types";

export function useGameSpec(gameId: string) {
  return useQuery<GameSpec>({
    queryKey: [`/api/games/${gameId}`],
    enabled: !!gameId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
