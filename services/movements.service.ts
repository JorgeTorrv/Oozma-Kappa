import "server-only";
import { prisma } from "@/lib/db";
import {
  DELIVERY_STATUS,
  MOVEMENT_TYPES,
  WASTE_STATUS,
} from "@/lib/constants";
import {
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
} from "@/lib/errors";
import {
  assertAvailable,
  assertCenterActive,
  normalizeQuantity,
  recordMovement,
} from "@/services/inventory.service";
import { applyInventoryDelta } from "@/repositories/inventory.repo";
import { notify } from "@/services/notification.service";
import { checkGoalsReached } from "@/services/goal.service";

/**
 * Envoltorios de alto nivel para cada flujo de movimiento. Cada uno valida sus
 * reglas de negocio y delega en `recordMovement` para la consistencia de stock.
 */

/** El flujo de aprobación de merma puede desactivarse con WASTE_APPROVAL_ENABLED=false. */
export function isWasteApprovalEnabled(): boolean {
  return process.env.WASTE_APPROVAL_ENABLED !== "false";
}

export type DonorInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
} | null;

async function resolveDonor(donor: DonorInput): Promise<string | null> {
  if (!donor) return null;
  const hasData = [donor.name, donor.phone, donor.email].some(
    (v) => v && v.trim().length > 0,
  );
  if (!hasData) return null; // recepción anónima
  const created = await prisma.donor.create({
    data: {
      name: donor.name?.trim() || null,
      phone: donor.phone?.trim() || null,
      email: donor.email?.trim() || null,
    },
  });
  return created.id;
}

export async function registerReception(input: {
  centerId: string;
  campaignId: string;
  articleId: string;
  quantity: number | string;
  actorUserId: string;
  donor: DonorInput;
  notes?: string | null;
}) {
  const donorId = await resolveDonor(input.donor);
  const res = await recordMovement({
    type: MOVEMENT_TYPES.RECEPTION,
    quantity: input.quantity,
    centerId: input.centerId,
    campaignId: input.campaignId,
    articleId: input.articleId,
    actorUserId: input.actorUserId,
    donorId,
    notes: input.notes ?? null,
  });

  await notify({
    type: "RECEPTION_CREATED",
    title: "Nueva recepción registrada",
    body: "Se registró una recepción en tu centro.",
    centerId: input.centerId,
    link: "/movimientos",
  }).catch(() => undefined);

  await checkGoalsReached(input.campaignId).catch(() => undefined);

  return res;
}

export async function registerDelivery(input: {
  centerId: string;
  campaignId: string;
  articleId: string;
  quantity: number | string;
  actorUserId: string;
  recipientInstitutionId: string;
  notes?: string | null;
}) {
  const institution = await prisma.recipientInstitution.findUnique({
    where: { id: input.recipientInstitutionId },
  });
  if (!institution || !institution.active) {
    throw new NotFoundError(
      "La institución receptora no existe o está inactiva.",
    );
  }

  const res = await recordMovement({
    type: MOVEMENT_TYPES.DELIVERY,
    quantity: input.quantity,
    centerId: input.centerId,
    campaignId: input.campaignId,
    articleId: input.articleId,
    actorUserId: input.actorUserId,
    recipientInstitutionId: input.recipientInstitutionId,
    status: DELIVERY_STATUS.PENDING,
    notes: input.notes ?? null,
  });

  const instUsers = await prisma.user.findMany({
    where: { institutionId: input.recipientInstitutionId, active: true },
    select: { id: true },
  });
  await Promise.all(
    instUsers.map((u) =>
      notify({
        type: "DELIVERY_PENDING",
        title: "Nueva entrega para tu institución",
        body: "Revisa y confirma la recepción cuando la recibas.",
        userId: u.id,
        link: "/institucion",
      }).catch(() => undefined),
    ),
  );

  return res;
}

export async function confirmDelivery(input: {
  movementId: string;
  actorUserId: string;
  institutionId: string;
}) {
  const movement = await prisma.movement.findUnique({
    where: { id: input.movementId },
  });
  if (!movement || movement.type !== MOVEMENT_TYPES.DELIVERY) {
    throw new NotFoundError("La entrega no existe.");
  }
  // Anti-IDOR: sólo la institución destinataria puede confirmar.
  if (movement.recipientInstitutionId !== input.institutionId) {
    throw new ForbiddenError("Esta entrega no está dirigida a tu institución.");
  }
  if (movement.status === DELIVERY_STATUS.CONFIRMED) {
    throw new RuleViolationError("La entrega ya fue confirmada.");
  }

  const updated = await prisma.movement.update({
    where: { id: movement.id },
    data: {
      status: DELIVERY_STATUS.CONFIRMED,
      confirmedAt: new Date(),
      resolvedById: input.actorUserId,
    },
  });

  await notify({
    type: "DELIVERY_CONFIRMED",
    title: "Entrega confirmada",
    body: "La institución confirmó la recepción de una entrega.",
    centerId: movement.centerId,
    link: "/movimientos",
  }).catch(() => undefined);

  return updated;
}

