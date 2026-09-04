"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction } from "./actions";
import { Field, Input } from "@/components/ui/primitives";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/form";
import type { ActionState } from "@/lib/result";

export function LoginForm() {
  const [state, action] = useActionState<ActionState | undefined, FormData>(
    loginAction,
    undefined,
  );
  const params = useSearchParams();
  const justRegistered = params.get("registrado") === "1";
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {justRegistered && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          Registro recibido. Tu cuenta quedará activa cuando el encargado del
          centro la apruebe.
        </p>
      )}

      <Field
        label="Correo o teléfono"
        htmlFor="identifier"
        error={fieldErrors.identifier}
        required
      >
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoFocus
          placeholder="correo@acopio.local  ·  833 123 4567"
          aria-describedby="identifier-error"
        />
      </Field>

      <Field
        label="Contraseña"
        htmlFor="password"
        error={fieldErrors.password}
        required
      >
        <PasswordInput
          id="password"
          name="password"
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

      <p className="text-center text-sm text-slate-500">
        ¿Quieres ser voluntario?{" "}
        <Link href="/registro" className="font-medium text-brand-700 hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </form>
  );
}
