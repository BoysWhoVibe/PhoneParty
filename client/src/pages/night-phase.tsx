import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Check, ChevronRight, User } from "lucide-react";
import { ROLES } from "@shared/schema";
import { useGameData, usePlayerRole } from "@/hooks/use-game-data";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { FullPageError } from "@/components/ui/error-display";

export default function NightPhase() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const playerId = localStorage.getItem("playerId");

  const { data: gameData, isLoading: gameLoading, error: gameError } = useGameData(code);
  const { data: roleData, isLoading: roleLoading, error: roleError } = usePlayerRole(code, playerId);

  const submitActionMutation = useMutation({
    mutationFn: async ({ actionType, targetId }: { actionType: string; targetId: string }) => {
      const response = await apiRequest("POST", `/api/games/${code}/night-action`, {
        playerId,
        actionType,
        targetId
      });
      return response.json();
    },
    onSuccess: () => {
      setHasSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      toast({
        title: "Action Submitted!",
        description: "Your night action has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit action",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (gameData && gameData.gameRoom.phase === "day") {
      setLocation(`/day/${code}`);
    }
  }, [gameData, code, setLocation]);

  const handleSelectTarget = (targetId: string) => {
    setSelectedTarget(targetId);
  };

  const handleConfirmAction = () => {
    if (!selectedTarget || !roleData) return;
    
    let actionType = "";
    switch (roleData.role) {
      case ROLES.SHERIFF:
        actionType = "investigate";
        break;
      case ROLES.MAFIA:
      case ROLES.GODFATHER:
        actionType = "kill";
        break;
      case ROLES.DOCTOR:
        actionType = "save";
        break;
      case ROLES.PROSTITUTE:
        actionType = "block";
        break;
      default:
        return;
    }
    
    submitActionMutation.mutate({ actionType, targetId: selectedTarget });
  };

  if (gameLoading || roleLoading) {
    return <FullPageLoader message="Loading night phase..." />;
  }

  if (gameError || roleError) {
    return <FullPageError message="Failed to load game data" onRetry={() => window.location.reload()} />;
  }

  if (!gameData || !roleData) {
    return <FullPageError message="Game or role data not found" />;
  }

  const role = roleData.role;
  const alivePlayers = gameData.players.filter((p: any) => p.isAlive && p.playerId !== playerId);
  const hasNightAction = [ROLES.SHERIFF, ROLES.MAFIA, ROLES.GODFATHER, ROLES.DOCTOR, ROLES.PROSTITUTE].includes(role);

  // If player has no night action, show waiting screen
  if (!hasNightAction) {
    return (
      <div className="min-h-screen night-gradient">
        <div className="bg-gray-900 bg-opacity-80 shadow-lg border-b border-gray-700">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">Night {gameData.gameRoom.currentDay}</h1>
                <p className="text-sm text-gray-400">{gameData.gameRoom.townName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Players Alive</p>
                <p className="text-lg font-semibold">{alivePlayers.length + 1}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 flex items-center justify-center min-h-[60vh]">
          <Card className="bg-surface bg-opacity-90 border-gray-600 max-w-sm w-full">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Rest Well</h2>
              <p className="text-gray-400 mb-6">
                You have no actions to take during the night. Wait for others to complete their actions.
              </p>
              
              <div className="animate-pulse flex items-center justify-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div className="w-2 h-2 bg-accent rounded-full"></div>
              </div>
              <p className="text-sm text-gray-400">Waiting for night actions to complete...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getActionTitle = () => {
    switch (role) {
      case ROLES.SHERIFF:
        return "Sheriff Investigation";
      case ROLES.MAFIA:
      case ROLES.GODFATHER:
        return "Mafia Elimination";
      case ROLES.DOCTOR:
        return "Doctor Protection";
      case ROLES.PROSTITUTE:
        return "Prostitute Visit";
      default:
        return "Night Action";
    }
  };

  const getActionDescription = () => {
    switch (role) {
      case ROLES.SHERIFF:
        return "Choose someone to investigate";
      case ROLES.MAFIA:
      case ROLES.GODFATHER:
        return "Choose someone to eliminate";
      case ROLES.DOCTOR:
        return "Choose someone to protect";
      case ROLES.PROSTITUTE:
        return "Choose someone to visit";
      default:
        return "Choose your target";
    }
  };

  const getActionButtonText = () => {
    if (!selectedTarget) return "Select a Target";
    
    const targetName = alivePlayers.find((p: any) => p.playerId === selectedTarget)?.name || "Unknown";
    
    switch (role) {
      case ROLES.SHERIFF:
        return `Investigate ${targetName}`;
      case ROLES.MAFIA:
      case ROLES.GODFATHER:
        return `Eliminate ${targetName}`;
      case ROLES.DOCTOR:
        return `Protect ${targetName}`;
      case ROLES.PROSTITUTE:
        return `Visit ${targetName}`;
      default:
        return `Target ${targetName}`;
    }
  };

  return (
    <div className="min-h-screen night-gradient">
      {/* Header */}
      <div className="bg-gray-900 bg-opacity-80 shadow-lg border-b border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Night {gameData.gameRoom.currentDay}</h1>
              <p className="text-sm text-gray-400">{gameData.gameRoom.townName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Players Alive</p>
              <p className="text-lg font-semibold">{alivePlayers.length + 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Night Action Interface */}
      <div className="px-4 py-6">
        {!hasSubmitted ? (
          <Card className="bg-surface bg-opacity-90 border-gray-600 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{getActionTitle()}</h2>
                  <p className="text-sm text-gray-400">{getActionDescription()}</p>
                </div>
              </div>

              {/* Player Selection */}
              <div className="space-y-3 mb-4">
                {alivePlayers.map((player: any) => {
                  const isSelected = selectedTarget === player.playerId;
                  
                  return (
                    <Button
                      key={player.playerId}
                      onClick={() => handleSelectTarget(player.playerId)}
                      variant="outline"
                      className={`w-full h-auto p-4 text-left justify-between transition-all duration-200 ${
                        isSelected 
                          ? "border-primary bg-gray-700 ring-2 ring-primary ring-opacity-50" 
                          : "border-gray-600 bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span>{player.name}</span>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Confirm Action */}
              <Button
                onClick={handleConfirmAction}
                disabled={!selectedTarget || submitActionMutation.isPending}
                className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                {submitActionMutation.isPending ? "Submitting..." : getActionButtonText()}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-surface bg-opacity-90 border-gray-600 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Action Submitted</h2>
              <p className="text-gray-400">Your night action has been recorded.</p>
            </CardContent>
          </Card>
        )}

        {/* Waiting Status */}
        <Card className="bg-surface bg-opacity-90 border-gray-600">
          <CardContent className="p-4 text-center">
            <div className="animate-pulse flex items-center justify-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <div className="w-2 h-2 bg-accent rounded-full"></div>
            </div>
            <p className="text-sm text-gray-400">Waiting for other players to complete their actions...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
