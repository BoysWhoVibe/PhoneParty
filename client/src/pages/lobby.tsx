import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Share, Crown, Play } from "lucide-react";
import PlayerList from "@/components/ui/player-list";
import GameHeader from "@/components/ui/game-header";
import { config } from "@/lib/config";

export default function Lobby() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerName, setPlayerName] = useState("");
  const [townNamingMode, setTownNamingMode] = useState("vote");
  const [hasJoined, setHasJoined] = useState(false);
  
  const playerId = localStorage.getItem("playerId");
  
  const { data: gameData, isLoading } = useQuery({
    queryKey: ["/api/games", code],
    refetchInterval: 2000, // Poll every 2 seconds
  }) as { data: any, isLoading: boolean };

  const joinMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/games/${code}/join`, {
        name
      });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("playerId", data.player.playerId);
      setHasJoined(true);
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      toast({
        title: "Joined!",
        description: "You have joined the game",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join game",
        variant: "destructive"
      });
    }
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/games/${code}/start`, {
        hostId: gameData?.gameRoom?.hostId || playerId,
        townNamingMode
      });
      return response.json();
    },
    onSuccess: () => {
      if (townNamingMode === "vote") {
        setLocation(`/town-naming/${code}`);
      } else {
        setLocation(`/role-assignment/${code}`);
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
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/games/${code}/add-test-players`);
      return response.json();
    },
    onSuccess: (data) => {
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

  useEffect(() => {
    if (gameData?.players && playerId) {
      const currentPlayer = gameData.players.find((p: any) => p.playerId === playerId);
      if (currentPlayer) {
        setHasJoined(true);
      }
    }
  }, [gameData, playerId]);

  useEffect(() => {
    // Only redirect to other phases if the user has actually joined the game
    if (gameData?.gameRoom && gameData.gameRoom.phase !== "lobby" && hasJoined) {
      // Redirect to appropriate phase
      switch (gameData.gameRoom.phase) {
        case "town_naming":
          setLocation(`/town-naming/${code}`);
          break;
        case "town_voting":
          setLocation(`/town-voting/${code}`);
          break;
        case "role_assignment":
          setLocation(`/role-assignment/${code}`);
          break;
        case "night":
          setLocation(`/night/${code}`);
          break;
        case "day":
          setLocation(`/day/${code}`);
          break;
        case "voting":
          setLocation(`/voting/${code}`);
          break;
        case "game_end":
          setLocation(`/game-end/${code}`);
          break;
      }
    }
  }, [gameData, code, setLocation, hasJoined]);

  const handleJoinGame = () => {
    if (!playerName || playerName.length > 15) {
      toast({
        title: "Invalid Name",
        description: "Name must be 1-15 characters",
        variant: "destructive"
      });
      return;
    }
    joinMutation.mutate(playerName);
  };

  const handleStartGame = () => {
    if (!gameData?.players || gameData.players.length < 1) {
      toast({
        title: "Not enough players", 
        description: "Need at least 1 player to start",
        variant: "destructive"
      });
      return;
    }
    startGameMutation.mutate();
  };

  const handleShareCode = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join my Mafia game!",
        text: `Use code: ${code}`,
      });
    } else {
      navigator.clipboard.writeText(code!);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-2">Game Not Found</h1>
              <p className="text-gray-400 mb-4">The room code may be invalid or the game may have ended.</p>
              <Button onClick={() => setLocation("/")} className="w-full">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isHost = playerId === gameData?.gameRoom?.hostId;
  const currentPlayer = gameData?.players?.find((p: any) => p.playerId === playerId);
  
  console.log("Debug - isHost:", isHost);
  console.log("Debug - hasJoined:", hasJoined);
  console.log("Debug - playerId:", playerId);
  console.log("Debug - gameData:", gameData);
  console.log("Debug - Show controls:", gameData && (hasJoined || isHost));

  return (
    <div className="min-h-screen bg-background">
      <GameHeader 
        title="Game Lobby" 
        gameCode={code}
        showBackButton={true}
      />

      {/* Player List */}
      <div className="px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Players</h2>
          <p className="text-gray-400 text-sm">
            {gameData?.players?.length || 0} players joined
          </p>
        </div>

        <PlayerList 
          players={gameData?.players || []} 
          hostId={gameData?.gameRoom.hostId || ""}
        />

        {/* Name Entry (for new players) or Game Started Message */}
        {!hasJoined && (
          <Card className="bg-surface border-2 border-dashed border-gray-600 mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-2">
                  <Crown className="w-6 h-6 text-gray-400" />
                </div>
                {gameData?.gameRoom?.phase !== "lobby" ? (
                  <div className="mb-3">
                    <p className="text-sm text-red-400 mb-1">🚫 Game Already Started</p>
                    <p className="text-xs text-gray-400 mb-3">This game is in progress and no longer accepting new players</p>
                    <Button
                      onClick={() => setLocation("/")}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2"
                    >
                      Return to Home
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400 mb-3">Enter your name to join</p>
                    <Input
                      type="text"
                      placeholder="Your name (max 15 chars)"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
                      className="w-full bg-gray-800 border-gray-600 text-center focus:border-primary mb-3"
                    />
                    <Button
                      onClick={handleJoinGame}
                      disabled={joinMutation.isPending}
                      className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2"
                    >
                      {joinMutation.isPending ? "Joining..." : "Join Game"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Controls - Show for testing */}
        {gameData && (hasJoined || isHost) && (
          <div className="space-y-4">
            {/* Town Naming Options */}
            <Card className="bg-surface border-gray-700">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Town Name</h3>
                <RadioGroup
                  value={townNamingMode}
                  onValueChange={setTownNamingMode}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="host" id="host" />
                    <Label htmlFor="host" className="text-sm">Host chooses name</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="vote" id="vote" />
                    <Label htmlFor="vote" className="text-sm">Players vote on names</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Add Test Players Button - Show only in debug mode */}
            {config.enableTestPlayers && (
              <Button
                onClick={() => addTestPlayersMutation.mutate()}
                disabled={addTestPlayersMutation.isPending}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 font-medium py-3"
              >
                {addTestPlayersMutation.isPending ? "Adding..." : "Add Test Players (Debug)"}
              </Button>
            )}

            {/* Start Game Button - Show for everyone during development */}
            <Button
              onClick={handleStartGame}
              disabled={startGameMutation.isPending || !gameData?.players || gameData.players.length < 1}
              className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-4 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {startGameMutation.isPending ? "Starting..." : "Start Game"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
