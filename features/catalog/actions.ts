"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCapability, assertSameOrigin } from "@/lib/auth/dal";
import { parseForm } from "@/lib/validate";
import { ok, runAction, type ActionState } from "@/lib/result";
import { AppError, RuleViolationError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import {
  articleSchema,
  campaignSchema,
  centerSchema,
  goalSchema,
  institutionSchema,
  userSchema,
  userUpdateSchema,
} from "@/validators/entities";
import { ROLES } from "@/lib/constants";

/* ------------------------------------------------------------- Campañas */
export async function createCampaignAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("campaign.create");
    const d = parseForm(campaignSchema, formData);
    const campaign = await prisma.campaign.create({
      data: {
        name: d.name,
        description: d.description ?? null,
        startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "campaign.create",
      entity: "Campaign",
      entityId: campaign.id,
      meta: { name: campaign.name },
    });
    revalidatePath("/campanas");
    return ok({ id: campaign.id }, "Campaña creada.");
  });
}

export async function updateCampaignAction(
  id: string,
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("campaign.update");
    const d = parseForm(campaignSchema, formData);
    await prisma.campaign.update({
      where: { id },
      data: {
        name: d.name,
        description: d.description ?? null,
        startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "campaign.update",
      entity: "Campaign",
      entityId: id,
    });
    revalidatePath("/campanas");
    revalidatePath(`/campanas/${id}`);
    return ok(undefined, "Campaña actualizada.");
  });
}

export async function toggleCampaignAction(id: string): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("campaign.toggle");
    const c = await prisma.campaign.findUnique({ where: { id } });
    if (!c) throw new RuleViolationError("La campaña no existe.");
    await prisma.campaign.update({
      where: { id },
      data: { active: !c.active },
    });
    await writeAudit({
      actorUserId: user.id,
      action: c.active ? "campaign.deactivate" : "campaign.activate",
      entity: "Campaign",
      entityId: id,
    });
    revalidatePath("/campanas");
    return ok(undefined, c.active ? "Campaña desactivada." : "Campaña activada.");
  });
}

/** Vincula o desvincula un centro de una campaña. */
export async function toggleCampaignCenterAction(
  campaignId: string,
  centerId: string,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("campaign.update");
    const existing = await prisma.campaignCenter.findUnique({
      where: { campaignId_centerId: { campaignId, centerId } },
    });
    if (existing) {
      const used = await prisma.movement.count({
        where: { campaignId, centerId },
      });
      if (used > 0) {
        throw new RuleViolationError(
          "No se puede quitar el centro: ya tiene movimientos en esta campaña.",
        );
      }
      await prisma.campaignCenter.delete({ where: { id: existing.id } });
      revalidatePath(`/campanas/${campaignId}`);
      return ok(undefined, "Centro desvinculado de la campaña.");
    }
    await prisma.campaignCenter.create({ data: { campaignId, centerId } });
    revalidatePath(`/campanas/${campaignId}`);
    return ok(undefined, "Centro vinculado a la campaña.");
  });
}

/* -------------------------------------------------------------- Centros */
export async function createCenterAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("center.create");
    const d = parseForm(centerSchema, formData);
    const center = await prisma.center.create({
      data: {
        name: d.name,
        institution: d.institution ?? null,
        address: d.address ?? null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "center.create",
      entity: "Center",
      entityId: center.id,
      meta: { name: center.name },
    });
    revalidatePath("/centros");
    return ok({ id: center.id }, "Centro creado.");
  });
}

export async function updateCenterAction(
  id: string,
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("center.update");
    const d = parseForm(centerSchema, formData);
    await prisma.center.update({
      where: { id },
      data: {
        name: d.name,
        institution: d.institution ?? null,
        address: d.address ?? null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "center.update",
      entity: "Center",
      entityId: id,
    });
    revalidatePath("/centros");
    revalidatePath(`/centros/${id}`);
    return ok(undefined, "Centro actualizado.");
  });
}

export async function toggleCenterAction(id: string): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("center.toggle");
    const c = await prisma.center.findUnique({ where: { id } });
    if (!c) throw new RuleViolationError("El centro no existe.");
    await prisma.center.update({ where: { id }, data: { active: !c.active } });
    await writeAudit({
      actorUserId: user.id,
      action: c.active ? "center.deactivate" : "center.activate",
      entity: "Center",
      entityId: id,
    });
    revalidatePath("/centros");
    return ok(undefined, c.active ? "Centro desactivado." : "Centro activado.");
  });
}

/* ------------------------------------------------------------ Artículos */
export async function createArticleAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("article.manage");
    const d = parseForm(articleSchema, formData);
    const existing = await prisma.article.findUnique({ where: { name: d.name } });
    if (existing) {
      throw new AppError("CONFLICT", "Ya existe un artículo con ese nombre.", {
        name: ["Ya existe un artículo con ese nombre."],
      });
    }
    await prisma.article.create({
      data: { name: d.name, category: d.category, unit: d.unit },
    });
    revalidatePath("/articulos");
    return ok(undefined, "Artículo creado.");
  });
}

