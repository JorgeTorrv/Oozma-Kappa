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
