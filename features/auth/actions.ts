"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { parseForm } from "@/lib/validate";
import { loginSchema } from "@/validators/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { checkLoginRateLimit, resetLoginRateLimit } from "@/lib/rate-limit";
import { fail, ok, runAction, type ActionState } from "@/lib/result";
import { AppError } from "@/lib/errors";

export async function loginAction(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const result = await runAction(async () => {
    const { email, password } = parseForm(loginSchema, formData);

    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rl = checkLoginRateLimit(`${ip}:${email}`);
    if (!rl.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        `Demasiados intentos. Espera ${Math.ceil(rl.retryAfterSec / 60)} min e inténtalo de nuevo.`,
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Mensaje genérico: no revela si el correo existe.
    const invalid = fail("Correo o contraseña incorrectos.");
    if (!user || !user.active) return invalid;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return invalid;

    resetLoginRateLimit(`${ip}:${email}`);
    await createSession(user.id);
    return ok(undefined, "Sesión iniciada.");
  });

  if (result.ok) redirect("/");
  return result;
}

export async function logoutAction(): Promise<never> {
  await destroySession();
  redirect("/login");
}
