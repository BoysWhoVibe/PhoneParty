import type { Express } from "express";
import { storage } from "./storage";
import { insertTownNameSuggestionSchema } from "@shared/schema";
import { assignRoles, checkWinConditions, finalizeTownName } from "./game-logic";

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

      // Assign roles to all players
      const roles = assignRoles(players.length);
      const playerRoles: { [playerId: string]: string } = {};
      
      players.forEach((player, index) => {
        playerRoles[player.playerId] = roles[index];
      });

      // Determine next phase based on town naming mode
      const nextPhase = gameRoom.townNamingMode === "host" ? "role_assignment" : "town_naming";

      const updatedGameState = {
        roles: playerRoles,
        nightActions: {},
        dayVotes: {},
        phaseStartTime: Date.now(),
        phaseDuration: 300000 // 5 minutes default
      };

      const updatedRoom = await storage.updateGameRoom(gameRoom.id, {
        phase: nextPhase,
        gameState: updatedGameState
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

      // Check if all players have submitted suggestions
      const players = await storage.getPlayersByGame(gameRoom.id);
      const suggestions = await storage.getTownNameSuggestionsByGame(gameRoom.id);
      
      if (suggestions.length >= players.length) {
        // All players submitted, transition to voting phase
        await storage.updateGameRoom(gameRoom.id, {
          phase: "town_voting",
          gameState: {
            ...gameRoom.gameState!,
            phaseStartTime: Date.now(),
            phaseDuration: 30000 // 30 seconds for voting
          }
        });
      }

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
      
      if (!suggestionId || !playerId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      if (gameRoom.phase !== "town_voting") {
        return res.status(400).json({ message: "Game is not in town voting phase" });
      }

      // Check if player already voted
      const existingVote = await storage.getTownNameVoteByPlayerAndGame(gameRoom.id, playerId);
      if (existingVote) {
        return res.status(400).json({ message: "Player has already voted" });
      }

      // Verify suggestion exists
      const suggestions = await storage.getTownNameSuggestionsByGame(gameRoom.id);
      const targetSuggestion = suggestions.find(s => s.id === suggestionId);
      if (!targetSuggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }

      // Add the vote
      await storage.addTownNameVote({
        gameId: gameRoom.id,
        playerId,
        suggestionId
      });

      // Update vote count on suggestion
      await storage.updateTownNameSuggestion(suggestionId, {
        votes: (targetSuggestion.votes || 0) + 1
      });

      // Check if all players have voted
      const players = await storage.getPlayersByGame(gameRoom.id);
      const votes = await storage.getTownNameVotesByGame(gameRoom.id);
      
      if (votes.length >= players.length) {
        // All players voted, determine winner and proceed to role assignment
        await finalizeTownName(gameRoom, suggestions);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error voting on town name:", error);
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