import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Alias de rutas del proyecto (equivalente a "paths" de tsconfig).
      "@": resolve(__dirname),
      // `server-only` no aplica en el entorno de pruebas (Node).
      "server-only": resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
    },
    pool: "forks",
    fileParallelism: false,
    testTimeout: 20000,
  },
});
