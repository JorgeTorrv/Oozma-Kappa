import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { DialogButton } from "@/components/ui/dialog";
import { ReceptionForm } from "@/features/movements/forms";
import { MovementsTable } from "@/features/history/movements-table";
import { buildScopedFilter, fetchMovementsPage } from "@/features/history/query";
import { MOVEMENT_TYPES } from "@/lib/constants";

export const metadata = { title: "Registrar recepción · Acopia" };

export default async function RecepcionesPage() {
  const { user } = await requireCapabilityPage("reception.create");
  const catalogs = await getMovementFormData(user.centerId);
  const canRegister = catalogs.campaigns.length > 0;

  const { filter } = buildScopedFilter(user, { type: MOVEMENT_TYPES.RECEPTION });
  const { items } = await fetchMovementsPage(filter, 1);

  return (
    <>
      <PageHeader
        title="Recepciones"
        description="Alta rápida de donaciones físicas recibidas en el centro."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Recepción" }]}
        actions={
          canRegister ? (
            <DialogButton
              label="Nueva recepción"
              title="Registrar recepción"
              width="lg"
            >
              <ReceptionForm catalogs={catalogs} />
            </DialogButton>
          ) : undefined
        }
      />

      {!canRegister && (
        <EmptyState
          title="No hay campañas activas para tu centro"
          description="Pide al coordinador que active una campaña y vincule tu centro."
        />
      )}

      <MovementsTable items={items} />
    </>
  );
}
