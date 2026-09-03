import { getInstitutionDashboard } from "@/services/dashboard.service";
import { StatCard, EmptyState } from "@/components/ui/page";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { StatusBadge } from "@/components/movement-badge";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { ConfirmDeliveryButton } from "./confirm-button";

export async function InstitutionDeliveries({
  institutionId,
}: {
  institutionId: string;
}) {
  const { pending, confirmed } = await getInstitutionDashboard(institutionId);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3">
        <StatCard
          label="Entregas pendientes"
          value={pending.length}
          tone={pending.length > 0 ? "warning" : "default"}
        />
        <StatCard label="Entregas recibidas" value={confirmed.length} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Pendientes de confirmar
        </h2>
        {pending.length === 0 ? (
          <EmptyState title="No hay entregas pendientes." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Fecha</TH>
                <TH>Centro de origen</TH>
                <TH>Campaña</TH>
                <TH>Artículo</TH>
                <TH className="text-right">Cantidad</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acción</TH>
              </TR>
            </THead>
            <TBody>
              {pending.map((d) => (
                <TR key={d.id}>
                  <TD className="whitespace-nowrap text-slate-500">
                    {formatDateTime(d.createdAt)}
                  </TD>
                  <TD>{d.center.name}</TD>
                  <TD>{d.campaign.name}</TD>
                  <TD className="font-medium text-slate-900">{d.article.name}</TD>
                  <TD className="text-right tabular-nums">
                    {formatQuantity(d.quantity)} {d.article.unit}
                  </TD>
                  <TD>
                    <StatusBadge status={d.status} />
                  </TD>
                  <TD className="text-right">
                    <ConfirmDeliveryButton movementId={d.id} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Entregas recibidas
        </h2>
        {confirmed.length === 0 ? (
          <EmptyState title="Todavía no has confirmado ninguna entrega." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Fecha</TH>
                <TH>Centro de origen</TH>
                <TH>Campaña</TH>
                <TH>Artículo</TH>
                <TH className="text-right">Cantidad</TH>
                <TH>Estado</TH>
              </TR>
            </THead>
            <TBody>
              {confirmed.map((d) => (
                <TR key={d.id}>
                  <TD className="whitespace-nowrap text-slate-500">
                    {formatDateTime(d.confirmedAt ?? d.createdAt)}
                  </TD>
                  <TD>{d.center.name}</TD>
                  <TD>{d.campaign.name}</TD>
                  <TD className="font-medium text-slate-900">{d.article.name}</TD>
                  <TD className="text-right tabular-nums">
                    {formatQuantity(d.quantity)} {d.article.unit}
                  </TD>
                  <TD>
                    <StatusBadge status={d.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </div>
  );
}
