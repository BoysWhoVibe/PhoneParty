import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Timer from "@/components/ui/timer";
import GameHeader from "@/components/ui/game-header";
import { useGameData } from "@/hooks/use-game-data";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { FullPageError } from "@/components/ui/error-display";

export default function TownNaming() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [townName, setTownName] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const playerId = localStorage.getItem("playerId");

  const { data: gameData, isLoading, error } = useGameData(code);

  const submitNameMutation = useMutation({
    mutationFn: async (suggestion: string) => {
      const response = await apiRequest("POST", `/api/games/${code}/town-name`, {
        playerId,
        suggestion
      });
      return response.json();
    },
    onSuccess: () => {
      setHasSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/games", code] });
      toast({
        title: "Submitted!",
        description: "Your town name has been submitted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit town name",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (gameData && gameData.gameRoom.phase === "town_voting") {
      setLocation(`/town-voting/${code}`);
    } else if (gameData && gameData.gameRoom.phase !== "town_naming") {
      setLocation(`/lobby/${code}`);
    }
  }, [gameData, code, setLocation]);

  useEffect(() => {
    if (gameData && playerId) {
      const hasPlayerSubmitted = gameData.townNameSuggestions.some(
        (s: any) => s.playerId === playerId
      );
      setHasSubmitted(hasPlayerSubmitted);
    }
  }, [gameData, playerId]);

  const handleSubmitName = () => {
    if (!townName.trim()) {
      toast({
        title: "Invalid Name",
        description: "Please enter a town name",
        variant: "destructive"
      });
      return;
    }
    submitNameMutation.mutate(townName.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitNameMutation.isPending) {
      e.preventDefault();
      handleSubmitName();
    }
  };

  const handleTimeUp = () => {
    // Automatically progress to voting phase when time runs out
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

  const totalPlayers = gameData.players.length;
  const submittedCount = gameData.townNameSuggestions.length;
  const remainingPlayers = totalPlayers - submittedCount;

  return (
    <div className="min-h-screen bg-background">
      <GameHeader 
        title="Name Your Town" 
        subtitle="Phase 1 of 2"
        gameCode={code}
        showBackButton={true}
      />

      {/* Timer */}
      <div className="px-4 py-4">
        <Timer 
          duration={60000} // 60 seconds
          startTime={gameData.gameRoom.gameState?.phaseStartTime}
          onTimeUp={handleTimeUp}
        />
      </div>

      {/* Submit Town Name */}
      <div className="px-4 pb-6">
        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Submit a Town Name</h2>
            {!hasSubmitted ? (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter a creative town name..."
                  value={townName}
                  onChange={(e) => setTownName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-gray-800 border-gray-600 focus:border-primary"
                />
                <Button
                  onClick={handleSubmitName}
                  disabled={submitNameMutation.isPending}
                  className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-3"
                >
                  {submitNameMutation.isPending ? "Submitting..." : "Submit Name"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-success font-medium">Name Submitted!</p>
                <p className="text-sm text-gray-400 mt-1">Waiting for other players...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submitted Names */}
      <div className="px-4">
        <h3 className="text-lg font-semibold mb-4">Submitted Names</h3>
        <div className="space-y-2 mb-6">
          {gameData.townNameSuggestions.map((suggestion: any) => (
            <Card key={suggestion.id} className="bg-surface border-gray-700">
              <CardContent className="p-3">
                <p className="text-gray-300">{suggestion.suggestion}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {remainingPlayers > 0 && (
          <div className="text-center text-sm text-gray-400">
            Waiting for {remainingPlayers} more player(s)...
          </div>
        )}
      </div>
    </div>
  );
}
