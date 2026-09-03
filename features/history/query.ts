import "server-only";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/session";
import {
  countMovements,
  listMovements,
  type MovementFilter,
} from "@/repositories/movements.repo";
import type { MovementType } from "@/lib/constants";

export type RawParams = Record<string, string | string[] | undefined>;

const str = (v: string | string[] | undefined) =>
  typeof v === "string" && v.length > 0 ? v : undefined;

/**
 * Construye el filtro de movimientos combinando los parámetros de la URL con el
 * ÁMBITO del usuario (autorización por rol/pertenencia). Un encargado nunca
 * puede "escapar" a otros centros manipulando la query.
 */
export function buildScopedFilter(
  user: SessionUser,
  raw: RawParams,
): { filter: MovementFilter; page: number } {
  const filter: MovementFilter = {};

  const article = str(raw.articleId);
  const type = str(raw.type) as MovementType | undefined;
  const actor = str(raw.actorUserId);
  const from = str(raw.from);
  const to = str(raw.to);

  if (article) filter.articleId = article;
  if (type) filter.type = type;
  if (actor) filter.actorUserId = actor;
  if (from) filter.from = new Date(`${from}T00:00:00`);
  if (to) filter.to = new Date(`${to}T23:59:59`);

  if (user.role === ROLES.COORDINADOR_GENERAL) {
    if (str(raw.campaignId)) filter.campaignId = str(raw.campaignId);
    if (str(raw.centerId)) filter.centerId = str(raw.centerId);
  } else if (user.role === ROLES.LIDER_CAMPANA && user.campaignId) {
    filter.campaignId = user.campaignId;
    if (str(raw.centerId)) filter.centerId = str(raw.centerId);
  } else if (
    (user.role === ROLES.ENCARGADO_CENTRO ||
      user.role === ROLES.VOLUNTARIO_CENTRO) &&
    user.centerId
  ) {
    // Su centro, como origen o destino.
    filter.centerAnySide = user.centerId;
    if (str(raw.campaignId)) filter.campaignId = str(raw.campaignId);
  } else {
    // Sin ámbito válido: no devuelve nada.
    filter.centerId = "__none__";
  }

  const page = Math.max(1, Number(str(raw.page) ?? "1") || 1);
  return { filter, page };
}

export const PAGE_SIZE = 20;

export async function fetchMovementsPage(filter: MovementFilter, page: number) {
  const [items, total] = await Promise.all([
    listMovements(filter, { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    countMovements(filter),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function fetchFilterCatalogs(user: SessionUser) {
  const isCoord = user.role === ROLES.COORDINADOR_GENERAL;
  const isLeader = user.role === ROLES.LIDER_CAMPANA;

  const [campaigns, centers, articles, users] = await Promise.all([
    prisma.campaign.findMany({
      where: isLeader && user.campaignId ? { id: user.campaignId } : {},
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.center.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.article.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    isCoord || isLeader
      ? prisma.user.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return {
    campaigns,
    centers,
    articles,
    users,
    showCampaign: isCoord,
    showCenter: isCoord || isLeader,
  };
}
