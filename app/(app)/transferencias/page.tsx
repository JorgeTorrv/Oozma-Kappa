import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { DialogButton } from "@/components/ui/dialog";
import { TransferForm } from "@/features/movements/forms";
import { MovementsTable } from "@/features/history/movements-table";
import { buildScopedFilter, fetchMovementsPage } from "@/features/history/query";
import { MOVEMENT_TYPES } from "@/lib/constants";

export const metadata = { title: "Transferencias · Acopia" };

export default async function TransferenciasPage() {
  const { user } = await requireCapabilityPage("transfer.create");
  const catalogs = await getMovementFormData(user.centerId);
  const canRegister =
    catalogs.campaigns.length > 0 && catalogs.centers.length >= 2;

  const { filter } = buildScopedFilter(user, {
    type: MOVEMENT_TYPES.TRANSFER_OUT,
  });
  const { items } = await fetchMovementsPage(filter, 1);

  return (
    <>
      <PageHeader
        title="Transferencias entre centros"
        description="Mueve inventario de un centro a otro dentro de la misma campaña. La operación es atómica."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Transferencias" },
        ]}
        actions={
          canRegister ? (
            <DialogButton
              label="Nueva transferencia"
              title="Transferencia entre centros"
              width="lg"
            >
              <TransferForm
                catalogs={catalogs}
                lockedFromCenterId={user.centerId}
              />
            </DialogButton>
          ) : undefined
        }
      />

      {!canRegister && (
        <EmptyState
          title="No es posible transferir todavía"
          description="Se necesitan al menos dos centros activos en una campaña."
        />
      )}

      <MovementsTable items={items} />
    </>
  );
}
