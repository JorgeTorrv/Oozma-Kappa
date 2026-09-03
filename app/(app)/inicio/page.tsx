import { requireUser } from "@/lib/auth/dal";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { CoordinatorDashboard } from "@/features/dashboard/coordinator";
import { CenterDashboard } from "@/features/dashboard/center";
import { CenterScopePicker } from "@/features/dashboard/center-scope-picker";
import { LeaderDashboard } from "@/features/dashboard/leader";
import { InstitutionDeliveries } from "@/features/institution/deliveries";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ centro?: string }>;
}) {
  const user = await requireUser();

  if (user.role === ROLES.COORDINADOR_GENERAL) {
    const { centro } = await searchParams;
    const centers = await prisma.center.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    const selected = centro
      ? centers.find((c) => c.id === centro)
      : undefined;

    return (
      <>
        <PageHeader
          title={selected ? `Panel · ${selected.name}` : "Panel global"}
          description={
            selected
              ? "Existencias, entradas, salidas y gráficas de este centro."
              : "Inventario, movimientos y progreso de todas las campañas y centros."
          }
        />
        <CenterScopePicker centers={centers} current={selected?.id} />
        {selected ? (
          <CenterDashboard centerId={selected.id} />
        ) : (
          <CoordinatorDashboard />
        )}
      </>
    );
  }

  if (
    user.role === ROLES.ENCARGADO_CENTRO ||
    user.role === ROLES.VOLUNTARIO_CENTRO
  ) {
    if (!user.centerId) {
      return (
        <EmptyState title="Tu cuenta no tiene un centro asignado. Contacta al coordinador." />
      );
    }
    return (
      <>
        <PageHeader
          title="Panel del centro"
          description="Existencias, entradas y salidas de tu centro."
        />
        <CenterDashboard centerId={user.centerId} />
      </>
    );
  }

  if (user.role === ROLES.LIDER_CAMPANA) {
    if (!user.campaignId) {
      return (
        <EmptyState title="Tu cuenta no tiene una campaña asignada. Contacta al coordinador." />
      );
    }
    return (
      <>
        <PageHeader
          title="Panel de campaña"
          description="Progreso, metas e inventario agregado de tu campaña."
        />
        <LeaderDashboard campaignId={user.campaignId} />
      </>
    );
  }

  if (user.role === ROLES.INSTITUCION_RECEPTORA) {
    if (!user.institutionId) {
      return (
        <EmptyState title="Tu cuenta no está asociada a una institución receptora." />
      );
    }
    return (
      <>
        <PageHeader
          title="Entregas a tu institución"
          description="Revisa y confirma las entregas dirigidas a tu institución."
        />
        <InstitutionDeliveries institutionId={user.institutionId} />
      </>
    );
  }

  return <EmptyState title="Rol no reconocido." />;
}
