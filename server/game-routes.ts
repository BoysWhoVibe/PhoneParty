import type { Express } from "express";
import { storage } from "./storage";
import { insertGameRoomSchema, insertPlayerSchema, insertTownNameSuggestionSchema, insertGameActionSchema } from "@shared/schema";
import { generateGameCode, assignRoles, generateTestPlayers, checkWinConditions } from "./game-logic";
import { nanoid } from "nanoid";

export function registerGameRoutes(app: Express) {
  // Create a new game room
  app.post("/api/games", async (req, res) => {
    try {
      const playerId = nanoid();
      let code: string;
      let existingRoom;
      
      // Generate unique code
      do {
        code = generateGameCode();
        existingRoom = await storage.getGameRoomByCode(code);
      } while (existingRoom);

      const gameRoom = await storage.createGameRoom({
        code,
        hostId: playerId,
        phase: "lobby",
        townName: null,
        townNamingMode: "host",
        currentDay: 0,
        gameState: {
          roles: {},
          nightActions: {},
          dayVotes: {},
          phaseStartTime: Date.now(),
          phaseDuration: 0
        }
      });

      res.json({ gameRoom, playerId });
    } catch (error) {
      res.status(500).json({ message: "Failed to create game room" });
    }
  });

  // Join a game room
  app.post("/api/games/:code/join", async (req, res) => {
    try {
      const { code } = req.params;
      const { name, hostPlayerId } = req.body;
      
      if (!name || name.length > 15) {
        return res.status(400).json({ message: "Name must be 1-15 characters" });
      }

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const existingPlayers = await storage.getPlayersByGame(gameRoom.id);
      
      // Check if name is already taken (case-insensitive)
      if (existingPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({ message: "Name already taken" });
      }

      // Use the provided hostPlayerId if this is the host, otherwise generate new one
      const isHost = hostPlayerId && hostPlayerId === gameRoom.hostId;
      const playerId = isHost ? hostPlayerId : nanoid();
      
      const player = await storage.addPlayer({
        playerId,
        name,
        gameId: gameRoom.id,
        role: null,
        isAlive: true,
        isHost: isHost,
      });

      res.json({ player, gameRoom });
    } catch (error) {
      res.status(500).json({ message: "Failed to join game room" });
    }
  });

  // Get game room data
  app.get("/api/games/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const gameRoom = await storage.getGameRoomByCode(code);
      
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const players = await storage.getPlayersByGame(gameRoom.id);
      res.json({ gameRoom, players });
    } catch (error) {
      res.status(500).json({ message: "Failed to get game room" });
    }
  });

  // Add test players for development
  app.post("/api/games/:code/add-test-players", async (req, res) => {
    try {
      const { code } = req.params;
      const gameRoom = await storage.getGameRoomByCode(code);
      
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const existingPlayers = await storage.getPlayersByGame(gameRoom.id);
      const testPlayers = generateTestPlayers();
      
      // Add test players that don't conflict with existing names (case-insensitive)
      const addedPlayers = [];
      for (const testPlayer of testPlayers) {
        if (!existingPlayers.some(p => p.name.toLowerCase() === testPlayer.name.toLowerCase())) {
          const player = await storage.addPlayer({
            playerId: testPlayer.playerId,
            name: testPlayer.name,
            gameId: gameRoom.id,
            role: null,
            isAlive: true
          });
          addedPlayers.push(player);
        }
      }

      res.json({ addedPlayers });
    } catch (error) {
      res.status(500).json({ message: "Failed to add test players" });
    }
  });
}