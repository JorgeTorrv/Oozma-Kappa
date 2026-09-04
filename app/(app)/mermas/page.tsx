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
import { DialogButton } from "@/components/ui/dialog";
import { WasteForm } from "@/features/movements/forms";
import { WasteApprovalList } from "@/features/movements/waste-approval";
import { WasteHistory } from "@/features/movements/waste-history";
import { isWasteApprovalEnabled } from "@/services/movements.service";
import { ROLES } from "@/lib/constants";

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
  const centerInactive =
    Boolean(user.centerId) &&
    Boolean(catalogs) &&
    !catalogs!.centers.some((c) => c.id === user.centerId);
  const canRegister =
    !centerInactive && Boolean(catalogs && catalogs.campaigns.length > 0);

  return (
    <>
      <PageHeader
        title="Mermas"
        description="Registro de mermas con motivo obligatorio. Permanecen visibles en el historial."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Mermas" }]}
        actions={
          canRegister && catalogs ? (
            <DialogButton
              label="Nueva merma"
              title="Registrar merma"
              description={
                isWasteApprovalEnabled()
                  ? "Con la aprobación activada, la merma queda pendiente y no descuenta stock hasta que el coordinador la apruebe."
                  : undefined
              }
              width="lg"
            >
              <WasteForm catalogs={catalogs} />
            </DialogButton>
          ) : undefined
        }
      />

      <div className="space-y-6">
        {canCreate && centerInactive && (
          <EmptyState
            title="Tu centro está desactivado"
            description="Puedes seguir consultando su información, pero no se pueden registrar movimientos hasta que el coordinador lo reactive."
          />
        )}
        {canCreate && !centerInactive && !canRegister && (
          <EmptyState title="No hay campañas activas para tu centro." />
        )}

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

        <Card>
          <CardHeader>
            <CardTitle>Historial de mermas</CardTitle>
            <p className="text-xs text-slate-500">
              Todas las mermas: pendientes, aprobadas y rechazadas.
            </p>
          </CardHeader>
          <CardContent>
            <WasteHistory
              centerId={
                user.role === ROLES.COORDINADOR_GENERAL ? null : user.centerId
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
