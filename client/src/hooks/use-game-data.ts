import { useQuery } from "@tanstack/react-query";

export function useGameData(code: string | undefined) {
  return useQuery({
    queryKey: ["/api/games", code],
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!code, // Only run query if code exists
  }) as { data: any; isLoading: boolean; error: any };
}

export function usePlayerRole(code: string | undefined, playerId: string | null) {
  return useQuery({
    queryKey: ["/api/games", code, "player", playerId, "role"],
    refetchInterval: 2000,
    enabled: !!(code && playerId), // Only run if both code and playerId exist
  }) as { data: any; isLoading: boolean; error: any };
}