import "server-only";
import { Prisma } from "@prisma/client";
import { prisma, type Db } from "@/lib/db";
import { INBOUND_TYPES } from "@/lib/constants";

export type StockKey = {
  centerId: string;
  campaignId: string;
  articleId: string;
};

/** Lee el snapshot materializado (o null si nunca hubo movimiento). */
export async function getInventoryItem(key: StockKey, db: Db = prisma) {
  return db.inventoryItem.findUnique({
    where: {
      centerId_campaignId_articleId: {
        centerId: key.centerId,
        campaignId: key.campaignId,
        articleId: key.articleId,
      },
    },
  });
}

/**
 * Aplica un delta (positivo o negativo) al snapshot, creándolo si no existe.
 * Debe llamarse SIEMPRE dentro de la misma transacción que crea el `Movement`.
 */
export async function applyInventoryDelta(
  key: StockKey,
  delta: Prisma.Decimal,
  db: Db,
): Promise<Prisma.Decimal> {
  const existing = await getInventoryItem(key, db);
  const current = existing?.quantity ?? new Prisma.Decimal(0);
  const next = current.plus(delta);

  if (existing) {
    const updated = await db.inventoryItem.update({
      where: { id: existing.id },
      data: { quantity: next },
    });
    return updated.quantity;
  }

  const created = await db.inventoryItem.create({
    data: {
      centerId: key.centerId,
      campaignId: key.campaignId,
      articleId: key.articleId,
      quantity: next,
    },
  });
  return created.quantity;
}

/** Inventario de un centro (opcionalmente acotado a una campaña). */
export async function listInventoryByCenter(
  centerId: string,
  campaignId?: string,
  db: Db = prisma,
) {
  return db.inventoryItem.findMany({
    where: { centerId, ...(campaignId ? { campaignId } : {}) },
    include: { article: true, campaign: true },
    orderBy: [{ article: { name: "asc" } }],
  });
}

/** Inventario agregado por artículo dentro de una campaña (suma de centros). */
export async function aggregateInventoryByCampaign(
  campaignId: string,
  db: Db = prisma,
) {
  const rows = await db.inventoryItem.findMany({
    where: { campaignId },
    include: { article: true, center: true },
  });
  return rows;
}

/**
 * Reconstruye el stock a partir del ledger de `Movement` (fuente de verdad).
 * Se usa en pruebas y para auditar que el snapshot no se ha desincronizado.
 */
export async function reconstructStockFromMovements(
  key: StockKey,
  db: Db = prisma,
): Promise<Prisma.Decimal> {
  const movements = await db.movement.findMany({
    where: {
      centerId: key.centerId,
      campaignId: key.campaignId,
      articleId: key.articleId,
    },
    select: { type: true, quantity: true },
  });

  return movements.reduce((acc, m) => {
    const signed = INBOUND_TYPES.includes(m.type as never)
      ? acc.plus(m.quantity)
      : acc.minus(m.quantity);
    return signed;
  }, new Prisma.Decimal(0));
}
