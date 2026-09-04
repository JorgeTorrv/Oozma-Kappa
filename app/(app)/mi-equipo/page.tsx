import { requireCapabilityPage } from "@/lib/auth/dal";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { VolunteerPanel } from "@/features/team/panel";

export const metadata = { title: "Mi equipo · Acopia" };

/**
 * Sólo para el encargado de centro: su equipo de voluntarios, acotado a SU
 * centro. El coordinador general ya no usa esta pantalla — para ver quién
 * forma parte de un centro entra desde /centros; las solicitudes de
 * voluntariado de todos los centros se aprueban en /solicitudes.
 */
export default async function MiEquipoPage() {
  const { user } = await requireCapabilityPage("team.manage");

  if (!user.centerId) {
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
      <VolunteerPanel centerId={user.centerId} />
    </>
  );
}
