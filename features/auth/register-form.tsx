"use client";

import { useActionState } from "react";
import { registerVolunteerAction } from "./actions";
import { Field, Input, Select } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/form";
import type { ActionState } from "@/lib/result";

type Center = { id: string; name: string; address: string | null };

export function RegisterForm({ centers }: { centers: Center[] }) {
  const [state, action] = useActionState<ActionState | undefined, FormData>(
    registerVolunteerAction,
    undefined,
  );
  const errs = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="firstName" error={errs.firstName} required>
          <Input id="firstName" name="firstName" autoComplete="given-name" required />
        </Field>
        <Field label="Apellido" htmlFor="lastName" error={errs.lastName} required>
          <Input id="lastName" name="lastName" autoComplete="family-name" required />
        </Field>
      </div>

      <Field label="Teléfono" htmlFor="phone" error={errs.phone} required>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
        />
      </Field>

      <Field label="Correo (opcional)" htmlFor="email" error={errs.email}>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </Field>

      <Field label="Centro de acopio" htmlFor="centerId" error={errs.centerId} required>
        <Select id="centerId" name="centerId" required defaultValue="">
          <option value="">Selecciona…</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.address ? ` — ${c.address}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Contraseña"
        htmlFor="password"
        error={errs.password}
        hint="Mínimo 8 caracteres."
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      {state && !state.ok && !state.fieldErrors && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <SubmitButton className="w-full" pendingText="Enviando…">
        Enviar solicitud
      </SubmitButton>
    </form>
  );
}
