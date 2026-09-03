import { getCampaignDashboard } from "@/services/dashboard.service";
import { StatCard, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { GoalProgress } from "@/components/ui/progress";
import { BarChartCard } from "@/components/charts";
import { MovementBadge } from "@/components/movement-badge";
import { formatQuantity, formatDate } from "@/lib/format";

export async function LeaderDashboard({ campaignId }: { campaignId: string }) {
  const d = await getCampaignDashboard(campaignId);
  if (!d) return <EmptyState title="La campaña no existe." />;
  const t = d.totals;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">
          {d.campaign.name}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Inicio {formatDate(d.campaign.startDate)} ·{" "}
          {d.centers.length} centros participantes
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {d.centers.map((c) => (
            <Badge key={c.id} color="blue">
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Recepción total" value={formatQuantity(t.receptions)} />
        <StatCard label="Entregas" value={formatQuantity(t.deliveries)} />
        <StatCard
          label="Merma"
          value={formatQuantity(t.waste)}
          tone={t.waste > 0 ? "warning" : "default"}
        />
        <StatCard label="Transferencias" value={formatQuantity(t.transfers)} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">
            Metas de recolección
          </h3>
          <div className="mt-4 space-y-4">
            {d.goals.length === 0 && (
              <p className="text-sm text-slate-500">
                Esta campaña no tiene metas configuradas.
              </p>
            )}
            {d.goals.map((g) => (
              <GoalProgress key={g.id} {...g} />
            ))}
          </div>
        </div>
        <BarChartCard
          title="Inventario acumulado por centro"
          data={d.perCenterStock}
          xKey="center"
          yKey="quantity"
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Inventario agregado de la campaña
        </h2>
        <Table>
          <THead>
            <TR>
              <TH>Artículo</TH>
              <TH>Unidad</TH>
              <TH className="text-right">Disponible (todos los centros)</TH>
            </TR>
          </THead>
          <TBody>
            {d.aggregatedInventory.map((r) => (
              <TR key={r.article}>
                <TD className="font-medium text-slate-900">{r.article}</TD>
                <TD>{r.unit}</TD>
                <TD className="text-right font-medium tabular-nums">
                  {formatQuantity(r.quantity)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Movimientos relevantes
        </h2>
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Tipo</TH>
              <TH>Centro</TH>
              <TH>Artículo</TH>
              <TH className="text-right">Cantidad</TH>
            </TR>
          </THead>
          <TBody>
            {d.recent.map((m) => (
              <TR key={m.id}>
                <TD className="whitespace-nowrap text-slate-500">
                  {formatDate(m.createdAt)}
                </TD>
                <TD>
                  <MovementBadge type={m.type} />
                </TD>
                <TD>{m.center.name}</TD>
                <TD>{m.article.name}</TD>
                <TD className="text-right tabular-nums">
                  {formatQuantity(m.quantity)} {m.article.unit}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </section>
    </div>
  );
}
