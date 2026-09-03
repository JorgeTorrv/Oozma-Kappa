/**
 * Constantes de dominio. SQLite no soporta enums nativos, así que estos valores
 * son la fuente de verdad para roles, tipos de movimiento y estados. Se validan
 * con Zod en la frontera de cada acción de servidor.
 */

export const ROLES = {
  COORDINADOR_GENERAL: "COORDINADOR_GENERAL",
  ENCARGADO_CENTRO: "ENCARGADO_CENTRO",
  VOLUNTARIO_CENTRO: "VOLUNTARIO_CENTRO",
  INSTITUCION_RECEPTORA: "INSTITUCION_RECEPTORA",
  LIDER_CAMPANA: "LIDER_CAMPANA",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LIST = Object.values(ROLES) as Role[];

export const ROLE_LABELS: Record<Role, string> = {
  COORDINADOR_GENERAL: "Coordinador general",
  ENCARGADO_CENTRO: "Encargado de centro",
  VOLUNTARIO_CENTRO: "Voluntario de centro",
  INSTITUCION_RECEPTORA: "Institución receptora",
  LIDER_CAMPANA: "Líder de campaña",
};

export const MOVEMENT_TYPES = {
  RECEPTION: "RECEPTION",
  DELIVERY: "DELIVERY",
  WASTE: "WASTE",
  TRANSFER_IN: "TRANSFER_IN",
  TRANSFER_OUT: "TRANSFER_OUT",
  ADJUSTMENT_POSITIVE: "ADJUSTMENT_POSITIVE",
  ADJUSTMENT_NEGATIVE: "ADJUSTMENT_NEGATIVE",
} as const;

export type MovementType = (typeof MOVEMENT_TYPES)[keyof typeof MOVEMENT_TYPES];

export const MOVEMENT_TYPE_LIST = Object.values(MOVEMENT_TYPES) as MovementType[];

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  RECEPTION: "Recepción",
  DELIVERY: "Entrega",
  WASTE: "Merma",
  TRANSFER_IN: "Transferencia entrada",
  TRANSFER_OUT: "Transferencia salida",
  ADJUSTMENT_POSITIVE: "Ajuste positivo",
  ADJUSTMENT_NEGATIVE: "Ajuste negativo",
};

/** Movimientos que suman al stock de un centro. */
export const INBOUND_TYPES: MovementType[] = [
  MOVEMENT_TYPES.RECEPTION,
  MOVEMENT_TYPES.TRANSFER_IN,
  MOVEMENT_TYPES.ADJUSTMENT_POSITIVE,
];

/** Movimientos que restan del stock de un centro. */
export const OUTBOUND_TYPES: MovementType[] = [
  MOVEMENT_TYPES.DELIVERY,
  MOVEMENT_TYPES.WASTE,
  MOVEMENT_TYPES.TRANSFER_OUT,
  MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE,
];

export const DELIVERY_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
} as const;
export type DeliveryStatus =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

export const WASTE_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type WasteStatus = (typeof WASTE_STATUS)[keyof typeof WASTE_STATUS];

export const APPROVAL_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type ApprovalStatus =
  (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  PENDING: "Pendiente de aprobación",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export const CREATED_VIA = {
  ADMIN: "ADMIN",
  SELF_REGISTRATION: "SELF_REGISTRATION",
} as const;

export const WASTE_REASONS = [
  "Caducidad",
  "Daño",
  "Pérdida",
  "Otro",
] as const;

/** Lista sugerida y flexible: el catálogo admite otras categorías. */
export const SUGGESTED_CATEGORIES = [
  "Alimentos",
  "Agua",
  "Ropa",
  "Higiene",
  "Limpieza",
  "Medicamentos",
  "Bebés",
  "Otros",
] as const;

export const SUGGESTED_UNITS = [
  "pieza",
  "kg",
  "litro",
  "bolsa",
  "caja",
  "paquete",
] as const;

/**
 * Umbral por defecto para alerta de stock bajo (en unidades del artículo).
 * Es una heurística de demostración; en producción sería configurable por
 * artículo/centro.
 */
export const LOW_STOCK_THRESHOLD = 20;

export const NOTIFICATION_TYPES = {
  RECEPTION_CREATED: "RECEPTION_CREATED",
  WASTE_PENDING: "WASTE_PENDING",
  WASTE_APPROVED: "WASTE_APPROVED",
  WASTE_REJECTED: "WASTE_REJECTED",
  TRANSFER_RECEIVED: "TRANSFER_RECEIVED",
  DELIVERY_PENDING: "DELIVERY_PENDING",
  DELIVERY_CONFIRMED: "DELIVERY_CONFIRMED",
  GOAL_REACHED: "GOAL_REACHED",
  VOLUNTEER_REQUEST: "VOLUNTEER_REQUEST",
  VOLUNTEER_APPROVED: "VOLUNTEER_APPROVED",
  VOLUNTEER_REJECTED: "VOLUNTEER_REJECTED",
} as const;
export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const SESSION_COOKIE = "acopio_session";
/** Duración de sesión: 7 días. Se renueva de forma deslizante en cada request. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
