import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  DELIVERY_STATUS,
  LOW_STOCK_THRESHOLD,
  MOVEMENT_TYPES,
  WASTE_STATUS,
} from "@/lib/constants";
import { getCampaignGoalProgress } from "@/services/goal.service";

const d0 = () => new Prisma.Decimal(0);
const num = (d: Prisma.Decimal | null | undefined) => (d ?? d0()).toNumber();

async function sumByType(
  type: string,
  where: Prisma.MovementWhereInput = {},
): Promise<number> {
  const agg = await prisma.movement.aggregate({
    where: { type, ...where },
    _sum: { quantity: true },
  });
  return num(agg._sum.quantity);
}

/* ------------------------------------------------------------------ *
 *  Dashboard global (coordinador)
 * ------------------------------------------------------------------ */
export async function getGlobalDashboard() {
  const [
    activeCampaigns,
    activeCenters,
    activeArticles,
    inventoryAgg,
    receptions,
    deliveries,
    waste,
    transfers,
    pendingWaste,
    pendingDeliveries,
  ] = await Promise.all([
    prisma.campaign.count({ where: { active: true } }),
    prisma.center.count({ where: { active: true } }),
    prisma.article.count({ where: { active: true } }),
    prisma.inventoryItem.aggregate({ _sum: { quantity: true } }),
    sumByType(MOVEMENT_TYPES.RECEPTION),
    sumByType(MOVEMENT_TYPES.DELIVERY),
    sumByType(MOVEMENT_TYPES.WASTE, { status: WASTE_STATUS.APPROVED }),
    sumByType(MOVEMENT_TYPES.TRANSFER_OUT),
    prisma.movement.count({
      where: { type: MOVEMENT_TYPES.WASTE, status: WASTE_STATUS.PENDING_APPROVAL },
    }),
    prisma.movement.count({
      where: { type: MOVEMENT_TYPES.DELIVERY, status: DELIVERY_STATUS.PENDING },
    }),
  ]);

  return {
    kpis: {
      activeCampaigns,
      activeCenters,
      activeArticles,
      totalInventory: num(inventoryAgg._sum.quantity),
      receptions,
      deliveries,
      waste,
      transfers,
      pendingWaste,
      pendingDeliveries,
    },
    inventoryByCenter: await inventoryByCenter(),
    receptionsByDay: await receptionsByDay(14),
    topArticles: await topReceivedArticles(6),
    categoryDistribution: await categoryDistribution(),
    wasteByCenter: await wasteByCenter(),
    campaignProgress: await campaignProgressSummary(),
    centerComparison: await centerComparison(),
  };
}

export async function inventoryByCenter() {
  const rows = await prisma.inventoryItem.groupBy({
    by: ["centerId"],
    _sum: { quantity: true },
  });
  const centers = await prisma.center.findMany({
    select: { id: true, name: true },
  });
  const nameById = new Map(centers.map((c) => [c.id, c.name]));
  return rows
    .map((r) => ({
      center: nameById.get(r.centerId) ?? "—",
      quantity: num(r._sum.quantity),
    }))
    .sort((a, b) => b.quantity - a.quantity);
}

export async function receptionsByDay(days: number) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const movements = await prisma.movement.findMany({
    where: { type: MOVEMENT_TYPES.RECEPTION, createdAt: { gte: since } },
    select: { createdAt: true, quantity: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const m of movements) {
    const key = m.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + m.quantity.toNumber());
  }
  return [...buckets.entries()].map(([date, quantity]) => ({ date, quantity }));
}

export async function topReceivedArticles(limit: number) {
  const rows = await prisma.movement.groupBy({
    by: ["articleId"],
    where: { type: MOVEMENT_TYPES.RECEPTION },
    _sum: { quantity: true },
  });
  const articles = await prisma.article.findMany({
    select: { id: true, name: true },
  });
  const nameById = new Map(articles.map((a) => [a.id, a.name]));
  return rows
    .map((r) => ({
      article: nameById.get(r.articleId) ?? "—",
      quantity: num(r._sum.quantity),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

export async function categoryDistribution() {
  const items = await prisma.inventoryItem.findMany({
    where: { quantity: { gt: 0 } },
    include: { article: { select: { category: true } } },
  });
  const byCat = new Map<string, number>();
  for (const it of items) {
    const c = it.article.category;
    byCat.set(c, (byCat.get(c) ?? 0) + it.quantity.toNumber());
  }
  return [...byCat.entries()]
    .map(([category, quantity]) => ({ category, quantity }))
    .sort((a, b) => b.quantity - a.quantity);
}

export async function wasteByCenter() {
  const rows = await prisma.movement.groupBy({
    by: ["centerId"],
    where: { type: MOVEMENT_TYPES.WASTE, status: WASTE_STATUS.APPROVED },
    _sum: { quantity: true },
  });
  const centers = await prisma.center.findMany({
    select: { id: true, name: true },
  });
  const nameById = new Map(centers.map((c) => [c.id, c.name]));
  return rows.map((r) => ({
    center: nameById.get(r.centerId) ?? "—",
    quantity: num(r._sum.quantity),
  }));
}

export async function campaignProgressSummary() {
  const campaigns = await prisma.campaign.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });
  const out: {
    campaign: string;
    goals: number;
    avgPercent: number;
  }[] = [];
  for (const c of campaigns) {
    const progress = await getCampaignGoalProgress(c.id);
    const avg =
      progress.length > 0
        ? progress.reduce((s, p) => s + p.percent, 0) / progress.length
        : 0;
    out.push({ campaign: c.name, goals: progress.length, avgPercent: avg });
  }
  return out;
}

export async function centerComparison() {
  const centers = await prisma.center.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });
  const result = [];
  for (const c of centers) {
    const [receptions, deliveries, waste, transfersOut, stockAgg] =
      await Promise.all([
        sumByType(MOVEMENT_TYPES.RECEPTION, { centerId: c.id }),
        sumByType(MOVEMENT_TYPES.DELIVERY, { centerId: c.id }),
        sumByType(MOVEMENT_TYPES.WASTE, {
          centerId: c.id,
          status: WASTE_STATUS.APPROVED,
        }),
        sumByType(MOVEMENT_TYPES.TRANSFER_OUT, { centerId: c.id }),
        prisma.inventoryItem.aggregate({
          where: { centerId: c.id },
          _sum: { quantity: true },
        }),
      ]);
    result.push({
      center: c.name,
      receptions,
      deliveries,
      waste,
      transfersOut,
      stock: num(stockAgg._sum.quantity),
    });
  }
  return result;
}

