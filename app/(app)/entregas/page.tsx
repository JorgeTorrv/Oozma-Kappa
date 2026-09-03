import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/primitives";
import { DeliveryForm } from "@/features/movements/forms";

export const metadata = { title: "Entregas · Acopia" };

export default async function EntregasPage() {
  const { user } = await requireCapabilityPage("delivery.create");
  const catalogs = await getMovementFormData(user.centerId);

  return (
    <>
      <PageHeader
        title="Registrar entrega"
        description="Canalización de artículos desde el centro hacia una institución receptora."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Entregas" }]}
      />
      {catalogs.campaigns.length === 0 || catalogs.institutions.length === 0 ? (
        <EmptyState
          title="Faltan datos para registrar entregas"
          description="Se necesita al menos una campaña activa y una institución receptora."
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-5">
            <DeliveryForm catalogs={catalogs} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
