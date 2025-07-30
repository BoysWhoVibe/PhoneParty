import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useGameMutations } from "@/hooks/use-game-mutations";
import { useGameData } from "@/hooks/use-game-data";
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
  const [selectedTownNamingMode, setSelectedTownNamingMode] = useState("host");
  const [hasJoined, setHasJoined] = useState(false);
  const [townNameInput, setTownNameInput] = useState("");
  const [isEditingTownName, setIsEditingTownName] = useState(false);
  const [serverSyncKey, setServerSyncKey] = useState(0);
  
  const playerId = localStorage.getItem("playerId");
  const { data: gameData, isLoading } = useGameData(code);
  const { joinGame, startGame, addTestPlayers, setTownName } = useGameMutations();

  // Custom town name mutation with sync protection
  const townNameMutation = {
    mutate: (townName: string) => {
      // Immediately set the input to show the value we're saving
      setTownNameInput(townName);
      
      // Block server sync temporarily to prevent override  
      setServerSyncKey(prev => prev + 1);
      
      // Call the consolidated mutation
      setTownName.mutate({ code: code!, townName });
    },
    isPending: setTownName.isPending
  };

  const saveTownNamingModeMutation = useMutation({
    mutationFn: async (mode: string) => {
      const response = await apiRequest("POST", `/api/games/${code}/set-town-naming-mode`, {
        mode: mode === "vote" ? "voting" : mode
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      toast({
        title: "Town Naming Mode Updated!",
        description: `Mode changed to "${selectedTownNamingMode === 'host' ? 'Host chooses name' : 'Players vote on name'}"`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update town naming mode",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (gameData?.players && playerId) {
      const currentPlayer = gameData.players.find((p: any) => p.playerId === playerId);
      if (currentPlayer) {
        setHasJoined(true);
      } else {
        setHasJoined(false);
      }
    }
  }, [gameData, playerId]);

  // Sync local town naming mode with server data, defaulting to "host"
  useEffect(() => {
    if (gameData?.gameRoom?.townNamingMode) {
      setSelectedTownNamingMode(gameData.gameRoom.townNamingMode);
    } else if (gameData?.gameRoom) {
      // Set default to "host" mode for new games
      setSelectedTownNamingMode("host");
    }
  }, [gameData?.gameRoom?.townNamingMode]);

  // Sync town name from server, but respect recent saves
  useEffect(() => {
    const serverTownName = gameData?.gameRoom?.townName;
    
    // Only sync if not editing, no pending mutations, and no recent saves blocking sync
    if (serverTownName && !isEditingTownName && !setTownName.isPending && serverSyncKey === 0) {
      setTownNameInput(serverTownName);
    }
  }, [gameData?.gameRoom?.townName, isEditingTownName, setTownName.isPending, serverSyncKey]);

  // Re-enable server sync after mutation completes
  useEffect(() => {
    if (serverSyncKey > 0 && !setTownName.isPending) {
      const timer = setTimeout(() => {
        setServerSyncKey(0);
      }, 1000); // Block server sync for 1 second after save
      return () => clearTimeout(timer);
    }
  }, [serverSyncKey, setTownName.isPending]);

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
    joinGame.mutate({ code: code!, name: playerName });
    setHasJoined(true);
  };

  const handleSetTownName = () => {
    if (!townNameInput || townNameInput.length > 30) {
      toast({
        title: "Invalid Town Name",
        description: "Town name must be 1-30 characters",
        variant: "destructive"
      });
      return;
    }
    
    const valueToSave = townNameInput.trim();
    setIsEditingTownName(false);
    townNameMutation.mutate(valueToSave);
  };

  const handleTownNameFocus = () => {
    setIsEditingTownName(true);
    // If there's a saved town name, use it as starting point
    if (gameData?.gameRoom?.townName && !townNameInput) {
      setTownNameInput(gameData.gameRoom.townName);
    }
  };

  const handleTownNameBlur = () => {
    // Small delay to allow save button click to register first
    setTimeout(() => {
      // Revert to saved town name if user clicks away without saving
      if (gameData?.gameRoom?.townName) {
        setTownNameInput(gameData.gameRoom.townName);
      }
      setIsEditingTownName(false);
    }, 150);
  };

  const handleTownNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSetTownName();
      // Force blur to exit editing mode
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      handleTownNameBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleSaveTownNamingMode = () => {
    saveTownNamingModeMutation.mutate(selectedTownNamingMode);
  };

  const handleStartGame = () => {
    startGame.mutate({
      code: code!,
      hostId: gameData?.gameRoom?.hostId || playerId!,
      townNamingMode: gameData?.gameRoom?.townNamingMode || "host"
    });
  };

  const handleAddTestPlayers = () => {
    addTestPlayers.mutate(code!);
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

  const currentPlayer = gameData?.players?.find((p: any) => p.playerId === playerId);
  // Host is simply the first player in the room (index 0)
  const isHost = hasJoined && gameData?.players?.length > 0 && gameData.players[0]?.playerId === playerId;
  


  return (
    <div className="min-h-screen bg-background">
      <GameHeader 
        title="Game Lobby" 
        gameCode={code}
        showBackButton={true}
      />

      {/* Large Room Code Display */}
      <div className="text-center mb-8 px-4">
        <div className="mb-2">
          <span className="text-gray-400 text-lg">Room Code</span>
        </div>
        <div className="text-5xl font-bold text-white tracking-widest font-mono bg-gray-800 inline-block px-6 py-3 rounded-lg border-2 border-primary">
          {code}
        </div>
        <div className="mt-2">
          <span className="text-gray-400 text-sm">Share this code with players</span>
        </div>
      </div>

      {/* Player List */}
      <div className="px-4 py-6">
        {/* Host Controls - Town Naming (only first player/host) */}
        {isHost && (
          <Card className="bg-surface border-gray-700 mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Town Name Setup</h3>
              <RadioGroup
                value={selectedTownNamingMode}
                onValueChange={setSelectedTownNamingMode}
                className="space-y-3 mb-4"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="host" id="host" />
                  <Label htmlFor="host" className="text-sm">Host chooses name</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="vote" id="vote" />
                  <Label htmlFor="vote" className="text-sm">Players vote on name</Label>
                </div>
              </RadioGroup>
              <Button
                onClick={handleSaveTownNamingMode}
                disabled={saveTownNamingModeMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {saveTownNamingModeMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Town Name Section - Show for all players, input for host when "host" mode */}
        {(gameData?.gameRoom?.townName || (isHost && gameData?.gameRoom?.townNamingMode === "host")) && (
          <Card className="bg-surface border-gray-700 mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Town Name</h3>
              
              {!isHost && gameData?.gameRoom?.townName ? (
                // Non-host players see the town name as read-only
                <div className="text-center p-4 bg-gray-800 rounded-lg border border-green-600">
                  <h2 className="text-2xl font-bold text-green-400">
                    {gameData.gameRoom.townName}
                  </h2>
                </div>
              ) : isHost && gameData?.gameRoom?.townNamingMode === "host" ? (
                // Host can inline-edit the town name
                <div className="space-y-3">
                  <div className="text-center p-4 bg-gray-800 rounded-lg border border-green-600">
                    <Input
                      ref={(ref) => {
                        if (!isEditingTownName && ref) {
                          ref.blur(); // Ensure input loses focus when not editing
                        }
                      }}
                      type="text"
                      placeholder="Click to enter town name"
                      value={townNameInput || ""}
                      onChange={(e) => setTownNameInput(e.target.value.slice(0, 30))}
                      onFocus={handleTownNameFocus}
                      onBlur={handleTownNameBlur}
                      onKeyDown={handleTownNameKeyDown}
                      className={`text-center text-2xl font-bold border-0 bg-transparent focus:bg-gray-700 focus:border-primary ${
                        isEditingTownName ? 'text-white' : 'text-green-400'
                      } placeholder:text-green-400/50 focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        boxShadow: 'none'
                      }}
                    />
                  </div>
                  
                  {isEditingTownName && townNameInput && townNameInput !== gameData?.gameRoom?.townName && (
                    <Button
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur from firing
                        handleSetTownName();
                      }}
                      disabled={townNameMutation.isPending || !townNameInput}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                      {townNameMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Start Game Button - Show for joined players below town name */}
        {gameData && isHost && (
          <div className="mb-6">
            <Button
              onClick={handleStartGame}
              disabled={startGame.isPending || !gameData?.players || gameData.players.length < 1}
              className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-4 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              {startGame.isPending ? "Starting..." : "Start Game"}
            </Button>
          </div>
        )}

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
                      disabled={joinGame.isPending}
                      className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2"
                    >
                      {joinGame.isPending ? "Joining..." : "Join Game"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Controls - Show for joined players */}
        {gameData && (hasJoined || isHost) && config.enableTestPlayers && (
          <div className="space-y-4">
            {/* Add Test Players Button - Show only in debug mode */}
            <Button
              onClick={handleAddTestPlayers}
              disabled={addTestPlayers.isPending}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 font-medium py-3"
            >
              {addTestPlayers.isPending ? "Adding..." : "Add Test Players (Debug)"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
