import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Shield, VenetianMask, UserCheck, Heart, Dice6, Moon, Crosshair, User } from "lucide-react";
import { ROLES } from "@shared/schema";

const roleIcons = {
  [ROLES.SHERIFF]: Shield,
  [ROLES.MAFIA]: VenetianMask,
  [ROLES.GODFATHER]: VenetianMask,
  [ROLES.DOCTOR]: Heart,
  [ROLES.JOKER]: Dice6,
  [ROLES.PROSTITUTE]: Moon,
  [ROLES.VIGILANTE]: Crosshair,
  [ROLES.CITIZEN]: User,
};

const roleDescriptions = {
  [ROLES.SHERIFF]: "Each night, select one player to investigate. You'll learn if they are MAFIA or NOT MAFIA. The Dice6 will appear as MAFIA to you.",
  [ROLES.MAFIA]: "Each night, work with other Mafia members to eliminate one townsperson. Your goal is to outnumber the town.",
  [ROLES.GODFATHER]: "You are Mafia, but investigations will show you as NOT MAFIA. Work with your team to eliminate townspeople.",
  [ROLES.DOCTOR]: "Each night, select one player to save. If they are targeted by the Mafia, they will survive.",
  [ROLES.JOKER]: "You win ONLY if you are voted out during the day. Avoid being killed at night or by the Vigilante.",
  [ROLES.PROSTITUTE]: "Each night, select one player to visit. Their night action will be blocked if they have one.",
  [ROLES.VIGILANTE]: "You have one bullet to use during any day phase. Announce your identity and shoot someone immediately.",
  [ROLES.CITIZEN]: "You have no special powers, but your vote is crucial. Use discussion and logic to find the Mafia.",
};

const roleColors = {
  [ROLES.SHERIFF]: "bg-blue-600",
  [ROLES.MAFIA]: "bg-red-600",
  [ROLES.GODFATHER]: "bg-red-700",
  [ROLES.DOCTOR]: "bg-green-600",
  [ROLES.JOKER]: "bg-purple-600",
  [ROLES.PROSTITUTE]: "bg-pink-600",
  [ROLES.VIGILANTE]: "bg-orange-600",
  [ROLES.CITIZEN]: "bg-gray-600",
};

export default function RoleAssignment() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  
  const playerId = localStorage.getItem("playerId");

  const { data: gameData } = useQuery({
    queryKey: ["/api/games", code],
    refetchInterval: 2000,
  });

  const { data: roleData } = useQuery({
    queryKey: ["/api/games", code, "player", playerId, "role"],
    enabled: !!playerId,
  });

  useEffect(() => {
    if (gameData && gameData.gameRoom.phase === "night") {
      setLocation(`/night/${code}`);
    }
  }, [gameData, code, setLocation]);

  const handleContinue = () => {
    setLocation(`/night/${code}`);
  };

  if (!gameData || !roleData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your role...</p>
        </div>
      </div>
    );
  }

  const role = roleData.role;
  const RoleIcon = roleIcons[role as keyof typeof roleIcons] || User;
  const roleColor = roleColors[role as keyof typeof roleColors] || "bg-gray-600";
  const description = roleDescriptions[role as keyof typeof roleDescriptions] || "No description available.";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm mx-auto text-center">
        {/* Town Name Result */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome to</h1>
          <h2 className="text-4xl font-bold text-accent">
            {gameData.gameRoom.townName || "Your Town"}
          </h2>
        </div>

        {/* Role Reveal */}
        <Card className="bg-surface shadow-2xl border-gray-700 mb-6">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className={`w-20 h-20 ${roleColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <RoleIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">Your Role</h3>
              <h2 className="text-3xl font-bold text-primary mb-4">{role}</h2>
            </div>

            {/* Role Description */}
            <div className="text-left bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                {description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-4 text-lg"
        >
          Continue to Game
        </Button>

        {/* Warning */}
        <p className="text-xs text-gray-400 mt-4 flex items-center justify-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 16.121m6.878-6.243L16.121 3M3 16.121l13.121-13.12" />
          </svg>
          Keep your role secret!
        </p>
      </div>
    </div>
  );
}
