import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    // PW_CHROMIUM points at a system Chromium where Playwright's own download is unavailable.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM, args: ['--no-sandbox'] } : {},
  },
  // The device preset defaults to WebKit; Chromium is what CI installs and what axe runs against.
  projects: [{ name: 'phone', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: process.env.CI ? 'npm run start' : 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 120_000 },
})
