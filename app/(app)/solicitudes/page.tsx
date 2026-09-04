import Link from "next/link";
import { requireCapabilityPage } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/page";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Field, Select } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import { VolunteerDecisionButtons } from "@/features/team/buttons";
import { APPROVAL_STATUS, ROLES } from "@/lib/constants";
import { formatDate, formatPhone } from "@/lib/format";

export const metadata = { title: "Solicitudes · Acopia" };

/**
 * Solicitudes de voluntariado de TODOS los centros, para el coordinador
 * general. El encargado de centro sigue aprobando las suyas en /mi-equipo.
 */
export default async function SolicitudesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireCapabilityPage("users.manage");
  const raw = await searchParams;
  const centerId = raw.centerId || undefined;

  const [pending, centers] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: ROLES.VOLUNTARIO_CENTRO,
        approvalStatus: APPROVAL_STATUS.PENDING,
        ...(centerId ? { centerId } : {}),
      },
      include: { center: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.center.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Solicitudes de voluntariado"
        description="Cuentas que se registraron solas y esperan aprobación de un centro."
        breadcrumbs={[
          { label: "Inicio", href: "/inicio" },
          { label: "Solicitudes" },
        ]}
      />

      <div className="space-y-4">
        <form
          method="get"
          className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <Field label="Centro" htmlFor="centerId">
            <Select id="centerId" name="centerId" defaultValue={centerId ?? ""}>
              <option value="">Todos</option>
              {centers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit">Filtrar</Button>
          <Link href="/solicitudes" className={buttonVariants({ variant: "ghost" })}>
            Limpiar
          </Link>
        </form>

        {pending.length === 0 ? (
          <EmptyState title="No hay solicitudes de voluntariado pendientes." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Contacto</TH>
                <TH>Centro</TH>
                <TH>Solicitó</TH>
                <TH className="text-right">Decisión</TH>
              </TR>
            </THead>
            <TBody>
              {pending.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium text-slate-900">{u.name}</TD>
                  <TD className="text-slate-500">
                    {[u.phone ? formatPhone(u.phone) : null, u.email]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TD>
                  <TD className="text-slate-500">{u.center?.name ?? "—"}</TD>
                  <TD className="text-slate-500">{formatDate(u.createdAt)}</TD>
                  <TD className="text-right">
                    <VolunteerDecisionButtons userId={u.id} />
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
