import "server-only";
import { prisma } from "@/lib/db";
import type { Db } from "@/lib/db";

/**
 * Bitácora de acciones administrativas relevantes (spec §36). No sustituye a los
 * `Movement` (que son la trazabilidad de inventario), sino que registra quién
 * creó/editó campañas, centros, usuarios, aprobó mermas, etc.
 */
export async function writeAudit(
  params: {
    actorUserId: string;
    action: string;
    entity: string;
    entityId?: string | null;
    meta?: Record<string, unknown>;
  },
  db: Db = prisma,
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      meta: params.meta ? JSON.stringify(params.meta) : null,
    },
  });
}
