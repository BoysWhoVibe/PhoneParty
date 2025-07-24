import { Card, CardContent } from "@/components/ui/card";
import { Crown, User } from "lucide-react";

interface Player {
  id: number;
  playerId: string;
  name: string;
  isHost: boolean;
  connectionStatus: string;
}

interface PlayerListProps {
  players: Player[];
  hostId: string;
}

const getConnectionColor = (status: string) => {
  switch (status) {
    case "connected":
      return "bg-success";
    case "reconnecting":
      return "bg-yellow-500 animate-pulse";
    case "disconnected":
      return "bg-error";
    default:
      return "bg-gray-500";
  }
};

const getConnectionText = (status: string) => {
  switch (status) {
    case "connected":
      return "Connected";
    case "reconnecting":
      return "Reconnecting...";
    case "disconnected":
      return "Disconnected";
    default:
      return "Unknown";
  }
};

const getConnectionTextColor = (status: string) => {
  switch (status) {
    case "connected":
      return "text-gray-400";
    case "reconnecting":
      return "text-yellow-400";
    case "disconnected":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getAvatarColor = (index: number) => {
  const colors = [
    "bg-primary",
    "bg-secondary", 
    "bg-accent",
    "bg-purple-600",
    "bg-pink-600",
    "bg-indigo-600",
    "bg-green-600",
    "bg-blue-600",
    "bg-red-600",
    "bg-yellow-600"
  ];
  return colors[index % colors.length];
};

export default function PlayerList({ players, hostId }: PlayerListProps) {
  return (
    <div className="space-y-3 mb-8">
      {players.map((player, index) => {
        const isHost = player.playerId === hostId;
        const avatarColor = getAvatarColor(index);
        const connectionColor = getConnectionColor(player.connectionStatus);
        const connectionText = getConnectionText(player.connectionStatus);
        const connectionTextColor = getConnectionTextColor(player.connectionStatus);

        return (
          <Card key={player.id} className="bg-surface border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 ${connectionColor} rounded-full`}></div>
                      <p className={`text-xs ${connectionTextColor}`}>{connectionText}</p>
                      {isHost && (
                        <>
                          <Crown className="w-3 h-3 text-accent" />
                          <span className="text-xs text-accent">Host</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
