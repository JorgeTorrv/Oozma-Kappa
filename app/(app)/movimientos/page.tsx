import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { toPrincipal } from "@/lib/auth/dal";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/page";
import { buttonVariants } from "@/components/ui/button";
import { HistoryFilters } from "@/features/history/filters";
import {
  MovementsTable,
  Pagination,
} from "@/features/history/movements-table";
import {
  buildScopedFilter,
  fetchFilterCatalogs,
  fetchMovementsPage,
  type RawParams,
} from "@/features/history/query";
import { Download } from "lucide-react";

export const metadata = { title: "Movimientos · Acopio Hub" };

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const user = await requireUser();
  const raw = await searchParams;
  const { filter, page } = buildScopedFilter(user, raw);
  const [catalogs, { items, total, pages }] = await Promise.all([
    fetchFilterCatalogs(user),
    fetchMovementsPage(filter, page),
  ]);

  const currentParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" && v) currentParams[k] = v;
  }
  const qs = new URLSearchParams(currentParams);
  const makeHref = (p: number) => {
    const u = new URLSearchParams(currentParams);
    u.set("page", String(p));
    return `/movimientos?${u.toString()}`;
  };
  const exportHref = `/api/export/movimientos?${qs.toString()}`;

  return (
    <>
      <PageHeader
        title="Historial de movimientos"
        description={`${total} movimiento(s). La trazabilidad es permanente: los movimientos no se editan ni se borran.`}
        breadcrumbs={[{ label: "Inicio", href: "/" }, { label: "Movimientos" }]}
        actions={
          can(toPrincipal(user), "export.data") && (
            <Link
              href={exportHref}
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
        <HistoryFilters catalogs={catalogs} current={currentParams} />
        <MovementsTable items={items} />
        <Pagination page={page} pages={pages} makeHref={makeHref} />
      </div>
    </>
  );
}
