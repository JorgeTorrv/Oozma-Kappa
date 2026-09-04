import { ROLES, type Role } from "./constants";
import { ForbiddenError } from "./errors";

/**
 * Matriz central de permisos (spec §41). Evita `if (role === "...")` disperso.
 * Se usa TANTO en la UI (ocultar controles) COMO en el servidor (autorizar).
 * Ocultar un botón NO es autorización: cada acción sensible llama a
 * `assertCan` / `assertCapability` en el servidor.
 */
export const CAPABILITIES = [
  "campaign.create",
  "campaign.update",
  "campaign.toggle",
  "center.create",
  "center.update",
  "center.toggle",
  "article.manage",
  "institution.manage",
  "users.manage",
  "reception.create",
  "delivery.create",
  "delivery.confirm",
  "waste.create",
  "waste.approve",
  "transfer.create",
  "adjustment.create",
  "inventory.global.read",
  "inventory.center.read",
  "inventory.campaign.read",
  "movements.global.read",
  "movements.center.read",
  "movements.campaign.read",
  "dashboard.global.read",
  "dashboard.center.read",
  "dashboard.campaign.read",
  "dashboard.institution.read",
  "goal.manage",
  "notifications.read",
  "traceability.read",
  "export.data",
  "team.manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const COORDINATOR: Capability[] = [
  "campaign.create",
  "campaign.update",
  "campaign.toggle",
  "center.create",
  "center.update",
  "center.toggle",
  "article.manage",
  "institution.manage",
  "users.manage",
  "reception.create",
  "delivery.create",
  "delivery.confirm",
  "waste.create",
  "waste.approve",
  "transfer.create",
  "adjustment.create",
  "inventory.global.read",
  "inventory.center.read",
  "inventory.campaign.read",
  "movements.global.read",
  "movements.center.read",
  "movements.campaign.read",
  "dashboard.global.read",
  "dashboard.center.read",
  "dashboard.campaign.read",
  "goal.manage",
  "notifications.read",
  "traceability.read",
  "export.data",
];

const CENTER_MANAGER: Capability[] = [
  "reception.create",
  "delivery.create",
  "waste.create",
  "transfer.create",
  "adjustment.create",
  "inventory.center.read",
  "movements.center.read",
  "dashboard.center.read",
  "notifications.read",
  "traceability.read",
  "export.data",
  "team.manage",
];

const CENTER_VOLUNTEER: Capability[] = [
  "reception.create",
  "delivery.create",
  "inventory.center.read",
  "movements.center.read",
  "dashboard.center.read",
  "notifications.read",
];

const INSTITUTION: Capability[] = [
  "delivery.confirm",
  "dashboard.institution.read",
  "notifications.read",
];

const CAMPAIGN_LEADER: Capability[] = [
  "inventory.campaign.read",
  "movements.campaign.read",
  "dashboard.campaign.read",
  "goal.manage",
  "notifications.read",
  "traceability.read",
  "export.data",
];

export const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  [ROLES.COORDINADOR_GENERAL]: new Set(COORDINATOR),
  [ROLES.ENCARGADO_CENTRO]: new Set(CENTER_MANAGER),
  [ROLES.VOLUNTARIO_CENTRO]: new Set(CENTER_VOLUNTEER),
  [ROLES.INSTITUCION_RECEPTORA]: new Set(INSTITUTION),
  [ROLES.LIDER_CAMPANA]: new Set(CAMPAIGN_LEADER),
};

export type Principal = {
  id: string;
  role: Role;
  centerId: string | null;
  institutionId: string | null;
  campaignId: string | null;
};

export function can(user: Principal | null | undefined, cap: Capability): boolean {
  if (!user) return false;
  return ROLE_CAPABILITIES[user.role]?.has(cap) ?? false;
}

export function assertCapability(
  user: Principal | null | undefined,
  cap: Capability,
): void {
  if (!can(user, cap)) {
    throw new ForbiddenError();
  }
}

/**
 * Autorización por pertenencia al centro (anti-IDOR). El coordinador pasa
 * siempre; encargado/voluntario sólo sobre su propio centro.
 */
export function canActOnCenter(user: Principal, centerId: string): boolean {
  if (user.role === ROLES.COORDINADOR_GENERAL) return true;
  if (
    user.role === ROLES.ENCARGADO_CENTRO ||
    user.role === ROLES.VOLUNTARIO_CENTRO
  ) {
    return user.centerId === centerId;
  }
  return false;
}

export function assertActOnCenter(user: Principal, centerId: string): void {
  if (!canActOnCenter(user, centerId)) {
    throw new ForbiddenError(
      "No puedes operar sobre un centro que no te corresponde.",
    );
  }
}

/** Acceso de lectura a una campaña concreta. */
export function canReadCampaign(user: Principal, campaignId: string): boolean {
  if (user.role === ROLES.COORDINADOR_GENERAL) return true;
  if (user.role === ROLES.LIDER_CAMPANA) return user.campaignId === campaignId;
  return false;
}

/**
 * Gestión de una cuenta de voluntario:
 *  - El coordinador general gestiona cualquier voluntario.
 *  - El encargado sólo gestiona voluntarios de SU centro.
 */
export function canManageVolunteer(
  actor: Principal,
  volunteer: { role: string; centerId: string | null },
): boolean {
  if (volunteer.role !== ROLES.VOLUNTARIO_CENTRO) return false;
  if (actor.role === ROLES.COORDINADOR_GENERAL) return true;
  if (actor.role === ROLES.ENCARGADO_CENTRO) {
    return actor.centerId != null && actor.centerId === volunteer.centerId;
  }
  return false;
}

export function assertManageVolunteer(
  actor: Principal,
  volunteer: { role: string; centerId: string | null },
): void {
  if (!canManageVolunteer(actor, volunteer)) {
    throw new ForbiddenError(
      "No puedes gestionar esta cuenta de voluntario.",
    );
  }
}
