import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/primitives";
import { AdjustmentForm } from "@/features/movements/forms";

export const metadata = { title: "Ajustes de inventario · Acopio Hub" };

export default async function AjustesPage() {
  const { user } = await requireCapabilityPage("adjustment.create");
  const catalogs = await getMovementFormData(user.centerId);

  return (
    <>
      <PageHeader
        title="Ajuste de inventario"
        description="Corrige el stock del sistema para que coincida con el conteo físico. Genera un movimiento de ajuste con motivo."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Ajustes" }]}
      />
      {catalogs.campaigns.length === 0 ? (
        <EmptyState title="No hay campañas activas para tu centro." />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-5">
            <AdjustmentForm catalogs={catalogs} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
