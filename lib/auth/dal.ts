import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser, type SessionUser } from "./session";
import {
  assertCapability,
  can,
  type Capability,
  type Principal,
} from "@/lib/permissions";
import { type Role } from "@/lib/constants";
import { UnauthenticatedError, ForbiddenError } from "@/lib/errors";

/**
 * Data Access Layer. Centraliza la verificación de sesión y autorización.
 * `cache()` memoiza durante un mismo render/route para no golpear la base varias
 * veces.
 */

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  return getSessionUser();
});

export function toPrincipal(user: SessionUser): Principal {
  return {
    id: user.id,
    role: user.role as Role,
    centerId: user.centerId,
    institutionId: user.institutionId,
    campaignId: user.campaignId,
  };
}

/** Para páginas: redirige a /login si no hay sesión. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Para acciones/route handlers: lanza en vez de redirigir. */
export async function requireUserOrThrow(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export async function requireCapability(
  cap: Capability,
): Promise<{ user: SessionUser; principal: Principal }> {
  const user = await requireUserOrThrow();
  const principal = toPrincipal(user);
  assertCapability(principal, cap);
  return { user, principal };
}

/**
 * Variante para PÁGINAS: si no hay sesión redirige a /login; si falta el permiso
 * muestra la página "no encontrada" (404) en vez de un error 500. La
 * autorización real de las acciones sigue usando `requireCapability` (que lanza).
 */
export async function requireCapabilityPage(
  ...caps: Capability[]
): Promise<{ user: SessionUser; principal: Principal }> {
  const user = await requireUser();
  const principal = toPrincipal(user);
  const allowed = caps.some((c) => can(principal, c));
  if (!allowed) notFound();
  return { user, principal };
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUserOrThrow();
  if (!roles.includes(user.role as Role)) throw new ForbiddenError();
  return user;
}

/**
 * Verificación de origen (mitigación CSRF) para acciones que mutan datos.
 * Los Server Actions de Next sólo aceptan POST, pero comprobamos además que el
 * `Origin`/`Referer` coincida con el `Host`.
 */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin) return; // navegación same-origin sin header Origin (GET); las mutaciones sí lo traen
  try {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      throw new ForbiddenError("Solicitud rechazada por seguridad (origen no válido).");
    }
  } catch {
    throw new ForbiddenError("Solicitud rechazada por seguridad (origen no válido).");
  }
}

export type { SessionUser };
