import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 90000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4197', channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless: true, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', trace: 'retain-on-failure' },
  webServer: { command: 'node tests/browser/server.mjs', url: 'http://127.0.0.1:4197/api/health', timeout: 30000, reuseExistingServer: false }
});
