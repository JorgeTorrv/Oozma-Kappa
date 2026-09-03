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
import { UserForm } from "@/features/catalog/forms";
import { UserRow } from "@/features/catalog/user-row";
import { ROLE_LABELS, type Role } from "@/lib/constants";

export const metadata = { title: "Usuarios · Acopio Hub" };

export default async function UsuariosPage() {
  const { user } = await requireCapabilityPage("users.manage");

  const [users, centers, institutions, campaigns] = await Promise.all([
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
  ]);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas del sistema y sus roles. Nunca se muestran contraseñas."
        breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Usuarios" }]}
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              centers={centers}
              institutions={institutions}
              campaigns={campaigns}
            />
          </CardContent>
        </Card>

        <Table>
          <THead>
            <TR>
              <TH>Nombre</TH>
              <TH>Correo</TH>
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
