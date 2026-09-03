import {
  MOVEMENT_TYPE_LABELS,
  DELIVERY_STATUS,
  WASTE_STATUS,
  type MovementType,
} from "@/lib/constants";
import { Badge } from "@/components/ui/primitives";

const colorByType: Record<MovementType, Parameters<typeof Badge>[0]["color"]> = {
  RECEPTION: "green",
  DELIVERY: "blue",
  WASTE: "red",
  TRANSFER_IN: "violet",
  TRANSFER_OUT: "violet",
  ADJUSTMENT_POSITIVE: "amber",
  ADJUSTMENT_NEGATIVE: "amber",
};

export function MovementBadge({ type }: { type: string }) {
  const t = type as MovementType;
  return (
    <Badge color={colorByType[t] ?? "slate"}>
      {MOVEMENT_TYPE_LABELS[t] ?? type}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const map: Record<string, { label: string; color: Parameters<typeof Badge>[0]["color"] }> = {
    [DELIVERY_STATUS.PENDING]: { label: "Pendiente", color: "amber" },
    [DELIVERY_STATUS.CONFIRMED]: { label: "Confirmada", color: "green" },
    [WASTE_STATUS.PENDING_APPROVAL]: { label: "Pend. aprobación", color: "amber" },
    [WASTE_STATUS.APPROVED]: { label: "Aprobada", color: "green" },
    [WASTE_STATUS.REJECTED]: { label: "Rechazada", color: "red" },
  };
  const m = map[status] ?? { label: status, color: "slate" as const };
  return <Badge color={m.color}>{m.label}</Badge>;
}
