import { execSync } from "node:child_process";

/**
 * Prepara la base de pruebas (Postgres) aplicando el esquema con
 * `prisma db push --force-reset`. Cada archivo de test siembra lo que necesita.
 */
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    "postgresql://postgres@localhost:5432/acopio_test";

  // Sincroniza el esquema (no se usa --force-reset: cada test limpia las tablas
  // con resetDb()).
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
