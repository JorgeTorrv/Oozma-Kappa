import { z } from "zod";
import { idSchema, optionalText, quantitySchema, requiredText } from "./common";
import { ROLE_LIST } from "@/lib/constants";

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
  phone: optionalText(40),
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
    if (!v.managerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.managerEmail))
      ctx.addIssue({ code: "custom", path: ["managerEmail"], message: "Correo válido requerido." });
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
  email: z.string().trim().toLowerCase().email("Correo no válido."),
  role: z.enum(ROLE_LIST as [string, ...string[]]),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100),
  centerId: optionalText(40),
  institutionId: optionalText(40),
  campaignId: optionalText(40),
});

export const userUpdateSchema = userSchema
  .partial({ password: true })
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
