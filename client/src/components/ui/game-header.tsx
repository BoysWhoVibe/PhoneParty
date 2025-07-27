import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface GameHeaderProps {
  title: string;
  subtitle?: string;
  gameCode?: string;
  showBackButton?: boolean;
}

export default function GameHeader({ title, subtitle, gameCode, showBackButton = true }: GameHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-surface shadow-lg border-b border-gray-700">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-gray-400 hover:text-white p-1"
            >
              <Home className="w-5 h-5" />
            </Button>
          )}
          <div className="text-center flex-1">
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </div>
        {gameCode && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Room Code</p>
            <p className="text-lg font-mono font-bold text-accent">{gameCode}</p>
          </div>
        )}
      </div>
    </div>
  );
}