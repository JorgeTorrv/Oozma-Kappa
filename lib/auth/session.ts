import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/constants";

/**
 * Sesiones de servidor con token opaco.
 *
 * - La cookie contiene únicamente un token aleatorio de 256 bits (base64url).
 * - En la base se guarda sólo `sha256(token)`. Un volcado de la tabla `Session`
 *   no permite reconstruir un token válido.
 * - La sesión se puede revocar al instante borrando la fila.
 * - Expiración deslizante: se renueva en cada verificación cuando pasa de la
 *   mitad de su vida.
 */

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<void> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  store.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  centerId: string | null;
  institutionId: string | null;
  campaignId: string | null;
};

/**
 * Resuelve la sesión actual contra la base (comprobación segura). Devuelve el
 * usuario sin `passwordHash`. Limpia sesiones caducadas.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          centerId: true,
          institutionId: true,
          campaignId: true,
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) {
      await prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => undefined);
    }
    return null;
  }

  if (!session.user.active) return null;

  // Expiración deslizante.
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining < SESSION_TTL_MS / 2) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session
      .update({ where: { id: session.id }, data: { expiresAt } })
      .catch(() => undefined);
  }

  return session.user;
}

/** Borra todas las sesiones caducadas (mantenimiento; se llama desde el seed). */
export async function purgeExpiredSessions(): Promise<number> {
  const res = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return res.count;
}
