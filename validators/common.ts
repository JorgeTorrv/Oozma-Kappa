import { z } from "zod";

export const idSchema = z.string().min(1, "Identificador requerido.");

/**
 * Cantidad como cadena para no perder precisión (unidades tipo kg). Debe ser un
 * número positivo, finito, con hasta 3 decimales. Rechaza NaN/Infinity/0/negativos.
 */
export const quantitySchema = z
  .string()
  .trim()
  .min(1, "Cantidad requerida.")
  .transform((v) => v.replace(",", "."))
  .refine((v) => /^\d+(\.\d{1,3})?$/.test(v), {
    message: "Cantidad inválida. Usa un número con hasta 3 decimales.",
  })
  .refine((v) => Number(v) > 0, { message: "La cantidad debe ser mayor que cero." });

export const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const requiredText = (label: string, min = 2, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label}: mínimo ${min} caracteres.`)
    .max(max, `${label}: máximo ${max} caracteres.`);

/** Convierte un `FormData` a objeto plano (strings). */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}
