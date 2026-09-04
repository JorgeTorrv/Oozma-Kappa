import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { DialogButton } from "@/components/ui/dialog";
import { DeliveryForm } from "@/features/movements/forms";
import { MovementsTable } from "@/features/history/movements-table";
import { buildScopedFilter, fetchMovementsPage } from "@/features/history/query";
import { MOVEMENT_TYPES } from "@/lib/constants";

export const metadata = { title: "Entregas · Acopia" };

export default async function EntregasPage() {
  const { user } = await requireCapabilityPage("delivery.create");
  const catalogs = await getMovementFormData(user.centerId);
  const centerInactive =
    Boolean(user.centerId) &&
    !catalogs.centers.some((c) => c.id === user.centerId);
  const canRegister =
    !centerInactive &&
    catalogs.campaigns.length > 0 &&
    catalogs.institutions.length > 0;

  const { filter } = buildScopedFilter(user, { type: MOVEMENT_TYPES.DELIVERY });
  const { items } = await fetchMovementsPage(filter, 1);

  return (
    <>
      <PageHeader
        title="Entregas"
        description="Canalización de artículos desde el centro hacia una institución receptora."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Entregas" }]}
        actions={
          canRegister ? (
            <DialogButton
              label="Nueva entrega"
              title="Registrar entrega"
              width="lg"
            >
              <DeliveryForm catalogs={catalogs} />
            </DialogButton>
          ) : undefined
        }
      />

      {centerInactive ? (
        <EmptyState
          title="Tu centro está desactivado"
          description="Puedes seguir consultando su información, pero no se pueden registrar movimientos hasta que el coordinador lo reactive."
        />
      ) : (
        !canRegister && (
          <EmptyState
            title="Faltan datos para registrar entregas"
            description="Se necesita al menos una campaña activa y una institución receptora."
          />
        )
      )}

      <MovementsTable items={items} />
    </>
  );
}
