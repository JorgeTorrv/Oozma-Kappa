import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DialogButton } from "@/components/ui/dialog";
import { InstitutionForm } from "@/features/catalog/forms";
import { ToggleActiveButton } from "@/features/catalog/row-actions";
import { toggleInstitutionAction } from "@/features/catalog/actions";

export const metadata = { title: "Instituciones receptoras · Acopia" };

export default async function InstitucionesPage() {
  await requireCapabilityPage("institution.manage");
  const institutions = await prisma.recipientInstitution.findMany({
    include: { _count: { select: { movements: true, users: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Instituciones receptoras"
        description="Organizaciones a las que se canalizan los artículos acopiados."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Instituciones" },
        ]}
        actions={
          <DialogButton
            label="Nueva institución"
            title="Nueva institución"
            width="lg"
          >
            <InstitutionForm />
          </DialogButton>
        }
      />
      <div className="space-y-6">
        {institutions.length === 0 ? (
          <EmptyState title="No hay instituciones registradas." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Institución</TH>
                <TH>Contacto</TH>
                <TH>Teléfono</TH>
                <TH className="text-right">Entregas</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {institutions.map((i) => (
                <TR key={i.id}>
                  <TD className="font-medium text-slate-900">{i.name}</TD>
                  <TD className="text-slate-500">{i.contactName ?? "—"}</TD>
                  <TD className="text-slate-500">{i.phone ?? "—"}</TD>
                  <TD className="text-right tabular-nums">
                    {i._count.movements}
                  </TD>
                  <TD>
                    <Badge color={i.active ? "green" : "slate"}>
                      {i.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <ToggleActiveButton
                      id={i.id}
                      active={i.active}
                      action={toggleInstitutionAction}
                      entityLabel="la institución"
                    />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </>
  );
}
