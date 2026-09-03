import Link from "next/link";
import { requireUser, toPrincipal } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { listInventoryView } from "@/services/inventory.service";
import { PageHeader, StatCard, EmptyState } from "@/components/ui/page";
import { buttonVariants } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/primitives";
import { formatQuantity } from "@/lib/format";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { Download } from "lucide-react";

export const metadata = { title: "Inventario · Acopio Hub" };

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const p = toPrincipal(user);
  const raw = await searchParams;

  // Ámbito.
  let campaignId: string | undefined;
  let centerId: string | undefined;
  const isCoord = user.role === ROLES.COORDINADOR_GENERAL;

  if (isCoord) {
    campaignId = raw.campaignId || undefined;
    centerId = raw.centerId || undefined;
  } else if (user.role === ROLES.LIDER_CAMPANA) {
    campaignId = user.campaignId ?? "__none__";
  } else {
    centerId = user.centerId ?? "__none__";
  }

  const [{ rows, total }, campaigns, centers] = await Promise.all([
    listInventoryView({ campaignId, centerId }),
    isCoord
      ? prisma.campaign.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isCoord
      ? prisma.center.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const lowCount = rows.filter((r) => r.quantity <= LOW_STOCK_THRESHOLD).length;
  const exportQs = new URLSearchParams();
  if (campaignId && campaignId !== "__none__")
    exportQs.set("campaignId", campaignId);
  if (centerId && centerId !== "__none__") exportQs.set("centerId", centerId);

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Existencias actuales calculadas desde los movimientos (centro + campaña + artículo)."
        breadcrumbs={[{ label: "Inicio", href: "/inicio" }, { label: "Inventario" }]}
        actions={
          can(p, "export.data") && (
            <Link
              href={`/api/export/inventario?${exportQs.toString()}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              prefetch={false}
            >
              <Download className="size-4" />
              Exportar CSV
            </Link>
          )
        }
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Líneas de inventario" value={rows.length} />
          <StatCard label="Total unidades" value={formatQuantity(total)} />
          <StatCard
            label="Con stock bajo"
            value={lowCount}
            tone={lowCount > 0 ? "warning" : "default"}
          />
        </div>

        {isCoord && (
          <form
            method="get"
            className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3"
          >
            <Field label="Campaña" htmlFor="campaignId">
              <Select
                id="campaignId"
                name="campaignId"
                defaultValue={raw.campaignId ?? ""}
              >
                <option value="">Todas</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Centro" htmlFor="centerId">
              <Select
                id="centerId"
                name="centerId"
                defaultValue={raw.centerId ?? ""}
              >
                <option value="">Todos</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                className={buttonVariants({ variant: "default" })}
              >
                Filtrar
              </button>
            </div>
          </form>
        )}

        {rows.length === 0 ? (
          <EmptyState title="No hay inventario para el ámbito seleccionado." />
        ) : (
          <Table>
            <THead>
              <TR>
                {isCoord && <TH>Centro</TH>}
                <TH>Artículo</TH>
                <TH>Categoría</TH>
                <TH>Unidad</TH>
                <TH className="text-right">Disponible</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  {isCoord && <TD>{r.center}</TD>}
                  <TD className="font-medium text-slate-900">
                    {r.article}
                    {r.quantity <= LOW_STOCK_THRESHOLD && (
                      <Badge color="amber" className="ml-2">
                        bajo
                      </Badge>
                    )}
                  </TD>
                  <TD>{r.category}</TD>
                  <TD>{r.unit}</TD>
                  <TD className="text-right font-medium tabular-nums">
                    {formatQuantity(r.quantity)}
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