export async function toggleArticleAction(id: string): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("article.manage");
    const a = await prisma.article.findUnique({ where: { id } });
    if (!a) throw new RuleViolationError("El artículo no existe.");
    await prisma.article.update({ where: { id }, data: { active: !a.active } });
    revalidatePath("/articulos");
    return ok(undefined, a.active ? "Artículo desactivado." : "Artículo activado.");
  });
}

/* --------------------------------------------------------- Instituciones */
export async function createInstitutionAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("institution.manage");
    const d = parseForm(institutionSchema, formData);
    await prisma.recipientInstitution.create({
      data: {
        name: d.name,
        contactName: d.contactName ?? null,
        phone: d.phone ?? null,
        address: d.address ?? null,
      },
    });
    revalidatePath("/instituciones");
    return ok(undefined, "Institución receptora creada.");
  });
}

export async function toggleInstitutionAction(id: string): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("institution.manage");
    const i = await prisma.recipientInstitution.findUnique({ where: { id } });
    if (!i) throw new RuleViolationError("La institución no existe.");
    await prisma.recipientInstitution.update({
      where: { id },
      data: { active: !i.active },
    });
    revalidatePath("/instituciones");
    return ok(undefined, i.active ? "Institución desactivada." : "Institución activada.");
  });
}

/* ------------------------------------------------------------- Usuarios */
function normalizeRelations(role: string, d: {
  centerId?: string;
  institutionId?: string;
  campaignId?: string;
}) {
  const rel: {
    centerId: string | null;
    institutionId: string | null;
    campaignId: string | null;
  } = { centerId: null, institutionId: null, campaignId: null };
  if (role === ROLES.ENCARGADO_CENTRO || role === ROLES.VOLUNTARIO_CENTRO) {
    if (!d.centerId) throw new RuleViolationError("Este rol requiere un centro.");
    rel.centerId = d.centerId;
  } else if (role === ROLES.INSTITUCION_RECEPTORA) {
    if (!d.institutionId)
      throw new RuleViolationError("Este rol requiere una institución.");
    rel.institutionId = d.institutionId;
  } else if (role === ROLES.LIDER_CAMPANA) {
    if (!d.campaignId)
      throw new RuleViolationError("Este rol requiere una campaña.");
    rel.campaignId = d.campaignId;
  }
  return rel;
}

export async function createUserAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("users.manage");
    const d = parseForm(userSchema, formData);
    const existing = await prisma.user.findUnique({ where: { email: d.email } });
    if (existing) {
      throw new AppError("CONFLICT", "Ya existe un usuario con ese correo.", {
        email: ["Ya existe un usuario con ese correo."],
      });
    }
    const rel = normalizeRelations(d.role, d);
    const created = await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        role: d.role,
        passwordHash: await hashPassword(d.password),
        ...rel,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "users.create",
      entity: "User",
      entityId: created.id,
      meta: { email: created.email, role: created.role },
    });
    revalidatePath("/usuarios");
    return ok(undefined, "Usuario creado.");
  });
}

export async function updateUserAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("users.manage");
    const d = parseForm(userUpdateSchema, formData);
    const rel = normalizeRelations(d.role, d);
    await prisma.user.update({
      where: { id: d.id },
      data: {
        name: d.name,
        email: d.email,
        role: d.role,
        ...rel,
        ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "users.update",
      entity: "User",
      entityId: d.id,
    });
    revalidatePath("/usuarios");
    return ok(undefined, "Usuario actualizado.");
  });
}

export async function toggleUserAction(id: string): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("users.manage");
    if (id === user.id) {
      throw new RuleViolationError("No puedes desactivar tu propia cuenta.");
    }
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) throw new RuleViolationError("El usuario no existe.");
    await prisma.user.update({ where: { id }, data: { active: !u.active } });
    // Al desactivar, invalida sus sesiones.
    if (u.active) await prisma.session.deleteMany({ where: { userId: id } });
    await writeAudit({
      actorUserId: user.id,
      action: u.active ? "users.deactivate" : "users.activate",
      entity: "User",
      entityId: id,
    });
    revalidatePath("/usuarios");
    return ok(undefined, u.active ? "Usuario desactivado." : "Usuario activado.");
  });
}

/* ---------------------------------------------------------------- Metas */
export async function createGoalAction(
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("goal.manage");
    const d = parseForm(goalSchema, formData);
    await prisma.campaignGoal.create({
      data: {
        campaignId: d.campaignId,
        articleId: d.articleId ?? null,
        category: d.articleId ? null : (d.category ?? null),
        targetQty: d.targetQty,
        unit: d.unit,
      },
    });
    revalidatePath(`/campanas/${d.campaignId}`);
    revalidatePath("/campanas");
    return ok(undefined, "Meta agregada.");
  });
}

export async function deleteGoalAction(id: string): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    await requireCapability("goal.manage");
    const goal = await prisma.campaignGoal.findUnique({ where: { id } });
    if (!goal) return ok(undefined, "La meta ya no existe.");
    await prisma.campaignGoal.delete({ where: { id } });
    revalidatePath(`/campanas/${goal.campaignId}`);
    return ok(undefined, "Meta eliminada.");
  });
}
