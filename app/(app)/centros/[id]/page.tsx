import { notFound } from "next/navigation";
import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Table, TBody, TH, THead, TR } from "@/components/ui/table";
import { UserRow } from "@/features/catalog/user-row";
import { PeopleFilters } from "@/features/team/filters";
import { APPROVAL_STATUS, ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

export const metadata = { title: "Equipo del centro · Acopia" };

/**
 * Quién forma parte de un centro (coordinador general). La edición de datos
 * del centro vive en el modal de /centros; esta pantalla es el equipo:
 * encargado y voluntarios, con su contacto y estado.
 */
export default async function CenterTeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user: viewer } = await requireCapabilityPage("users.manage");
  const { id } = await params;
  const raw = await searchParams;
  const role = raw.role || undefined;
  const status = raw.status;

  const center = await prisma.center.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!center) notFound();

  const [users, allCenters, institutions, campaigns] = await Promise.all([
    prisma.user.findMany({
      where: {
        centerId: id,
        approvalStatus: APPROVAL_STATUS.APPROVED,
        ...(role ? { role } : {}),
        ...(status === "active"
          ? { active: true }
          : status === "inactive"
            ? { active: false }
            : {}),
      },
      include: {
        center: { select: { name: true } },
        institution: { select: { name: true } },
        campaign: { select: { name: true } },
      },
      orderBy: [{ role: "asc" }, { active: "desc" }, { name: "asc" }],
    }),
    prisma.center.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.recipientInstitution.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.campaign.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title={`Equipo · ${center.name}`}
        description="Encargado y voluntarios que forman parte de este centro."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Centros", href: "/centros" },
          { label: center.name },
        ]}
      />

      <div className="space-y-4">
        <PeopleFilters
          roles={[ROLES.ENCARGADO_CENTRO, ROLES.VOLUNTARIO_CENTRO]}
          current={{ role, status }}
          basePath={`/centros/${id}`}
        />

        {users.length === 0 ? (
          <EmptyState
            title="Nadie coincide con ese filtro."
            description="Las solicitudes pendientes de este centro se aprueban en Solicitudes."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Contacto</TH>
                <TH>Rol</TH>
                <TH>Ámbito</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  self={u.id === viewer.id}
                  user={{
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role,
                    roleLabel: ROLE_LABELS[u.role as Role] ?? u.role,
                    active: u.active,
                    scope:
                      u.center?.name ??
                      u.institution?.name ??
                      u.campaign?.name ??
                      "—",
                    centerId: u.centerId,
                    institutionId: u.institutionId,
                    campaignId: u.campaignId,
                  }}
                  centers={allCenters}
                  institutions={institutions}
                  campaigns={campaigns}
                />
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </>
  );
}
