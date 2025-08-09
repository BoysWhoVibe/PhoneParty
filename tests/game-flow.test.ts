import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';

// Helper function to create a player session
async function createPlayerSession(context: BrowserContext, name: string) {
  const page = await context.newPage();
  await page.goto(BASE_URL);
  return { page, name };
}

// Helper function to create a game as host
async function createGameAsHost(page: Page, hostName: string) {
  // Fill host name and create game
  await page.fill('[data-testid="input-host-name"]', hostName);
  await page.click('[data-testid="button-create-game"]');
  
  // Wait for navigation to lobby
  await page.waitForURL(/\/lobby\/.+/);
  
  // Extract game code from URL
  const url = page.url();
  const gameCode = url.split('/lobby/')[1];
  
  return gameCode;
}

// Helper function to join game as player
async function joinGameAsPlayer(page: Page, gameCode: string, playerName: string) {
  // Fill player name and game code
  await page.fill('[data-testid="input-player-name"]', playerName);
  await page.fill('[data-testid="input-room-code"]', gameCode);
  await page.click('[data-testid="button-join-game"]');
  
  // Wait for navigation to lobby
  await page.waitForURL(/\/lobby\/.+/);
}

// Helper function to start game from lobby (host only)
async function startGameFromLobby(page: Page) {
  // Click start game button
  await page.click('[data-testid="button-start-game"]');
  
  // Wait for navigation to role assignment phase
  await page.waitForURL(/\/role-assignment\/.+/);
}

// Helper function to acknowledge role
async function acknowledgeRole(page: Page) {
  // Wait for role assignment page to load
  await page.waitForSelector('[data-testid="button-acknowledge-role"]');
  
  // Click acknowledge role button
  await page.click('[data-testid="button-acknowledge-role"]');
  
  // Wait for acknowledgment to complete
  await expect(page.locator('text=✓ Role Acknowledged')).toBeVisible();
}

// Helper function to start gameplay (host only, after all acknowledge)
async function startGameplay(page: Page) {
  // Wait for start game button to be enabled
  await page.waitForSelector('[data-testid="button-start-game"]:not([disabled])');
  
  // Click start game button
  await page.click('[data-testid="button-start-game"]');
}

