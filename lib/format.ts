import { Prisma } from "@prisma/client";

/** Zona horaria de referencia para la operación (noreste de México). */
export const APP_TIME_ZONE = "America/Mexico_City";

type DecimalLike = Prisma.Decimal | number | string;

export function toDecimal(value: DecimalLike): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

/**
 * Formatea una cantidad para lectura humana en es-MX. Muestra hasta 3 decimales
 * pero sin ceros sobrantes (10.5 kg, no 10.500).
 */
export function formatQuantity(value: DecimalLike): string {
  const d = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
  const n = d.toNumber();
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  }).format(n);
}

export function formatQuantityWithUnit(value: DecimalLike, unit: string): string {
  return `${formatQuantity(value)} ${unit}`;
}

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: APP_TIME_ZONE,
});

const dateTimeFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});

export function formatDate(value: Date | string): string {
  return dateFmt.format(typeof value === "string" ? new Date(value) : value);
}

export function formatDateTime(value: Date | string): string {
  return dateTimeFmt.format(typeof value === "string" ? new Date(value) : value);
}

/** Convierte un `Date` a `YYYY-MM-DD` para inputs `type="date"`. */
export function toDateInputValue(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
