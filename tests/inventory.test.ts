import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { prisma, resetDb, makeFixture, stockOf } from "./helpers";
import {
  recordMovement,
  adjustInventory,
  getStock,
  verifyConsistency,
} from "../services/inventory.service";
import { executeTransfer } from "../services/transfer.service";
import {
  registerReception,
  registerDelivery,
  registerWaste,
} from "../services/movements.service";
import { MOVEMENT_TYPES } from "../lib/constants";

let fx: Awaited<ReturnType<typeof makeFixture>>;

beforeEach(async () => {
  await resetDb();
  fx = await makeFixture();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const key = () => ({
  centerId: fx.centerA.id,
  campaignId: fx.campaign.id,
  articleId: fx.article.id,
});

describe("InventoryService", () => {
  it("1. la recepción aumenta el stock", async () => {
    await registerReception({
      ...key(),
      quantity: 100,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(100);
  });

  it("2. la entrega reduce el stock", async () => {
    await registerReception({
      ...key(),
      quantity: 100,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await registerDelivery({
      ...key(),
      quantity: 30,
      actorUserId: fx.managerA.id,
      recipientInstitutionId: fx.institution.id,
    });
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(70);
  });

  it("3. no se permite una entrega mayor al stock", async () => {
    await registerReception({
      ...key(),
      quantity: 10,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await expect(
      registerDelivery({
        ...key(),
        quantity: 25,
        actorUserId: fx.managerA.id,
        recipientInstitutionId: fx.institution.id,
      }),
    ).rejects.toThrow(/suficiente inventario/i);
    // El stock no cambió.
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(10);
  });

  it("4 y 5. la merma reduce el stock y requiere motivo", async () => {
    process.env.WASTE_APPROVAL_ENABLED = "false";
    await registerReception({
      ...key(),
      quantity: 50,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await expect(
      registerWaste({
        ...key(),
        quantity: 5,
        actorUserId: fx.managerA.id,
        reason: "",
      }),
    ).rejects.toThrow(/motivo/i);

    await registerWaste({
      ...key(),
      quantity: 8,
      actorUserId: fx.managerA.id,
      reason: "Caducidad",
    });
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(42);
    delete process.env.WASTE_APPROVAL_ENABLED;
  });

  it("6, 7 y 8. la transferencia mueve stock y conserva el total de la campaña", async () => {
    await registerReception({
      ...key(),
      quantity: 200,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    const totalBefore =
      (await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)) +
      (await stockOf(fx.centerB.id, fx.campaign.id, fx.article.id));

    await executeTransfer({
      campaignId: fx.campaign.id,
      fromCenterId: fx.centerA.id,
      toCenterId: fx.centerB.id,
      articleId: fx.article.id,
      quantity: 75,
      actorUserId: fx.managerA.id,
    });

    const a = await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id);
    const b = await stockOf(fx.centerB.id, fx.campaign.id, fx.article.id);
    expect(a).toBe(125);
    expect(b).toBe(75);
    expect(a + b).toBe(totalBefore); // total de campaña sin cambio

    // Dos movimientos con el mismo transferId.
    const mv = await prisma.movement.findMany({
      where: { transferId: { not: null } },
    });
    expect(mv).toHaveLength(2);
    expect(new Set(mv.map((m) => m.transferId)).size).toBe(1);
  });

  it("9. la transferencia falla completamente si una parte falla (atomicidad)", async () => {
    await registerReception({
      ...key(),
      quantity: 20,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    // Centro destino no participa en la campaña -> debe abortar sin escribir nada.
    const outsider = await prisma.center.create({
      data: { name: "Centro Externo", active: true },
    });
    await expect(
      executeTransfer({
        campaignId: fx.campaign.id,
        fromCenterId: fx.centerA.id,
        toCenterId: outsider.id,
        articleId: fx.article.id,
        quantity: 10,
        actorUserId: fx.managerA.id,
      }),
    ).rejects.toThrow(/misma campaña/i);

    expect(await prisma.transfer.count()).toBe(0);
    expect(
      await prisma.movement.count({ where: { type: { contains: "TRANSFER" } } }),
    ).toBe(0);
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(20);
  });

  it("9b. transferencia sin stock suficiente no escribe nada", async () => {
    await registerReception({
      ...key(),
      quantity: 5,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await expect(
      executeTransfer({
        campaignId: fx.campaign.id,
        fromCenterId: fx.centerA.id,
        toCenterId: fx.centerB.id,
        articleId: fx.article.id,
        quantity: 50,
        actorUserId: fx.managerA.id,
      }),
    ).rejects.toThrow(/suficiente/i);
    expect(await prisma.transfer.count()).toBe(0);
    expect(await stockOf(fx.centerB.id, fx.campaign.id, fx.article.id)).toBe(0);
  });

  it("10 y 11. ajuste positivo y negativo modifican el inventario", async () => {
    await registerReception({
      ...key(),
      quantity: 40,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await adjustInventory({
      direction: "POSITIVE",
      quantity: 10,
      ...key(),
      actorUserId: fx.managerA.id,
      reason: "Conteo físico sobrante",
    });
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(50);

    await adjustInventory({
      direction: "NEGATIVE",
      quantity: 15,
      ...key(),
      actorUserId: fx.managerA.id,
      reason: "Conteo físico faltante",
    });
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(35);
  });

  it("11b. el ajuste requiere motivo", async () => {
    await expect(
      adjustInventory({
        direction: "POSITIVE",
        quantity: 5,
        ...key(),
        actorUserId: fx.managerA.id,
        reason: "",
      }),
    ).rejects.toThrow(/motivo/i);
  });

  it("12. nunca se permite stock negativo", async () => {
    await expect(
      recordMovement({
        type: MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE,
        quantity: 5,
        ...key(),
        actorUserId: fx.managerA.id,
        reason: "x",
      }),
    ).rejects.toThrow(/suficiente inventario/i);
    const stock = await getStock(key());
    expect(stock.toNumber()).toBe(0);
  });

  it("rechaza cantidades inválidas (0, negativa, NaN, muchos decimales)", async () => {
    for (const q of ["0", "-3", "abc", "1.23456"]) {
      await expect(
        registerReception({
          ...key(),
          quantity: q,
          actorUserId: fx.managerA.id,
          donor: null,
        }),
      ).rejects.toThrow();
    }
  });

  it("maneja decimales (kg) sin errores de coma flotante", async () => {
    await registerReception({
      ...key(),
      quantity: "10.5",
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await registerReception({
      ...key(),
      quantity: "0.25",
      actorUserId: fx.managerA.id,
      donor: null,
    });
    expect(await stockOf(fx.centerA.id, fx.campaign.id, fx.article.id)).toBe(
      10.75,
    );
  });

  it("recepción anónima vs. con datos de donante", async () => {
    await registerReception({
      ...key(),
      quantity: 5,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await registerReception({
      ...key(),
      quantity: 5,
      actorUserId: fx.managerA.id,
      donor: { name: "Panadería La Central", phone: null, email: null },
    });
    const anon = await prisma.movement.findFirst({
      where: { type: MOVEMENT_TYPES.RECEPTION, donorId: null },
    });
    const named = await prisma.movement.findFirst({
      where: { type: MOVEMENT_TYPES.RECEPTION, donorId: { not: null } },
    });
    expect(anon).toBeTruthy();
    expect(named).toBeTruthy();
    expect(await prisma.donor.count()).toBe(1);
  });

  it("el snapshot de inventario coincide con el ledger de movimientos", async () => {
    await registerReception({
      ...key(),
      quantity: 100,
      actorUserId: fx.managerA.id,
      donor: null,
    });
    await registerDelivery({
      ...key(),
      quantity: 20,
      actorUserId: fx.managerA.id,
      recipientInstitutionId: fx.institution.id,
    });
    await adjustInventory({
      direction: "NEGATIVE",
      quantity: 5,
      ...key(),
      actorUserId: fx.managerA.id,
      reason: "merma menor",
    });
    const check = await verifyConsistency(key());
    expect(check.consistent).toBe(true);
    expect(check.snapshot.toNumber()).toBe(75);
  });
});
