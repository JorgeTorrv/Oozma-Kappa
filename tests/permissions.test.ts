import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDb, makeFixture } from "./helpers";
import {
  can,
  canActOnCenter,
  assertActOnCenter,
  canManageVolunteer,
  ROLE_CAPABILITIES,
} from "../lib/permissions";
import { ROLES } from "../lib/constants";

let fx: Awaited<ReturnType<typeof makeFixture>>;

beforeEach(async () => {
  await resetDb();
  fx = await makeFixture();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const principal = (
  role: string,
  extras: Partial<{ centerId: string; campaignId: string; institutionId: string }> = {},
) => ({
  id: "u",
  role: role as never,
  centerId: extras.centerId ?? null,
  institutionId: extras.institutionId ?? null,
  campaignId: extras.campaignId ?? null,
});

describe("Matriz de permisos", () => {
  it("13. cada rol tiene el conjunto de capacidades esperado", () => {
    expect(can(principal(ROLES.COORDINADOR_GENERAL), "campaign.create")).toBe(
      true,
    );
    expect(can(principal(ROLES.COORDINADOR_GENERAL), "waste.approve")).toBe(true);
    expect(can(principal(ROLES.ENCARGADO_CENTRO), "transfer.create")).toBe(true);
    expect(can(principal(ROLES.ENCARGADO_CENTRO), "users.manage")).toBe(false);
    expect(can(principal(ROLES.VOLUNTARIO_CENTRO), "reception.create")).toBe(
      true,
    );
    expect(can(principal(ROLES.INSTITUCION_RECEPTORA), "delivery.confirm")).toBe(
      true,
    );
    expect(
      can(principal(ROLES.INSTITUCION_RECEPTORA), "inventory.global.read"),
    ).toBe(false);
    expect(can(principal(ROLES.LIDER_CAMPANA), "dashboard.campaign.read")).toBe(
      true,
    );
    expect(can(principal(ROLES.LIDER_CAMPANA), "reception.create")).toBe(false);
  });

  it("15. el voluntario NO puede registrar merma ni ajustes ni transferir", () => {
    const vol = principal(ROLES.VOLUNTARIO_CENTRO, { centerId: fx.centerA.id });
    expect(can(vol, "waste.create")).toBe(false);
    expect(can(vol, "adjustment.create")).toBe(false);
    expect(can(vol, "transfer.create")).toBe(false);
  });

  it("14. un encargado sólo puede operar sobre su propio centro (anti-IDOR)", () => {
    const encA = principal(ROLES.ENCARGADO_CENTRO, { centerId: fx.centerA.id });
    expect(canActOnCenter(encA, fx.centerA.id)).toBe(true);
    expect(canActOnCenter(encA, fx.centerB.id)).toBe(false);
    expect(() => assertActOnCenter(encA, fx.centerB.id)).toThrow(/no te corresponde/i);
  });

  it("el coordinador puede operar sobre cualquier centro", () => {
    const coord = principal(ROLES.COORDINADOR_GENERAL);
    expect(canActOnCenter(coord, fx.centerA.id)).toBe(true);
    expect(canActOnCenter(coord, fx.centerB.id)).toBe(true);
  });

  it("ningún rol tiene capacidades fuera de la lista blanca", () => {
    for (const [, caps] of Object.entries(ROLE_CAPABILITIES)) {
      for (const c of caps) expect(typeof c).toBe("string");
    }
  });

  it("gestión de voluntarios: encargado sólo su centro; coordinador cualquiera", () => {
    const encA = principal(ROLES.ENCARGADO_CENTRO, { centerId: fx.centerA.id });
    const coord = principal(ROLES.COORDINADOR_GENERAL);
    const volInA = { role: ROLES.VOLUNTARIO_CENTRO, centerId: fx.centerA.id };
    const volInB = { role: ROLES.VOLUNTARIO_CENTRO, centerId: fx.centerB.id };

    expect(can(encA, "team.manage")).toBe(true);
    expect(canManageVolunteer(encA, volInA)).toBe(true);
    expect(canManageVolunteer(encA, volInB)).toBe(false);
    expect(canManageVolunteer(coord, volInB)).toBe(true);

    // Un encargado no puede "gestionar" a otro encargado como si fuera voluntario.
    expect(
      canManageVolunteer(encA, {
        role: ROLES.ENCARGADO_CENTRO,
        centerId: fx.centerA.id,
      }),
    ).toBe(false);
    // El voluntario no gestiona a nadie.
    const volA = principal(ROLES.VOLUNTARIO_CENTRO, { centerId: fx.centerA.id });
    expect(canManageVolunteer(volA, volInA)).toBe(false);
    expect(can(volA, "team.manage")).toBe(false);
  });
});

describe("Reglas de negocio de merma (aprobación)", () => {
  it("con aprobación activa, la merma NO descuenta stock hasta aprobarse", async () => {
    process.env.WASTE_APPROVAL_ENABLED = "true";
    const { registerReception, registerWaste, approveWaste } = await import(
      "../services/movements.service"
    );

    await registerReception({
      centerId: fx.centerA.id,
      campaignId: fx.campaign.id,
      articleId: fx.article.id,
      quantity: 30,
      actorUserId: fx.managerA.id,
      donor: null,
    });

    const res = await registerWaste({
      centerId: fx.centerA.id,
      campaignId: fx.campaign.id,
      articleId: fx.article.id,
      quantity: 12,
      actorUserId: fx.managerA.id,
      reason: "Daño",
    });
    expect(res.pending).toBe(true);

    let item = await prisma.inventoryItem.findFirst({
      where: { centerId: fx.centerA.id },
    });
    expect(item?.quantity.toNumber()).toBe(30); // aún no descuenta

    await approveWaste({ movementId: res.movementId, actorUserId: fx.coordinator.id });
    item = await prisma.inventoryItem.findFirst({
      where: { centerId: fx.centerA.id },
    });
    expect(item?.quantity.toNumber()).toBe(18); // ahora sí
    delete process.env.WASTE_APPROVAL_ENABLED;
  });
});
