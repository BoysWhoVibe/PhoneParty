import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gameRooms = pgTable("game_rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull(),
  phase: text("phase").notNull().default("lobby"), // lobby, town_naming, town_voting, role_assignment, night, day, voting, game_end
  townName: text("town_name"),
  townNamingMode: text("town_naming_mode").default("vote"), // host, vote
  currentDay: integer("current_day").default(0),
  gameState: jsonb("game_state").$type<GameState>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameRooms.id),
  playerId: text("player_id").notNull(),
  name: text("name").notNull(),
  role: text("role"),
  isAlive: boolean("is_alive").default(true),
  isHost: boolean("is_host").default(false),
  connectionStatus: text("connection_status").default("connected"), // connected, disconnected, reconnecting
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const townNameSuggestions = pgTable("town_name_suggestions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameRooms.id),
  playerId: text("player_id").notNull(),
  suggestion: text("suggestion").notNull(),
  votes: integer("votes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameActions = pgTable("game_actions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameRooms.id),
  playerId: text("player_id").notNull(),
  phase: text("phase").notNull(),
  day: integer("day").notNull(),
  actionType: text("action_type").notNull(), // investigate, kill, save, vote, nominate, etc.
  targetId: text("target_id"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types for game state
export interface GameState {
  roles: { [playerId: string]: string };
  nightActions: { [playerId: string]: any };
  dayVotes: { [playerId: string]: string };
  nominatedPlayer?: string;
  phaseStartTime: number;
  phaseDuration: number;
  winners?: string[];
  gameEndReason?: string;
}

export const insertGameRoomSchema = createInsertSchema(gameRooms).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true,
});

export const insertTownNameSuggestionSchema = createInsertSchema(townNameSuggestions).omit({
  id: true,
  createdAt: true,
  votes: true,
});

export const insertGameActionSchema = createInsertSchema(gameActions).omit({
  id: true,
  createdAt: true,
});

export type InsertGameRoom = z.infer<typeof insertGameRoomSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertTownNameSuggestion = z.infer<typeof insertTownNameSuggestionSchema>;
export type InsertGameAction = z.infer<typeof insertGameActionSchema>;

export type GameRoom = typeof gameRooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type TownNameSuggestion = typeof townNameSuggestions.$inferSelect;
export type GameAction = typeof gameActions.$inferSelect;

// Role definitions
export const ROLES = {
  MAFIA: "Mafia",
  GODFATHER: "Godfather", 
  SHERIFF: "Sheriff",
  DOCTOR: "Doctor",
  JOKER: "Joker",
  PROSTITUTE: "Prostitute",
  VIGILANTE: "Vigilante",
  CITIZEN: "Citizen"
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
