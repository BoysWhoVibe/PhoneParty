import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerGameRoutes } from "./game-routes";
import { registerActionRoutes } from "./action-routes";
import { registerPhaseRoutes } from "./phase-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register modular route groups
  registerGameRoutes(app);
  registerActionRoutes(app);
  registerPhaseRoutes(app);

  // Create HTTP server
  const server = createServer(app);
  return server;
}
