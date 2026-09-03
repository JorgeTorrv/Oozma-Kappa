import "server-only";
import { prisma } from "@/lib/db";
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPES,
  type MovementType,
} from "@/lib/constants";

/**
 * Trazabilidad visual de los recursos (diferenciador, spec §20).
 *
 * No es blockchain ni nada exótico: simplemente aprovecha el ledger de
 * `Movement` para reconstruir, en orden cronológico, el recorrido de un artículo
 * dentro de una campaña:
 *
 *   Donación → Centro A → Transferencia → Centro B → Entrega → Institución
 *
 * La vista lo pinta como una línea de tiempo.
 */

export type TraceEvent = {
  id: string;
  type: MovementType;
  typeLabel: string;
  date: Date;
  quantity: string;
  unit: string;
  center: string;
  counterpartCenter: string | null;
  institution: string | null;
  donor: string | null;
  donorAnonymous: boolean;
  actor: string;
  reason: string | null;
  status: string | null;
  transferId: string | null;
};

export async function listTraceableArticles(campaignId: string) {
  const rows = await prisma.movement.findMany({
    where: { campaignId },
    select: { articleId: true, article: { select: { name: true, unit: true } } },
    distinct: ["articleId"],
    orderBy: { article: { name: "asc" } },
  });
  return rows.map((r) => ({
    id: r.articleId,
    name: r.article.name,
    unit: r.article.unit,
  }));
}

export async function getResourceTrace(params: {
  campaignId: string;
  articleId: string;
}): Promise<{
  events: TraceEvent[];
  summary: {
    received: number;
    delivered: number;
    wasted: number;
    transfers: number;
    centersTouched: string[];
    institutionsReached: string[];
  };
}> {
  const movements = await prisma.movement.findMany({
    where: { campaignId: params.campaignId, articleId: params.articleId },
    include: {
      article: { select: { unit: true } },
      center: { select: { name: true } },
      destinationCenter: { select: { name: true } },
      recipientInstitution: { select: { name: true } },
      donor: { select: { name: true } },
      actor: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const events: TraceEvent[] = movements.map((m) => ({
    id: m.id,
    type: m.type as MovementType,
    typeLabel: MOVEMENT_TYPE_LABELS[m.type as MovementType] ?? m.type,
    date: m.createdAt,
    quantity: m.quantity.toString(),
    unit: m.article.unit,
    center: m.center.name,
    counterpartCenter: m.destinationCenter?.name ?? null,
    institution: m.recipientInstitution?.name ?? null,
    donor: m.donor?.name ?? null,
    donorAnonymous: m.type === MOVEMENT_TYPES.RECEPTION && !m.donorId,
    actor: m.actor.name,
    reason: m.reason,
    status: m.status,
    transferId: m.transferId,
  }));

  const centersTouched = [...new Set(events.map((e) => e.center))];
  const institutionsReached = [
    ...new Set(
      events.filter((e) => e.institution).map((e) => e.institution as string),
    ),
  ];

  const sum = (t: MovementType) =>
    movements
      .filter((m) => m.type === t)
      .reduce((s, m) => s + m.quantity.toNumber(), 0);

  return {
    events,
    summary: {
      received: sum(MOVEMENT_TYPES.RECEPTION),
      delivered: sum(MOVEMENT_TYPES.DELIVERY),
      wasted: sum(MOVEMENT_TYPES.WASTE),
      transfers: movements.filter((m) => m.type === MOVEMENT_TYPES.TRANSFER_OUT)
        .length,
      centersTouched,
      institutionsReached,
    },
  };
}

/** Trazabilidad a partir de un movimiento concreto (enlace desde el historial). */
export async function getTraceForMovement(movementId: string) {
  const movement = await prisma.movement.findUnique({
    where: { id: movementId },
    select: { campaignId: true, articleId: true },
  });
  if (!movement) return null;
  return {
    campaignId: movement.campaignId,
    articleId: movement.articleId,
    ...(await getResourceTrace(movement)),
  };
}
