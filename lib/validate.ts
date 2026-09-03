import type { z } from "zod";
import { AppError } from "./errors";

/**
 * Valida un `FormData` contra un esquema Zod. Lanza `AppError("VALIDATION")` con
 * los errores por campo, que `runAction` convierte en un `ActionState` seguro.
 */
export function parseForm<S extends z.ZodTypeAny>(
  schema: S,
  formData: FormData,
): z.infer<S> {
  const raw: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") raw[k] = v;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const flat = result.error.flatten();
    throw new AppError(
      "VALIDATION",
      "Revisa los datos del formulario.",
      flat.fieldErrors as Record<string, string[]>,
    );
  }
  return result.data;
}
