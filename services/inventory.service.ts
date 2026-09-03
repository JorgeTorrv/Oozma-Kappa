import "server-only";
import { Prisma } from "@prisma/client";
import { prisma, type Db } from "@/lib/db";
import {
  INBOUND_TYPES,
  MOVEMENT_TYPES,
  OUTBOUND_TYPES,
  type MovementType,
} from "@/lib/constants";
import {
  InsufficientStockError,
  InvalidQuantityError,
  NotFoundError,
  RuleViolationError,
} from "@/lib/errors";
import {
  applyInventoryDelta,
  getInventoryItem,
  reconstructStockFromMovements,
  type StockKey,
} from "@/repositories/inventory.repo";
import { createMovement } from "@/repositories/movements.repo";

/**
 * InventoryService — lógica CENTRALIZADA de inventario (spec §4 y §8).
 *
 * Reglas invariables:
 *  - El stock se define por (centro + campaña + artículo).
 *  - stock = Σ(entradas) − Σ(salidas). Nunca < 0.
 *  - Cantidades: finitas, > 0. Nunca NaN / Infinity / 0 / negativas.
 *  - Toda mutación de inventario produce un `Movement` (fuente de trazabilidad).
 *  - `InventoryItem` es sólo un caché; se actualiza en la MISMA transacción.
 *  - Operaciones multi-movimiento (transferencias) → una transacción atómica.
 *
 * Los componentes visuales NO calculan inventario: siempre pasan por aquí.
 */

export function normalizeQuantity(input: number | string): Prisma.Decimal {
  let dec: Prisma.Decimal;
  try {
    dec = new Prisma.Decimal(input);
  } catch {
    throw new InvalidQuantityError();
  }
  if (!dec.isFinite() || dec.isNaN()) throw new InvalidQuantityError();
  if (dec.lte(0)) {
    throw new InvalidQuantityError("La cantidad debe ser mayor que cero.");
  }
  // Máx. 3 decimales (unidades tipo kg). Evita ruido de coma flotante.
  if (dec.decimalPlaces() > 3) {
    throw new InvalidQuantityError(
      "La cantidad admite como máximo 3 decimales.",
    );
  }
  return dec;
}

export function signedDelta(
  type: MovementType,
  quantity: Prisma.Decimal,
): Prisma.Decimal {
  if (INBOUND_TYPES.includes(type)) return quantity;
  if (OUTBOUND_TYPES.includes(type)) return quantity.negated();
  throw new RuleViolationError("Tipo de movimiento no reconocido.");
}

/** Stock actual (desde el snapshot). */
export async function getStock(
  key: StockKey,
  db: Db = prisma,
): Promise<Prisma.Decimal> {
  const item = await getInventoryItem(key, db);
  return item?.quantity ?? new Prisma.Decimal(0);
}

/** Lanza si no hay cantidad suficiente para una salida. */
export async function assertAvailable(
  key: StockKey,
  quantity: Prisma.Decimal,
  db: Db = prisma,
): Promise<void> {
  const stock = await getStock(key, db);
  if (stock.lt(quantity)) {
    throw new InsufficientStockError(
      `No existe suficiente inventario. Disponible: ${stock.toString()}.`,
    );
  }
}

export type RecordMovementInput = {
  type: MovementType;
  quantity: number | string;
  centerId: string;
  campaignId: string;
  articleId: string;
  actorUserId: string;
  recipientInstitutionId?: string | null;
  destinationCenterId?: string | null;
  transferId?: string | null;
  donorId?: string | null;
  status?: string | null;
  reason?: string | null;
  notes?: string | null;
  /** Si es false, no valida disponibilidad (uso interno de transferencias que ya validaron). */
  checkAvailability?: boolean;
};

/**
 * Punto único para registrar un movimiento y mantener el snapshot consistente.
 * Si recibe un cliente transaccional lo usa; si no, abre su propia transacción.
 */
