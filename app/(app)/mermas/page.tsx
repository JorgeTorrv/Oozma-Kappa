import { requireUser, toPrincipal } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { getMovementFormData } from "@/features/movements/data";
import { PageHeader, EmptyState } from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";
import { WasteForm } from "@/features/movements/forms";
import { WasteApprovalList } from "@/features/movements/waste-approval";
import { isWasteApprovalEnabled } from "@/services/movements.service";

export const metadata = { title: "Mermas · Acopia" };

export default async function MermasPage() {
  const user = await requireUser();
  const p = toPrincipal(user);
  const canCreate = can(p, "waste.create");
  const canApprove = can(p, "waste.approve");

  if (!canCreate && !canApprove) {
    return <EmptyState title="No tienes acceso a esta sección." />;
  }

  const catalogs = canCreate
    ? await getMovementFormData(user.centerId)
    : null;

  return (
    <>
      <PageHeader
        title="Mermas"
        description="Registro de mermas con motivo obligatorio. Permanecen visibles en el historial."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Mermas" }]}
      />

      <div className="space-y-6">
        {canApprove && (
          <Card>
            <CardHeader>
              <CardTitle>Mermas pendientes de aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              <WasteApprovalList />
            </CardContent>
          </Card>
        )}

        {canCreate && catalogs && (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Registrar merma</CardTitle>
              {isWasteApprovalEnabled() && (
                <p className="text-xs text-slate-500">
                  Con la aprobación activada, la merma queda pendiente y no
                  descuenta stock hasta que el coordinador la apruebe.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {catalogs.campaigns.length === 0 ? (
                <EmptyState title="No hay campañas activas para tu centro." />
              ) : (
                <WasteForm catalogs={catalogs} />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
