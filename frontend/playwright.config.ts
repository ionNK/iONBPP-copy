import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the admin prototype. Specs run against the local mock
 * data only (no network, no env vars). Next 16 allows a single `next dev` per
 * project dir, so the default port is used and an already-running dev server
 * is reused; otherwise one is started for the run.
 */
const PORT = 3000;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/admin/dashboard`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
