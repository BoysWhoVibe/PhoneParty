import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorDisplay({ 
  title = "Error", 
  message, 
  onRetry, 
  className = "" 
}: ErrorDisplayProps) {
  return (
    <Card className={`bg-surface border-red-600 ${className}`}>
      <CardContent className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function FullPageError({ 
  title = "Something went wrong", 
  message, 
  onRetry 
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <ErrorDisplay 
        title={title} 
        message={message} 
        onRetry={onRetry}
        className="w-full max-w-md"
      />
    </div>
  );
}