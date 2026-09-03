/**
 * Seed de demostración de Acopio Hub.
 *
 * Datos REALISTAS (spec §25): campaña de emergencia por inundaciones, tres
 * centros del sur de Tamaulipas, instituciones receptoras reales del contexto y
 * artículos típicos de acopio. Las cantidades están calculadas a mano para que
 * TODOS los inventarios queden coherentes y nunca negativos.
 *
 * El seed escribe los `Movement` y actualiza el snapshot `InventoryItem`
 * directamente (sin pasar por los servicios `server-only`), pero aplica las
 * mismas reglas de signo. Al final verifica que snapshot == ledger.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DELIVERY_STATUS,
  INBOUND_TYPES,
  MOVEMENT_TYPES,
  ROLES,
  WASTE_STATUS,
  type MovementType,
} from "../lib/constants";

const prisma = new PrismaClient();

/** Contraseña de DEMO — sólo para desarrollo. Documentada en README y /docs. */
const DEMO_PASSWORD = "Demo1234!";

const D = (n: number | string) => new Prisma.Decimal(n);
const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function wipe() {
  // Orden seguro respecto a claves foráneas.
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
}

async function main() {
  await wipe();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  /* ---------------------------------------------------------------- Campaña */
  const campaign = await prisma.campaign.create({
    data: {
      name: "Apoyo por Inundaciones Zona Sur",
      description:
        "Coordinación de centros de acopio para las colonias afectadas por las inundaciones en la zona sur de Tamaulipas.",
      startDate: daysAgo(18),
      endDate: null,
      active: true,
    },
  });

  /* ---------------------------------------------------------------- Centros */
  const tampico = await prisma.center.create({
    data: {
      name: "Centro Tampico",
      institution: "Cruz Roja Delegación Tampico",
      address: "Av. Hidalgo 1900, Col. Árbol Grande, Tampico",
      latitude: 22.2553,
      longitude: -97.8686,
      active: true,
    },
  });
  const madero = await prisma.center.create({
    data: {
      name: "Centro Ciudad Madero",
      institution: "DIF Ciudad Madero",
      address: "Calle Monterrey 305, Col. Primero de Mayo, Ciudad Madero",
      latitude: 22.2764,
      longitude: -97.829,
      active: true,
    },
  });
  const altamira = await prisma.center.create({
    data: {
      name: "Centro Altamira",
      institution: "Protección Civil Altamira",
      address: "Blvd. de los Ríos s/n, Altamira",
      latitude: 22.3915,
      longitude: -97.9386,
      active: true,
    },
  });
  const centers = [tampico, madero, altamira];

  for (const c of centers) {
    await prisma.campaignCenter.create({
      data: { campaignId: campaign.id, centerId: c.id },
    });
  }

  /* --------------------------------------------------------- Instituciones */
  const cruzRoja = await prisma.recipientInstitution.create({
    data: {
      name: "Cruz Roja Tampico",
      contactName: "Lic. Fernanda Rangel",
      phone: "833-217-1200",
      address: "Calle Sor Juana Inés de la Cruz 202, Tampico",
      active: true,
    },
  });
  const dif = await prisma.recipientInstitution.create({
    data: {
      name: "DIF Municipal",
      contactName: "Ing. Rubén Salazar",
      phone: "833-230-4455",
      address: "Palacio Municipal, Plaza de Armas, Tampico",
      active: true,
    },
  });
  const albergue = await prisma.recipientInstitution.create({
    data: {
      name: "Albergue Temporal Unidad Deportiva",
      contactName: "Profa. Alma Delgado",
      phone: "833-260-7788",
      address: "Unidad Deportiva Adolfo López Mateos, Ciudad Madero",
      active: true,
    },
  });

  /* --------------------------------------------------------------- Usuarios */
  const coordinador = await prisma.user.create({
    data: {
      name: "Mariana Cázares",
      email: "coordinador@acopio.local",
      passwordHash,
      role: ROLES.COORDINADOR_GENERAL,
    },
  });
  const encTampico = await prisma.user.create({
    data: {
      name: "Jorge Treviño",
      email: "encargado.tampico@acopio.local",
      passwordHash,
      role: ROLES.ENCARGADO_CENTRO,
      centerId: tampico.id,
    },
  });
  const volTampico = await prisma.user.create({
    data: {
      name: "Paola Hernández",
      email: "voluntario.tampico@acopio.local",
      passwordHash,
      role: ROLES.VOLUNTARIO_CENTRO,
      centerId: tampico.id,
    },
  });
  const encMadero = await prisma.user.create({
    data: {
      name: "Luis Ramírez",
      email: "encargado.madero@acopio.local",
      passwordHash,
      role: ROLES.ENCARGADO_CENTRO,
      centerId: madero.id,
    },
  });
  const volMadero = await prisma.user.create({
    data: {
      name: "Diana Sosa",
      email: "voluntario.madero@acopio.local",
      passwordHash,
      role: ROLES.VOLUNTARIO_CENTRO,
      centerId: madero.id,
    },
  });
  const encAltamira = await prisma.user.create({
    data: {
      name: "Óscar Villanueva",
      email: "encargado.altamira@acopio.local",
      passwordHash,
      role: ROLES.ENCARGADO_CENTRO,
      centerId: altamira.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Cruz Roja Tampico (recepción)",
      email: "cruzroja@acopio.local",
      passwordHash,
      role: ROLES.INSTITUCION_RECEPTORA,
      institutionId: cruzRoja.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "DIF Municipal (recepción)",
      email: "dif@acopio.local",
      passwordHash,
      role: ROLES.INSTITUCION_RECEPTORA,
      institutionId: dif.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Sergio Pineda",
      email: "lider@acopio.local",
      passwordHash,
      role: ROLES.LIDER_CAMPANA,
      campaignId: campaign.id,
    },
  });

  /* --------------------------------------------------------------- Artículos */
  const mk = (name: string, category: string, unit: string) =>
    prisma.article.create({ data: { name, category, unit } });
  const agua = await mk("Agua embotellada", "Agua", "pieza");
  const arroz = await mk("Arroz", "Alimentos", "kg");
  const frijol = await mk("Frijol", "Alimentos", "kg");
  const atun = await mk("Atún enlatado", "Alimentos", "pieza");
  const cobijas = await mk("Cobijas", "Ropa", "pieza");
  const panales = await mk("Pañales", "Bebés", "bolsa");
  const papel = await mk("Papel higiénico", "Higiene", "paquete");
  const medicamentos = await mk("Medicamentos básicos", "Medicamentos", "caja");
  const limpieza = await mk("Productos de limpieza", "Limpieza", "pieza");

  /* ------------------------------------------------------------------ Metas */
  await prisma.campaignGoal.createMany({
    data: [
      { campaignId: campaign.id, articleId: arroz.id, targetQty: D(500), unit: "kg" },
      {
        campaignId: campaign.id,
        articleId: medicamentos.id,
        targetQty: D(100),
        unit: "caja",
      },
      { campaignId: campaign.id, articleId: agua.id, targetQty: D(1000), unit: "pieza" },
      {
        campaignId: campaign.id,
        category: "Higiene",
        targetQty: D(200),
        unit: "paquete",
      },
    ],
  });

  /* ------------------------------------------------ Helper de movimientos */
  const inv = new Map<string, Prisma.Decimal>(); // key: center|article
  const keyOf = (centerId: string, articleId: string) =>
    `${centerId}|${articleId}`;

  async function move(opts: {
    type: MovementType;
    center: { id: string };
    article: { id: string };
    qty: number;
    actor: { id: string };
    when: Date;
    donorId?: string | null;
    recipientInstitutionId?: string | null;
    destinationCenterId?: string | null;
    transferId?: string | null;
    status?: string | null;
    reason?: string | null;
    notes?: string | null;
    skipInventory?: boolean; // p.ej. merma PENDING_APPROVAL
  }) {
    const quantity = D(opts.qty);
    await prisma.movement.create({
      data: {
        type: opts.type,
        quantity,
        centerId: opts.center.id,
        campaignId: campaign.id,
        articleId: opts.article.id,
        actorUserId: opts.actor.id,
        donorId: opts.donorId ?? null,
        recipientInstitutionId: opts.recipientInstitutionId ?? null,
        destinationCenterId: opts.destinationCenterId ?? null,
        transferId: opts.transferId ?? null,
        status: opts.status ?? null,
        reason: opts.reason ?? null,
        notes: opts.notes ?? null,
        createdAt: opts.when,
      },
    });

    if (opts.skipInventory) return;
    const k = keyOf(opts.center.id, opts.article.id);
    const cur = inv.get(k) ?? D(0);
    const next = INBOUND_TYPES.includes(opts.type)
      ? cur.plus(quantity)
      : cur.minus(quantity);
    if (next.lt(0)) {
      throw new Error(
        `Seed inconsistente: stock negativo en ${k} (${next.toString()})`,
      );
    }
    inv.set(k, next);
  }

  async function transfer(opts: {
    from: { id: string };
    to: { id: string };
    article: { id: string };
    qty: number;
    actor: { id: string };
    when: Date;
    notes?: string;
  }) {
    const row = await prisma.transfer.create({
      data: {
        campaignId: campaign.id,
        articleId: opts.article.id,
        quantity: D(opts.qty),
        fromCenterId: opts.from.id,
        toCenterId: opts.to.id,
        actorUserId: opts.actor.id,
        notes: opts.notes ?? null,
        status: "COMPLETED",
      },
    });
    await move({
      type: MOVEMENT_TYPES.TRANSFER_OUT,
      center: opts.from,
      article: opts.article,
      qty: opts.qty,
      actor: opts.actor,
      when: opts.when,
      destinationCenterId: opts.to.id,
      transferId: row.id,
      notes: opts.notes ?? null,
    });
    await move({
      type: MOVEMENT_TYPES.TRANSFER_IN,
      center: opts.to,
      article: opts.article,
      qty: opts.qty,
      actor: opts.actor,
      when: opts.when,
      destinationCenterId: opts.from.id,
      transferId: row.id,
      notes: opts.notes ?? null,
    });
  }

  /* --------------------------------------------------------------- Donantes */
  const donor = (name: string, phone?: string) =>
    prisma.donor.create({ data: { name, phone: phone ?? null } });
  const dComite = await donor("Comité Vecinal Árbol Grande", "833-140-2211");
  const dAbarrotes = await donor("Abarrotes La Placita");
  const dParroquia = await donor("Parroquia San José");
  const dFarmacia = await donor("Farmacias del Ahorro - Sucursal Centro");
  const dSindicato = await donor("Sindicato Portuario Sección 24");
  const dMedicos = await donor("Colegio de Médicos de Tampico");
  const dEjido = await donor("Ejido Miramar");
  const dGuarderia = await donor("Guardería Pública No. 12");

  /* ----------------------------------------------------- Movimientos Tampico */
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: agua, qty: 400, actor: volTampico, when: daysAgo(16) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: agua, qty: 200, actor: volTampico, when: daysAgo(14), donorId: dComite.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: arroz, qty: 180, actor: encTampico, when: daysAgo(15) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: frijol, qty: 120, actor: volTampico, when: daysAgo(13), donorId: dAbarrotes.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: atun, qty: 300, actor: volTampico, when: daysAgo(12) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: cobijas, qty: 90, actor: encTampico, when: daysAgo(11), donorId: dParroquia.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: panales, qty: 60, actor: volTampico, when: daysAgo(9) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: papel, qty: 140, actor: volTampico, when: daysAgo(8) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: medicamentos, qty: 40, actor: encTampico, when: daysAgo(7), donorId: dFarmacia.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: tampico, article: limpieza, qty: 75, actor: volTampico, when: daysAgo(5) });

  await move({ type: MOVEMENT_TYPES.DELIVERY, center: tampico, article: agua, qty: 150, actor: encTampico, when: daysAgo(6), recipientInstitutionId: cruzRoja.id, status: DELIVERY_STATUS.CONFIRMED, notes: "Entregado a brigada de la Cruz Roja" });
  await move({ type: MOVEMENT_TYPES.DELIVERY, center: tampico, article: arroz, qty: 50, actor: encTampico, when: daysAgo(2), recipientInstitutionId: dif.id, status: DELIVERY_STATUS.PENDING });
  await move({ type: MOVEMENT_TYPES.WASTE, center: tampico, article: atun, qty: 12, actor: encTampico, when: daysAgo(4), status: WASTE_STATUS.APPROVED, reason: "Daño", notes: "Latas perforadas durante el traslado" });

  await transfer({ from: tampico, to: madero, article: agua, qty: 120, actor: encTampico, when: daysAgo(5), notes: "Reequilibrio hacia Ciudad Madero" });
  await transfer({ from: tampico, to: altamira, article: cobijas, qty: 30, actor: encTampico, when: daysAgo(3), notes: "Solicitud de Altamira por frente frío" });

  await move({ type: MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE, center: tampico, article: papel, qty: 5, actor: encTampico, when: daysAgo(3), reason: "Conteo físico: faltante no explicado" });
  await move({ type: MOVEMENT_TYPES.ADJUSTMENT_POSITIVE, center: tampico, article: frijol, qty: 8, actor: encTampico, when: daysAgo(3), reason: "Conteo físico: sobrante respecto al sistema" });

  /* ------------------------------------------------------ Movimientos Madero */
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: madero, article: agua, qty: 250, actor: encMadero, when: daysAgo(15) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: madero, article: arroz, qty: 220, actor: volMadero, when: daysAgo(14), donorId: dSindicato.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: madero, article: frijol, qty: 90, actor: volMadero, when: daysAgo(12) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: madero, article: cobijas, qty: 120, actor: encMadero, when: daysAgo(10) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: madero, article: medicamentos, qty: 55, actor: encMadero, when: daysAgo(8), donorId: dMedicos.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: madero, article: papel, qty: 100, actor: volMadero, when: daysAgo(6) });

  await move({ type: MOVEMENT_TYPES.DELIVERY, center: madero, article: cobijas, qty: 80, actor: encMadero, when: daysAgo(4), recipientInstitutionId: albergue.id, status: DELIVERY_STATUS.CONFIRMED, notes: "Para las familias del albergue" });
  await move({ type: MOVEMENT_TYPES.DELIVERY, center: madero, article: medicamentos, qty: 20, actor: encMadero, when: daysAgo(1), recipientInstitutionId: cruzRoja.id, status: DELIVERY_STATUS.PENDING });

  // Merma PENDING_APPROVAL: NO descuenta stock hasta que el coordinador la apruebe.
  await move({ type: MOVEMENT_TYPES.WASTE, center: madero, article: arroz, qty: 10, actor: encMadero, when: daysAgo(2), status: WASTE_STATUS.PENDING_APPROVAL, reason: "Caducidad", notes: "Costales con humedad; pendiente de revisión", skipInventory: true });

  await transfer({ from: madero, to: altamira, article: arroz, qty: 60, actor: encMadero, when: daysAgo(3), notes: "Altamira sin arroz suficiente" });
  await move({ type: MOVEMENT_TYPES.ADJUSTMENT_POSITIVE, center: madero, article: agua, qty: 15, actor: encMadero, when: daysAgo(2), reason: "Donación del día previo no capturada" });

  /* --------------------------------------------------- Movimientos Altamira */
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: altamira, article: agua, qty: 300, actor: encAltamira, when: daysAgo(13) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: altamira, article: frijol, qty: 140, actor: encAltamira, when: daysAgo(11), donorId: dEjido.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: altamira, article: atun, qty: 180, actor: encAltamira, when: daysAgo(9) });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: altamira, article: panales, qty: 80, actor: encAltamira, when: daysAgo(7), donorId: dGuarderia.id });
  await move({ type: MOVEMENT_TYPES.RECEPTION, center: altamira, article: limpieza, qty: 60, actor: encAltamira, when: daysAgo(5) });

  await move({ type: MOVEMENT_TYPES.DELIVERY, center: altamira, article: agua, qty: 100, actor: encAltamira, when: daysAgo(3), recipientInstitutionId: dif.id, status: DELIVERY_STATUS.CONFIRMED });
  await move({ type: MOVEMENT_TYPES.DELIVERY, center: altamira, article: frijol, qty: 40, actor: encAltamira, when: daysAgo(1), recipientInstitutionId: albergue.id, status: DELIVERY_STATUS.PENDING });
  await move({ type: MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE, center: altamira, article: atun, qty: 6, actor: encAltamira, when: daysAgo(2), reason: "Latas abolladas retiradas del inventario" });

  /* --------------------------------------------- Snapshot InventoryItem */
  for (const [k, quantity] of inv.entries()) {
    const [centerId, articleId] = k.split("|");
    await prisma.inventoryItem.create({
      data: { centerId, campaignId: campaign.id, articleId, quantity },
    });
  }

  /* -------------------------------------------------------------- Auditoría */
  await prisma.auditLog.createMany({
    data: [
      { actorUserId: coordinador.id, action: "campaign.create", entity: "Campaign", entityId: campaign.id, meta: JSON.stringify({ name: campaign.name }) },
      { actorUserId: coordinador.id, action: "center.create", entity: "Center", entityId: tampico.id },
      { actorUserId: coordinador.id, action: "center.create", entity: "Center", entityId: madero.id },
      { actorUserId: coordinador.id, action: "center.create", entity: "Center", entityId: altamira.id },
      { actorUserId: coordinador.id, action: "users.create", entity: "User", entityId: encTampico.id },
    ],
  });

  /* ---------------------------------------------------------- Notificaciones */
  await prisma.notification.createMany({
    data: [
      { type: "WASTE_PENDING", title: "Merma pendiente de aprobación", body: "Centro Ciudad Madero registró una merma de 10 kg de Arroz (motivo: Caducidad).", role: ROLES.COORDINADOR_GENERAL, link: "/mermas" },
      { type: "GOAL_REACHED", title: "Meta alcanzada: Agua embotellada", body: "Se alcanzó la meta de 1000 pieza para Agua embotellada.", role: ROLES.COORDINADOR_GENERAL, link: "/campanas" },
      { type: "GOAL_REACHED", title: "Meta alcanzada: Higiene", body: "Se alcanzó la meta de 200 paquete para la categoría Higiene.", role: ROLES.COORDINADOR_GENERAL, link: "/campanas" },
      { type: "DELIVERY_PENDING", title: "Entrega pendiente de confirmación", body: "Centro Ciudad Madero envió 20 caja de Medicamentos básicos.", centerId: madero.id, link: "/institucion" },
      { type: "RECEPTION_CREATED", title: "Nueva recepción registrada", body: "Se registró una recepción de Productos de limpieza en Centro Tampico.", centerId: tampico.id, link: "/movimientos" },
    ],
  });

  /* --------------------------------------------------- Verificación final */
  const movements = await prisma.movement.findMany({
    select: { type: true, quantity: true, centerId: true, articleId: true, status: true },
  });
  const ledger = new Map<string, Prisma.Decimal>();
  for (const m of movements) {
    if (m.status === WASTE_STATUS.PENDING_APPROVAL) continue; // aún no afecta stock
    const k = `${m.centerId}|${m.articleId}`;
    const cur = ledger.get(k) ?? D(0);
    ledger.set(
      k,
      INBOUND_TYPES.includes(m.type as MovementType)
        ? cur.plus(m.quantity)
        : cur.minus(m.quantity),
    );
  }
  const snapshots = await prisma.inventoryItem.findMany();
  let mismatches = 0;
  for (const s of snapshots) {
    const k = `${s.centerId}|${s.articleId}`;
    const led = ledger.get(k) ?? D(0);
    if (!led.equals(s.quantity)) {
      mismatches++;
      console.error(
        `  ✗ ${k}: snapshot ${s.quantity.toString()} != ledger ${led.toString()}`,
      );
    }
    if (s.quantity.lt(0)) {
      mismatches++;
      console.error(`  ✗ ${k}: stock negativo ${s.quantity.toString()}`);
    }
  }
  if (mismatches > 0) {
    throw new Error(`Seed inconsistente: ${mismatches} discrepancias.`);
  }

  console.log("Seed completado:");
  console.log(`  Campaña: ${campaign.name}`);
  console.log(`  Centros: ${centers.length}  ·  Artículos: 9  ·  Movimientos: ${movements.length}`);
  console.log(`  Snapshots de inventario: ${snapshots.length} (todos >= 0, consistentes con el ledger)`);
  console.log(`  Usuarios demo con contraseña: ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
