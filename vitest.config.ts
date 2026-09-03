import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Base de pruebas: Postgres. Por defecto `acopio_test` en localhost; se puede
 * sobrescribir con la variable de entorno `TEST_DATABASE_URL`.
 */
const TEST_DB =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres@localhost:5432/acopio_test";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname),
      "server-only": resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: TEST_DB,
      DIRECT_URL: TEST_DB,
      TEST_DATABASE_URL: TEST_DB,
    },
    pool: "forks",
    fileParallelism: false,
    testTimeout: 20000,
  },
});
