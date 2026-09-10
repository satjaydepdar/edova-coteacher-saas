import { defineConfig } from '@playwright/test'

/** Requires the app dev server (npm run dev, :5173) and the API (:8001, migration
 *  028 applied) already running -- same convention as the backend's test_*.py
 *  house tests, which expect a live server rather than mocking one. */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1, // sequential: one shared live dev server + backend, not isolated units
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  reporter: 'list',
})
