import Link from "next/link";
import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CenterForm } from "@/features/catalog/forms";
import { ToggleActiveButton } from "@/features/catalog/row-actions";
import { toggleCenterAction } from "@/features/catalog/actions";

export const metadata = { title: "Centros · Acopio Hub" };

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
      />
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo centro</CardTitle>
          </CardHeader>
          <CardContent>
            <CenterForm />
          </CardContent>
        </Card>

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
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
                      >
                        Editar
                      </Link>
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
