// Configuration for development vs production modes
export const config = {
  // Enable debug features like home button in game phases
  // Set to false for production deployment
  debugMode: true, // Always true during development
  
  // Other configuration options can be added here
  enableTestPlayers: true, // Always true during development
} as const;