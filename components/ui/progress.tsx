import { cn } from "@/lib/utils";
import { formatPercent, formatQuantity } from "@/lib/format";

export function GoalProgress({
  label,
  unit,
  current,
  target,
  percent,
  reached,
}: {
  label: string;
  unit: string;
  current: number;
  target: number;
  percent: number;
  reached: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-800">{label}</span>
        <span
          className={cn(
            "tabular-nums",
            reached ? "font-semibold text-emerald-600" : "text-slate-500",
          )}
        >
          {formatQuantity(current)} / {formatQuantity(target)} {unit} ·{" "}
          {formatPercent(percent)}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.round(percent * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de la meta ${label}`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            reached ? "bg-emerald-500" : "bg-brand-600",
          )}
          style={{ width: `${Math.min(percent * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
