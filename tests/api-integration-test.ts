import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';

// Helper function to make API requests
async function apiRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return {
    status: response.status,
    data: response.ok ? await response.json() : null,
    ok: response.ok
  };
}

test.describe('Mafia Game API Integration Tests', () => {
  
  test('Complete game flow via API', async () => {
    console.log('🎮 Testing complete game flow via API...');

    // Step 1: Create a game
    console.log('Step 1: Creating game...');
    const createGameResponse = await apiRequest('/api/games', 'POST', {
      hostName: 'TestHost'
    });
    
    expect(createGameResponse.ok).toBe(true);
    expect(createGameResponse.data.gameRoom).toBeDefined();
    expect(createGameResponse.data.gameRoom.code).toMatch(/^[A-Z]{4}$/);
    
    const gameCode = createGameResponse.data.gameRoom.code;
    const hostId = createGameResponse.data.gameRoom.hostId;
    console.log(`Game created: ${gameCode}, Host ID: ${hostId}`);

    // Step 2: Add players to the game
    console.log('Step 2: Adding players...');
    
    const player1Response = await apiRequest(`/api/games/${gameCode}/join`, 'POST', {
      playerName: 'Player1'
    });
    expect(player1Response.ok).toBe(true);
    const player1Id = player1Response.data.player.playerId;

    const player2Response = await apiRequest(`/api/games/${gameCode}/join`, 'POST', {
      playerName: 'Player2'
    });
    expect(player2Response.ok).toBe(true);
    const player2Id = player2Response.data.player.playerId;

    // Step 3: Verify players are in the lobby
    console.log('Step 3: Verifying lobby state...');
    const gameStateResponse = await apiRequest(`/api/games/${gameCode}`);
    expect(gameStateResponse.ok).toBe(true);
    expect(gameStateResponse.data.players).toHaveLength(3);
    expect(gameStateResponse.data.players.map((p: any) => p.name)).toContain('TestHost');
    expect(gameStateResponse.data.players.map((p: any) => p.name)).toContain('Player1');
    expect(gameStateResponse.data.players.map((p: any) => p.name)).toContain('Player2');

    // Step 4: Set town name (optional)
    console.log('Step 4: Setting town name...');
    const townNameResponse = await apiRequest(`/api/games/${gameCode}/set-town-name`, 'POST', {
      townName: 'Test Town'
    });
    expect(townNameResponse.ok).toBe(true);

    // Step 5: Start the game
    console.log('Step 5: Starting game...');
    const startGameResponse = await apiRequest(`/api/games/${gameCode}/start`, 'POST', {
      hostId: hostId,
      townNamingMode: 'host'
    });
    expect(startGameResponse.ok).toBe(true);
    expect(startGameResponse.data.gameRoom.phase).toBe('role-assignment');

    // Step 6: Get roles for all players
    console.log('Step 6: Checking role assignments...');
    const hostRoleResponse = await apiRequest(`/api/games/${gameCode}/player/${hostId}/role`);
    expect(hostRoleResponse.ok).toBe(true);
    expect(hostRoleResponse.data.role).toBeDefined();

    const player1RoleResponse = await apiRequest(`/api/games/${gameCode}/player/${player1Id}/role`);
    expect(player1RoleResponse.ok).toBe(true);
    expect(player1RoleResponse.data.role).toBeDefined();

    const player2RoleResponse = await apiRequest(`/api/games/${gameCode}/player/${player2Id}/role`);
    expect(player2RoleResponse.ok).toBe(true);
    expect(player2RoleResponse.data.role).toBeDefined();

    // Step 7: Acknowledge roles for all players
    console.log('Step 7: Acknowledging roles...');
    
    const hostAckResponse = await apiRequest(`/api/games/${gameCode}/acknowledge-role`, 'POST', {
      playerId: hostId
    });
    expect(hostAckResponse.ok).toBe(true);

    const player1AckResponse = await apiRequest(`/api/games/${gameCode}/acknowledge-role`, 'POST', {
      playerId: player1Id
    });
    expect(player1AckResponse.ok).toBe(true);

    const player2AckResponse = await apiRequest(`/api/games/${gameCode}/acknowledge-role`, 'POST', {
      playerId: player2Id
    });
    expect(player2AckResponse.ok).toBe(true);

    // Step 8: Verify all players have acknowledged roles
    console.log('Step 8: Verifying role acknowledgments...');
    const finalGameStateResponse = await apiRequest(`/api/games/${gameCode}`);
    expect(finalGameStateResponse.ok).toBe(true);
    
    const allAcknowledged = finalGameStateResponse.data.players.every((p: any) => p.roleAcknowledged);
    expect(allAcknowledged).toBe(true);

    // Step 9: Host starts gameplay
    console.log('Step 9: Starting gameplay...');
    const startGameplayResponse = await apiRequest(`/api/games/${gameCode}/start-gameplay`, 'POST', {
      hostId: hostId
    });
    expect(startGameplayResponse.ok).toBe(true);

    console.log('✅ Complete API flow test passed!');
  });

  test('Host identification via API', async () => {
    console.log('🔑 Testing host identification via API...');

    // Create game
    const createGameResponse = await apiRequest('/api/games', 'POST', {
      hostName: 'Host'
    });
    expect(createGameResponse.ok).toBe(true);
    
    const gameCode = createGameResponse.data.gameRoom.code;
    const hostId = createGameResponse.data.gameRoom.hostId;

    // Add a player
    const playerResponse = await apiRequest(`/api/games/${gameCode}/join`, 'POST', {
      playerName: 'Player'
    });
    expect(playerResponse.ok).toBe(true);
    const playerId = playerResponse.data.player.playerId;

    // Verify host is correctly identified
    const gameStateResponse = await apiRequest(`/api/games/${gameCode}`);
    expect(gameStateResponse.ok).toBe(true);
    expect(gameStateResponse.data.gameRoom.hostId).toBe(hostId);

    // Verify players list shows correct host
    const hostPlayer = gameStateResponse.data.players.find((p: any) => p.playerId === hostId);
    const regularPlayer = gameStateResponse.data.players.find((p: any) => p.playerId === playerId);
    
    expect(hostPlayer.name).toBe('Host');
    expect(regularPlayer.name).toBe('Player');

    console.log('✅ Host identification test passed!');
  });

  test('Role assignment validation', async () => {
    console.log('🎭 Testing role assignment validation...');

    // Create game with 5 players
    const createGameResponse = await apiRequest('/api/games', 'POST', {
      hostName: 'Host'
    });
    expect(createGameResponse.ok).toBe(true);
    
    const gameCode = createGameResponse.data.gameRoom.code;
    const hostId = createGameResponse.data.gameRoom.hostId;

    // Add 4 more players
    const playerIds = [hostId];
    for (let i = 1; i <= 4; i++) {
      const playerResponse = await apiRequest(`/api/games/${gameCode}/join`, 'POST', {
        playerName: `Player${i}`
      });
      expect(playerResponse.ok).toBe(true);
      playerIds.push(playerResponse.data.player.playerId);
    }

    // Start game
    const startGameResponse = await apiRequest(`/api/games/${gameCode}/start`, 'POST', {
      hostId: hostId,
      townNamingMode: 'host'
    });
    expect(startGameResponse.ok).toBe(true);

    // Check that all players have unique roles
    const roles: string[] = [];
    for (const playerId of playerIds) {
      const roleResponse = await apiRequest(`/api/games/${gameCode}/player/${playerId}/role`);
      expect(roleResponse.ok).toBe(true);
      roles.push(roleResponse.data.role);
    }

    // Verify role distribution
    expect(roles).toHaveLength(5);
    expect(roles.includes('Mafia')).toBe(true);
    expect(roles.filter(r => r === 'Civilian').length).toBeGreaterThan(0);

    console.log('✅ Role assignment validation passed!');
  });

  test('Error handling', async () => {
    console.log('🚨 Testing error handling...');

    // Test joining non-existent game
    const joinInvalidResponse = await apiRequest('/api/games/XXXX/join', 'POST', {
      playerName: 'Player'
    });
    expect(joinInvalidResponse.ok).toBe(false);

    // Test getting role before game starts
    const createGameResponse = await apiRequest('/api/games', 'POST', {
      hostName: 'Host'
    });
    expect(createGameResponse.ok).toBe(true);
    
    const gameCode = createGameResponse.data.gameRoom.code;
    const hostId = createGameResponse.data.gameRoom.hostId;

    const roleBeforeStartResponse = await apiRequest(`/api/games/${gameCode}/player/${hostId}/role`);
    expect(roleBeforeStartResponse.ok).toBe(false);

    console.log('✅ Error handling test passed!');
  });
});