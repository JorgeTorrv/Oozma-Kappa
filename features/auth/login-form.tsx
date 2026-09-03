"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Field, Input } from "@/components/ui/primitives";
import { SubmitButton } from "@/components/form";
import type { ActionState } from "@/lib/result";

export function LoginForm() {
  const [state, action] = useActionState<ActionState | undefined, FormData>(
    loginAction,
    undefined,
  );
  const fieldErrors =
    state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Correo" htmlFor="email" error={fieldErrors.email} required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="tucorreo@acopio.local"
          aria-describedby="email-error"
        />
      </Field>

      <Field
        label="Contraseña"
        htmlFor="password"
        error={fieldErrors.password}
        required
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-describedby="password-error"
        />
      </Field>

      {state && !state.ok && !state.fieldErrors && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}

      <SubmitButton className="w-full" pendingText="Entrando…">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}
