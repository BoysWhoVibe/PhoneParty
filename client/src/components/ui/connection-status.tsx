import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Monitor connection status
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 right-4">
      <Card className="bg-surface border-gray-700">
        <CardContent className="px-4 py-2">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-error'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Connection Lost'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
