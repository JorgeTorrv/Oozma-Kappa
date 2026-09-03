import { z } from "zod";

/** Normaliza un teléfono a sólo dígitos (para comparaciones consistentes). */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = z.object({
  // El identificador puede ser un correo o un teléfono.
  identifier: z.string().trim().min(1, "Escribe tu correo o teléfono."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Decide si el identificador es correo o teléfono y lo normaliza. */
export function parseIdentifier(
  identifier: string,
): { kind: "email"; value: string } | { kind: "phone"; value: string } {
  const trimmed = identifier.trim();
  if (emailRe.test(trimmed)) {
    return { kind: "email", value: trimmed.toLowerCase() };
  }
  return { kind: "phone", value: normalizePhone(trimmed) };
}

/* ─────────────────────────────── Auto-registro de voluntario ───────────── */

export const volunteerRegisterSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Escribe tu nombre.")
      .max(80, "Nombre demasiado largo."),
    lastName: z
      .string()
      .trim()
      .min(1, "Escribe tu apellido.")
      .max(80, "Apellido demasiado largo."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .refine((v) => v === undefined || emailRe.test(v), "Correo no válido."),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .refine(
        (v) => v === undefined || normalizePhone(v).length >= 10,
        "El teléfono debe tener al menos 10 dígitos.",
      ),
    centerId: z.string().min(1, "Elige un centro de acopio."),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(100),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.phone), {
    message: "Deja al menos un dato de contacto: teléfono o correo.",
    path: ["phone"],
  });

export type VolunteerRegisterInput = z.infer<typeof volunteerRegisterSchema>;