/* ------------------------------------------------------------------ *
 *  Dashboard de centro
 * ------------------------------------------------------------------ */
export async function getCenterDashboard(centerId: string) {
  const [center, inventory, recent] = await Promise.all([
    prisma.center.findUnique({ where: { id: centerId } }),
    prisma.inventoryItem.findMany({
      where: { centerId },
      include: { article: true, campaign: { select: { name: true } } },
      orderBy: [{ article: { name: "asc" } }],
    }),
    prisma.movement.findMany({
      where: { OR: [{ centerId }, { destinationCenterId: centerId }] },
      include: {
        article: { select: { name: true, unit: true } },
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const [receptions, deliveries, waste, transfersIn, transfersOut] =
    await Promise.all([
      sumByType(MOVEMENT_TYPES.RECEPTION, { centerId }),
      sumByType(MOVEMENT_TYPES.DELIVERY, { centerId }),
      sumByType(MOVEMENT_TYPES.WASTE, {
        centerId,
        status: WASTE_STATUS.APPROVED,
      }),
      sumByType(MOVEMENT_TYPES.TRANSFER_IN, { centerId }),
      sumByType(MOVEMENT_TYPES.TRANSFER_OUT, { centerId }),
    ]);

  const stockRows = inventory.map((it) => ({
    articleId: it.articleId,
    article: it.article.name,
    category: it.article.category,
    unit: it.article.unit,
    quantity: it.quantity.toNumber(),
    campaign: it.campaign.name,
    low: it.quantity.toNumber() <= LOW_STOCK_THRESHOLD,
  }));

  return {
    center,
    totals: { receptions, deliveries, waste, transfersIn, transfersOut },
    stockRows,
    lowStock: stockRows.filter((r) => r.low),
    totalStock: stockRows.reduce((s, r) => s + r.quantity, 0),
    recent,
  };
}

/* ------------------------------------------------------------------ *
 *  Dashboard de campaña (líder)
 * ------------------------------------------------------------------ */
export async function getCampaignDashboard(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      centers: { include: { center: true } },
    },
  });
  if (!campaign) return null;

  const centerIds = campaign.centers.map((cc) => cc.centerId);

  const [inventory, receptions, deliveries, waste, transfers, goals, recent] =
    await Promise.all([
      prisma.inventoryItem.findMany({
        where: { campaignId },
        include: { article: true, center: { select: { name: true } } },
      }),
      sumByType(MOVEMENT_TYPES.RECEPTION, { campaignId }),
      sumByType(MOVEMENT_TYPES.DELIVERY, { campaignId }),
      sumByType(MOVEMENT_TYPES.WASTE, {
        campaignId,
        status: WASTE_STATUS.APPROVED,
      }),
      sumByType(MOVEMENT_TYPES.TRANSFER_OUT, { campaignId }),
      getCampaignGoalProgress(campaignId),
      prisma.movement.findMany({
        where: { campaignId },
        include: {
          article: { select: { name: true, unit: true } },
          center: { select: { name: true } },
          actor: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ]);

  const aggByArticle = new Map<
    string,
    { article: string; unit: string; quantity: number }
  >();
  for (const it of inventory) {
    const cur = aggByArticle.get(it.articleId) ?? {
      article: it.article.name,
      unit: it.article.unit,
      quantity: 0,
    };
    cur.quantity += it.quantity.toNumber();
    aggByArticle.set(it.articleId, cur);
  }

  const perCenterStock = campaign.centers.map((cc) => {
    const total = inventory
      .filter((i) => i.centerId === cc.centerId)
      .reduce((s, i) => s + i.quantity.toNumber(), 0);
    return { center: cc.center.name, quantity: total };
  });

  return {
    campaign,
    centers: campaign.centers.map((cc) => cc.center),
    centerIds,
    totals: { receptions, deliveries, waste, transfers },
    aggregatedInventory: [...aggByArticle.values()].sort(
      (a, b) => b.quantity - a.quantity,
    ),
    perCenterStock,
    goals,
    recent,
  };
}

/* ------------------------------------------------------------------ *
 *  Dashboard institución receptora
 * ------------------------------------------------------------------ */
export async function getInstitutionDashboard(institutionId: string) {
  const deliveries = await prisma.movement.findMany({
    where: {
      type: MOVEMENT_TYPES.DELIVERY,
      recipientInstitutionId: institutionId,
    },
    include: {
      article: { select: { name: true, unit: true } },
      center: { select: { name: true } },
      campaign: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    pending: deliveries.filter((d) => d.status === DELIVERY_STATUS.PENDING),
    confirmed: deliveries.filter((d) => d.status === DELIVERY_STATUS.CONFIRMED),
  };
}
