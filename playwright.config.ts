import { defineConfig, devices } from "@playwright/test";

/**
 * E2E del recorrido de demostración. Usa una base SQLite propia (`prisma/e2e.db`)
 * que se prepara y siembra antes de arrancar el servidor.
 *
 * Requiere navegadores de Playwright:  npx playwright install chromium
 */
const PORT = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command:
      "npx prisma db push --skip-generate && npx prisma db seed && npx next dev --port " +
      PORT,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: "file:./e2e.db",
      NODE_ENV: "development",
    },
  },
});
