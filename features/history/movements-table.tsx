import Link from "next/link";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/page";
import { MovementBadge, StatusBadge } from "@/components/movement-badge";
import { formatDateTime, formatQuantity } from "@/lib/format";
import type { MovementWithRelations } from "@/repositories/movements.repo";
import { Route } from "lucide-react";

export function MovementsTable({
  items,
  showTrace = true,
}: {
  items: MovementWithRelations[];
  showTrace?: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No existen movimientos para los filtros seleccionados."
        description="Ajusta los filtros o registra un nuevo movimiento."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Fecha</TH>
          <TH>Tipo</TH>
          <TH>Artículo</TH>
          <TH className="text-right">Cantidad</TH>
          <TH>Centro</TH>
          <TH>Destino</TH>
          <TH>Usuario</TH>
          <TH>Motivo</TH>
          <TH>Estado</TH>
          {showTrace && <TH />}
        </TR>
      </THead>
      <TBody>
        {items.map((m) => (
          <TR key={m.id}>
            <TD className="whitespace-nowrap text-slate-500">
              {formatDateTime(m.createdAt)}
            </TD>
            <TD>
              <MovementBadge type={m.type} />
            </TD>
            <TD className="font-medium text-slate-900">{m.article.name}</TD>
            <TD className="text-right tabular-nums">
              {formatQuantity(m.quantity)} {m.article.unit}
            </TD>
            <TD>{m.center.name}</TD>
            <TD className="text-slate-500">
              {m.destinationCenter?.name ??
                m.recipientInstitution?.name ??
                "—"}
            </TD>
            <TD className="text-slate-500">{m.actor.name}</TD>
            <TD className="max-w-[16rem] truncate text-slate-500" title={m.reason ?? ""}>
              {m.reason ?? "—"}
            </TD>
            <TD>
              {m.status ? <StatusBadge status={m.status} /> : (
                <span className="text-slate-300">—</span>
              )}
            </TD>
            {showTrace && (
              <TD className="text-right">
                <Link
                  href={`/trazabilidad?movimiento=${m.id}`}
                  className="inline-flex items-center gap-1 text-xs text-brand-700 hover:underline"
                  title="Ver trazabilidad"
                >
                  <Route className="size-3.5" />
                  Trazar
                </Link>
              </TD>
            )}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

export function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;
  return (
    <nav
      className="flex items-center justify-between text-sm"
      aria-label="Paginación"
    >
      <span className="text-slate-500">
        Página {page} de {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={makeHref(page - 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
          >
            Anterior
          </Link>
        )}
        {page < pages && (
          <Link
            href={makeHref(page + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
          >
            Siguiente
          </Link>
        )}
      </div>
    </nav>
  );
}
