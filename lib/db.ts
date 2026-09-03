import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma como singleton. En desarrollo Next.js recarga los módulos con
 * frecuencia; sin el singleton se abrirían decenas de conexiones a SQLite.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Tipo del cliente transaccional que recibe `prisma.$transaction(fn)`. */
export type PrismaTx = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/** Cliente utilizable tanto dentro como fuera de una transacción. */
export type Db = PrismaClient | PrismaTx;
