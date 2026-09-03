import Link from "next/link";
import { prisma } from "@/lib/db";
import { MOVEMENT_TYPES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/page";
import { StatusBadge } from "@/components/movement-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime, formatQuantity } from "@/lib/format";

/**
 * Historial de mermas (todas: pendientes, aprobadas y rechazadas).
 * El historial completo y filtrable está en /movimientos (tipo = Merma);
 * esto es un resumen rápido dentro de la propia pantalla de mermas.
 */
export async function WasteHistory({
  centerId,
  limit = 30,
}: {
  centerId?: string | null;
  limit?: number;
}) {
  const rows = await prisma.movement.findMany({
    where: {
      type: MOVEMENT_TYPES.WASTE,
      ...(centerId ? { centerId } : {}),
    },
    include: {
      article: { select: { name: true, unit: true } },
      center: { select: { name: true } },
      actor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (rows.length === 0) {
    return <EmptyState title="Todavía no se ha registrado ninguna merma." />;
  }

  const href = centerId
    ? `/movimientos?type=${MOVEMENT_TYPES.WASTE}&centerId=${centerId}`
    : `/movimientos?type=${MOVEMENT_TYPES.WASTE}`;

  return (
    <div className="space-y-3">
      <Table>
        <THead>
          <TR>
            <TH>Fecha</TH>
            <TH>Centro</TH>
            <TH>Artículo</TH>
            <TH className="text-right">Cantidad</TH>
            <TH>Motivo</TH>
            <TH>Registró</TH>
            <TH>Estado</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((m) => (
            <TR key={m.id}>
              <TD className="whitespace-nowrap text-slate-500">
                {formatDateTime(m.createdAt)}
              </TD>
              <TD>{m.center.name}</TD>
              <TD className="font-medium text-slate-900">{m.article.name}</TD>
              <TD className="text-right tabular-nums">
                {formatQuantity(m.quantity)} {m.article.unit}
              </TD>
              <TD className="max-w-[16rem] text-slate-600">
                {m.reason ?? "—"}
                {m.notes && (
                  <span className="block text-xs text-slate-400">{m.notes}</span>
                )}
              </TD>
              <TD className="text-slate-500">{m.actor.name}</TD>
              <TD>
                <StatusBadge status={m.status} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
      <p className="text-xs text-slate-500">
        Mostrando las {rows.length} más recientes.{" "}
        <Link href={href} className="font-medium text-brand-700 hover:underline">
          Ver historial completo en Movimientos
        </Link>
        .
      </p>
    </div>
  );
}
