import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeRemaining } from "@/lib/game-utils";

interface TimerProps {
  duration: number; // Duration in milliseconds
  startTime?: number; // Start time in milliseconds (timestamp)
  onTimeUp?: () => void;
  variant?: "default" | "day";
}

export default function Timer({ duration, startTime, onTimeUp, variant = "default" }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);

  useEffect(() => {
    if (!startTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && onTimeUp) {
        onTimeUp();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  const progressPercentage = duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;
  const timeDisplay = formatTimeRemaining(timeRemaining);

  const cardClasses = variant === "day" 
    ? "bg-white border-gray-200 shadow-sm" 
    : "bg-surface border-gray-700";
    
  const textColor = variant === "day" 
    ? "text-gray-600" 
    : "text-gray-400";
    
  const timerColor = variant === "day" 
    ? "text-red-600" 
    : "text-accent";
    
  const progressBg = variant === "day" 
    ? "bg-gray-200" 
    : "bg-gray-700";
    
  const progressFill = variant === "day" 
    ? "bg-red-500" 
    : "bg-accent";

  return (
    <Card className={cardClasses}>
      <CardContent className="p-4 text-center">
        <p className={`text-sm ${textColor} mb-2`}>Time Remaining</p>
        <div className={`text-3xl font-bold ${timerColor}`}>{timeDisplay}</div>
        <div className={`w-full ${progressBg} rounded-full h-2 mt-3`}>
          <div 
            className={`${progressFill} h-2 rounded-full transition-all duration-1000`}
            style={{ width: `${Math.min(100, progressPercentage)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
