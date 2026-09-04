"use client";

import { ActionButton } from "@/components/form";
import { confirmDeliveryAction } from "@/features/movements/actions";
import { CheckCircle2 } from "lucide-react";

export function ConfirmDeliveryButton({ movementId }: { movementId: string }) {
  return (
    <ActionButton
      size="sm"
      action={() => confirmDeliveryAction(movementId)}
      confirm="¿Confirmar que tu institución recibió esta entrega?"
      confirmTitle="Confirmar recepción"
      confirmLabel="Confirmar"
      successToast="Entrega confirmada como recibida."
    >
      <CheckCircle2 className="size-4" />
      Confirmar recepción
    </ActionButton>
  );
}
