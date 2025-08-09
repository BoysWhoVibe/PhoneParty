#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎭 Starting Mafia Game Tests...\n');

// Check if we want to run browser tests (experimental)
const runBrowserTests = process.argv.includes('--browser');

if (runBrowserTests) {
  console.log('🌐 Running browser-based tests (experimental)...\n');
  // Run Playwright browser tests (may fail in environments without browser dependencies)
  const playwrightProcess = spawn('npx', ['playwright', 'test', 'tests/game-flow.test.ts', '--reporter=line'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  playwrightProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All browser tests passed!');
    } else {
      console.log(`\n❌ Browser tests failed with exit code ${code}`);
      console.log('\nNote: Browser tests may fail in environments without browser dependencies.');
      console.log('Run "./run-tests.js" without --browser flag to run API tests instead.');
    }
    process.exit(code);
  });
} else {
  console.log('🔗 Running API integration tests...\n');
  // Run API integration tests (more reliable in Replit environment)
  const apiTestProcess = spawn('npx', ['playwright', 'test', 'tests/api-integration-test.ts', '--reporter=line'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  apiTestProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All API tests passed!');
      console.log('\nTo run browser tests: ./run-tests.js --browser');
      console.log('To debug tests: npx playwright test --debug');
    } else {
      console.log(`\n❌ API tests failed with exit code ${code}`);
    }
    process.exit(code);
  });
}

// Handle errors
process.on('error', (error) => {
  console.error('Error running tests:', error);
  process.exit(1);
});