export async function recordMovement(
  input: RecordMovementInput,
  db?: Db,
): Promise<{ movementId: string; resultingStock: Prisma.Decimal }> {
  const run = async (tx: Db) => {
    const quantity = normalizeQuantity(input.quantity);

    // Integridad referencial mínima (evita movimientos "huérfanos").
    const [campaign, center, article] = await Promise.all([
      tx.campaign.findUnique({ where: { id: input.campaignId } }),
      tx.center.findUnique({ where: { id: input.centerId } }),
      tx.article.findUnique({ where: { id: input.articleId } }),
    ]);
    if (!campaign) throw new NotFoundError("La campaña no existe.");
    if (!center) throw new NotFoundError("El centro no existe.");
    if (!article) throw new NotFoundError("El artículo no existe.");

    // El centro debe participar en la campaña.
    const link = await tx.campaignCenter.findUnique({
      where: {
        campaignId_centerId: {
          campaignId: input.campaignId,
          centerId: input.centerId,
        },
      },
    });
    if (!link) {
      throw new RuleViolationError(
        "El centro seleccionado no participa en esta campaña.",
      );
    }

    const key: StockKey = {
      centerId: input.centerId,
      campaignId: input.campaignId,
      articleId: input.articleId,
    };

    const isOutbound = OUTBOUND_TYPES.includes(input.type);
    if (isOutbound && input.checkAvailability !== false) {
      await assertAvailable(key, quantity, tx);
    }

    const movement = await createMovement(
      {
        type: input.type,
        quantity,
        centerId: input.centerId,
        campaignId: input.campaignId,
        articleId: input.articleId,
        actorUserId: input.actorUserId,
        recipientInstitutionId: input.recipientInstitutionId ?? null,
        destinationCenterId: input.destinationCenterId ?? null,
        transferId: input.transferId ?? null,
        donorId: input.donorId ?? null,
        status: input.status ?? null,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
      },
      tx,
    );

    const delta = signedDelta(input.type, quantity);
    const resultingStock = await applyInventoryDelta(key, delta, tx);

    // Cinturón y tirantes: el snapshot jamás debe quedar negativo.
    if (resultingStock.lt(0)) {
      throw new InsufficientStockError();
    }

    return { movementId: movement.id, resultingStock };
  };

  if (db) return run(db);
  return prisma.$transaction((tx) => run(tx));
}

/**
 * Ajuste manual de inventario (spec §13). Genera ADJUSTMENT_POSITIVE o
 * ADJUSTMENT_NEGATIVE, nunca modifica un campo de stock directamente.
 */
export async function adjustInventory(
  input: {
    direction: "POSITIVE" | "NEGATIVE";
    quantity: number | string;
    centerId: string;
    campaignId: string;
    articleId: string;
    actorUserId: string;
    reason: string;
    notes?: string | null;
  },
  db?: Db,
) {
  if (!input.reason || input.reason.trim().length < 3) {
    throw new RuleViolationError("El ajuste requiere un motivo.");
  }
  const type =
    input.direction === "POSITIVE"
      ? MOVEMENT_TYPES.ADJUSTMENT_POSITIVE
      : MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE;

  return recordMovement(
    {
      type,
      quantity: input.quantity,
      centerId: input.centerId,
      campaignId: input.campaignId,
      articleId: input.articleId,
      actorUserId: input.actorUserId,
      reason: input.reason.trim(),
      notes: input.notes ?? null,
    },
    db,
  );
}

/** Vista de inventario (snapshot) para pantallas, con filtros de ámbito. */
export async function listInventoryView(
  params: { campaignId?: string; centerId?: string },
  db: Db = prisma,
) {
  const items = await db.inventoryItem.findMany({
    where: {
      ...(params.campaignId ? { campaignId: params.campaignId } : {}),
      ...(params.centerId ? { centerId: params.centerId } : {}),
    },
    include: {
      article: { select: { name: true, category: true, unit: true } },
      center: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true } },
    },
    orderBy: [
      { center: { name: "asc" } },
      { article: { name: "asc" } },
    ],
  });

  const rows = items.map((it) => ({
    id: it.id,
    center: it.center.name,
    centerId: it.centerId,
    campaign: it.campaign.name,
    article: it.article.name,
    category: it.article.category,
    unit: it.article.unit,
    quantity: it.quantity.toNumber(),
  }));

  const total = rows.reduce((s, r) => s + r.quantity, 0);
  return { rows, total };
}

/** Verifica que snapshot y ledger coinciden (uso en pruebas / diagnóstico). */
export async function verifyConsistency(
  key: StockKey,
  db: Db = prisma,
): Promise<{ snapshot: Prisma.Decimal; ledger: Prisma.Decimal; consistent: boolean }> {
  const snapshot = await getStock(key, db);
  const ledger = await reconstructStockFromMovements(key, db);
  return { snapshot, ledger, consistent: snapshot.equals(ledger) };
}
