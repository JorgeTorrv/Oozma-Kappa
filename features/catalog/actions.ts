"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  requireCapability,
  requireUserOrThrow,
  toPrincipal,
  assertSameOrigin,
} from "@/lib/auth/dal";
import { parseForm } from "@/lib/validate";
import { ok, runAction, type ActionState } from "@/lib/result";
import { AppError, ForbiddenError, RuleViolationError } from "@/lib/errors";
import { writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import {
  articleSchema,
  campaignLeaderSchema,
  campaignSchema,
  centerSchema,
  centerWithManagerSchema,
  goalSchema,
  institutionSchema,
  userSchema,
  userUpdateSchema,
} from "@/validators/entities";
import { APPROVAL_STATUS, CREATED_VIA, ROLES } from "@/lib/constants";
import { notify } from "@/services/notification.service";
import { assertManageVolunteer, can } from "@/lib/permissions";
import { normalizePhone } from "@/validators/auth";

/**
 * Verifica que el correo (si se da) y el teléfono no estén ya en uso por otra
 * cuenta. El teléfono se compara normalizado (sólo dígitos).
 */
async function assertContactAvailable(opts: {
  email?: string | null;
  phone?: string | null;
  excludeUserId?: string;
}): Promise<void> {
  if (opts.email) {
    const hit = await prisma.user.findUnique({ where: { email: opts.email } });
    if (hit && hit.id !== opts.excludeUserId) {
      throw new AppError("CONFLICT", "Ya existe un usuario con ese correo.", {
        email: ["Ya existe un usuario con ese correo."],
      });
    }
  }
  if (opts.phone) {
    const target = normalizePhone(opts.phone);
    const all = await prisma.user.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });
    const clash = all.find(
      (u) => u.phone && normalizePhone(u.phone) === target,
    );
    if (clash && clash.id !== opts.excludeUserId) {
      throw new AppError("CONFLICT", "Ya existe un usuario con ese teléfono.", {
        phone: ["Ya existe un usuario con ese teléfono."],
      });
    }
  }
}

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
    const d = parseForm(centerWithManagerSchema, formData);

    const wantsManager = Boolean(d.managerPhone && d.managerPassword);
    if (wantsManager) {
      await assertContactAvailable({
        email: d.managerEmail,
        phone: d.managerPhone,
      });
    }
    const managerHash = wantsManager
      ? await hashPassword(d.managerPassword as string)
      : null;

    const center = await prisma.$transaction(async (tx) => {
      const c = await tx.center.create({
        data: {
          name: d.name,
          institution: d.institution ?? null,
          address: d.address ?? null,
          phone: d.phone ?? null,
          latitude: d.latitude ?? null,
          longitude: d.longitude ?? null,
        },
      });
      if (wantsManager) {
        await tx.user.create({
          data: {
            name: `${d.managerFirstName} ${d.managerLastName}`,
            firstName: d.managerFirstName,
            lastName: d.managerLastName,
            email: d.managerEmail ?? null,
            phone: d.managerPhone ? normalizePhone(d.managerPhone) : null,
            passwordHash: managerHash as string,
            role: ROLES.ENCARGADO_CENTRO,
            centerId: c.id,
            active: true,
            approvalStatus: APPROVAL_STATUS.APPROVED,
            createdVia: CREATED_VIA.ADMIN,
            approvedById: user.id,
          },
        });
      }
      return c;
    });

    await writeAudit({
      actorUserId: user.id,
      action: "center.create",
      entity: "Center",
      entityId: center.id,
      meta: { name: center.name, withManager: wantsManager },
    });
    revalidatePath("/centros");
    revalidatePath("/usuarios");
    return ok(
      { id: center.id },
      wantsManager
        ? "Centro creado y encargado registrado."
        : "Centro creado.",
    );
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
        phone: d.phone ?? null,
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
    await assertContactAvailable({ email: d.email, phone: d.phone });
    const rel = normalizeRelations(d.role, d);
    const created = await prisma.user.create({
      data: {
        name: d.name,
        phone: d.phone,
        email: d.email ?? null,
        role: d.role,
        passwordHash: await hashPassword(d.password),
        approvalStatus: APPROVAL_STATUS.APPROVED,
        createdVia: CREATED_VIA.ADMIN,
        approvedById: user.id,
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
    await assertContactAvailable({
      email: d.email,
      phone: d.phone,
      excludeUserId: d.id,
    });
    const rel = normalizeRelations(d.role, d);
    await prisma.user.update({
      where: { id: d.id },
      data: {
        name: d.name,
        email: d.email ?? null,
        ...(d.phone ? { phone: d.phone } : {}),
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
    if (u.centerId) revalidatePath(`/centros/${u.centerId}`);
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

/* --------------------------------------------------- Equipo de voluntarios */
async function requireVolunteerManager() {
  await assertSameOrigin();
  const actor = await requireUserOrThrow();
  const principal = toPrincipal(actor);
  if (!can(principal, "team.manage") && !can(principal, "users.manage")) {
    throw new ForbiddenError();
  }
  return { actor, principal };
}

export async function approveVolunteerAction(
  userId: string,
): Promise<ActionState> {
  return runAction(async () => {
    const { actor, principal } = await requireVolunteerManager();
    const volunteer = await prisma.user.findUnique({ where: { id: userId } });
    if (!volunteer) throw new RuleViolationError("La cuenta no existe.");
    assertManageVolunteer(principal, volunteer);
    if (volunteer.approvalStatus === APPROVAL_STATUS.APPROVED && volunteer.active) {
      return ok(undefined, "La cuenta ya estaba activa.");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: APPROVAL_STATUS.APPROVED,
        active: true,
        approvedById: actor.id,
      },
    });
    await writeAudit({
      actorUserId: actor.id,
      action: "volunteer.approve",
      entity: "User",
      entityId: userId,
    });
    await notify({
      type: "VOLUNTEER_APPROVED",
      title: "Tu cuenta de voluntario fue aprobada",
      body: "Ya puedes iniciar sesión y registrar movimientos.",
      userId,
      link: "/inicio",
    }).catch(() => undefined);

    revalidatePath("/mi-equipo");
    revalidatePath("/solicitudes");
    revalidatePath("/usuarios");
    if (volunteer.centerId) revalidatePath(`/centros/${volunteer.centerId}`);
    return ok(undefined, "Voluntario aprobado.");
  });
}

export async function rejectVolunteerAction(
  userId: string,
): Promise<ActionState> {
  return runAction(async () => {
    const { actor, principal } = await requireVolunteerManager();
    const volunteer = await prisma.user.findUnique({ where: { id: userId } });
    if (!volunteer) throw new RuleViolationError("La cuenta no existe.");
    assertManageVolunteer(principal, volunteer);

    await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: APPROVAL_STATUS.REJECTED,
        active: false,
        approvedById: actor.id,
      },
    });
    await prisma.session.deleteMany({ where: { userId } });
    await writeAudit({
      actorUserId: actor.id,
      action: "volunteer.reject",
      entity: "User",
      entityId: userId,
    });
    await notify({
      type: "VOLUNTEER_REJECTED",
      title: "Tu solicitud de voluntariado fue rechazada",
      body: "Contacta al encargado del centro si crees que es un error.",
      userId,
    }).catch(() => undefined);

    revalidatePath("/mi-equipo");
    revalidatePath("/solicitudes");
    revalidatePath("/usuarios");
    if (volunteer.centerId) revalidatePath(`/centros/${volunteer.centerId}`);
    return ok(undefined, "Solicitud rechazada.");
  });
}

export async function toggleVolunteerActiveAction(
  userId: string,
): Promise<ActionState> {
  return runAction(async () => {
    const { actor, principal } = await requireVolunteerManager();
    const volunteer = await prisma.user.findUnique({ where: { id: userId } });
    if (!volunteer) throw new RuleViolationError("La cuenta no existe.");
    assertManageVolunteer(principal, volunteer);

    const next = !volunteer.active;
    await prisma.user.update({
      where: { id: userId },
      data: { active: next },
    });
    if (!next) await prisma.session.deleteMany({ where: { userId } });
    await writeAudit({
      actorUserId: actor.id,
      action: next ? "volunteer.activate" : "volunteer.deactivate",
      entity: "User",
      entityId: userId,
    });
    revalidatePath("/mi-equipo");
    revalidatePath("/usuarios");
    if (volunteer.centerId) revalidatePath(`/centros/${volunteer.centerId}`);
    return ok(undefined, next ? "Voluntario reactivado." : "Voluntario desactivado.");
  });
}

/* ------------------------------------------------ Líderes de campaña */
export async function addCampaignLeaderAction(
  campaignId: string,
  _p: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("users.manage");
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new RuleViolationError("La campaña no existe.");

    const d = parseForm(campaignLeaderSchema, formData);
    await assertContactAvailable({ email: d.email, phone: d.phone });

    const created = await prisma.user.create({
      data: {
        name: `${d.firstName} ${d.lastName}`,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email ?? null,
        phone: d.phone,
        passwordHash: await hashPassword(d.password),
        role: ROLES.LIDER_CAMPANA,
        campaignId,
        active: true,
        approvalStatus: APPROVAL_STATUS.APPROVED,
        createdVia: CREATED_VIA.ADMIN,
        approvedById: user.id,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "campaign.leader.add",
      entity: "User",
      entityId: created.id,
      meta: { campaignId, email: created.email },
    });
    revalidatePath(`/campanas/${campaignId}`);
    revalidatePath("/usuarios");
    return ok(undefined, "Líder de campaña creado y asignado.");
  });
}

