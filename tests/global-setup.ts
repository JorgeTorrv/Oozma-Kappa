import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Prepara una base SQLite limpia para las pruebas: borra el archivo anterior y
 * aplica el esquema con `prisma db push`. No genera datos: cada test siembra lo
 * que necesita.
 */
export default function setup() {
  const dbFile = resolve(process.cwd(), "prisma/test.db");
  for (const f of [dbFile, `${dbFile}-journal`]) {
    try {
      rmSync(f);
    } catch {
      /* no existía */
    }
  }

  // El archivo ya se borró arriba, así que `db push` lo crea desde cero
  // (no se usa --force-reset para no realizar una acción destructiva).
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
