import Link from "next/link";
import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import { Table, TBody, TH, THead, TR } from "@/components/ui/table";
import { DialogButton } from "@/components/ui/dialog";
import { UserForm } from "@/features/catalog/forms";
import { UserRow } from "@/features/catalog/user-row";
import { PeopleFilters } from "@/features/team/filters";
import {
  APPROVAL_STATUS,
  ROLE_LABELS,
  ROLE_LIST,
  type Role,
} from "@/lib/constants";
import { UserCheck } from "lucide-react";

export const metadata = { title: "Usuarios · Acopia" };

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { user } = await requireCapabilityPage("users.manage");
  const raw = await searchParams;
  const role = raw.role || undefined;
  const centerId = raw.centerId || undefined;
  const status = raw.status;

  const [users, centers, institutions, campaigns, pendingCount] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          ...(role ? { role } : {}),
          ...(centerId ? { centerId } : {}),
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
        orderBy: [{ active: "desc" }, { name: "asc" }],
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
      prisma.user.count({
        where: {
          role: "VOLUNTARIO_CENTRO",
          approvalStatus: APPROVAL_STATUS.PENDING,
        },
      }),
    ]);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas del sistema y sus roles. Nunca se muestran contraseñas."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Usuarios" }]}
        actions={
          <DialogButton label="Nuevo usuario" title="Nuevo usuario" width="lg">
            <UserForm
              centers={centers}
              institutions={institutions}
              campaigns={campaigns}
            />
          </DialogButton>
        }
      />

      <div className="space-y-4">
        {pendingCount > 0 && (
          <Link
            href="/solicitudes"
            className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 hover:bg-brand-100"
          >
            <UserCheck className="size-4 shrink-0" />
            {pendingCount} solicitud{pendingCount === 1 ? "" : "es"} de
            voluntariado pendiente{pendingCount === 1 ? "" : "s"} — ver
            solicitudes
          </Link>
        )}

        <PeopleFilters
          roles={ROLE_LIST}
          centers={centers}
          current={{ role, centerId, status }}
          basePath="/usuarios"
        />

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
                self={u.id === user.id}
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
                centers={centers}
                institutions={institutions}
                campaigns={campaigns}
              />
            ))}
          </TBody>
        </Table>
      </div>
    </>
  );
}
