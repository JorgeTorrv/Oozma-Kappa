import { getGlobalDashboard } from "@/services/dashboard.service";
import { StatCard } from "@/components/ui/page";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
} from "@/components/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatQuantity, formatPercent } from "@/lib/format";

export async function CoordinatorDashboard() {
  const d = await getGlobalDashboard();
  const k = d.kpis;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Campañas activas" value={k.activeCampaigns} />
        <StatCard label="Centros activos" value={k.activeCenters} />
        <StatCard label="Artículos" value={k.activeArticles} />
        <StatCard
          label="Inventario total"
          value={formatQuantity(k.totalInventory)}
          hint="unidades en existencia"
        />
        <StatCard label="Recepciones" value={formatQuantity(k.receptions)} />
        <StatCard label="Entregas" value={formatQuantity(k.deliveries)} />
        <StatCard
          label="Merma"
          value={formatQuantity(k.waste)}
          tone={k.waste > 0 ? "warning" : "default"}
        />
        <StatCard label="Transferencias" value={formatQuantity(k.transfers)} />
      </section>

      {(k.pendingWaste > 0 || k.pendingDeliveries > 0) && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="Mermas por aprobar"
            value={k.pendingWaste}
            tone={k.pendingWaste > 0 ? "warning" : "default"}
            hint="requieren tu revisión"
          />
          <StatCard
            label="Entregas sin confirmar"
            value={k.pendingDeliveries}
            hint="esperan confirmación de la institución"
          />
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChartCard
          title="Inventario por centro"
          description="Unidades actualmente disponibles en cada centro."
          data={d.inventoryByCenter}
          xKey="center"
          yKey="quantity"
        />
        <LineChartCard
          title="Recepciones por día"
          description="Últimos 14 días."
          data={d.receptionsByDay.map((r) => ({
            date: r.date.slice(5),
            quantity: r.quantity,
          }))}
          xKey="date"
          yKey="quantity"
        />
        <BarChartCard
          title="Artículos más recibidos"
          data={d.topArticles}
          xKey="article"
          yKey="quantity"
          color="#059669"
        />
        <PieChartCard
          title="Distribución por categoría"
          description="Inventario disponible por categoría."
          data={d.categoryDistribution}
          nameKey="category"
          valueKey="quantity"
        />
        <BarChartCard
          title="Merma por centro"
          data={d.wasteByCenter}
          xKey="center"
          yKey="quantity"
          color="#dc2626"
        />
        <Card>
          <CardHeader>
            <CardTitle>Progreso de campañas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.campaignProgress.length === 0 && (
              <p className="text-sm text-slate-500">Sin metas registradas.</p>
            )}
            {d.campaignProgress.map((c) => (
              <div key={c.campaign}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-800">
                    {c.campaign}
                  </span>
                  <span className="text-slate-500">
                    {c.goals} metas · {formatPercent(c.avgPercent)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${Math.min(c.avgPercent * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Comparación entre centros
        </h2>
        <Table>
          <THead>
            <TR>
              <TH>Centro</TH>
              <TH className="text-right">Recepciones</TH>
              <TH className="text-right">Entregas</TH>
              <TH className="text-right">Merma</TH>
              <TH className="text-right">Transf. salida</TH>
              <TH className="text-right">Stock actual</TH>
            </TR>
          </THead>
          <TBody>
            {d.centerComparison.map((c) => (
              <TR key={c.center}>
                <TD className="font-medium text-slate-900">{c.center}</TD>
                <TD className="text-right tabular-nums">
                  {formatQuantity(c.receptions)}
                </TD>
                <TD className="text-right tabular-nums">
                  {formatQuantity(c.deliveries)}
                </TD>
                <TD className="text-right tabular-nums">
                  {formatQuantity(c.waste)}
                </TD>
                <TD className="text-right tabular-nums">
                  {formatQuantity(c.transfersOut)}
                </TD>
                <TD className="text-right font-medium tabular-nums text-slate-900">
                  {formatQuantity(c.stock)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
