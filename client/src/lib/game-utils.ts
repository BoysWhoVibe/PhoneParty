import { ROLES } from "@shared/schema";

export interface RoleInfo {
  name: string;
  description: string;
  team: "town" | "mafia" | "neutral";
  hasNightAction: boolean;
}

export const getRoleInfo = (role: string): RoleInfo => {
  switch (role) {
    case ROLES.SHERIFF:
      return {
        name: "Sheriff",
        description: "Investigate one player each night to learn if they are Mafia or not.",
        team: "town",
        hasNightAction: true
      };
    case ROLES.MAFIA:
      return {
        name: "Mafia",
        description: "Work with other Mafia to eliminate townspeople each night.",
        team: "mafia",
        hasNightAction: true
      };
    case ROLES.GODFATHER:
      return {
        name: "Godfather",
        description: "You are Mafia but appear as 'Not Mafia' to investigations.",
        team: "mafia",
        hasNightAction: true
      };
    case ROLES.DOCTOR:
      return {
        name: "Doctor",
        description: "Protect one player each night from being eliminated.",
        team: "town",
        hasNightAction: true
      };
    case ROLES.JOKER:
      return {
        name: "Joker",
        description: "Win by being voted out during the day. Lose if killed at night.",
        team: "neutral",
        hasNightAction: false
      };
    case ROLES.PROSTITUTE:
      return {
        name: "Prostitute",
        description: "Visit one player each night to block their action.",
        team: "town",
        hasNightAction: true
      };
    case ROLES.VIGILANTE:
      return {
        name: "Vigilante",
        description: "You have one bullet to use during any day phase.",
        team: "town",
        hasNightAction: false
      };
    case ROLES.CITIZEN:
      return {
        name: "Citizen",
        description: "You have no special powers, but your vote is crucial.",
        team: "town",
        hasNightAction: false
      };
    default:
      return {
        name: "Unknown",
        description: "Unknown role",
        team: "town",
        hasNightAction: false
      };
  }
};

export const isRoleEvil = (role: string): boolean => {
  return [ROLES.MAFIA, ROLES.GODFATHER].includes(role);
};

export const canRoleWinWithMafia = (role: string): boolean => {
  return [ROLES.MAFIA, ROLES.GODFATHER].includes(role);
};

export const canRoleWinWithTown = (role: string): boolean => {
  return [ROLES.SHERIFF, ROLES.DOCTOR, ROLES.PROSTITUTE, ROLES.VIGILANTE, ROLES.CITIZEN].includes(role);
};

export const generateGameCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
};

export const calculateMajority = (totalVoters: number): number => {
  return Math.floor(totalVoters / 2) + 1;
};

export const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `0:${remainingSeconds.toString().padStart(2, '0')}`;
};
