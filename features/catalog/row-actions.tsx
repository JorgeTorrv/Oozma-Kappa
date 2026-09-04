"use client";

import { ActionButton } from "@/components/form";
import type { ActionState } from "@/lib/result";
import { Power } from "lucide-react";

export function ToggleActiveButton({
  id,
  active,
  action,
  entityLabel,
}: {
  id: string;
  active: boolean;
  action: (id: string) => Promise<ActionState>;
  entityLabel: string;
}) {
  return (
    <ActionButton
      size="sm"
      variant={active ? "outline" : "secondary"}
      action={() => action(id)}
      confirm={
        active
          ? `¿Desactivar ${entityLabel}? Dejará de estar disponible para nuevas operaciones.`
          : `¿Activar ${entityLabel}?`
      }
      confirmTitle={active ? "Desactivar" : "Activar"}
      confirmLabel={active ? "Desactivar" : "Activar"}
      confirmVariant={active ? "destructive" : "default"}
    >
      <Power className="size-3.5" />
      {active ? "Desactivar" : "Activar"}
    </ActionButton>
  );
}

export function DeleteGoalButton({
  id,
  action,
}: {
  id: string;
  action: (id: string) => Promise<ActionState>;
}) {
  return (
    <ActionButton
      size="sm"
      variant="ghost"
      action={() => action(id)}
      confirm="¿Eliminar esta meta?"
      confirmTitle="Eliminar meta"
      confirmLabel="Eliminar"
      confirmVariant="destructive"
    >
      Eliminar
    </ActionButton>
  );
}
