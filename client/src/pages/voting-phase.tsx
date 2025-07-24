import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThumbsDown, ThumbsUp, User } from "lucide-react";
import Timer from "@/components/ui/timer";

export default function VotingPhase() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);
  
  const playerId = localStorage.getItem("playerId");

  const { data: gameData } = useQuery({
    queryKey: ["/api/games", code],
    refetchInterval: 2000,
  });

  const voteMutation = useMutation({
    mutationFn: async (vote: "yes" | "no") => {
      const response = await apiRequest("POST", `/api/games/${code}/vote`, {
        playerId,
        vote
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
    if (gameData && gameData.gameRoom.phase === "day") {
      setLocation(`/day/${code}`);
    } else if (gameData && gameData.gameRoom.phase === "night") {
      setLocation(`/night/${code}`);
    } else if (gameData && gameData.gameRoom.phase === "game_end") {
      setLocation(`/game-end/${code}`);
    }
  }, [gameData, code, setLocation]);

  const handleVote = (vote: "yes" | "no") => {
    if (hasVoted) return;
    voteMutation.mutate(vote);
  };

  const handleTimeUp = () => {
    // Time ran out, proceed to next phase
    queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
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

  const nominatedPlayerId = gameData.gameRoom.gameState?.nominatedPlayer;
  const nominatedPlayer = gameData.players.find((p: any) => p.playerId === nominatedPlayerId);
  const alivePlayers = gameData.players.filter((p: any) => p.isAlive);
  const eligibleVoters = alivePlayers.filter((p: any) => p.playerId !== nominatedPlayerId);

  // Mock vote counts - in real implementation, this would come from game actions
  const eliminateVotes = 2;
  const spareVotes = 1;
  const votedCount = eliminateVotes + spareVotes;
  const majorityThreshold = Math.floor(eligibleVoters.length / 2) + 1;

  if (!nominatedPlayer) {
    return (
      <div className="min-h-screen day-gradient flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
              <p className="text-gray-600 mb-4">No player has been nominated.</p>
              <Button onClick={() => setLocation(`/day/${code}`)} className="w-full">
                Return to Day Phase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen day-gradient text-gray-900">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 py-4 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Voting Phase</h1>
          <p className="text-sm text-gray-600">Day {gameData.gameRoom.currentDay} • {gameData.gameRoom.townName}</p>
        </div>
      </div>

      {/* Timer */}
      <div className="px-4 py-4">
        <Timer 
          duration={90000} // 90 seconds
          startTime={gameData.gameRoom.gameState?.phaseStartTime}
          onTimeUp={handleTimeUp}
          variant="day"
        />
      </div>

      {/* Nominated Player */}
      <div className="px-4 pb-4">
        <Card className="bg-red-100 border-red-300 mb-6">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">{nominatedPlayer.name}</h2>
              <p className="text-sm text-red-700">has been nominated for elimination</p>
            </div>
          </CardContent>
        </Card>

        {/* Voting Options */}
        {!hasVoted && nominatedPlayerId !== playerId && (
          <div className="space-y-4 mb-6">
            <Button
              onClick={() => handleVote("yes")}
              disabled={voteMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 text-lg"
            >
              <ThumbsDown className="w-5 h-5 mr-2" />
              Vote to Eliminate
            </Button>

            <Button
              onClick={() => handleVote("no")}
              disabled={voteMutation.isPending}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              Vote to Spare
            </Button>
          </div>
        )}

        {hasVoted && (
          <Card className="bg-green-100 border-green-300 mb-6">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-green-800">Vote Submitted!</p>
              <p className="text-sm text-green-700">Waiting for other players...</p>
            </CardContent>
          </Card>
        )}

        {nominatedPlayerId === playerId && (
          <Card className="bg-yellow-100 border-yellow-300 mb-6">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="w-6 h-6 text-white" />
              </div>
              <p className="font-medium text-yellow-800">You are on trial</p>
              <p className="text-sm text-yellow-700">You cannot vote in your own trial</p>
            </CardContent>
          </Card>
        )}

        {/* Vote Status */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Current Votes</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Eliminate</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${eligibleVoters.length > 0 ? (eliminateVotes / eligibleVoters.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{eliminateVotes}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Spare</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${eligibleVoters.length > 0 ? (spareVotes / eligibleVoters.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{spareVotes}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              {votedCount} of {eligibleVoters.length} players voted
              • Majority needed: {majorityThreshold}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
