import "server-only";
import { Prisma } from "@prisma/client";
import { prisma, type Db } from "@/lib/db";
import type { MovementType } from "@/lib/constants";

export type CreateMovementData = {
  type: MovementType;
  quantity: Prisma.Decimal;
  centerId: string;
  campaignId: string;
  articleId: string;
  actorUserId: string;
  recipientInstitutionId?: string | null;
  destinationCenterId?: string | null;
  transferId?: string | null;
  donorId?: string | null;
  status?: string | null;
  reason?: string | null;
  notes?: string | null;
};

export async function createMovement(data: CreateMovementData, db: Db = prisma) {
  return db.movement.create({ data });
}

export type MovementFilter = {
  campaignId?: string;
  centerId?: string;
  /** Incluye movimientos donde el centro es origen O destino. */
  centerAnySide?: string;
  articleId?: string;
  type?: MovementType;
  actorUserId?: string;
  recipientInstitutionId?: string;
  status?: string;
  from?: Date;
  to?: Date;
};

export function buildMovementWhere(
  filter: MovementFilter,
): Prisma.MovementWhereInput {
  const where: Prisma.MovementWhereInput = {};
  if (filter.campaignId) where.campaignId = filter.campaignId;
  if (filter.centerId) where.centerId = filter.centerId;
  if (filter.articleId) where.articleId = filter.articleId;
  if (filter.type) where.type = filter.type;
  if (filter.actorUserId) where.actorUserId = filter.actorUserId;
  if (filter.recipientInstitutionId)
    where.recipientInstitutionId = filter.recipientInstitutionId;
  if (filter.status) where.status = filter.status;
  if (filter.centerAnySide) {
    where.OR = [
      { centerId: filter.centerAnySide },
      { destinationCenterId: filter.centerAnySide },
    ];
  }
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = filter.from;
    if (filter.to) where.createdAt.lte = filter.to;
  }
  return where;
}

const listInclude = {
  center: { select: { id: true, name: true } },
  destinationCenter: { select: { id: true, name: true } },
  campaign: { select: { id: true, name: true } },
  article: { select: { id: true, name: true, unit: true, category: true } },
  actor: { select: { id: true, name: true } },
  recipientInstitution: { select: { id: true, name: true } },
  donor: { select: { id: true, name: true } },
} satisfies Prisma.MovementInclude;

export async function listMovements(
  filter: MovementFilter,
  page: { skip: number; take: number },
  db: Db = prisma,
) {
  return db.movement.findMany({
    where: buildMovementWhere(filter),
    include: listInclude,
    orderBy: { createdAt: "desc" },
    skip: page.skip,
    take: page.take,
  });
}

export async function countMovements(filter: MovementFilter, db: Db = prisma) {
  return db.movement.count({ where: buildMovementWhere(filter) });
}

/** Para exportación CSV: sin paginar (respeta el filtro aplicado). */
export async function listAllMovements(filter: MovementFilter, db: Db = prisma) {
  return db.movement.findMany({
    where: buildMovementWhere(filter),
    include: listInclude,
    orderBy: { createdAt: "desc" },
    take: 10000,
  });
}

export type MovementWithRelations = Prisma.MovementGetPayload<{
  include: typeof listInclude;
}>;
