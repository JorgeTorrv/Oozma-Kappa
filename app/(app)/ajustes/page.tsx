import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { DialogButton } from "@/components/ui/dialog";
import { AdjustmentForm } from "@/features/movements/forms";
import { MovementsTable } from "@/features/history/movements-table";
import { buildScopedFilter, fetchMovementsPage } from "@/features/history/query";

export const metadata = { title: "Ajustes de inventario · Acopia" };

export default async function AjustesPage() {
  const { user } = await requireCapabilityPage("adjustment.create");
  const catalogs = await getMovementFormData(user.centerId);
  const centerInactive =
    Boolean(user.centerId) &&
    !catalogs.centers.some((c) => c.id === user.centerId);
  const canRegister = !centerInactive && catalogs.campaigns.length > 0;

  const { filter } = buildScopedFilter(user, {});
  const { items } = await fetchMovementsPage(filter, 1);
  const adjustments = items.filter((m) => m.type.startsWith("ADJUSTMENT_"));

  return (
    <>
      <PageHeader
        title="Ajustes de inventario"
        description="Corrige el stock del sistema para que coincida con el conteo físico. Genera un movimiento de ajuste con motivo."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Ajustes" }]}
        actions={
          canRegister ? (
            <DialogButton
              label="Nuevo ajuste"
              title="Ajuste de inventario"
              width="lg"
            >
              <AdjustmentForm catalogs={catalogs} />
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
          <EmptyState title="No hay campañas activas para tu centro." />
        )
      )}

      {adjustments.length > 0 ? (
        <MovementsTable items={adjustments} />
      ) : (
        <EmptyState
          title="Sin ajustes recientes"
          description="Los ajustes que registres aparecerán aquí y en el historial de movimientos."
        />
      )}
    </>
  );
}
