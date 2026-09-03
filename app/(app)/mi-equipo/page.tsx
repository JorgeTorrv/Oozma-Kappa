import { requireCapabilityPage } from "@/lib/auth/dal";
import { ROLES } from "@/lib/constants";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { VolunteerPanel } from "@/features/team/panel";

export const metadata = { title: "Mi equipo · Acopia" };

export default async function MiEquipoPage() {
  const { user } = await requireCapabilityPage("team.manage", "users.manage");

  // El encargado ve sólo su centro. El coordinador ve todos.
  const scopedCenter =
    user.role === ROLES.ENCARGADO_CENTRO ? user.centerId : undefined;

  if (user.role === ROLES.ENCARGADO_CENTRO && !user.centerId) {
    return (
      <EmptyState title="Tu cuenta no tiene un centro asignado. Contacta al coordinador." />
    );
  }

  return (
    <>
      <PageHeader
        title="Mi equipo de voluntarios"
        description="Aprueba las solicitudes de voluntariado y administra a tu equipo."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Mi equipo" },
        ]}
      />
      <VolunteerPanel centerId={scopedCenter ?? undefined} />
    </>
  );
}
