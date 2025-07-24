import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronRight } from "lucide-react";
import Timer from "@/components/ui/timer";

export default function TownVoting() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  const playerId = localStorage.getItem("playerId");

  const { data: gameData, isLoading } = useQuery({
    queryKey: ["/api/games", code],
    refetchInterval: 2000,
  });

  const voteMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      const response = await apiRequest("POST", `/api/games/${code}/town-name/vote`, {
        playerId,
        suggestionId
      });
      return response.json();
    },
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      toast({
        title: "Vote Submitted!",
        description: "Your vote has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (gameData && gameData.gameRoom.phase === "role_assignment") {
      setLocation(`/role-assignment/${code}`);
    } else if (gameData && gameData.gameRoom.phase !== "town_voting") {
      setLocation(`/lobby/${code}`);
    }
  }, [gameData, code, setLocation]);

  const handleVote = (suggestionId: number) => {
    if (hasVoted) return;
    setSelectedSuggestion(suggestionId);
    voteMutation.mutate(suggestionId);
  };

  const handleTimeUp = () => {
    // Automatically progress to role assignment when time runs out
    if (gameData) {
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
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
              <Button onClick={() => setLocation("/")} className="w-full">
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate vote counts (this would normally come from backend)
  const voteCounts: { [key: number]: number } = {};
  gameData.townNameSuggestions.forEach((suggestion: any) => {
    voteCounts[suggestion.id] = suggestion.votes || 0;
  });

  const totalPlayers = gameData.players.length;
  const votedCount = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface shadow-lg border-b border-gray-700">
        <div className="px-4 py-4 text-center">
          <h1 className="text-xl font-semibold">Vote for Town Name</h1>
          <p className="text-sm text-gray-400">Phase 2 of 2</p>
        </div>
      </div>

      {/* Timer */}
      <div className="px-4 py-4">
        <Timer 
          duration={30000} // 30 seconds
          startTime={gameData.gameRoom.gameState?.phaseStartTime}
          onTimeUp={handleTimeUp}
        />
      </div>

      {/* Voting Options */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold mb-4">Choose Your Favorite</h2>
        <div className="space-y-3">
          {gameData.townNameSuggestions.map((suggestion: any) => {
            const isSelected = selectedSuggestion === suggestion.id;
            const voteCount = voteCounts[suggestion.id] || 0;
            
            return (
              <Button
                key={suggestion.id}
                onClick={() => handleVote(suggestion.id)}
                disabled={hasVoted || voteMutation.isPending}
                variant="outline"
                className={`w-full h-auto p-4 text-left justify-between hover:bg-gray-700 transition-all duration-200 ${
                  isSelected 
                    ? "border-primary bg-gray-700 ring-2 ring-primary ring-opacity-50" 
                    : "border-gray-600 bg-surface"
                }`}
              >
                <span className="text-lg">{suggestion.suggestion}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {voteCount > 0 ? `${voteCount} vote${voteCount !== 1 ? 's' : ''}` : ''}
                  </span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          {votedCount} of {totalPlayers} players voted
        </div>
      </div>
    </div>
  );
}
