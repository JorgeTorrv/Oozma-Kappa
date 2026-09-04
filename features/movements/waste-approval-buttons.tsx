"use client";

import { ActionButton } from "@/components/form";
import { approveWasteAction, rejectWasteAction } from "./actions";
import { Check, X } from "lucide-react";

export function WasteDecisionButtons({ movementId }: { movementId: string }) {
  return (
    <div className="flex justify-end gap-2">
      <ActionButton
        size="sm"
        action={() => approveWasteAction(movementId)}
        confirm="¿Aprobar esta merma? El inventario disminuirá."
        confirmTitle="Aprobar merma"
        confirmLabel="Aprobar"
        successToast="Merma aprobada."
      >
        <Check className="size-4" />
        Aprobar
      </ActionButton>
      <ActionButton
        size="sm"
        variant="outline"
        action={() => rejectWasteAction(movementId)}
        confirm="¿Rechazar esta merma? El inventario no se modificará."
        confirmTitle="Rechazar merma"
        confirmLabel="Rechazar"
        confirmVariant="destructive"
        successToast="Merma rechazada."
      >
        <X className="size-4" />
        Rechazar
      </ActionButton>
    </div>
  );
}
