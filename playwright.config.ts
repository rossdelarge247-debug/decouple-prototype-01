import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'phone', use: { ...devices['iPhone 13'] } }],
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
})
