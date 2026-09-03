import "server-only";
import { prisma } from "@/lib/db";

/** Catálogos para poblar los formularios de movimiento. */
export async function getMovementFormData(centerId: string | null) {
  const [campaigns, articles, institutions, centers] = await Promise.all([
    prisma.campaign.findMany({
      where: {
        active: true,
        ...(centerId ? { centers: { some: { centerId } } } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.article.findMany({
      where: { active: true },
      select: { id: true, name: true, unit: true, category: true },
      orderBy: { name: "asc" },
    }),
    prisma.recipientInstitution.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.center.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { campaigns, articles, institutions, centers };
}

/** Centros participantes de una campaña (para transferencias). */
export async function getCampaignCenters(campaignId: string) {
  const links = await prisma.campaignCenter.findMany({
    where: { campaignId },
    include: { center: { select: { id: true, name: true, active: true } } },
  });
  return links.map((l) => l.center).filter((c) => c.active);
}

/** Stock actual de un centro para una campaña (para mostrar disponibilidad en formularios). */
export async function getCenterStockMap(centerId: string, campaignId: string) {
  const items = await prisma.inventoryItem.findMany({
    where: { centerId, campaignId },
    select: { articleId: true, quantity: true },
  });
  return Object.fromEntries(
    items.map((i) => [i.articleId, i.quantity.toString()]),
  );
}
