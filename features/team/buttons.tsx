"use client";

import { ActionButton } from "@/components/form";
import {
  approveVolunteerAction,
  rejectVolunteerAction,
  toggleVolunteerActiveAction,
} from "@/features/catalog/actions";
import { Check, X, Power } from "lucide-react";

export function VolunteerDecisionButtons({ userId }: { userId: string }) {
  return (
    <div className="flex justify-end gap-2">
      <ActionButton
        size="sm"
        action={() => approveVolunteerAction(userId)}
        successToast="Voluntario aprobado."
        confirm="¿Aprobar esta cuenta? Podrá iniciar sesión."
      >
        <Check className="size-4" />
        Aprobar
      </ActionButton>
      <ActionButton
        size="sm"
        variant="outline"
        action={() => rejectVolunteerAction(userId)}
        successToast="Solicitud rechazada."
        confirm="¿Rechazar esta solicitud?"
      >
        <X className="size-4" />
        Rechazar
      </ActionButton>
    </div>
  );
}

export function VolunteerToggleButton({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  return (
    <ActionButton
      size="sm"
      variant={active ? "outline" : "secondary"}
      action={() => toggleVolunteerActiveAction(userId)}
      confirm={
        active
          ? "¿Desactivar a este voluntario? Se cerrará su sesión."
          : "¿Reactivar a este voluntario?"
      }
    >
      <Power className="size-3.5" />
      {active ? "Desactivar" : "Reactivar"}
    </ActionButton>
  );
}
