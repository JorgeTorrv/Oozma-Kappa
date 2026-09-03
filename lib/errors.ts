/**
 * Errores de dominio. Todos llevan un mensaje ya redactado para el usuario final
 * (en español, sin detalles técnicos). Las capas superiores nunca deben exponer
 * stack traces: convierten estos errores en mensajes y toasts.
 */

export type AppErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY"
  | "RULE_VIOLATION"
  | "RATE_LIMITED"
  | "CONFLICT";

export class AppError extends Error {
  code: AppErrorCode;
  /** Detalles opcionales por campo, para formularios. */
  fieldErrors?: Record<string, string[]>;

  constructor(
    code: AppErrorCode,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Necesitas iniciar sesión para continuar.") {
    super("UNAUTHENTICATED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "El recurso solicitado no existe.") {
    super("NOT_FOUND", message);
  }
}

export class InsufficientStockError extends AppError {
  constructor(
    message = "No existe suficiente inventario para realizar esta operación.",
  ) {
    super("INSUFFICIENT_STOCK", message);
  }
}

export class InvalidQuantityError extends AppError {
  constructor(message = "Cantidad inválida.") {
    super("INVALID_QUANTITY", message);
  }
}

export class RuleViolationError extends AppError {
  constructor(message: string) {
    super("RULE_VIOLATION", message);
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
