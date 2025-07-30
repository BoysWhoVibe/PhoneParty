import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGameMutations } from "@/hooks/use-game-mutations";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users, Info, VenetianMask } from "lucide-react";
import ConnectionStatus from "@/components/ui/connection-status";

export default function Home() {
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState("");
  const [hostName, setHostName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [nameError, setNameError] = useState("");
  const [hostNameError, setHostNameError] = useState("");
  const { createGame, joinGame } = useGameMutations();

  const handleCreateGame = () => {
    setHostNameError("");
    
    if (!hostName.trim()) {
      setHostNameError("Please enter a host name");
      return;
    }
    
    if (hostName.length > 15) {
      setHostNameError("Name must be 15 characters or less");
      return;
    }
    
    createGame.mutate(hostName);
  };

  const handleJoinGame = () => {
    // Clear previous name error
    setNameError("");
    
    if (!playerName.trim()) {
      setNameError("Please enter your name");
      return;
    }
    
    if (playerName.length > 15) {
      setNameError("Name must be 15 characters or less");
      return;
    }
    
    if (roomCode.length !== 4) {
      toast({
        title: "Invalid Code",
        description: "Room code must be 4 letters",
        variant: "destructive"
      });
      return;
    }
    
    joinGame.mutate({ 
      code: roomCode.toUpperCase(), 
      name: playerName.trim(),
      onNameError: setNameError
    });
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    setRoomCode(value);
  };

  const handleHostNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateGame();
    }
  };

  const handleRoomCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoinGame();
    }
  };

  const handlePlayerNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleJoinGame();
    }
  };

  const handlePlayerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 15);
    setPlayerName(value);
    
    // Clear error when user starts typing
    if (nameError) {
      setNameError("");
    }
  };

  const handleHostNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 15);
    setHostName(value);
    
    // Clear error when user starts typing
    if (hostNameError) {
      setHostNameError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-900 to-gray-800 px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <VenetianMask className="w-24 h-24 text-accent mx-auto mb-4" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Mafia Game</h1>
        <p className="text-gray-400 text-lg">Mobile Multiplayer Party Game</p>
      </div>

      {/* Main Actions */}
      <div className="max-w-sm mx-auto space-y-6">
        {/* Create Game Card */}
        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <PlusCircle className="w-12 h-12 text-primary mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Host a Game</h2>
              <p className="text-gray-400 text-sm">Enter your name to create a room</p>
            </div>
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Your name (max 15 chars)"
                  value={hostName}
                  onChange={handleHostNameChange}
                  onKeyDown={handleHostNameKeyDown}
                  className={`w-full bg-gray-800 border-gray-600 text-center focus:border-primary ${
                    hostNameError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {hostNameError && (
                  <p className="text-red-400 text-sm mt-1 text-center">{hostNameError}</p>
                )}
              </div>
              <Button 
                onClick={handleCreateGame}
                disabled={createGame.isPending}
                className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-3"
              >
                {createGame.isPending ? "Creating..." : "Create Game Room"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Join Game Card */}
        <Card className="bg-surface border-gray-700">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Users className="w-12 h-12 text-secondary mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Join a Game</h2>
              <p className="text-gray-400 text-sm">Enter your name and room code</p>
            </div>
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Your name (max 15 chars)"
                  value={playerName}
                  onChange={handlePlayerNameChange}
                  onKeyDown={handlePlayerNameKeyDown}
                  className={`w-full bg-gray-800 border-gray-600 text-center focus:border-secondary ${
                    nameError ? "border-red-500 focus:border-red-500" : ""
                  }`}
                />
                {nameError && (
                  <p className="text-red-400 text-sm mt-1 text-center">{nameError}</p>
                )}
              </div>
              <Input
                type="text"
                placeholder="ABCD"
                value={roomCode}
                onChange={handleRoomCodeChange}
                onKeyDown={handleRoomCodeKeyDown}
                className="text-center text-2xl font-mono tracking-widest uppercase bg-gray-800 border-gray-600 focus:border-secondary"
              />
              <Button 
                onClick={handleJoinGame}
                disabled={joinGame.isPending || !playerName.trim() || roomCode.length !== 4}
                className="w-full bg-secondary hover:bg-green-700 text-white font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinGame.isPending ? "Joining..." : "Join Game"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Rules Link */}
        <div className="text-center">
          <Button variant="link" className="text-gray-400 hover:text-white text-sm">
            <Info className="w-4 h-4 mr-1" />
            How to Play
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <ConnectionStatus />
    </div>
  );
}
