import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/primitives";
import { ReceptionForm } from "@/features/movements/forms";

export const metadata = { title: "Registrar recepción · Acopio Hub" };

export default async function RecepcionesPage() {
  const { user } = await requireCapabilityPage("reception.create");
  const catalogs = await getMovementFormData(user.centerId);

  return (
    <>
      <PageHeader
        title="Registrar recepción"
        description="Alta rápida de donaciones físicas recibidas en el centro."
        breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Recepción" }]}
      />
      {catalogs.campaigns.length === 0 ? (
        <EmptyState
          title="No hay campañas activas para tu centro"
          description="Pide al coordinador que active una campaña y vincule tu centro."
        />
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-5">
            <ReceptionForm catalogs={catalogs} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
