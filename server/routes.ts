import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameRoomSchema, insertPlayerSchema, insertTownNameSuggestionSchema, insertGameActionSchema, ROLES } from "@shared/schema";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate a unique 4-letter game code
  function generateGameCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  }

  // Assign roles randomly to players
  function assignRoles(playerCount: number): string[] {
    const roles = [];
    
    // Always have at least 1 Mafia
    roles.push(ROLES.MAFIA);
    
    if (playerCount >= 4) {
      roles.push(ROLES.SHERIFF);
    }
    
    if (playerCount >= 5) {
      roles.push(ROLES.DOCTOR);
    }
    
    if (playerCount >= 6) {
      roles.push(ROLES.MAFIA); // Second Mafia
    }
    
    if (playerCount >= 7) {
      roles.push(ROLES.GODFATHER);
    }
    
    if (playerCount >= 8) {
      roles.push(ROLES.JOKER);
    }
    
    if (playerCount >= 9) {
      roles.push(ROLES.PROSTITUTE);
    }
    
    if (playerCount >= 10) {
      roles.push(ROLES.VIGILANTE);
    }
    
    // Fill remaining slots with Citizens
    while (roles.length < playerCount) {
      roles.push(ROLES.CITIZEN);
    }
    
    // Shuffle the roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }
    
    return roles;
  }

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
        townNamingMode: "vote",
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
      const { name } = req.body;
      
      if (!name || name.length > 15) {
        return res.status(400).json({ message: "Name must be 1-15 characters" });
      }

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const existingPlayers = await storage.getPlayersByGame(gameRoom.id);
      
      // Check if name is already taken
      if (existingPlayers.some(p => p.name === name)) {
        return res.status(400).json({ message: "Name already taken" });
      }

      const playerId = nanoid();
      const player = await storage.addPlayer({
        gameId: gameRoom.id,
        playerId,
        name,
        role: null,
        isAlive: true,
        isHost: false,
        connectionStatus: "connected"
      });

      res.json({ player, gameRoom });
    } catch (error) {
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  // Get game state
  app.get("/api/games/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const gameRoom = await storage.getGameRoomByCode(code);
      
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const players = await storage.getPlayersByGame(gameRoom.id);
      const townNameSuggestions = await storage.getTownNameSuggestionsByGame(gameRoom.id);

      res.json({ gameRoom, players, townNameSuggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to get game state" });
    }
  });

  // Start game
  app.post("/api/games/:code/start", async (req, res) => {
    try {
      const { code } = req.params;
      const { hostId, townNamingMode } = req.body;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom || gameRoom.hostId !== hostId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const players = await storage.getPlayersByGame(gameRoom.id);
      if (players.length < 1) {
        return res.status(400).json({ message: "Need at least 1 player" });
      }

      const phase = townNamingMode === "host" ? "role_assignment" : "town_naming";
      
      await storage.updateGameRoom(gameRoom.id, {
        phase,
        townNamingMode,
        gameState: {
          ...gameRoom.gameState,
          phaseStartTime: Date.now(),
          phaseDuration: townNamingMode === "vote" ? 60000 : 0 // 1 minute for town naming
        }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Submit town name suggestion
  app.post("/api/games/:code/town-name", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, suggestion } = req.body;

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom || gameRoom.phase !== "town_naming") {
        return res.status(400).json({ message: "Not in town naming phase" });
      }

      // Check if player already submitted
      const existing = await storage.getTownNameSuggestionsByGame(gameRoom.id);
      if (existing.some(s => s.playerId === playerId)) {
        return res.status(400).json({ message: "Already submitted" });
      }

      await storage.addTownNameSuggestion({
        gameId: gameRoom.id,
        playerId,
        suggestion
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit town name" });
    }
  });

  // Vote for town name
  app.post("/api/games/:code/town-name/vote", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, suggestionId } = req.body;

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom || gameRoom.phase !== "town_voting") {
        return res.status(400).json({ message: "Not in town voting phase" });
      }

      // Record vote in game actions
      await storage.addGameAction({
        gameId: gameRoom.id,
        playerId,
        phase: "town_voting",
        day: 0,
        actionType: "vote_town_name",
        targetId: suggestionId.toString(),
        data: null
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to vote for town name" });
    }
  });

  // Assign roles and start game
  app.post("/api/games/:code/assign-roles", async (req, res) => {
    try {
      const { code } = req.params;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const players = await storage.getPlayersByGame(gameRoom.id);
      const roles = assignRoles(players.length);
      const roleAssignments: { [playerId: string]: string } = {};

      // Assign roles to players
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const role = roles[i];
        await storage.updatePlayer(player.id, { role });
        roleAssignments[player.playerId] = role;
      }

      // Update game state
      await storage.updateGameRoom(gameRoom.id, {
        phase: "role_assignment",
        currentDay: 1,
        gameState: {
          ...gameRoom.gameState,
          roles: roleAssignments,
          phaseStartTime: Date.now(),
          phaseDuration: 10000 // 10 seconds to read role
        }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to assign roles" });
    }
  });

  // Submit night action
  app.post("/api/games/:code/night-action", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, actionType, targetId } = req.body;

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom || gameRoom.phase !== "night") {
        return res.status(400).json({ message: "Not in night phase" });
      }

      await storage.addGameAction({
        gameId: gameRoom.id,
        playerId,
        phase: "night",
        day: gameRoom.currentDay,
        actionType,
        targetId,
        data: null
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit night action" });
    }
  });

  // Nominate player for voting
  app.post("/api/games/:code/nominate", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, targetId } = req.body;

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom || gameRoom.phase !== "day") {
        return res.status(400).json({ message: "Not in day phase" });
      }

      await storage.updateGameRoom(gameRoom.id, {
        phase: "voting",
        gameState: {
          ...gameRoom.gameState,
          nominatedPlayer: targetId,
          dayVotes: {},
          phaseStartTime: Date.now(),
          phaseDuration: 90000 // 90 seconds to vote
        }
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to nominate player" });
    }
  });

  // Submit elimination vote
  app.post("/api/games/:code/vote", async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId, vote } = req.body; // vote: "yes" or "no"

      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom || gameRoom.phase !== "voting") {
        return res.status(400).json({ message: "Not in voting phase" });
      }

      await storage.addGameAction({
        gameId: gameRoom.id,
        playerId,
        phase: "voting",
        day: gameRoom.currentDay,
        actionType: "elimination_vote",
        targetId: vote,
        data: null
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Get player's role (for role assignment screen)
  app.get("/api/games/:code/player/:playerId/role", async (req, res) => {
    try {
      const { code, playerId } = req.params;
      
      const gameRoom = await storage.getGameRoomByCode(code);
      if (!gameRoom) {
        return res.status(404).json({ message: "Game room not found" });
      }

      const player = await storage.getPlayerByGameAndPlayerId(gameRoom.id, playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json({ role: player.role });
    } catch (error) {
      res.status(500).json({ message: "Failed to get player role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
