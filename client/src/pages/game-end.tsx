import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Crown, Skull, Redo, Users, Home, VenetianMask, User } from "lucide-react";

export default function GameEnd() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gameData } = useQuery({
    queryKey: ["/api/games", code],
  });

  const playAgainMutation = useMutation({
    mutationFn: async () => {
      // This would reset the game with same players
      const response = await apiRequest("POST", `/api/games/${code}/restart`);
      return response.json();
    },
    onSuccess: () => {
      setLocation(`/lobby/${code}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restart game",
        variant: "destructive"
      });
    }
  });

  if (!gameData) {
    return (
      <div className="min-h-screen game-end-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Mock game results - in real implementation, this would come from game state
  const gameResults = {
    winner: "Mafia",
    winners: [
      { name: "Alex Johnson", role: "Mafia" },
      { name: "Emma Taylor", role: "Godfather" }
    ],
    eliminated: [
      { name: "Sarah Chen", role: "Sheriff", method: "Voted out Day 2" },
      { name: "Mike Rodriguez", role: "Doctor", method: "Killed Night 2" }
    ]
  };

  const isWinner = gameResults.winners.some(w => 
    gameData.players.some((p: any) => p.name === w.name && p.playerId === localStorage.getItem("playerId"))
  );

  return (
    <div className="min-h-screen game-end-gradient text-white">
      {/* Header */}
      <div className="text-center pt-12 pb-8">
        <Trophy className="w-24 h-24 text-accent mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">Game Over</h1>
        <p className="text-gray-400">{gameData.gameRoom.townName} has fallen</p>
      </div>

      {/* Winner Announcement */}
      <div className="px-4 pb-8">
        <Card className="bg-surface bg-opacity-90 border-gray-600 mb-8">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <VenetianMask className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-red-500 mb-2">{gameResults.winner} Wins!</h2>
              <p className="text-gray-300">
                {gameResults.winner === "Mafia" 
                  ? "The Mafia has eliminated enough townspeople to control the vote."
                  : "The town has successfully eliminated all the Mafia!"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final Player Status */}
        <Card className="bg-surface bg-opacity-90 border-gray-600 mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Final Results</h3>
            
            {/* Winners */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-green-400 mb-3 flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Winners
              </h4>
              <div className="space-y-2">
                {gameResults.winners.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-900 bg-opacity-30 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span>{player.name}</span>
                    </div>
                    <span className="text-sm text-red-400 font-medium">{player.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminated Players */}
            <div>
              <h4 className="text-lg font-medium text-gray-400 mb-3 flex items-center">
                <Skull className="w-5 h-5 mr-2" />
                Eliminated
              </h4>
              <div className="space-y-2">
                {gameResults.eliminated.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-800 bg-opacity-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-300">{player.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-blue-400 font-medium">{player.role}</span>
                      <p className="text-xs text-gray-500">{player.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Result */}
        {isWinner && (
          <Card className="bg-green-900 bg-opacity-30 border-green-600 mb-8">
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold">Congratulations! You Won!</p>
            </CardContent>
          </Card>
        )}

        {/* Game Actions */}
        <div className="space-y-4">
          <Button
            onClick={() => playAgainMutation.mutate()}
            disabled={playAgainMutation.isPending}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-4 text-lg"
          >
            <Redo className="w-5 h-5 mr-2" />
            {playAgainMutation.isPending ? "Starting..." : "Play Again"}
          </Button>

          <Button
            onClick={() => setLocation(`/lobby/${code}`)}
            className="w-full bg-secondary hover:bg-green-700 text-white font-semibold py-4 text-lg"
          >
            <Users className="w-5 h-5 mr-2" />
            New Game
          </Button>

          <Button
            onClick={() => setLocation("/")}
            variant="secondary"
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3"
          >
            <Home className="w-4 h-4 mr-2" />
            Leave Game
          </Button>
        </div>
      </div>
    </div>
  );
}
