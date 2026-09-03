import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { LoginForm } from "@/features/auth/login-form";
import { Skeleton } from "@/components/ui/primitives";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Iniciar sesión · Acopia" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inicio");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" aria-label="Ir al inicio">
            <Logo height={150} />
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            Registro y coordinación de centros de acopio
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
