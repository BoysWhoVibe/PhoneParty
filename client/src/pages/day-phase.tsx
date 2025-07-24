import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skull, Search, Gavel, MoreVertical, User, Crown } from "lucide-react";

export default function DayPhase() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const playerId = localStorage.getItem("playerId");

  const { data: gameData } = useQuery({
    queryKey: ["/api/games", code],
    refetchInterval: 2000,
  });

  const nominateMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const response = await apiRequest("POST", `/api/games/${code}/nominate`, {
        playerId,
        targetId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      setLocation(`/voting/${code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to nominate player",
        variant: "destructive"
      });
    }
  });

  const handleNominate = (targetId: string) => {
    nominateMutation.mutate(targetId);
  };

  if (!gameData) {
    return (
      <div className="min-h-screen day-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not in day phase
  if (gameData.gameRoom.phase === "voting") {
    setLocation(`/voting/${code}`);
    return null;
  }

  const alivePlayers = gameData.players.filter((p: any) => p.isAlive);
  const currentPlayer = alivePlayers.find((p: any) => p.playerId === playerId);
  const otherPlayers = alivePlayers.filter((p: any) => p.playerId !== playerId);

  // Mock night results - in real implementation, this would come from game state
  const nightResults = {
    killedPlayer: "Mike Rodriguez", // This would be calculated from night actions
    investigationResult: currentPlayer?.role === "Sheriff" ? {
      target: "Emma Taylor",
      result: "NOT MAFIA"
    } : null
  };

  return (
    <div className="min-h-screen day-gradient text-gray-900">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Day {gameData.gameRoom.currentDay}</h1>
              <p className="text-sm text-gray-600">{gameData.gameRoom.townName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Players Alive</p>
              <p className="text-lg font-semibold text-gray-900">{alivePlayers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Night Results */}
      <div className="px-4 py-4">
        {nightResults.killedPlayer && (
          <Card className="bg-red-100 border-red-300 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Skull className="w-4 h-4 text-red-600 mr-2" />
                <h3 className="font-semibold text-red-800">Night Results</h3>
              </div>
              <p className="text-sm text-red-700">
                <span className="font-medium">{nightResults.killedPlayer}</span> was killed during the night.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Investigation Result (if applicable) */}
        {nightResults.investigationResult && (
          <Card className="bg-blue-100 border-blue-300 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Search className="w-4 h-4 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-800">Investigation Result</h3>
              </div>
              <p className="text-sm text-blue-700">
                Your investigation of <span className="font-medium">{nightResults.investigationResult.target}</span> returned: 
                <span className="font-bold text-blue-900 ml-1">{nightResults.investigationResult.result}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Players */}
      <div className="px-4 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Surviving Players</h3>
        
        <div className="space-y-2 mb-6">
          {alivePlayers.map((player: any) => (
            <Card key={player.playerId} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{player.name}</span>
                  </div>
                  {player.playerId === gameData.gameRoom.hostId && (
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-accent" />
                      <span className="text-xs text-gray-600">Host</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Nomination Phase */}
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nomination Phase</h3>
            <p className="text-sm text-gray-600 mb-4">
              Discuss and nominate someone for elimination. The town must decide who to vote on.
            </p>

            {/* Nominate Buttons */}
            <div className="space-y-2">
              {otherPlayers.map((player: any) => (
                <Button
                  key={player.playerId}
                  onClick={() => handleNominate(player.playerId)}
                  disabled={nominateMutation.isPending}
                  variant="outline"
                  className="w-full h-auto p-3 text-left justify-between bg-gray-50 hover:bg-gray-100 border-gray-300"
                >
                  <span className="text-gray-900">{player.name}</span>
                  <Gavel className="w-4 h-4 text-gray-400" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-4 right-4">
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Day Phase • Discussion Time
              </div>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
