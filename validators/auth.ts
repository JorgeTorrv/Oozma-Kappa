import { z } from "zod";

/** Normaliza un teléfono a sólo dígitos (para comparaciones consistentes). */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = z.object({
  // El identificador puede ser un correo o un teléfono. Se acota la longitud
  // para no aceptar entradas absurdas ni forzar hashing sobre payloads enormes.
  identifier: z
    .string()
    .trim()
    .min(1, "Escribe tu correo o teléfono.")
    .max(320, "Valor demasiado largo."),
  password: z
    .string()
    .min(1, "Escribe tu contraseña.")
    .max(200, "Contraseña demasiado larga."),
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

export const volunteerRegisterSchema = z.object({
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
  // El teléfono es obligatorio: es el identificador con el que se inicia sesión.
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio.")
    .max(40)
    .refine(
      (v) => normalizePhone(v).length >= 10,
      "El teléfono debe tener al menos 10 dígitos.",
    ),
  // El correo es opcional; si se escribe, debe ser válido.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(160)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || emailRe.test(v), "Correo no válido."),
  centerId: z.string().min(1, "Elige un centro de acopio."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100),
});

export type VolunteerRegisterInput = z.infer<typeof volunteerRegisterSchema>;
