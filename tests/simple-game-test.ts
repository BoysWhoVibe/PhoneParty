import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';

test.describe('Simple Mafia Game Test', () => {
  test('Complete game flow with 3 players', async ({ browser }) => {
    console.log('🎮 Starting 3-player game test...');

    // Create separate browser contexts for each player
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    try {
      // Create pages for each player
      const hostPage = await hostContext.newPage();
      const player1Page = await player1Context.newPage();
      const player2Page = await player2Context.newPage();

      // Step 1: Host creates game
      console.log('Step 1: Host creating game...');
      await hostPage.goto(BASE_URL);
      await hostPage.fill('[data-testid="input-host-name"]', 'TestHost');
      await hostPage.click('[data-testid="button-create-game"]');
      
      // Wait for navigation to lobby
      await hostPage.waitForURL(/\/lobby\/.+/);
      
      // Extract game code from URL
      const gameCode = hostPage.url().split('/lobby/')[1];
      console.log(`Game created with code: ${gameCode}`);

      // Step 2: Players join the game
      console.log('Step 2: Players joining game...');
      
      // Player 1 joins
      await player1Page.goto(BASE_URL);
      await player1Page.fill('[data-testid="input-player-name"]', 'Player1');
      await player1Page.fill('[data-testid="input-room-code"]', gameCode);
      await player1Page.click('[data-testid="button-join-game"]');
      await player1Page.waitForURL(/\/lobby\/.+/);

      // Player 2 joins
      await player2Page.goto(BASE_URL);
      await player2Page.fill('[data-testid="input-player-name"]', 'Player2');
      await player2Page.fill('[data-testid="input-room-code"]', gameCode);
      await player2Page.click('[data-testid="button-join-game"]');
      await player2Page.waitForURL(/\/lobby\/.+/);

      // Verify all players are in lobby
      await expect(hostPage.locator('text=TestHost')).toBeVisible();
      await expect(hostPage.locator('text=Player1')).toBeVisible();
      await expect(hostPage.locator('text=Player2')).toBeVisible();

      // Step 3: Host starts the game
      console.log('Step 3: Host starting game...');
      await hostPage.click('[data-testid="button-start-game"]');

      // Wait for all players to be redirected to role assignment
      await Promise.all([
        hostPage.waitForURL(/\/role-assignment\/.+/),
        player1Page.waitForURL(/\/role-assignment\/.+/),
        player2Page.waitForURL(/\/role-assignment\/.+/)
      ]);

      // Step 4: Verify role assignment page loads for all players
      console.log('Step 4: Verifying role assignment page...');
      await expect(hostPage.locator('text=Role Assignment')).toBeVisible();
      await expect(player1Page.locator('text=Role Assignment')).toBeVisible();
      await expect(player2Page.locator('text=Role Assignment')).toBeVisible();

      // Step 5: All players acknowledge their roles
      console.log('Step 5: Players acknowledging roles...');
      
      // Each player clicks acknowledge role button
      await hostPage.click('[data-testid="button-acknowledge-role"]');
      await player1Page.click('[data-testid="button-acknowledge-role"]');
      await player2Page.click('[data-testid="button-acknowledge-role"]');

      // Wait for acknowledgments to complete
      await expect(hostPage.locator('text=✓ Role Acknowledged')).toBeVisible();
      await expect(player1Page.locator('text=✓ Role Acknowledged')).toBeVisible();
      await expect(player2Page.locator('text=✓ Role Acknowledged')).toBeVisible();

      // Step 6: Verify non-host players see waiting message
      console.log('Step 6: Verifying waiting messages...');
      await expect(player1Page.locator('text=Waiting for host to start the game')).toBeVisible();
      await expect(player2Page.locator('text=Waiting for host to start the game')).toBeVisible();

      // Step 7: Verify host can start gameplay
      console.log('Step 7: Verifying host start game button...');
      await expect(hostPage.locator('[data-testid="button-start-game"]:not([disabled])')).toBeVisible();

      // Step 8: Host starts gameplay
      console.log('Step 8: Host starting gameplay...');
      await hostPage.click('[data-testid="button-start-game"]');

      // Verify game has moved to next phase (could be next phase like night/day)
      // For now, just verify the role assignment phase is complete
      await expect(hostPage.locator('text=Starting Game...')).toBeVisible({ timeout: 10000 });

      console.log('✅ Complete game flow test passed!');

    } finally {
      // Clean up browser contexts
      await hostContext.close();
      await player1Context.close();
      await player2Context.close();
    }
  });

  test('Host identification test', async ({ browser }) => {
    console.log('🔑 Testing host identification...');

    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    try {
      const hostPage = await hostContext.newPage();
      const playerPage = await playerContext.newPage();

      // Host creates game
      await hostPage.goto(BASE_URL);
      await hostPage.fill('[data-testid="input-host-name"]', 'Host');
      await hostPage.click('[data-testid="button-create-game"]');
      await hostPage.waitForURL(/\/lobby\/.+/);
      
      const gameCode = hostPage.url().split('/lobby/')[1];

      // Player joins
      await playerPage.goto(BASE_URL);
      await playerPage.fill('[data-testid="input-player-name"]', 'Player');
      await playerPage.fill('[data-testid="input-room-code"]', gameCode);
      await playerPage.click('[data-testid="button-join-game"]');
      await playerPage.waitForURL(/\/lobby\/.+/);

      // Verify host has start game button
      await expect(hostPage.locator('[data-testid="button-start-game"]')).toBeVisible();
      
      // Verify non-host player does NOT have start game button
      await expect(playerPage.locator('[data-testid="button-start-game"]')).not.toBeVisible();

      console.log('✅ Host identification test passed!');

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});