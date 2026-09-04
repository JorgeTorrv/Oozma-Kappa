/**
 * Deja todos los teléfonos ya guardados como SÓLO DÍGITOS (833-344-1244 →
 * 8333441244). El inicio de sesión ya compara normalizado, así que esto es
 * limpieza: unifica el formato y permite búsquedas exactas.
 *
 * Uso (con la conexión apuntando a la base que quieras limpiar):
 *   npm run db:normalize-phones          # simulacro, no cambia nada
 *   CONFIRM=YES npm run db:normalize-phones
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const digits = (s: string) => s.replace(/\D/g, "");

async function main() {
  const apply = process.env.CONFIRM === "YES";

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, phone: true },
  });
  const centers = await prisma.center.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, phone: true },
  });

  // Para detectar colisiones al normalizar (User.phone es único).
  const takenUserPhones = new Set(
    users.map((u) => digits(u.phone as string)),
  );

  let userChanges = 0;
  let userSkips = 0;
  for (const u of users) {
    const raw = u.phone as string;
    const norm = digits(raw);
    if (norm === raw) continue;

    // ¿Otro usuario ya tiene ese número normalizado?
    const clash =
      users.filter((o) => o.id !== u.id && digits(o.phone as string) === norm)
        .length > 0;
    if (clash) {
      console.warn(`SKIP usuario "${u.name}": ${raw} → ${norm} choca con otra cuenta.`);
      userSkips++;
      continue;
    }
    takenUserPhones.add(norm);
    console.log(`usuario "${u.name}": ${raw} → ${norm}`);
    if (apply) {
      await prisma.user.update({ where: { id: u.id }, data: { phone: norm } });
    }
    userChanges++;
  }

  let centerChanges = 0;
  for (const c of centers) {
    const raw = c.phone as string;
    const norm = digits(raw);
    if (norm === raw) continue;
    console.log(`centro "${c.name}": ${raw} → ${norm}`);
    if (apply) {
      await prisma.center.update({ where: { id: c.id }, data: { phone: norm } });
    }
    centerChanges++;
  }

  console.log(
    `\n${apply ? "APLICADO" : "SIMULACRO"} — usuarios: ${userChanges} cambios, ` +
      `${userSkips} omitidos · centros: ${centerChanges} cambios.`,
  );
  if (!apply && userChanges + centerChanges > 0) {
    console.log("Para aplicar: CONFIRM=YES npm run db:normalize-phones");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
