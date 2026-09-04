import { requireCapabilityPage } from "@/lib/auth/dal";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  getResourceTrace,
  getTraceForMovement,
  listTraceableArticles,
} from "@/services/traceability.service";
import { PageHeader, EmptyState, StatCard } from "@/components/ui/page";
import { TraceControls } from "@/features/traceability/controls";
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

  const campaignRows = await prisma.campaign.findMany({
    where: campaignWhere,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Artículos con movimientos por campaña — se mandan al cliente para llenar los
  // desplegables sin un segundo viaje al servidor.
  const articleLists = await Promise.all(
    campaignRows.map((c) => listTraceableArticles(c.id)),
  );
  const campaigns = campaignRows.map((c, i) => ({
    id: c.id,
    name: c.name,
    articles: articleLists[i].map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
    })),
  }));

  let campaignId = raw.campaignId;
  let articleId = raw.articleId;
  let category = raw.category;
  let trace = null;

  if (raw.movimiento) {
    const t = await getTraceForMovement(raw.movimiento);
    if (t) {
      campaignId = t.campaignId;
      articleId = t.articleId;
      category = undefined;
      trace = t;
    }
  }

  // La campaña elegida debe estar dentro del ámbito del usuario.
  if (campaignId && !campaigns.some((c) => c.id === campaignId)) {
    campaignId = undefined;
    articleId = undefined;
    category = undefined;
    trace = null;
  }

  if (!trace && campaignId && (articleId || category)) {
    trace = await getResourceTrace({
      campaignId,
      articleId: articleId ?? null,
      category: category ?? null,
    });
  }

  return (
    <>
      <PageHeader
        title="Trazabilidad visual de los recursos"
        description="Sigue el recorrido de un artículo o de una categoría completa: donación → centro → transferencias → entrega a una institución."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Trazabilidad" },
        ]}
      />

      <div className="space-y-6">
        <TraceControls
          campaigns={campaigns}
          current={{ campaignId, articleId, category }}
        />

        {!trace ? (
          <EmptyState
            title="Elige una campaña y luego un artículo o una categoría"
            description="También puedes llegar aquí desde el botón «Trazar» del historial de movimientos."
          />
        ) : trace.events.length === 0 ? (
          <EmptyState title="No hay movimientos para esa selección en la campaña." />
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
