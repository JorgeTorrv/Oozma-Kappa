#!/usr/bin/env node
/**
 * `npm run demo` — arranque a prueba de fallos para la presentación (spec §33).
 *
 *  1. Comprueba / crea la base SQLite y aplica las migraciones.
 *  2. Si la base está vacía, carga los datos de demostración.
 *  3. Inicia la aplicación (next dev).
 *
 * No necesita Internet: todo es local.
 */
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd) =>
  execSync(cmd, { stdio: "inherit", cwd: root, env: process.env });

console.log("▶ Acopio Hub — preparando entorno de demostración\n");

run("npx prisma generate");
run("npx prisma migrate deploy");

const prisma = new PrismaClient();
let needsSeed = true;
try {
  const users = await prisma.user.count();
  const movements = await prisma.movement.count();
  needsSeed = users === 0 || movements === 0;
  console.log(
    `  Base de datos: ${users} usuario(s), ${movements} movimiento(s).`,
  );
} catch {
  needsSeed = true;
} finally {
  await prisma.$disconnect();
}

if (needsSeed) {
  console.log("  Cargando datos de demostración…");
  run("npx prisma db seed");
} else {
  console.log("  Los datos de demostración ya están presentes. (Omitiendo seed)");
}

console.log("\n▶ Iniciando la aplicación en http://localhost:3000\n");
run("npx next dev");
