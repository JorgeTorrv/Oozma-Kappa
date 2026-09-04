"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { parseForm } from "@/lib/validate";
import {
  loginSchema,
  parseIdentifier,
  volunteerRegisterSchema,
  normalizePhone,
} from "@/validators/auth";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { fail, ok, runAction, type ActionState } from "@/lib/result";
import { AppError } from "@/lib/errors";
import { APPROVAL_STATUS, CREATED_VIA, ROLES } from "@/lib/constants";
import { notify } from "@/services/notification.service";
import { assertSameOrigin } from "@/lib/auth/dal";

// Hash bcrypt "de relleno" (contraseña aleatoria). Se compara contra él cuando
// el usuario no existe para que el tiempo de respuesta no delate si el
// correo/teléfono está registrado (defensa ante enumeración por temporización).
const DUMMY_HASH =
  "$2a$12$abcdefghijklmnopqrstuuWn8Vh2m0aQ9r3s4t5u6v7w8x9y0z1A2B";

export async function loginAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const result = await runAction(async () => {
    // Consultas parametrizadas vía Prisma (sin SQL crudo) → inmune a SQL
    // injection; además validamos y acotamos la entrada con Zod, comprobamos el
    // origen (CSRF) y limitamos la tasa de intentos.
    await assertSameOrigin();
    const { identifier, password } = parseForm(loginSchema, formData);

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

    // Doble límite: por (IP + identificador) y por IP sola (evita "spray").
    const rlPair = checkLoginRateLimit(`login:${ip}:${identifier}`, 8);
    const rlIp = checkLoginRateLimit(`login-ip:${ip}`, 40);
    if (!rlPair.allowed || !rlIp.allowed) {
      const wait = Math.max(rlPair.retryAfterSec, rlIp.retryAfterSec);
      throw new AppError(
        "RATE_LIMITED",
        `Demasiados intentos. Espera ${Math.ceil(wait / 60)} min e inténtalo de nuevo.`,
      );
    }

    const id = parseIdentifier(identifier);

    let matched = null;
    if (id.kind === "email") {
      matched = await prisma.user.findUnique({ where: { email: id.value } });
    } else {
      // El teléfono se guarda con el formato que escribió el usuario; se
      // compara normalizado (sólo dígitos).
      const candidates = await prisma.user.findMany({
        where: { phone: { not: null } },
        select: { id: true, phone: true },
      });
      const hit = candidates.find(
        (c) => c.phone && normalizePhone(c.phone) === id.value,
      );
      if (hit) {
        matched = await prisma.user.findUnique({ where: { id: hit.id } });
      }
    }

    const invalid = fail("Correo/teléfono o contraseña incorrectos.");
    if (!matched) {
      // Igualar el coste de tiempo con el camino "usuario existe".
      await verifyPassword(password, DUMMY_HASH);
      return invalid;
    }

    const valid = await verifyPassword(password, matched.passwordHash);
    if (!valid) return invalid;

    if (matched.approvalStatus === APPROVAL_STATUS.PENDING) {
      return fail(
        "Tu cuenta está pendiente de aprobación por el encargado del centro.",
      );
    }
    if (matched.approvalStatus === APPROVAL_STATUS.REJECTED) {
      return fail("Tu solicitud de voluntariado fue rechazada.");
    }
    if (!matched.active) {
      return fail("Tu cuenta está desactivada. Contacta al encargado.");
    }

    resetLoginRateLimit(`login:${ip}:${identifier}`);
    resetLoginRateLimit(`login-ip:${ip}`);
    await createSession(matched.id);
    return ok(undefined, "Sesión iniciada.");
  });

  if (result.ok) redirect("/inicio");
  return result;
}

export async function logoutAction(): Promise<never> {
  await destroySession();
  redirect("/login");
}

/**
 * Auto-registro público como voluntario. La cuenta nace INACTIVA y
 * PENDING: un encargado (o el coordinador) de ese centro debe aprobarla.
 */
export async function registerVolunteerAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const result = await runAction(async () => {
    await assertSameOrigin();
    const d = parseForm(volunteerRegisterSchema, formData);

    const center = await prisma.center.findUnique({
      where: { id: d.centerId },
    });
    if (!center || !center.active) {
      return fail("El centro seleccionado no está disponible.");
    }

    const phoneNorm = d.phone ? normalizePhone(d.phone) : null;

    // Unicidad de correo / teléfono.
    if (d.email) {
      const exists = await prisma.user.findUnique({ where: { email: d.email } });
      if (exists) {
        throw new AppError("CONFLICT", "Ese correo ya está registrado.", {
          email: ["Ese correo ya está registrado."],
        });
      }
    }
    if (phoneNorm) {
      const all = await prisma.user.findMany({
        where: { phone: { not: null } },
        select: { phone: true },
      });
      if (all.some((u) => u.phone && normalizePhone(u.phone) === phoneNorm)) {
        throw new AppError("CONFLICT", "Ese teléfono ya está registrado.", {
          phone: ["Ese teléfono ya está registrado."],
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        name: `${d.firstName} ${d.lastName}`,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email ?? null,
        phone: d.phone ?? null,
        passwordHash: await hashPassword(d.password),
        role: ROLES.VOLUNTARIO_CENTRO,
        centerId: d.centerId,
        active: false,
        approvalStatus: APPROVAL_STATUS.PENDING,
        createdVia: CREATED_VIA.SELF_REGISTRATION,
      },
    });

    await notify({
      type: "VOLUNTEER_REQUEST",
      title: "Nueva solicitud de voluntariado",
      body: `${user.name} quiere unirse a ${center.name}.`,
      centerId: center.id,
      link: "/mi-equipo",
    }).catch(() => undefined);
    await notify({
      type: "VOLUNTEER_REQUEST",
      title: "Nueva solicitud de voluntariado",
      body: `${user.name} solicitó unirse a ${center.name}.`,
      role: ROLES.COORDINADOR_GENERAL,
      link: "/solicitudes",
    }).catch(() => undefined);

    return ok(undefined, "registered");
  });

  if (result.ok) redirect("/login?registrado=1");
  return result;
}
