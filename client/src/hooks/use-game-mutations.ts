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
      const joinResponse = await apiRequest("POST", `/api/games/${gameData.gameRoom.code}/join`, {
        name
      });
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
        variant: "destructive"
      });
    }
  });

  const joinGameMutation = useMutation({
    mutationFn: async ({ code, name }: { code: string; name?: string }) => {
      if (name) {
        // Join with a name (from lobby page)
        const response = await apiRequest("POST", `/api/games/${code}/join`, { name });
        return response.json();
      } else {
        // Just check if game exists (from home page)
        const response = await apiRequest("GET", `/api/games/${code}`);
        return response.json();
      }
    },
    onSuccess: (data, variables) => {
      if (variables.name) {
        // Joining from lobby - store player ID and invalidate cache
        localStorage.setItem("playerId", data.player.playerId);
        queryClient.invalidateQueries({ queryKey: ["/api/games", variables.code] });
        toast({
          title: "Joined!",
          description: "You have joined the game",
        });
      } else {
        // Navigating from home - just go to lobby
        setLocation(`/lobby/${data.gameRoom.code}`);
      }
    },
    onError: (error: any, variables) => {
      const description = variables.name 
        ? error.message || "Failed to join game"
        : "Game room not found";
      
      toast({
        title: "Error",
        description,
        variant: "destructive"
      });
    }
  });

  const startGameMutation = useMutation({
    mutationFn: async ({ code, hostId, townNamingMode }: { 
      code: string; 
      hostId: string; 
      townNamingMode: string; 
    }) => {
      const response = await apiRequest("POST", `/api/games/${code}/start`, {
        hostId,
        townNamingMode
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
        variant: "destructive"
      });
    }
  });

  const addTestPlayersMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", `/api/games/${code}/add-test-players`);
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
        variant: "destructive"
      });
    }
  });

  const setTownNameMutation = useMutation({
    mutationFn: async ({ code, townName }: { code: string; townName: string }) => {
      const response = await apiRequest("POST", `/api/games/${code}/set-town-name`, {
        townName
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate queries to get fresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/games", variables.code] });
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
        variant: "destructive"
      });
    }
  });

  return {
    createGame: createGameMutation,
    joinGame: joinGameMutation,
    startGame: startGameMutation,
    addTestPlayers: addTestPlayersMutation,
    setTownName: setTownNameMutation
  };
}