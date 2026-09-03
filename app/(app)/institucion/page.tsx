import { requireCapabilityPage } from "@/lib/auth/dal";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { InstitutionDeliveries } from "@/features/institution/deliveries";

export const metadata = { title: "Entregas recibidas · Acopia" };

export default async function InstitucionPage() {
  const { user } = await requireCapabilityPage("delivery.confirm");

  if (!user.institutionId) {
    return (
      <EmptyState title="Tu cuenta no está asociada a una institución receptora." />
    );
  }

  return (
    <>
      <PageHeader
        title="Entregas a tu institución"
        description="Consulta las entregas dirigidas a tu institución y confírmalas cuando las recibas."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Entregas recibidas" },
        ]}
      />
      <InstitutionDeliveries institutionId={user.institutionId} />
    </>
  );
}
