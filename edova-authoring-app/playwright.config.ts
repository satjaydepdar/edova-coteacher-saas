import { defineConfig } from '@playwright/test'

/** Requires the app dev server (npm run dev, :5174) and the API (:8001, migration
 *  027 applied) already running -- same convention as the backend's test_*.py
 *  house tests, which expect a live server rather than mocking one. */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // Sequential on purpose: these hit one shared live dev server + backend (same
  // philosophy as the backend's own test_*.py suite), not isolated units --
  // parallel workers raced each other under load and caused a flaky timeout.
  workers: 1,
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
  },
  reporter: 'list',
})
