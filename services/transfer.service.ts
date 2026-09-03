import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MOVEMENT_TYPES } from "@/lib/constants";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import {
  assertAvailable,
  normalizeQuantity,
  recordMovement,
} from "@/services/inventory.service";
import { notify } from "@/services/notification.service";

/**
 * Transferencia entre centros (spec §12). TODO ocurre dentro de UNA transacción:
 *  - Se valida que ambos centros participen en la misma campaña.
 *  - Se valida stock en el origen.
 *  - Se crea la entidad `Transfer`.
 *  - Se registran TRANSFER_OUT (origen) y TRANSFER_IN (destino) con el mismo
 *    `transferId`.
 *  - Resultado: origen baja, destino sube, total de campaña sin cambio.
 *  - Si cualquier paso falla, no se guarda NADA.
 */
export type TransferInput = {
  campaignId: string;
  fromCenterId: string;
  toCenterId: string;
  articleId: string;
  quantity: number | string;
  actorUserId: string;
  notes?: string | null;
};

export async function executeTransfer(input: TransferInput) {
  if (input.fromCenterId === input.toCenterId) {
    throw new RuleViolationError(
      "El centro de origen y el de destino deben ser distintos.",
    );
  }

  const quantity = normalizeQuantity(input.quantity);

  return prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findUnique({
      where: { id: input.campaignId },
    });
    if (!campaign) throw new NotFoundError("La campaña no existe.");
    if (!campaign.active) {
      throw new RuleViolationError("La campaña no está activa.");
    }

    const links = await tx.campaignCenter.findMany({
      where: {
        campaignId: input.campaignId,
        centerId: { in: [input.fromCenterId, input.toCenterId] },
      },
    });
    const linkedIds = new Set(links.map((l) => l.centerId));
    if (!linkedIds.has(input.fromCenterId) || !linkedIds.has(input.toCenterId)) {
      throw new RuleViolationError(
        "Sólo se permiten transferencias entre centros que participan en la misma campaña.",
      );
    }

    // Validación de stock en origen (dentro de la transacción).
    await assertAvailable(
      {
        centerId: input.fromCenterId,
        campaignId: input.campaignId,
        articleId: input.articleId,
      },
      quantity,
      tx,
    );

    const transfer = await tx.transfer.create({
      data: {
        campaignId: input.campaignId,
        articleId: input.articleId,
        quantity,
        fromCenterId: input.fromCenterId,
        toCenterId: input.toCenterId,
        actorUserId: input.actorUserId,
        notes: input.notes ?? null,
        status: "COMPLETED",
      },
    });

    await recordMovement(
      {
        type: MOVEMENT_TYPES.TRANSFER_OUT,
        quantity: quantity.toString(),
        centerId: input.fromCenterId,
        campaignId: input.campaignId,
        articleId: input.articleId,
        actorUserId: input.actorUserId,
        destinationCenterId: input.toCenterId,
        transferId: transfer.id,
        notes: input.notes ?? null,
      },
      tx,
    );

    await recordMovement(
      {
        type: MOVEMENT_TYPES.TRANSFER_IN,
        quantity: quantity.toString(),
        centerId: input.toCenterId,
        campaignId: input.campaignId,
        articleId: input.articleId,
        actorUserId: input.actorUserId,
        destinationCenterId: input.fromCenterId,
        transferId: transfer.id,
        notes: input.notes ?? null,
        checkAvailability: false,
      },
      tx,
    );

    return transfer;
  }).then(async (transfer) => {
    // Notificación fuera de la transacción (no debe abortarla si falla).
    await notify({
      type: "TRANSFER_RECEIVED",
      title: "Transferencia recibida",
      body: `Tu centro recibió una transferencia de ${quantity.toString()} unidades.`,
      centerId: input.toCenterId,
      link: "/movimientos",
    }).catch(() => undefined);
    return transfer;
  });
}

/** Total de un artículo en toda la campaña (suma de snapshots por centro). */
export async function campaignArticleTotal(
  campaignId: string,
  articleId: string,
): Promise<Prisma.Decimal> {
  const rows = await prisma.inventoryItem.findMany({
    where: { campaignId, articleId },
    select: { quantity: true },
  });
  return rows.reduce((acc, r) => acc.plus(r.quantity), new Prisma.Decimal(0));
}
