import Link from "next/link";
import { getCenterDashboard } from "@/services/dashboard.service";
import { StatCard, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { MovementBadge } from "@/components/movement-badge";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
} from "@/components/charts";
import { formatQuantity, formatDateTime } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { AlertTriangle } from "lucide-react";

export async function CenterDashboard({ centerId }: { centerId: string }) {
  const d = await getCenterDashboard(centerId);
  const t = d.totals;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Stock total"
          value={formatQuantity(d.totalStock)}
          hint="unidades"
        />
        <StatCard label="Entradas" value={formatQuantity(t.receptions)} />
        <StatCard label="Salidas" value={formatQuantity(t.deliveries)} />
        <StatCard
          label="Merma"
          value={formatQuantity(t.waste)}
          tone={t.waste > 0 ? "warning" : "default"}
        />
        <StatCard label="Transf. entrada" value={formatQuantity(t.transfersIn)} />
        <StatCard label="Transf. salida" value={formatQuantity(t.transfersOut)} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Recepciones por día"
          description="Últimos 14 días en el centro."
          data={d.charts.receptionsByDay.map((r) => ({
            date: r.date.slice(5),
            quantity: r.quantity,
          }))}
          xKey="date"
          yKey="quantity"
        />
        <BarChartCard
          title="Entradas vs. salidas"
          description="Movimiento total del centro."
          data={d.charts.flow}
          xKey="tipo"
          yKey="cantidad"
        />
        <BarChartCard
          title="Artículos más recibidos"
          data={d.charts.topArticles}
          xKey="article"
          yKey="quantity"
          color="#059669"
        />
        <PieChartCard
          title="Inventario por categoría"
          data={d.charts.categoryDistribution}
          nameKey="category"
          valueKey="quantity"
        />
      </section>

      {d.lowStock.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <AlertTriangle className="size-4" />
            Stock bajo ({d.lowStock.length}{" "}
            {d.lowStock.length === 1 ? "artículo" : "artículos"} ≤{" "}
            {LOW_STOCK_THRESHOLD})
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {d.lowStock.map((r) => (
              <li key={r.articleId}>
                <Badge color="amber">
                  {r.article}: {formatQuantity(r.quantity)} {r.unit}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Inventario disponible
        </h2>
        {d.stockRows.length === 0 ? (
          <EmptyState
            title="Sin inventario todavía"
            description="Registra una recepción para comenzar a contar stock."
            action={
              <Link
                href="/recepciones"
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                Registrar recepción
              </Link>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Artículo</TH>
                <TH>Categoría</TH>
                <TH>Unidad</TH>
                <TH className="text-right">Cantidad disponible</TH>
              </TR>
            </THead>
            <TBody>
              {d.stockRows.map((r) => (
                <TR key={r.articleId}>
                  <TD className="font-medium text-slate-900">
                    {r.article}
                    {r.low && (
                      <Badge color="amber" className="ml-2">
                        bajo
                      </Badge>
                    )}
                  </TD>
                  <TD>{r.category}</TD>
                  <TD>{r.unit}</TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatQuantity(r.quantity)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Movimientos recientes
        </h2>
        {d.recent.length === 0 ? (
          <EmptyState title="Aún no hay movimientos en este centro." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Fecha</TH>
                <TH>Tipo</TH>
                <TH>Artículo</TH>
                <TH className="text-right">Cantidad</TH>
                <TH>Usuario</TH>
              </TR>
            </THead>
            <TBody>
              {d.recent.map((m) => (
                <TR key={m.id}>
                  <TD className="whitespace-nowrap text-slate-500">
                    {formatDateTime(m.createdAt)}
                  </TD>
                  <TD>
                    <MovementBadge type={m.type} />
                  </TD>
                  <TD>{m.article.name}</TD>
                  <TD className="text-right tabular-nums">
                    {formatQuantity(m.quantity)} {m.article.unit}
                  </TD>
                  <TD className="text-slate-500">{m.actor.name}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  );
}
