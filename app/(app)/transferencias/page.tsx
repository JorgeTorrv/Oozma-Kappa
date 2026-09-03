import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/primitives";
import { TransferForm } from "@/features/movements/forms";

export const metadata = { title: "Transferencias · Acopio Hub" };

export default async function TransferenciasPage() {
  const { user } = await requireCapabilityPage("transfer.create");
  const catalogs = await getMovementFormData(user.centerId);

  return (
    <>
      <PageHeader
        title="Transferencia entre centros"
        description="Mueve inventario de un centro a otro dentro de la misma campaña. La operación es atómica."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Transferencias" },
        ]}
      />
      {catalogs.campaigns.length === 0 || catalogs.centers.length < 2 ? (
        <EmptyState
          title="No es posible transferir todavía"
          description="Se necesitan al menos dos centros activos en una campaña."
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-5">
            <TransferForm
              catalogs={catalogs}
              lockedFromCenterId={user.centerId}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
