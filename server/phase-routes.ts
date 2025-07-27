import type { Express } from "express";
import { storage } from "./storage";
import { insertTownNameSuggestionSchema } from "@shared/schema";
import { assignRoles, checkWinConditions } from "./game-logic";

export function registerPhaseRoutes(app: Express) {
  // Start the game
  app.post("/api/games/:code/start", async (req, res) => {
    try {
      const { code } = req.params;
      const gameRoom = await storage.getGameRoomByCode(code);
      
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const players = await storage.getPlayersByGame(gameRoom.id);
      if (players.length < 1) {
        return res.status(400).json({ message: "Need at least 1 player to start" });
      }

      // Determine next phase based on town naming mode
      const nextPhase = gameRoom.townNamingMode === "host" ? "role-assignment" : "town-naming";

      const updatedRoom = await storage.updateGameRoom(gameRoom.id, {
        phase: nextPhase
      });

      res.json({ gameRoom: updatedRoom });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Set town name (host only)
  app.post("/api/games/:code/set-town-name", async (req, res) => {
    try {
      const { code } = req.params;
      const { townName } = req.body;
      
      if (!townName || townName.length > 30) {
        return res.status(400).json({ message: "Town name must be 1-30 characters" });
      }

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const updatedRoom = await storage.updateGameRoom(gameRoom.id, {
        townName
      });

      res.json({ gameRoom: updatedRoom });
    } catch (error) {
      res.status(500).json({ message: "Failed to set town name" });
    }
  });

  // Set town naming mode
  app.post("/api/games/:code/set-town-naming-mode", async (req, res) => {
    try {
      const { code } = req.params;
      const { mode } = req.body;
      
      if (!["host", "voting"].includes(mode)) {
        return res.status(400).json({ message: "Invalid town naming mode" });
      }

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const updatedRoom = await storage.updateGameRoom(gameRoom.id, {
        townNamingMode: mode
      });

      res.json({ gameRoom: updatedRoom });
    } catch (error) {
      res.status(500).json({ message: "Failed to set town naming mode" });
    }
  });

  // Submit town name suggestion
  app.post("/api/games/:code/town-name", async (req, res) => {
    try {
      const { code } = req.params;
      const body = insertTownNameSuggestionSchema.parse(req.body);
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const suggestion = await storage.addTownNameSuggestion({
        ...body,
        gameId: gameRoom.id
      });

      res.json({ suggestion });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit town name suggestion" });
    }
  });

  // Vote on town name suggestion
  app.post("/api/games/:code/town-name/vote", async (req, res) => {
    try {
      const { code } = req.params;
      const { suggestionId, playerId } = req.body;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      // Implementation would depend on how votes are stored
      // This is a simplified version
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to vote on town name" });
    }
  });

  // Assign roles to all players
  app.post("/api/games/:code/assign-roles", async (req, res) => {
    try {
      const { code } = req.params;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const players = await storage.getPlayersByGame(gameRoom.id);
      const roles = assignRoles(players.length);
      
      // Create role assignments
      const roleAssignments: Record<string, string> = {};
      players.forEach((player, index) => {
        roleAssignments[player.playerId] = roles[index];
      });

      const updatedGameState = {
        ...gameRoom.gameState!,
        roles: roleAssignments
      };

      const updatedRoom = await storage.updateGameRoom(gameRoom.id, {
        phase: "night",
        gameState: updatedGameState
      });

      res.json({ gameRoom: updatedRoom });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign roles" });
    }
  });
}