import "server-only";
import { prisma } from "@/lib/db";

export type MapCenter = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  campaigns: string[];
  totalStock: number;
  topArticles: { name: string; quantity: number }[];
};

/** Centros activos con su resumen de inventario para el mapa / la lista. */
export async function getMapCenters(): Promise<MapCenter[]> {
  const centers = await prisma.center.findMany({
    where: { active: true },
    include: {
      campaigns: { include: { campaign: { select: { name: true } } } },
      inventory: {
        include: { article: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return centers.map((c) => {
    const byArticle = new Map<string, number>();
    let total = 0;
    for (const it of c.inventory) {
      const q = it.quantity.toNumber();
      total += q;
      byArticle.set(
        it.article.name,
        (byArticle.get(it.article.name) ?? 0) + q,
      );
    }
    const topArticles = [...byArticle.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    return {
      id: c.id,
      name: c.name,
      address: c.address,
      latitude: c.latitude,
      longitude: c.longitude,
      campaigns: c.campaigns.map((cc) => cc.campaign.name),
      totalStock: total,
      topArticles,
    };
  });
}
