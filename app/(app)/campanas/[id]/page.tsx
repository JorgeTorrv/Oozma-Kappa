import { notFound } from "next/navigation";
import { requireUser, toPrincipal } from "@/lib/auth/dal";
import { can, canReadCampaign } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getCampaignGoalProgress } from "@/services/goal.service";
import { PageHeader, EmptyState } from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";
import { GoalProgress } from "@/components/ui/progress";
import { CampaignForm, GoalForm } from "@/features/catalog/forms";
import { DeleteGoalButton } from "@/features/catalog/row-actions";
import {
  deleteGoalAction,
  toggleCampaignCenterAction,
} from "@/features/catalog/actions";
import { CampaignCenterToggle } from "@/features/catalog/campaign-centers";
import { toDateInputValue } from "@/lib/format";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const p = toPrincipal(user);

  const isCoord = can(p, "campaign.update");
  const canGoals = can(p, "goal.manage");
  if (!isCoord && !canReadCampaign(p, id)) notFound();

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      centers: { include: { center: true } },
      _count: { select: { movements: true } },
    },
  });
  if (!campaign) notFound();

  const [allCenters, articles, goals] = await Promise.all([
    prisma.center.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.article.findMany({
      where: { active: true },
      select: { id: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
    getCampaignGoalProgress(id),
  ]);

  const linkedIds = new Set(campaign.centers.map((cc) => cc.centerId));

  return (
    <>
      <PageHeader
        title={campaign.name}
        description={campaign.description ?? undefined}
        breadcrumbs={[
          { label: "Inicio", href: "/" },
          { label: "Campañas", href: "/campanas" },
          { label: campaign.name },
        ]}
        actions={
          <Badge color={campaign.active ? "green" : "slate"}>
            {campaign.active ? "Activa" : "Inactiva"}
          </Badge>
        }
      />

      <div className="space-y-6">
        {isCoord && (
          <Card>
            <CardHeader>
              <CardTitle>Datos de la campaña</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignForm
                mode="edit"
                campaignId={campaign.id}
                defaults={{
                  name: campaign.name,
                  description: campaign.description,
                  startDate: toDateInputValue(campaign.startDate),
                  endDate: campaign.endDate
                    ? toDateInputValue(campaign.endDate)
                    : null,
                }}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Centros participantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allCenters.length === 0 && (
              <p className="text-sm text-slate-500">No hay centros activos.</p>
            )}
            {allCenters.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <span className="text-sm text-slate-800">{c.name}</span>
                {isCoord ? (
                  <CampaignCenterToggle
                    campaignId={campaign.id}
                    centerId={c.id}
                    linked={linkedIds.has(c.id)}
                    action={toggleCampaignCenterAction}
                  />
                ) : (
                  <Badge color={linkedIds.has(c.id) ? "green" : "slate"}>
                    {linkedIds.has(c.id) ? "Participa" : "No participa"}
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metas de recolección</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 && (
              <EmptyState
                title="Sin metas"
                description="Agrega metas por artículo o categoría para seguir el progreso."
              />
            )}
            {goals.map((g) => (
              <div key={g.id} className="flex items-end gap-3">
                <div className="flex-1">
                  <GoalProgress {...g} />
                </div>
                {canGoals && (
                  <DeleteGoalButton id={g.id} action={deleteGoalAction} />
                )}
              </div>
            ))}
            {canGoals && (
              <div className="border-t border-slate-100 pt-4">
                <GoalForm campaignId={campaign.id} articles={articles} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
