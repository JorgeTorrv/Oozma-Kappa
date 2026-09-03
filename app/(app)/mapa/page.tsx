import { requireCapabilityPage } from "@/lib/auth/dal";
import { getMapCenters } from "@/features/map/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { CentersMap } from "@/features/map/centers-map";

export const metadata = { title: "Mapa de centros · Acopio Hub" };

export default async function MapaPage() {
  await requireCapabilityPage("inventory.global.read", "inventory.campaign.read");
  const centers = await getMapCenters();

  return (
    <>
      <PageHeader
        title="Mapa de centros"
        description="Ubicación de los centros de acopio y su inventario resumido (OpenStreetMap, sin servicios de pago)."
        breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Mapa" }]}
      />
      {centers.length === 0 ? (
        <EmptyState title="No hay centros activos para mostrar." />
      ) : (
        <CentersMap centers={centers} />
      )}
    </>
  );
}
