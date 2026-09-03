import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, toPrincipal } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CampaignForm } from "@/features/catalog/forms";
import { ToggleActiveButton } from "@/features/catalog/row-actions";
import { toggleCampaignAction } from "@/features/catalog/actions";
import { formatDate, toDateInputValue } from "@/lib/format";

export const metadata = { title: "Campañas · Acopia" };

export default async function CampanasPage() {
  const user = await requireUser();
  const p = toPrincipal(user);
  const isCoord = can(p, "campaign.create");

  if (!isCoord && user.role === "LIDER_CAMPANA" && user.campaignId) {
    redirect(`/campanas/${user.campaignId}`);
  }

  const campaigns = await prisma.campaign.findMany({
    where: isCoord ? {} : { id: user.campaignId ?? "__none__" },
    include: { _count: { select: { centers: true, movements: true, goals: true } } },
    orderBy: [{ active: "desc" }, { startDate: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Campañas"
        description="Campañas de acopio y los centros que participan en cada una."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Campañas" }]}
      />

      <div className="space-y-6">
        {isCoord && (
          <Card>
            <CardHeader>
              <CardTitle>Nueva campaña</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignForm
                defaults={{
                  name: "",
                  description: null,
                  startDate: toDateInputValue(new Date()),
                  endDate: null,
                }}
              />
            </CardContent>
          </Card>
        )}

        {campaigns.length === 0 ? (
          <EmptyState title="No existen campañas activas." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Campaña</TH>
                <TH>Inicio</TH>
                <TH className="text-right">Centros</TH>
                <TH className="text-right">Movimientos</TH>
                <TH className="text-right">Metas</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {campaigns.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium text-slate-900">
                    <Link href={`/campanas/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TD>
                  <TD className="text-slate-500">{formatDate(c.startDate)}</TD>
                  <TD className="text-right tabular-nums">{c._count.centers}</TD>
                  <TD className="text-right tabular-nums">
                    {c._count.movements}
                  </TD>
                  <TD className="text-right tabular-nums">{c._count.goals}</TD>
                  <TD>
                    <Badge color={c.active ? "green" : "slate"}>
                      {c.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/campanas/${c.id}`}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
                      >
                        Abrir
                      </Link>
                      {isCoord && (
                        <ToggleActiveButton
                          id={c.id}
                          active={c.active}
                          action={toggleCampaignAction}
                          entityLabel="la campaña"
                        />
                      )}
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </>
  );
}
