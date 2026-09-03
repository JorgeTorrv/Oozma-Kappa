import { notFound } from "next/navigation";
import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { CenterForm } from "@/features/catalog/forms";

export default async function CenterEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireCapabilityPage("center.update");
  const center = await prisma.center.findUnique({ where: { id } });
  if (!center) notFound();

  return (
    <>
      <PageHeader
        title={`Editar: ${center.name}`}
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Centros", href: "/centros" },
          { label: center.name },
        ]}
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Datos del centro</CardTitle>
        </CardHeader>
        <CardContent>
          <CenterForm
            mode="edit"
            centerId={center.id}
            defaults={{
              name: center.name,
              institution: center.institution,
              address: center.address,
              latitude: center.latitude,
              longitude: center.longitude,
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
