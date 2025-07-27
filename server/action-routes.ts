import type { Express } from "express";
import { storage } from "./storage";
import { insertGameActionSchema, ROLES } from "@shared/schema";
import { checkWinConditions } from "./game-logic";

export function registerActionRoutes(app: Express) {
  // Submit a night action
  app.post("/api/games/:code/night-action", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, action, targetId } = req.body;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const gameAction = await storage.addGameAction({
        playerId,
        gameId: gameRoom.id!,
        action,
        targetId,
        phase: gameRoom.phase,
        day: gameRoom.currentDay || 1
      });

      res.json({ gameAction });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit night action" });
    }
  });

  // Nominate a player for voting
  app.post("/api/games/:code/nominate", async (req, res) => {
    try {
      const { code } = req.params;
      const { nominatedPlayerId } = req.body;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const updatedGameState = {
        ...gameRoom.gameState!,
        nominatedPlayer: nominatedPlayerId
      };

      await storage.updateGameRoom(gameRoom.id, {
        phase: "voting",
        gameState: updatedGameState
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to nominate player" });
    }
  });

  // Submit a vote
  app.post("/api/games/:code/vote", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, vote } = req.body;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const updatedGameState = {
        ...gameRoom.gameState!,
        dayVotes: {
          ...gameRoom.gameState!.dayVotes,
          [playerId]: vote
        }
      };

      await storage.updateGameRoom(gameRoom.id, {
        gameState: updatedGameState
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Get player's role
  app.get("/api/games/:code/player/:playerId/role", async (req, res) => {
    try {
      const { code, playerId } = req.params;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const role = gameRoom.gameState!.roles?.[playerId];
      if (!role) {
        return res.status(404).json({ message: "Role not assigned" });
      }

      res.json({ role });
    } catch (error) {
      res.status(500).json({ message: "Failed to get player role" });
    }
  });
}