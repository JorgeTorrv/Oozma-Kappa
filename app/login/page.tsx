import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "@/features/auth/login-form";
import { Boxes } from "lucide-react";

export const metadata: Metadata = { title: "Iniciar sesión · Acopio Hub" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-700 text-white">
            <Boxes className="size-6" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Acopio Hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registro y coordinación de centros de acopio
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Sistema de demostración. Consulta las cuentas de prueba en el README.
        </p>
      </div>
    </main>
  );
}
