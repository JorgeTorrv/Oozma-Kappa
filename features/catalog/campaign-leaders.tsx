"use client";

import * as React from "react";
import { ActionForm, ActionButton, SubmitButton } from "@/components/form";
import { Field, Input, Select, Badge } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/page";
import {
  addCampaignLeaderAction,
  assignCampaignLeaderAction,
  removeCampaignLeaderAction,
} from "./actions";
import { UserPlus } from "lucide-react";

type Leader = { id: string; name: string; email: string | null; active: boolean };
type Assignable = { id: string; name: string; email: string | null };

export function CampaignLeaders({
  campaignId,
  leaders,
  assignable,
}: {
  campaignId: string;
  leaders: Leader[];
  assignable: Assignable[];
}) {
  const [pick, setPick] = React.useState("");
  const addLeader = addCampaignLeaderAction.bind(null, campaignId);

  return (
    <div className="space-y-5">
      {/* Líderes actuales */}
      {leaders.length === 0 ? (
        <EmptyState title="Esta campaña no tiene líder asignado." />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {leaders.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{l.name}</p>
                <p className="text-xs text-slate-500">{l.email ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={l.active ? "green" : "slate"}>
                  {l.active ? "Activo" : "Inactivo"}
                </Badge>
                <ActionButton
                  size="sm"
                  variant="outline"
                  action={() => removeCampaignLeaderAction(l.id)}
                  confirm="¿Retirar a este líder de la campaña? Su cuenta quedará desactivada."
                >
                  Quitar
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Asignar un usuario que ya es líder (de otra campaña o sin campaña) */}
      {assignable.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Asignar un líder existente" htmlFor="assignLeader">
            <Select
              id="assignLeader"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              className="w-auto min-w-64"
            >
              <option value="">Selecciona…</option>
              {assignable.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.email ? ` — ${u.email}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <ActionButton
            size="sm"
            disabled={!pick}
            action={() => assignCampaignLeaderAction(campaignId, pick)}
            successToast="Líder asignado."
          >
            Asignar
          </ActionButton>
        </div>
      )}

      {/* Crear un líder nuevo para esta campaña */}
      <div className="border-t border-slate-100 pt-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <UserPlus className="size-4" />
          Crear un líder nuevo para esta campaña
        </p>
        <ActionForm
          action={addLeader}
          successToast="Líder de campaña creado y asignado."
          resetOnSuccess
          className="grid gap-3 sm:grid-cols-2"
        >
          {(s) => (
            <>
              <Field label="Nombre" htmlFor="firstName" required>
                <Input id="firstName" name="firstName" required />
              </Field>
              <Field label="Apellido" htmlFor="lastName" required>
                <Input id="lastName" name="lastName" required />
              </Field>
              <Field
                label="Teléfono"
                htmlFor="phone"
                required
                error={s && !s.ok ? s.fieldErrors?.phone : undefined}
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="833 123 4567"
                />
              </Field>
              <Field
                label="Correo (opcional)"
                htmlFor="email"
                error={s && !s.ok ? s.fieldErrors?.email : undefined}
              >
                <Input id="email" name="email" type="email" />
              </Field>
              <Field
                label="Contraseña temporal"
                htmlFor="password"
                required
                error={s && !s.ok ? s.fieldErrors?.password : undefined}
              >
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton>Crear y asignar</SubmitButton>
              </div>
            </>
          )}
        </ActionForm>
      </div>
    </div>
  );
}
