import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";
import { Table, TBody, TH, THead, TR } from "@/components/ui/table";
import { DialogButton } from "@/components/ui/dialog";
import { UserForm } from "@/features/catalog/forms";
import { UserRow } from "@/features/catalog/user-row";
import { VolunteerPanel } from "@/features/team/panel";
import { APPROVAL_STATUS, ROLE_LABELS, type Role } from "@/lib/constants";

export const metadata = { title: "Usuarios · Acopia" };

export default async function UsuariosPage() {
  const { user } = await requireCapabilityPage("users.manage");

  const [users, centers, institutions, campaigns, pendingCount] =
    await Promise.all([
    prisma.user.findMany({
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

      <div className="space-y-6">
        {pendingCount > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Solicitudes de voluntariado ({pendingCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VolunteerPanel showActive={false} />
            </CardContent>
          </Card>
        )}

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
