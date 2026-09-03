import { isAppError } from "./errors";

/**
 * Resultado uniforme para acciones de servidor (Server Actions). Se usa con
 * `useActionState` en el cliente: nunca lanza al usuario un stack trace.
 */
export type ActionState<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | {
      ok: false;
      message: string;
      code?: string;
      fieldErrors?: Record<string, string[]>;
    };

export function ok<T>(data?: T, message?: string): ActionState<T> {
  return { ok: true, data, message };
}

export function fail(
  message: string,
  fieldErrors?: Record<string, string[]>,
  code?: string,
): ActionState<never> {
  return { ok: false, message, fieldErrors, code };
}

/**
 * Envuelve la lógica de una acción y traduce cualquier excepción a un
 * `ActionState` seguro. Los errores no controlados se registran en el servidor
 * pero al usuario sólo se le muestra un mensaje genérico.
 */
export async function runAction<T>(
  fn: () => Promise<ActionState<T>>,
): Promise<ActionState<T>> {
  try {
    return await fn();
  } catch (e) {
    // `redirect()` y `notFound()` de Next lanzan errores de control de flujo
    // que deben propagarse.
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      typeof (e as { digest: unknown }).digest === "string" &&
      ((e as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (e as { digest: string }).digest === "NEXT_NOT_FOUND")
    ) {
      throw e;
    }
    if (isAppError(e)) {
      return { ok: false, message: e.message, code: e.code, fieldErrors: e.fieldErrors };
    }
    console.error("[runAction] error no controlado:", e);
    return {
      ok: false,
      message: "Ocurrió un error inesperado. Intenta de nuevo.",
      code: "UNKNOWN",
    };
  }
}
