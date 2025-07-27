import { ROLES } from "@shared/schema";
import { nanoid } from "nanoid";

// Generate a unique 4-letter game code
export function generateGameCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

// Assign roles randomly to players
export function assignRoles(playerCount: number): string[] {
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

// Generate test players for development
export function generateTestPlayers(): Array<{name: string, playerId: string}> {
  const testNames = ["Alice", "Bob", "Carol", "Dave", "Emma", "Frank", "Grace", "Harry"];
  return testNames.map(name => ({
    name,
    playerId: nanoid()
  }));
}

// Check win conditions for the game
export function checkWinConditions(players: any[], gameState: any): {winner?: string, reason?: string} {
  const livingPlayers = players.filter(p => !p.isDead);
  const roles = gameState.roles || {};
  
  // Count living players by team
  let livingTown = 0;
  let livingMafia = 0;
  let livingJoker = 0;
  
  for (const player of livingPlayers) {
    const role = roles[player.playerId];
    if ([ROLES.MAFIA, ROLES.GODFATHER].includes(role)) {
      livingMafia++;
    } else if (role === ROLES.JOKER) {
      livingJoker++;
    } else {
      livingTown++;
    }
  }
  
  // Mafia wins if they equal or outnumber town
  if (livingMafia >= livingTown && livingMafia > 0) {
    return { winner: "Mafia", reason: "Mafia equals or outnumbers town" };
  }
  
  // Town wins if all mafia are eliminated
  if (livingMafia === 0) {
    return { winner: "Town", reason: "All Mafia eliminated" };
  }
  
  // Continue game if no win condition met
  return {};
}