test.describe('Mafia Game Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure server is running by checking home page
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toContainText('Mafia');
  });

  test('Complete game flow: create, join, acknowledge roles, start', async ({ browser }) => {
    // Create separate browser contexts for each player to simulate different users
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    try {
      // Create player sessions
      const { page: hostPage } = await createPlayerSession(hostContext, 'Host');
      const { page: player1Page } = await createPlayerSession(player1Context, 'Player1');
      const { page: player2Page } = await createPlayerSession(player2Context, 'Player2');

      // Step 1: Host creates game
      console.log('Step 1: Host creates game...');
      const gameCode = await createGameAsHost(hostPage, 'TestHost');
      console.log(`Game created with code: ${gameCode}`);

      // Step 2: Players join the game
      console.log('Step 2: Players joining game...');
      await Promise.all([
        joinGameAsPlayer(player1Page, gameCode, 'TestPlayer1'),
        joinGameAsPlayer(player2Page, gameCode, 'TestPlayer2')
      ]);

      // Verify all players are in lobby
      await expect(hostPage.locator('text=TestHost')).toBeVisible();
      await expect(hostPage.locator('text=TestPlayer1')).toBeVisible();
      await expect(hostPage.locator('text=TestPlayer2')).toBeVisible();

      // Step 3: Host starts the game
      console.log('Step 3: Host starting game...');
      await startGameFromLobby(hostPage);

      // Wait for all players to be redirected to role assignment
      await Promise.all([
        player1Page.waitForURL(/\/role-assignment\/.+/),
        player2Page.waitForURL(/\/role-assignment\/.+/)
      ]);

      // Step 4: All players acknowledge their roles
      console.log('Step 4: Players acknowledging roles...');
      await Promise.all([
        acknowledgeRole(hostPage),
        acknowledgeRole(player1Page),
        acknowledgeRole(player2Page)
      ]);

      // Step 5: Verify non-host players see waiting message
      console.log('Step 5: Verifying waiting messages...');
      await expect(player1Page.locator('text=Waiting for host to start the game')).toBeVisible();
      await expect(player2Page.locator('text=Waiting for host to start the game')).toBeVisible();

      // Step 6: Host starts gameplay
      console.log('Step 6: Host starting gameplay...');
      await startGameplay(hostPage);

      // Step 7: Verify game has advanced to next phase
      console.log('Step 7: Verifying game advancement...');
      // This will depend on what the next phase after role assignment is
      // For now, we verify the role assignment phase is complete
      await expect(hostPage.locator('text=Starting Game...')).toBeVisible({ timeout: 5000 });

      console.log('✅ Complete game flow test passed!');

    } finally {
      // Clean up contexts
      await hostContext.close();
      await player1Context.close();
      await player2Context.close();
    }
  });

  test('Host identification and controls', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    try {
      const { page: hostPage } = await createPlayerSession(hostContext, 'Host');
      const { page: playerPage } = await createPlayerSession(playerContext, 'Player');

      // Create game as host
      const gameCode = await createGameAsHost(hostPage, 'TestHost');
      
      // Player joins
      await joinGameAsPlayer(playerPage, gameCode, 'TestPlayer');

      // Verify host has start game button
      await expect(hostPage.locator('[data-testid="button-start-game"]')).toBeVisible();
      
      // Verify non-host player does NOT have start game button
      await expect(playerPage.locator('[data-testid="button-start-game"]')).not.toBeVisible();

      // Start game and move to role assignment
      await startGameFromLobby(hostPage);
      await playerPage.waitForURL(/\/role-assignment\/.+/);

      // Both acknowledge roles
      await Promise.all([
        acknowledgeRole(hostPage),
        acknowledgeRole(playerPage)
      ]);

      // Verify only host has start gameplay button
      await expect(hostPage.locator('[data-testid="button-start-game"]:not([disabled])')).toBeVisible();
      await expect(playerPage.locator('[data-testid="button-start-game"]')).not.toBeVisible();

      console.log('✅ Host identification test passed!');

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('Role acknowledgment flow', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    try {
      const { page: hostPage } = await createPlayerSession(hostContext, 'Host');
      const { page: player1Page } = await createPlayerSession(player1Context, 'Player1');
      const { page: player2Page } = await createPlayerSession(player2Context, 'Player2');

      // Setup game
      const gameCode = await createGameAsHost(hostPage, 'TestHost');
      await Promise.all([
        joinGameAsPlayer(player1Page, gameCode, 'TestPlayer1'),
        joinGameAsPlayer(player2Page, gameCode, 'TestPlayer2')
      ]);

      await startGameFromLobby(hostPage);
      await Promise.all([
        player1Page.waitForURL(/\/role-assignment\/.+/),
        player2Page.waitForURL(/\/role-assignment\/.+/)
      ]);

      // Test partial acknowledgment
      await acknowledgeRole(player1Page);
      
      // Verify host button is still disabled
      await expect(hostPage.locator('[data-testid="button-start-game"][disabled]')).toBeVisible();
      await expect(hostPage.locator('text=Waiting for role acknowledgements')).toBeVisible();

      // Acknowledge remaining players
      await Promise.all([
        acknowledgeRole(hostPage),
        acknowledgeRole(player2Page)
      ]);

      // Verify host button is now enabled
      await expect(hostPage.locator('[data-testid="button-start-game"]:not([disabled])')).toBeVisible();
      
      // Verify waiting messages for non-host players
      await expect(player1Page.locator('text=Waiting for host to start the game')).toBeVisible();
      await expect(player2Page.locator('text=Waiting for host to start the game')).toBeVisible();

      console.log('✅ Role acknowledgment flow test passed!');

    } finally {
      await hostContext.close();
      await player1Context.close();
      await player2Context.close();
    }
  });
});