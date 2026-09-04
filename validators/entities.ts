import { z } from "zod";
import { idSchema, optionalText, quantitySchema, requiredText } from "./common";
import { ROLE_LIST } from "@/lib/constants";
import { normalizePhone } from "./auth";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Teléfono obligatorio (identificador de acceso). Se guarda SIEMPRE como sólo
 * dígitos para que dé igual cómo se teclee al iniciar sesión (833-344-1244 y
 * 8333441244 quedan iguales). Al menos 10 dígitos.
 */
const requiredPhone = z
  .string()
  .trim()
  .min(1, "El teléfono es obligatorio.")
  .max(40)
  .transform(normalizePhone)
  .refine((v) => v.length >= 10, "El teléfono debe tener al menos 10 dígitos.");

/** Teléfono opcional, también normalizado a sólo dígitos. */
const optionalPhone = z
  .string()
  .trim()
  .max(40)
  .optional()
  .transform((v) => {
    const d = v ? normalizePhone(v) : "";
    return d.length > 0 ? d : undefined;
  })
  .refine(
    (v) => v === undefined || v.length >= 7,
    "El teléfono no parece válido.",
  );

/** Correo opcional; si se escribe, debe ser válido. */
const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(160)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))
  .refine((v) => v === undefined || emailRe.test(v), "Correo no válido.");

const dateString = z
  .string()
  .trim()
  .min(1, "Fecha requerida.")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Fecha no válida.");

export const campaignSchema = z.object({
  name: requiredText("Nombre", 3, 120),
  description: optionalText(1000),
  startDate: dateString,
  endDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => v === undefined || !Number.isNaN(Date.parse(v)),
      "Fecha de fin no válida.",
    ),
});

export const centerSchema = z.object({
  name: requiredText("Nombre", 3, 120),
  institution: optionalText(160),
  address: optionalText(240),
  phone: optionalPhone,
  latitude: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : undefined))
    .refine(
      (v) => v === undefined || (Number.isFinite(v) && v >= -90 && v <= 90),
      "Latitud fuera de rango.",
    ),
  longitude: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : undefined))
    .refine(
      (v) => v === undefined || (Number.isFinite(v) && v >= -180 && v <= 180),
      "Longitud fuera de rango.",
    ),
});

/** Alta de centro que además registra a su primer encargado (opcional). */
export const centerWithManagerSchema = centerSchema
  .extend({
    managerFirstName: optionalText(80),
    managerLastName: optionalText(80),
    managerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    managerPhone: optionalText(40),
    managerPassword: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
  })
  .superRefine((v, ctx) => {
    const any =
      v.managerFirstName ||
      v.managerLastName ||
      v.managerEmail ||
      v.managerPhone ||
      v.managerPassword;
    if (!any) return;
    if (!v.managerFirstName)
      ctx.addIssue({ code: "custom", path: ["managerFirstName"], message: "Requerido." });
    if (!v.managerLastName)
      ctx.addIssue({ code: "custom", path: ["managerLastName"], message: "Requerido." });
    if (!v.managerPhone || normalizePhone(v.managerPhone).length < 10)
      ctx.addIssue({
        code: "custom",
        path: ["managerPhone"],
        message: "Teléfono obligatorio (mínimo 10 dígitos).",
      });
    if (v.managerEmail && !emailRe.test(v.managerEmail))
      ctx.addIssue({ code: "custom", path: ["managerEmail"], message: "Correo no válido." });
    if (!v.managerPassword || v.managerPassword.length < 8)
      ctx.addIssue({
        code: "custom",
        path: ["managerPassword"],
        message: "Mínimo 8 caracteres.",
      });
  });

export const articleSchema = z.object({
  name: requiredText("Nombre", 2, 120),
  category: requiredText("Categoría", 2, 60),
  unit: requiredText("Unidad", 1, 30),
});

export const institutionSchema = z.object({
  name: requiredText("Nombre", 3, 160),
  contactName: optionalText(120),
  phone: optionalText(40),
  address: optionalText(240),
});

export const userSchema = z.object({
  name: requiredText("Nombre", 3, 120),
  phone: requiredPhone,
  email: optionalEmail,
  role: z.enum(ROLE_LIST as [string, ...string[]]),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100),
  centerId: optionalText(40),
  institutionId: optionalText(40),
  campaignId: optionalText(40),
});

// Al editar: la contraseña y el teléfono no son obligatorios (cuentas antiguas
// pueden no tener teléfono aún).
export const userUpdateSchema = userSchema
  .partial({ password: true, phone: true })
  .extend({ id: idSchema });

export const goalSchema = z
  .object({
    campaignId: idSchema,
    articleId: optionalText(40),
    category: optionalText(60),
    targetQty: quantitySchema,
    unit: requiredText("Unidad", 1, 30),
  })
  .refine((v) => v.articleId || v.category, {
    message: "Indica un artículo o una categoría.",
    path: ["articleId"],
  });

export const toggleSchema = z.object({ id: idSchema });

/** Alta de un líder de campaña desde la propia pantalla de la campaña. */
export const campaignLeaderSchema = z.object({
  firstName: requiredText("Nombre", 2, 80),
  lastName: requiredText("Apellido", 2, 80),
  phone: requiredPhone,
  email: optionalEmail,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100),
});
