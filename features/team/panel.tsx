import { prisma } from "@/lib/db";
import { APPROVAL_STATUS, ROLES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/page";
import { Badge } from "@/components/ui/primitives";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import {
  VolunteerDecisionButtons,
  VolunteerToggleButton,
} from "./buttons";

/**
 * Lista de voluntarios y solicitudes pendientes.
 *  - `centerId`  → sólo ese centro (vista del encargado).
 *  - sin centerId → todos los centros (vista del coordinador).
 */
export async function VolunteerPanel({
  centerId,
  showActive = true,
}: {
  centerId?: string;
  showActive?: boolean;
}) {
  const where = {
    role: ROLES.VOLUNTARIO_CENTRO,
    ...(centerId ? { centerId } : {}),
  };

  const [pending, active] = await Promise.all([
    prisma.user.findMany({
      where: { ...where, approvalStatus: APPROVAL_STATUS.PENDING },
      include: { center: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    showActive
      ? prisma.user.findMany({
          where: { ...where, approvalStatus: APPROVAL_STATUS.APPROVED },
          include: { center: { select: { name: true } } },
          orderBy: [{ active: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Solicitudes pendientes ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState title="No hay solicitudes de voluntariado pendientes." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Nombre</TH>
                <TH>Contacto</TH>
                {!centerId && <TH>Centro</TH>}
                <TH>Solicitó</TH>
                <TH className="text-right">Decisión</TH>
              </TR>
            </THead>
            <TBody>
              {pending.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium text-slate-900">{u.name}</TD>
                  <TD className="text-slate-500">
                    {[u.phone, u.email].filter(Boolean).join(" · ") || "—"}
                  </TD>
                  {!centerId && <TD>{u.center?.name ?? "—"}</TD>}
                  <TD className="text-slate-500">{formatDate(u.createdAt)}</TD>
                  <TD className="text-right">
                    <VolunteerDecisionButtons userId={u.id} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      {showActive && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Voluntarios ({active.length})
          </h2>
          {active.length === 0 ? (
            <EmptyState title="Todavía no hay voluntarios aprobados." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Nombre</TH>
                  <TH>Contacto</TH>
                  {!centerId && <TH>Centro</TH>}
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </TR>
              </THead>
              <TBody>
                {active.map((u) => (
                  <TR key={u.id}>
                    <TD className="font-medium text-slate-900">{u.name}</TD>
                    <TD className="text-slate-500">
                      {[u.phone, u.email].filter(Boolean).join(" · ") || "—"}
                    </TD>
                    {!centerId && <TD>{u.center?.name ?? "—"}</TD>}
                    <TD>
                      <Badge color={u.active ? "green" : "slate"}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <VolunteerToggleButton userId={u.id} active={u.active} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </section>
      )}
    </div>
  );
}
