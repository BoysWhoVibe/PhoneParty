import { 
  gameRooms, 
  players, 
  townNameSuggestions, 
  gameActions,
  type GameRoom, 
  type Player, 
  type TownNameSuggestion, 
  type GameAction,
  type InsertGameRoom, 
  type InsertPlayer, 
  type InsertTownNameSuggestion, 
  type InsertGameAction,
  type GameState
} from "@shared/schema";

export interface IStorage {
  // Game Room operations
  createGameRoom(room: InsertGameRoom): Promise<GameRoom>;
  getGameRoom(id: number): Promise<GameRoom | undefined>;
  getGameRoomByCode(code: string): Promise<GameRoom | undefined>;
  updateGameRoom(id: number, updates: Partial<GameRoom>): Promise<GameRoom | undefined>;
  
  // Player operations
  addPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayerByGameAndPlayerId(gameId: number, playerId: string): Promise<Player | undefined>;
  getPlayersByGame(gameId: number): Promise<Player[]>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined>;
  removePlayer(id: number): Promise<boolean>;
  
  // Town name operations
  addTownNameSuggestion(suggestion: InsertTownNameSuggestion): Promise<TownNameSuggestion>;
  getTownNameSuggestionsByGame(gameId: number): Promise<TownNameSuggestion[]>;
  updateTownNameSuggestion(id: number, updates: Partial<TownNameSuggestion>): Promise<TownNameSuggestion | undefined>;
  
  // Game action operations
  addGameAction(action: InsertGameAction): Promise<GameAction>;
  getGameActionsByGameAndPhase(gameId: number, phase: string, day: number): Promise<GameAction[]>;
  getGameActionsByPlayer(gameId: number, playerId: string): Promise<GameAction[]>;
}

export class MemStorage implements IStorage {
  private gameRooms: Map<number, GameRoom>;
  private players: Map<number, Player>;
  private townNameSuggestions: Map<number, TownNameSuggestion>;
  private gameActions: Map<number, GameAction>;
  private currentGameRoomId: number;
  private currentPlayerId: number;
  private currentSuggestionId: number;
  private currentActionId: number;

  constructor() {
    this.gameRooms = new Map();
    this.players = new Map();
    this.townNameSuggestions = new Map();
    this.gameActions = new Map();
    this.currentGameRoomId = 1;
    this.currentPlayerId = 1;
    this.currentSuggestionId = 1;
    this.currentActionId = 1;
  }

  async createGameRoom(room: InsertGameRoom): Promise<GameRoom> {
    const id = this.currentGameRoomId++;
    const gameRoom: GameRoom = {
      code: room.code,
      hostId: room.hostId,
      phase: room.phase || "lobby",
      townName: room.townName || null,
      townNamingMode: room.townNamingMode || "host",
      currentDay: room.currentDay || 0,
      gameState: room.gameState || {
        roles: {},
        nightActions: {},
        dayVotes: {},
        phaseStartTime: Date.now(),
        phaseDuration: 0,
        nominatedPlayer: undefined,
        winners: undefined,
        gameEndReason: undefined
      } as GameState,
      id,
      createdAt: new Date(),
    };
    this.gameRooms.set(id, gameRoom);
    return gameRoom;
  }

  async getGameRoom(id: number): Promise<GameRoom | undefined> {
    return this.gameRooms.get(id);
  }

  async getGameRoomByCode(code: string): Promise<GameRoom | undefined> {
    return Array.from(this.gameRooms.values()).find(room => room.code === code);
  }

  async updateGameRoom(id: number, updates: Partial<Omit<GameRoom, 'id' | 'createdAt'>>): Promise<GameRoom | undefined> {
    const existing = this.gameRooms.get(id);
    if (!existing) return undefined;
    
    const updated: GameRoom = { ...existing, ...updates };
    this.gameRooms.set(id, updated);
    return updated;
  }

  async addPlayer(player: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const newPlayer: Player = {
      playerId: player.playerId,
      name: player.name,
      role: player.role || null,
      gameId: player.gameId || null,
      isAlive: player.isAlive || true,
      isHost: player.isHost || false,
      connectionStatus: player.connectionStatus || "connected",
      id,
      joinedAt: new Date(),
    };
    this.players.set(id, newPlayer);
    return newPlayer;
  }

  async getPlayer(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getPlayerByGameAndPlayerId(gameId: number, playerId: string): Promise<Player | undefined> {
    return Array.from(this.players.values()).find(
      player => player.gameId === gameId && player.playerId === playerId
    );
  }

  async getPlayersByGame(gameId: number): Promise<Player[]> {
    return Array.from(this.players.values()).filter(player => player.gameId === gameId);
  }

  async updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined> {
    const existing = this.players.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.players.set(id, updated);
    return updated;
  }

  async removePlayer(id: number): Promise<boolean> {
    return this.players.delete(id);
  }

  async addTownNameSuggestion(suggestion: InsertTownNameSuggestion): Promise<TownNameSuggestion> {
    const id = this.currentSuggestionId++;
    const newSuggestion: TownNameSuggestion = {
      playerId: suggestion.playerId,
      suggestion: suggestion.suggestion,
      gameId: suggestion.gameId || null,
      id,
      votes: 0,
      createdAt: new Date(),
    };
    this.townNameSuggestions.set(id, newSuggestion);
    return newSuggestion;
  }

  async getTownNameSuggestionsByGame(gameId: number): Promise<TownNameSuggestion[]> {
    return Array.from(this.townNameSuggestions.values()).filter(
      suggestion => suggestion.gameId === gameId
    );
  }

  async updateTownNameSuggestion(id: number, updates: Partial<TownNameSuggestion>): Promise<TownNameSuggestion | undefined> {
    const existing = this.townNameSuggestions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.townNameSuggestions.set(id, updated);
    return updated;
  }

  async addGameAction(action: InsertGameAction): Promise<GameAction> {
    const id = this.currentActionId++;
    const newAction: GameAction = {
      playerId: action.playerId,
      phase: action.phase,
      day: action.day,
      actionType: action.actionType,
      data: action.data || null,
      gameId: action.gameId || null,
      targetId: action.targetId || null,
      id,
      createdAt: new Date(),
    };
    this.gameActions.set(id, newAction);
    return newAction;
  }

  async getGameActionsByGameAndPhase(gameId: number, phase: string, day: number): Promise<GameAction[]> {
    return Array.from(this.gameActions.values()).filter(
      action => action.gameId === gameId && action.phase === phase && action.day === day
    );
  }

  async getGameActionsByPlayer(gameId: number, playerId: string): Promise<GameAction[]> {
    return Array.from(this.gameActions.values()).filter(
      action => action.gameId === gameId && action.playerId === playerId
    );
  }
}

export const storage = new MemStorage();
