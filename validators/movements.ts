import { z } from "zod";
import { idSchema, optionalText, quantitySchema } from "./common";
import { WASTE_REASONS } from "@/lib/constants";

export const receptionSchema = z.object({
  campaignId: idSchema,
  articleId: idSchema,
  quantity: quantitySchema,
  donorName: optionalText(120),
  donorPhone: optionalText(40),
  donorEmail: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Correo del donante no válido.",
    ),
  notes: optionalText(500),
});

export const deliverySchema = z.object({
  campaignId: idSchema,
  articleId: idSchema,
  recipientInstitutionId: idSchema,
  quantity: quantitySchema,
  notes: optionalText(500),
});

export const wasteSchema = z.object({
  campaignId: idSchema,
  articleId: idSchema,
  quantity: quantitySchema,
  reason: z.enum(WASTE_REASONS, {
    errorMap: () => ({ message: "Selecciona un motivo válido." }),
  }),
  notes: optionalText(500),
});

export const transferSchema = z.object({
  campaignId: idSchema,
  fromCenterId: idSchema,
  toCenterId: idSchema,
  articleId: idSchema,
  quantity: quantitySchema,
  notes: optionalText(500),
});

export const adjustmentSchema = z.object({
  campaignId: idSchema,
  articleId: idSchema,
  direction: z.enum(["POSITIVE", "NEGATIVE"]),
  quantity: quantitySchema,
  reason: z.string().trim().min(3, "El motivo es obligatorio.").max(300),
  notes: optionalText(500),
});

export const confirmDeliverySchema = z.object({ movementId: idSchema });
export const wasteDecisionSchema = z.object({
  movementId: idSchema,
  reason: optionalText(300),
});
