import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MOVEMENT_TYPES } from "@/lib/constants";
import { notify } from "@/services/notification.service";

/**
 * Metas de recolección por campaña (extra, spec §19). El "actual" de una meta se
 * mide como el total RECIBIDO (suma de RECEPTION) del artículo o categoría en la
 * campaña — no el stock disponible, para que las salidas no bajen el progreso.
 */
export type GoalProgress = {
  id: string;
  label: string;
  unit: string;
  target: number;
  current: number;
  percent: number;
  reached: boolean;
};

async function receivedTotal(
  campaignId: string,
  opts: { articleId?: string | null; category?: string | null },
): Promise<Prisma.Decimal> {
  const where: Prisma.MovementWhereInput = {
    campaignId,
    type: MOVEMENT_TYPES.RECEPTION,
  };
  if (opts.articleId) where.articleId = opts.articleId;
  if (opts.category) where.article = { category: opts.category };

  const agg = await prisma.movement.aggregate({
    where,
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? new Prisma.Decimal(0);
}

export async function getCampaignGoalProgress(
  campaignId: string,
): Promise<GoalProgress[]> {
  const goals = await prisma.campaignGoal.findMany({
    where: { campaignId },
    include: { article: true },
    orderBy: { createdAt: "asc" },
  });

  return Promise.all(
    goals.map(async (g) => {
      const current = await receivedTotal(campaignId, {
        articleId: g.articleId,
        category: g.category,
      });
      const target = g.targetQty.toNumber();
      const cur = current.toNumber();
      const percent = target > 0 ? Math.min(cur / target, 1) : 0;
      return {
        id: g.id,
        label: g.article?.name ?? g.category ?? "Meta",
        unit: g.unit,
        target,
        current: cur,
        percent,
        reached: cur >= target && target > 0,
      };
    }),
  );
}

/**
 * Comprueba si alguna meta se alcanzó y, en tal caso, emite una notificación
 * (una sola vez por meta). Se llama tras cada recepción.
 */
export async function checkGoalsReached(campaignId: string): Promise<void> {
  const progress = await getCampaignGoalProgress(campaignId);
  const reached = progress.filter((p) => p.reached);
  if (reached.length === 0) return;

  for (const p of reached) {
    const already = await prisma.notification.findFirst({
      where: {
        type: "GOAL_REACHED",
        title: { contains: p.label },
        role: "COORDINADOR_GENERAL",
      },
    });
    if (already) continue;
    await notify({
      type: "GOAL_REACHED",
      title: `Meta alcanzada: ${p.label}`,
      body: `Se alcanzó la meta de ${p.target} ${p.unit} para ${p.label}.`,
      role: "COORDINADOR_GENERAL",
      link: `/campanas`,
    }).catch(() => undefined);
  }
}
