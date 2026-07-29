import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Test-specific environment: its own database, E2E hooks enabled.
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const PORT = process.env.E2E_PORT ?? '3100';
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  // Every spec shares one database and mutates attainment, grade and score
  // rows, so running files concurrently makes them clear each other's data.
  // A single worker keeps the suite deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Attainment calculations and report generation touch a lot of rows
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    // Traces and screenshots only when something fails — they are the fastest
    // way to see what the page actually looked like.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Prepares the database and signs each role in once, saving storage state.
  globalSetup: './e2e/support/global-setup.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Production build: closest to what actually ships, and far faster per page
    // than dev mode compiling on demand.
    command: `npm run build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'production',
      E2E_TEST_MODE: 'true',
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? '',
      CRON_SECRET: process.env.CRON_SECRET ?? '',
      NEXT_PUBLIC_APP_URL: BASE_URL,
    },
  },
});
