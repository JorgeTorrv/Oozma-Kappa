import { requireCapabilityPage } from "@/lib/auth/dal";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  getResourceTrace,
  getTraceForMovement,
  listTraceableArticles,
} from "@/services/traceability.service";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/page";
import { Field, Select } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { TraceTimeline } from "@/features/traceability/timeline";
import { formatQuantity } from "@/lib/format";

export const metadata = { title: "Trazabilidad · Acopia" };

export default async function TrazabilidadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user } = await requireCapabilityPage("traceability.read");
  const raw = await searchParams;

  // Campañas visibles según el rol.
  const campaignWhere =
    user.role === ROLES.COORDINADOR_GENERAL
      ? {}
      : user.role === ROLES.LIDER_CAMPANA
        ? { id: user.campaignId ?? "__none__" }
        : { centers: { some: { centerId: user.centerId ?? "__none__" } } };

  const campaigns = await prisma.campaign.findMany({
    where: campaignWhere,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  let campaignId = raw.campaignId;
  let articleId = raw.articleId;
  let trace = null;

  if (raw.movimiento) {
    const t = await getTraceForMovement(raw.movimiento);
    if (t) {
      campaignId = t.campaignId;
      articleId = t.articleId;
      trace = t;
    }
  }

  // Valida que la campaña elegida esté dentro del ámbito.
  if (campaignId && !campaigns.some((c) => c.id === campaignId)) {
    campaignId = undefined;
    articleId = undefined;
    trace = null;
  }

  const articles = campaignId
    ? await listTraceableArticles(campaignId)
    : [];

  if (!trace && campaignId && articleId) {
    trace = await getResourceTrace({ campaignId, articleId });
  }

  return (
    <>
      <PageHeader
        title="Trazabilidad visual de los recursos"
        description="Sigue el recorrido de un artículo: donación → centro → transferencias → entrega a una institución."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Trazabilidad" },
        ]}
      />

      <div className="space-y-6">
        <form
          method="get"
          className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3"
        >
          <Field label="Campaña" htmlFor="campaignId">
            <Select
              id="campaignId"
              name="campaignId"
              defaultValue={campaignId ?? ""}
            >
              <option value="">Selecciona…</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Artículo" htmlFor="articleId">
            <Select
              id="articleId"
              name="articleId"
              defaultValue={articleId ?? ""}
              disabled={!campaignId}
            >
              <option value="">
                {campaignId ? "Selecciona…" : "Elige campaña primero"}
              </option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit">Ver trazabilidad</Button>
          </div>
        </form>

        {!trace ? (
          <EmptyState
            title="Elige una campaña y un artículo"
            description="También puedes llegar aquí desde el botón «Trazar» del historial de movimientos."
          />
        ) : trace.events.length === 0 ? (
          <EmptyState title="Ese artículo no tiene movimientos en la campaña." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Recibido"
                value={formatQuantity(trace.summary.received)}
              />
              <StatCard
                label="Entregado"
                value={formatQuantity(trace.summary.delivered)}
              />
              <StatCard
                label="Merma"
                value={formatQuantity(trace.summary.wasted)}
              />
              <StatCard label="Transferencias" value={trace.summary.transfers} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded bg-slate-100 px-2 py-1">
                Centros: {trace.summary.centersTouched.join(" · ")}
              </span>
              {trace.summary.institutionsReached.length > 0 && (
                <span className="rounded bg-slate-100 px-2 py-1">
                  Instituciones: {trace.summary.institutionsReached.join(" · ")}
                </span>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <TraceTimeline events={trace.events} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
