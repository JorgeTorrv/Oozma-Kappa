import Link from "next/link";
import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DialogButton } from "@/components/ui/dialog";
import { CenterForm } from "@/features/catalog/forms";
import { ToggleActiveButton } from "@/features/catalog/row-actions";
import { toggleCenterAction } from "@/features/catalog/actions";
import { Users } from "lucide-react";

export const metadata = { title: "Centros · Acopia" };

export default async function CentrosPage() {
  await requireCapabilityPage("center.create");
  const centers = await prisma.center.findMany({
    include: {
      _count: { select: { campaigns: true, users: true } },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="Centros de acopio"
        description="Alta y administración de los centros de recolección."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Centros" }]}
        actions={
          <DialogButton label="Nuevo centro" title="Nuevo centro" width="xl">
            <CenterForm />
          </DialogButton>
        }
      />
      <div className="space-y-6">
        {centers.length === 0 ? (
          <EmptyState title="Aún no hay centros registrados." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Centro</TH>
                <TH>Dirección</TH>
                <TH className="text-right">Campañas</TH>
                <TH className="text-right">Usuarios</TH>
                <TH>Estado</TH>
                <TH className="text-right">Acciones</TH>
              </TR>
            </THead>
            <TBody>
              {centers.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium text-slate-900">{c.name}</TD>
                  <TD className="text-slate-500">{c.address ?? "—"}</TD>
                  <TD className="text-right tabular-nums">
                    {c._count.campaigns}
                  </TD>
                  <TD className="text-right tabular-nums">{c._count.users}</TD>
                  <TD>
                    <Badge color={c.active ? "green" : "slate"}>
                      {c.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/centros/${c.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
                        <Users className="size-4" />
                        Equipo
                      </Link>
                      <DialogButton
                        label="Editar"
                        title={`Editar centro: ${c.name}`}
                        variant="outline"
                        width="xl"
                      >
                        <CenterForm
                          mode="edit"
                          centerId={c.id}
                          defaults={{
                            name: c.name,
                            institution: c.institution,
                            address: c.address,
                            phone: c.phone,
                            latitude: c.latitude,
                            longitude: c.longitude,
                          }}
                        />
                      </DialogButton>
                      <ToggleActiveButton
                        id={c.id}
                        active={c.active}
                        action={toggleCenterAction}
                        entityLabel="el centro"
                      />
                    </div>
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
