/**
 * go-live — deja la base LISTA PARA PRODUCCIÓN.
 *
 * Borra TODOS los datos (demo o no) y crea una única cuenta de
 * COORDINADOR_GENERAL a partir de variables de entorno. Las tablas y el
 * esquema NO se tocan (eso lo hace `prisma migrate deploy`).
 *
 * Uso:
 *   ADMIN_PHONE="833 111 2233" \
 *   ADMIN_PASSWORD="una-contraseña-larga" \
 *   ADMIN_EMAIL="admin@tudominio.mx"      # opcional
 *   ADMIN_NAME="Coordinación general"     # opcional
 *   CONFIRM=WIPE npm run db:go-live
 *
 * Sin `CONFIRM=WIPE` sólo muestra qué se borraría y no cambia nada.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_COST = 12; // igual que lib/auth/password.ts

function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`✗ Falta la variable de entorno ${name}.`);
    process.exit(1);
  }
  return v;
}

async function counts() {
  const [
    users,
    centers,
    campaigns,
    articles,
    institutions,
    movements,
    sessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.center.count(),
    prisma.campaign.count(),
    prisma.article.count(),
    prisma.recipientInstitution.count(),
    prisma.movement.count(),
    prisma.session.count(),
  ]);
  return { users, centers, campaigns, articles, institutions, movements, sessions };
}

async function main() {
  const phone = req("ADMIN_PHONE");
  const password = req("ADMIN_PASSWORD");
  const email = process.env.ADMIN_EMAIL?.trim() || null;
  const name = process.env.ADMIN_NAME?.trim() || "Coordinación general";
  const confirmed = process.env.CONFIRM === "WIPE";

  if (password.length < 8) {
    console.error("✗ ADMIN_PASSWORD debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const before = await counts();
  console.log("Estado actual de la base:");
  console.table(before);

  if (!confirmed) {
    console.log(
      "\nMODO SIMULACRO (dry-run). No se borró nada.\n" +
        "Para ejecutar de verdad, vuelve a correr con  CONFIRM=WIPE  al frente.",
    );
    return;
  }

  console.log("\nBorrando todos los datos…");
  // Orden respetando las claves foráneas.
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.campaignGoal.deleteMany();
  await prisma.campaignCenter.deleteMany();
  await prisma.session.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.recipientInstitution.deleteMany();
  await prisma.center.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.article.deleteMany();

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const admin = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "COORDINADOR_GENERAL",
      active: true,
      approvalStatus: "APPROVED",
      createdVia: "ADMIN",
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  const after = await counts();
  console.log("\n✓ Base lista para producción.");
  console.table(after);
  console.log("Admin creado:", admin);
  console.log(
    `\nEntra en /login con el teléfono  ${phone}  (o el correo, si lo pusiste) y la contraseña definida.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
