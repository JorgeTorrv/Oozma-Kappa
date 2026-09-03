import "server-only";
import {
  MOVEMENT_TYPE_LABELS,
  type MovementType,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import {
  listAllMovements,
  type MovementFilter,
} from "@/repositories/movements.repo";
import { prisma } from "@/lib/db";

/** Serializa un valor a una celda CSV segura (evita inyección de fórmulas). */
function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n;]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  // BOM para que Excel en español abra los acentos correctamente.
  return "﻿" + lines.join("\r\n");
}

/** Exporta movimientos respetando exactamente el filtro aplicado en pantalla. */
export async function exportMovementsCsv(filter: MovementFilter): Promise<string> {
  const movements = await listAllMovements(filter);
  const headers = [
    "Fecha",
    "Tipo",
    "Artículo",
    "Categoría",
    "Cantidad",
    "Unidad",
    "Centro",
    "Destino",
    "Institución",
    "Usuario",
    "Estado",
    "Motivo",
    "Campaña",
    "Notas",
  ];
  const rows = movements.map((m) => [
    formatDateTime(m.createdAt),
    MOVEMENT_TYPE_LABELS[m.type as MovementType] ?? m.type,
    m.article.name,
    m.article.category,
    m.quantity.toString(),
    m.article.unit,
    m.center.name,
    m.destinationCenter?.name ?? "",
    m.recipientInstitution?.name ?? "",
    m.actor.name,
    m.status ?? "",
    m.reason ?? "",
    m.campaign.name,
    m.notes ?? "",
  ]);
  return toCsv(headers, rows);
}

/** Exporta el inventario actual (snapshot) filtrable por campaña / centro. */
export async function exportInventoryCsv(params: {
  campaignId?: string;
  centerId?: string;
}): Promise<string> {
  const items = await prisma.inventoryItem.findMany({
    where: {
      ...(params.campaignId ? { campaignId: params.campaignId } : {}),
      ...(params.centerId ? { centerId: params.centerId } : {}),
    },
    include: {
      article: true,
      center: { select: { name: true } },
      campaign: { select: { name: true } },
    },
    orderBy: [{ center: { name: "asc" } }, { article: { name: "asc" } }],
  });

  const headers = [
    "Campaña",
    "Centro",
    "Artículo",
    "Categoría",
    "Unidad",
    "Cantidad disponible",
  ];
  const rows = items.map((it) => [
    it.campaign.name,
    it.center.name,
    it.article.name,
    it.article.category,
    it.article.unit,
    it.quantity.toString(),
  ]);
  return toCsv(headers, rows);
}
