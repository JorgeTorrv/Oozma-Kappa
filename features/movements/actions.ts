"use server";

import { revalidatePath } from "next/cache";
import { requireCapability, assertSameOrigin } from "@/lib/auth/dal";
import { assertActOnCenter } from "@/lib/permissions";
import { parseForm } from "@/lib/validate";
import { ok, runAction, type ActionState } from "@/lib/result";
import { RuleViolationError } from "@/lib/errors";
import {
  adjustmentSchema,
  confirmDeliverySchema,
  deliverySchema,
  receptionSchema,
  transferSchema,
  wasteDecisionSchema,
  wasteSchema,
} from "@/validators/movements";
import { adjustInventory } from "@/services/inventory.service";
import {
  approveWaste,
  confirmDelivery,
  registerDelivery,
  registerReception,
  registerWaste,
  rejectWaste,
} from "@/services/movements.service";
import { executeTransfer } from "@/services/transfer.service";
import { writeAudit } from "@/lib/audit";

/** Devuelve el centro sobre el que opera el usuario (el suyo, o el del form si es coordinador). */
async function resolveOperatingCenter(
  user: { role: string; centerId: string | null },
  formCenterId?: string | null,
): Promise<string> {
  if (user.centerId) return user.centerId;
  if (formCenterId) return formCenterId;
  throw new RuleViolationError("Selecciona un centro.");
}

export async function createReceptionAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user, principal } = await requireCapability("reception.create");
    const data = parseForm(receptionSchema, formData);
    const centerId = await resolveOperatingCenter(
      user,
      formData.get("centerId") as string | null,
    );
    assertActOnCenter(principal, centerId);

    await registerReception({
      centerId,
      campaignId: data.campaignId,
      articleId: data.articleId,
      quantity: data.quantity,
      actorUserId: user.id,
      donor: {
        name: data.donorName ?? null,
        phone: data.donorPhone ?? null,
        email: data.donorEmail ?? null,
      },
      notes: data.notes ?? null,
    });

    revalidatePath("/movimientos");
    revalidatePath("/inventario");
    revalidatePath("/");
    return ok(undefined, "Recepción registrada. El inventario se actualizó.");
  });
}

export async function createDeliveryAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user, principal } = await requireCapability("delivery.create");
    const data = parseForm(deliverySchema, formData);
    const centerId = await resolveOperatingCenter(
      user,
      formData.get("centerId") as string | null,
    );
    assertActOnCenter(principal, centerId);

    await registerDelivery({
      centerId,
      campaignId: data.campaignId,
      articleId: data.articleId,
      quantity: data.quantity,
      actorUserId: user.id,
      recipientInstitutionId: data.recipientInstitutionId,
      notes: data.notes ?? null,
    });

    revalidatePath("/movimientos");
    revalidatePath("/inventario");
    revalidatePath("/institucion");
    revalidatePath("/");
    return ok(undefined, "Entrega registrada. El inventario disminuyó.");
  });
}

export async function createWasteAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user, principal } = await requireCapability("waste.create");
    const data = parseForm(wasteSchema, formData);
    const centerId = await resolveOperatingCenter(
      user,
      formData.get("centerId") as string | null,
    );
    assertActOnCenter(principal, centerId);

    const res = await registerWaste({
      centerId,
      campaignId: data.campaignId,
      articleId: data.articleId,
      quantity: data.quantity,
      actorUserId: user.id,
      reason: data.reason,
      notes: data.notes ?? null,
    });

    revalidatePath("/mermas");
    revalidatePath("/movimientos");
    revalidatePath("/inventario");
    revalidatePath("/");
    return ok(
      res,
      res.pending
        ? "Merma registrada. Queda pendiente de aprobación del coordinador."
        : "Merma registrada. El inventario disminuyó.",
    );
  });
}

export async function createTransferAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user, principal } = await requireCapability("transfer.create");
    const data = parseForm(transferSchema, formData);

    // El origen debe ser el centro del usuario (salvo coordinador).
    if (user.centerId && data.fromCenterId !== user.centerId) {
      throw new RuleViolationError(
        "Sólo puedes transferir desde tu propio centro.",
      );
    }
    assertActOnCenter(principal, data.fromCenterId);

    const transfer = await executeTransfer({
      campaignId: data.campaignId,
      fromCenterId: data.fromCenterId,
      toCenterId: data.toCenterId,
      articleId: data.articleId,
      quantity: data.quantity,
      actorUserId: user.id,
      notes: data.notes ?? null,
    });

    revalidatePath("/movimientos");
    revalidatePath("/inventario");
    revalidatePath("/trazabilidad");
    revalidatePath("/");
    return ok(
      { transferId: transfer.id },
      "Transferencia completada. Origen disminuyó y destino aumentó.",
    );
  });
}

export async function createAdjustmentAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user, principal } = await requireCapability("adjustment.create");
    const data = parseForm(adjustmentSchema, formData);
    const centerId = await resolveOperatingCenter(
      user,
      formData.get("centerId") as string | null,
    );
    assertActOnCenter(principal, centerId);

    await adjustInventory({
      direction: data.direction,
      quantity: data.quantity,
      centerId,
      campaignId: data.campaignId,
      articleId: data.articleId,
      actorUserId: user.id,
      reason: data.reason,
      notes: data.notes ?? null,
    });

    revalidatePath("/movimientos");
    revalidatePath("/inventario");
    revalidatePath("/");
    return ok(undefined, "Ajuste aplicado. Queda registrado en el historial.");
  });
}

/* ------------------------------------------------ Institución: confirmar */
export async function confirmDeliveryAction(
  movementId: string,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("delivery.confirm");
    const { movementId: id } = confirmDeliverySchema.parse({ movementId });
    if (!user.institutionId) {
      throw new RuleViolationError(
        "Tu cuenta no está asociada a una institución receptora.",
      );
    }
    await confirmDelivery({
      movementId: id,
      actorUserId: user.id,
      institutionId: user.institutionId,
    });
    revalidatePath("/institucion");
    revalidatePath("/movimientos");
    revalidatePath("/");
    return ok(undefined, "Entrega confirmada como recibida.");
  });
}

/* ------------------------------------------------ Coordinador: aprobar merma */
export async function approveWasteAction(
  movementId: string,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("waste.approve");
    const { movementId: id } = wasteDecisionSchema.parse({ movementId });
    await approveWaste({ movementId: id, actorUserId: user.id });
    await writeAudit({
      actorUserId: user.id,
      action: "waste.approve",
      entity: "Movement",
      entityId: id,
    });
    revalidatePath("/mermas");
    revalidatePath("/movimientos");
    revalidatePath("/inventario");
    revalidatePath("/");
    return ok(undefined, "Merma aprobada. El inventario disminuyó.");
  });
}

export async function rejectWasteAction(
  movementId: string,
  reason?: string,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("waste.approve");
    const parsed = wasteDecisionSchema.parse({ movementId, reason });
    await rejectWaste({
      movementId: parsed.movementId,
      actorUserId: user.id,
      reason: parsed.reason ?? null,
    });
    await writeAudit({
      actorUserId: user.id,
      action: "waste.reject",
      entity: "Movement",
      entityId: parsed.movementId,
    });
    revalidatePath("/mermas");
    revalidatePath("/movimientos");
    revalidatePath("/");
    return ok(undefined, "Merma rechazada. El inventario no se modificó.");
  });
}