/**
 * Merma (spec §11). Motivo obligatorio. Con el flujo de aprobación activo, la
 * merma nace en PENDING_APPROVAL y NO descuenta stock hasta ser aprobada.
 */
export async function registerWaste(input: {
  centerId: string;
  campaignId: string;
  articleId: string;
  quantity: number | string;
  actorUserId: string;
  reason: string;
  notes?: string | null;
}) {
  if (!input.reason || input.reason.trim().length < 3) {
    throw new RuleViolationError("La merma requiere un motivo.");
  }

  if (isWasteApprovalEnabled()) {
    await assertCenterActive(input.centerId);
    const qty = normalizeQuantity(input.quantity);
    await assertAvailable(
      {
        centerId: input.centerId,
        campaignId: input.campaignId,
        articleId: input.articleId,
      },
      qty,
    );
    const pending = await prisma.movement.create({
      data: {
        type: MOVEMENT_TYPES.WASTE,
        quantity: qty,
        centerId: input.centerId,
        campaignId: input.campaignId,
        articleId: input.articleId,
        actorUserId: input.actorUserId,
        reason: input.reason.trim(),
        notes: input.notes ?? null,
        status: WASTE_STATUS.PENDING_APPROVAL,
      },
    });

    await notify({
      type: "WASTE_PENDING",
      title: "Merma pendiente de aprobación",
      body: "Una merma requiere aprobación del coordinador general.",
      role: "COORDINADOR_GENERAL",
      link: "/mermas",
    }).catch(() => undefined);

    return { movementId: pending.id, pending: true as const };
  }

  const res = await recordMovement({
    type: MOVEMENT_TYPES.WASTE,
    quantity: input.quantity,
    centerId: input.centerId,
    campaignId: input.campaignId,
    articleId: input.articleId,
    actorUserId: input.actorUserId,
    reason: input.reason.trim(),
    notes: input.notes ?? null,
    status: WASTE_STATUS.APPROVED,
  });
  return { movementId: res.movementId, pending: false as const };
}

export async function approveWaste(input: {
  movementId: string;
  actorUserId: string;
}) {
  const movement = await prisma.movement.findUnique({
    where: { id: input.movementId },
  });
  if (
    !movement ||
    movement.type !== MOVEMENT_TYPES.WASTE ||
    movement.status !== WASTE_STATUS.PENDING_APPROVAL
  ) {
    throw new NotFoundError("La merma pendiente no existe.");
  }

  return prisma.$transaction(async (tx) => {
    await assertCenterActive(movement.centerId, tx);
    await assertAvailable(
      {
        centerId: movement.centerId,
        campaignId: movement.campaignId,
        articleId: movement.articleId,
      },
      movement.quantity,
      tx,
    );

    await applyInventoryDelta(
      {
        centerId: movement.centerId,
        campaignId: movement.campaignId,
        articleId: movement.articleId,
      },
      movement.quantity.negated(),
      tx,
    );

    const updated = await tx.movement.update({
      where: { id: movement.id },
      data: {
        status: WASTE_STATUS.APPROVED,
        resolvedById: input.actorUserId,
        confirmedAt: new Date(),
      },
    });

    await notify(
      {
        type: "WASTE_APPROVED",
        title: "Merma aprobada",
        body: "El coordinador aprobó una merma de tu centro.",
        centerId: movement.centerId,
        link: "/movimientos",
      },
      tx,
    ).catch(() => undefined);

    return updated;
  });
}

export async function rejectWaste(input: {
  movementId: string;
  actorUserId: string;
  reason?: string | null;
}) {
  const movement = await prisma.movement.findUnique({
    where: { id: input.movementId },
  });
  if (
    !movement ||
    movement.type !== MOVEMENT_TYPES.WASTE ||
    movement.status !== WASTE_STATUS.PENDING_APPROVAL
  ) {
    throw new NotFoundError("La merma pendiente no existe.");
  }

  const updated = await prisma.movement.update({
    where: { id: movement.id },
    data: {
      status: WASTE_STATUS.REJECTED,
      resolvedById: input.actorUserId,
      confirmedAt: new Date(),
      notes: input.reason
        ? `${movement.notes ? movement.notes + " · " : ""}Rechazo: ${input.reason}`
        : movement.notes,
    },
  });

  await notify({
    type: "WASTE_REJECTED",
    title: "Merma rechazada",
    body: "El coordinador rechazó una merma de tu centro.",
    centerId: movement.centerId,
    link: "/movimientos",
  }).catch(() => undefined);

  return updated;
}