export async function assignCampaignLeaderAction(
  campaignId: string,
  userId: string,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("users.manage");
    const [campaign, target] = await Promise.all([
      prisma.campaign.findUnique({ where: { id: campaignId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!campaign) throw new RuleViolationError("La campaña no existe.");
    if (!target) throw new RuleViolationError("El usuario no existe.");

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: ROLES.LIDER_CAMPANA,
        campaignId,
        centerId: null,
        institutionId: null,
        active: true,
        approvalStatus: APPROVAL_STATUS.APPROVED,
      },
    });
    await writeAudit({
      actorUserId: user.id,
      action: "campaign.leader.assign",
      entity: "User",
      entityId: userId,
      meta: { campaignId },
    });
    revalidatePath(`/campanas/${campaignId}`);
    revalidatePath("/usuarios");
    return ok(undefined, "Líder asignado a la campaña.");
  });
}

export async function removeCampaignLeaderAction(
  userId: string,
): Promise<ActionState> {
  return runAction(async () => {
    await assertSameOrigin();
    const { user } = await requireCapability("users.manage");
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.role !== ROLES.LIDER_CAMPANA) {
      throw new RuleViolationError("Ese usuario no es líder de campaña.");
    }
    const campaignId = target.campaignId;
    await prisma.user.update({
      where: { id: userId },
      data: { campaignId: null, active: false },
    });
    await prisma.session.deleteMany({ where: { userId } });
    await writeAudit({
      actorUserId: user.id,
      action: "campaign.leader.remove",
      entity: "User",
      entityId: userId,
      meta: { campaignId },
    });
    if (campaignId) revalidatePath(`/campanas/${campaignId}`);
    revalidatePath("/usuarios");
    return ok(
      undefined,
      "Líder retirado de la campaña. La cuenta quedó desactivada.",
    );
  });
}
