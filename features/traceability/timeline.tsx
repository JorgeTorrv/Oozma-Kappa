import {
  PackagePlus,
  Send,
  Trash2,
  ArrowLeftRight,
  SlidersHorizontal,
  MapPin,
  User,
} from "lucide-react";
import { MOVEMENT_TYPES } from "@/lib/constants";
import type { TraceEvent } from "@/services/traceability.service";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

const config: Record<
  string,
  { icon: typeof PackagePlus; ring: string; dot: string }
> = {
  [MOVEMENT_TYPES.RECEPTION]: {
    icon: PackagePlus,
    ring: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  [MOVEMENT_TYPES.DELIVERY]: {
    icon: Send,
    ring: "border-blue-200",
    dot: "bg-blue-500",
  },
  [MOVEMENT_TYPES.WASTE]: {
    icon: Trash2,
    ring: "border-red-200",
    dot: "bg-red-500",
  },
  [MOVEMENT_TYPES.TRANSFER_OUT]: {
    icon: ArrowLeftRight,
    ring: "border-violet-200",
    dot: "bg-violet-500",
  },
  [MOVEMENT_TYPES.TRANSFER_IN]: {
    icon: ArrowLeftRight,
    ring: "border-violet-200",
    dot: "bg-violet-500",
  },
  [MOVEMENT_TYPES.ADJUSTMENT_POSITIVE]: {
    icon: SlidersHorizontal,
    ring: "border-amber-200",
    dot: "bg-amber-500",
  },
  [MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE]: {
    icon: SlidersHorizontal,
    ring: "border-amber-200",
    dot: "bg-amber-500",
  },
};

function describe(e: TraceEvent): string {
  switch (e.type) {
    case MOVEMENT_TYPES.RECEPTION:
      return e.donorAnonymous
        ? `Donación anónima recibida en ${e.center}`
        : `Donación de ${e.donor} recibida en ${e.center}`;
    case MOVEMENT_TYPES.TRANSFER_OUT:
      return `Transferido de ${e.center} hacia ${e.counterpartCenter}`;
    case MOVEMENT_TYPES.TRANSFER_IN:
      return `Recibido en ${e.center} desde ${e.counterpartCenter}`;
    case MOVEMENT_TYPES.DELIVERY:
      return `Entregado desde ${e.center} a ${e.institution}${
        e.status === "CONFIRMED" ? " (confirmada)" : " (pendiente de confirmar)"
      }`;
    case MOVEMENT_TYPES.WASTE:
      return `Merma en ${e.center}${e.reason ? ` — ${e.reason}` : ""}`;
    case MOVEMENT_TYPES.ADJUSTMENT_POSITIVE:
      return `Ajuste positivo en ${e.center}${e.reason ? ` — ${e.reason}` : ""}`;
    case MOVEMENT_TYPES.ADJUSTMENT_NEGATIVE:
      return `Ajuste negativo en ${e.center}${e.reason ? ` — ${e.reason}` : ""}`;
    default:
      return e.typeLabel;
  }
}

export function TraceTimeline({ events }: { events: TraceEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-6">
      {events.map((e) => {
        const c = config[e.type] ?? {
          icon: MapPin,
          ring: "border-slate-200",
          dot: "bg-slate-400",
        };
        const Icon = c.icon;
        return (
          <li key={e.id} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] top-1.5 size-3.5 rounded-full ring-4 ring-white",
                c.dot,
              )}
            />
            <div className={cn("rounded-lg border bg-white p-3", c.ring)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-900">
                    {e.typeLabel}
                  </span>
                  <span className="text-sm text-slate-500">
                    · {formatQuantity(e.quantity)} {e.unit}
                  </span>
                </div>
                <time className="whitespace-nowrap text-xs text-slate-400">
                  {formatDateTime(e.date)}
                </time>
              </div>
              <p className="mt-1 text-sm text-slate-600">{describe(e)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <User className="size-3" />
                {e.actor}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
