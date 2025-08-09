import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useGameMutations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGameMutation = useMutation({
    mutationFn: async (name: string) => {
      // First create the game room
      const createResponse = await apiRequest("POST", "/api/games");
      const gameData = await createResponse.json();

      // Then immediately join it as the first player (making us the host)
      const joinResponse = await apiRequest(
        "POST",
        `/api/games/${gameData.gameRoom.code}/join`,
        {
          name,
        },
      );
      const joinData = await joinResponse.json();

      return { gameData, joinData };
    },
    onSuccess: ({ gameData, joinData }) => {
      localStorage.setItem("playerId", joinData.player.playerId);
      setLocation(`/lobby/${gameData.gameRoom.code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create game room",
        variant: "destructive",
      });
    },
  });

  const joinGameMutation = useMutation({
    mutationFn: async ({
      code,
      name,
      onNameError,
    }: {
      code: string;
      name: string;
      onNameError?: (error: string) => void;
    }) => {
      // Always join with a name now
      const response = await apiRequest("POST", `/api/games/${code}/join`, {
        name,
      });
      return { data: await response.json(), onNameError };
    },
    onSuccess: ({ data }, variables) => {
      // Store player ID and navigate to lobby
      localStorage.setItem("playerId", data.player.playerId);
      setLocation(`/lobby/${variables.code}`);
      toast({
        title: "Joined!",
        description: "You have joined the game",
      });
    },
    onError: (error: any, variables) => {
      // Check if this is a name-specific error and we have a callback
      if (variables.onNameError && error.message) {
        variables.onNameError(error.message);
      } else {
        // Show general error in toast
        toast({
          title: "Error",
          description: error.message || "Failed to join game",
          variant: "destructive",
        });
      }
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async ({
      code,
      hostId,
      townNamingMode,
    }: {
      code: string;
      hostId: string;
      townNamingMode: string;
    }) => {
      const response = await apiRequest("POST", `/api/games/${code}/start`, {
        hostId,
        townNamingMode,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.townNamingMode === "vote") {
        setLocation(`/town-naming/${variables.code}`);
      } else {
        setLocation(`/role-assignment/${variables.code}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    },
  });

  const addTestPlayersMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest(
        "POST",
        `/api/games/${code}/add-test-players`,
      );
      return response.json();
    },
    onSuccess: (data, code) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      toast({
        title: "Test Players Updated!",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add test players",
        variant: "destructive",
      });
    },
  });

  const setTownNameMutation = useMutation({
    mutationFn: async ({
      code,
      townName,
    }: {
      code: string;
      townName: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/games/${code}/set-town-name`,
        {
          townName,
        },
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to get fresh data
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["/api/games", variables.code],
        });
      }, 500);

      toast({
        title: "Town Name Set!",
        description: `Town name changed to "${data.townName}"`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set town name",
        variant: "destructive",
      });
    },
  });

  const acknowledgeRoleMutation = useMutation({
    mutationFn: async ({ code, playerId }: { code: string; playerId: string }) => {
      const response = await apiRequest("POST", `/api/games/${code}/acknowledge-role`, {
        playerId,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate game data to refresh state
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Role Acknowledged",
        description: "You have acknowledged your role",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge role",
        variant: "destructive",
      });
    },
  });

  const startGameplayMutation = useMutation({
    mutationFn: async ({ code, hostPlayerId }: { code: string; hostPlayerId: string }) => {
      const response = await apiRequest("POST", `/api/games/${code}/start-gameplay`, {
        hostPlayerId,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate game data to refresh state
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Game Started",
        description: "The game has begun! Good luck!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start the game",
        variant: "destructive",
      });
    },
  });

  return {
    createGame: createGameMutation,
    joinGame: joinGameMutation,
    startGame: startGameMutation,
    addTestPlayers: addTestPlayersMutation,
    setTownName: setTownNameMutation,
    acknowledgeRole: acknowledgeRoleMutation,
    startGameplay: startGameplayMutation,
  };
}
