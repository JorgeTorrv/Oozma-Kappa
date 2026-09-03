import { prisma } from "@/lib/db";
import { WASTE_STATUS, MOVEMENT_TYPES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/page";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { WasteDecisionButtons } from "./waste-approval-buttons";

export async function WasteApprovalList() {
  const pending = await prisma.movement.findMany({
    where: {
      type: MOVEMENT_TYPES.WASTE,
      status: WASTE_STATUS.PENDING_APPROVAL,
    },
    include: {
      article: { select: { name: true, unit: true } },
      center: { select: { name: true } },
      campaign: { select: { name: true } },
      actor: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pending.length === 0) {
    return <EmptyState title="No hay mermas pendientes de aprobación." />;
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Fecha</TH>
          <TH>Centro</TH>
          <TH>Artículo</TH>
          <TH className="text-right">Cantidad</TH>
          <TH>Motivo</TH>
          <TH>Registró</TH>
          <TH className="text-right">Decisión</TH>
        </TR>
      </THead>
      <TBody>
        {pending.map((m) => (
          <TR key={m.id}>
            <TD className="whitespace-nowrap text-slate-500">
              {formatDateTime(m.createdAt)}
            </TD>
            <TD>{m.center.name}</TD>
            <TD className="font-medium text-slate-900">{m.article.name}</TD>
            <TD className="text-right tabular-nums">
              {formatQuantity(m.quantity)} {m.article.unit}
            </TD>
            <TD>
              {m.reason}
              {m.notes && (
                <span className="block text-xs text-slate-400">{m.notes}</span>
              )}
            </TD>
            <TD className="text-slate-500">{m.actor.name}</TD>
            <TD className="text-right">
              <WasteDecisionButtons movementId={m.id} />
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
