import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  resetDatabase,
  seedTestData,
  disconnect,
  ACCOUNTS,
  TEST_PASSWORD,
  type SeededIds,
} from './fixtures';
import { signIn } from './auth-helper';

/**
 * Runs once before the suite.
 *
 * 1. Rebuilds the test database from scratch, so every run starts identical
 * 2. Signs each role in and saves its cookies
 *
 * Signing in is expensive here — admin and faculty need an OTP round trip — so
 * doing it once and reusing the stored state keeps the suite fast.
 */

export const STATE_DIR = path.resolve(__dirname, '../.auth');
export const IDS_FILE = path.join(STATE_DIR, 'seeded-ids.json');

export function statePath(role: keyof typeof ACCOUNTS): string {
  return path.join(STATE_DIR, `${role}.json`);
}

export function readSeededIds(): SeededIds {
  return JSON.parse(fs.readFileSync(IDS_FILE, 'utf-8'));
}

async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:3100';

  console.log('\n[e2e] Resetting test database...');
  await resetDatabase();

  console.log('[e2e] Seeding test data...');
  const ids = await seedTestData();

  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(IDS_FILE, JSON.stringify(ids, null, 2));

  console.log('[e2e] Signing in each role...');
  const browser = await chromium.launch();

  try {
    for (const role of Object.keys(ACCOUNTS) as (keyof typeof ACCOUNTS)[]) {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      await signIn(page, {
        email: ACCOUNTS[role].email,
        password: TEST_PASSWORD,
        role: ACCOUNTS[role].role,
        baseURL,
      });

      await context.storageState({ path: statePath(role) });
      await context.close();
      console.log(`[e2e]   ${role} ✓`);
    }
  } finally {
    await browser.close();
    await disconnect();
  }

  console.log('[e2e] Setup complete.\n');
}

export default globalSetup;
