import { PrismaClient } from "@prisma/client";
import { ROLES } from "../lib/constants";

export const prisma = new PrismaClient();

export async function resetDb() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.campaignGoal.deleteMany();
  await prisma.campaignCenter.deleteMany();
  await prisma.session.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.recipientInstitution.deleteMany();
  await prisma.center.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.article.deleteMany();
}

/**
 * Fixture mínimo: una campaña con dos centros vinculados, un artículo, una
 * institución receptora y un usuario por rol relevante.
 */
export async function makeFixture() {
  const campaign = await prisma.campaign.create({
    data: { name: "Campaña de prueba", startDate: new Date(), active: true },
  });
  const centerA = await prisma.center.create({
    data: { name: "Centro A", active: true },
  });
  const centerB = await prisma.center.create({
    data: { name: "Centro B", active: true },
  });
  await prisma.campaignCenter.createMany({
    data: [
      { campaignId: campaign.id, centerId: centerA.id },
      { campaignId: campaign.id, centerId: centerB.id },
    ],
  });
  const article = await prisma.article.create({
    data: { name: "Arroz", category: "Alimentos", unit: "kg" },
  });
  const institution = await prisma.recipientInstitution.create({
    data: { name: "Cruz Roja", active: true },
  });

  const coordinator = await prisma.user.create({
    data: {
      name: "Coord",
      email: "coord@test.local",
      passwordHash: "x",
      role: ROLES.COORDINADOR_GENERAL,
    },
  });
  const managerA = await prisma.user.create({
    data: {
      name: "Enc A",
      email: "enca@test.local",
      passwordHash: "x",
      role: ROLES.ENCARGADO_CENTRO,
      centerId: centerA.id,
    },
  });
  const managerB = await prisma.user.create({
    data: {
      name: "Enc B",
      email: "encb@test.local",
      passwordHash: "x",
      role: ROLES.ENCARGADO_CENTRO,
      centerId: centerB.id,
    },
  });
  const volunteerA = await prisma.user.create({
    data: {
      name: "Vol A",
      email: "vola@test.local",
      passwordHash: "x",
      role: ROLES.VOLUNTARIO_CENTRO,
      centerId: centerA.id,
    },
  });

  return {
    campaign,
    centerA,
    centerB,
    article,
    institution,
    coordinator,
    managerA,
    managerB,
    volunteerA,
  };
}

export async function stockOf(
  centerId: string,
  campaignId: string,
  articleId: string,
): Promise<number> {
  const item = await prisma.inventoryItem.findUnique({
    where: {
      centerId_campaignId_articleId: { centerId, campaignId, articleId },
    },
  });
  return item ? item.quantity.toNumber() : 0;
}
