// Configuration for development vs production modes
export const config = {
  // Enable debug features like home button in game phases
  // Set to false for production deployment
  debugMode: import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true',
  
  // Other configuration options can be added here
  enableTestPlayers: import.meta.env.NODE_ENV === 'development' || import.meta.env.VITE_ENABLE_TEST_PLAYERS === 'true',
} as const;