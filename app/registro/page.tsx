import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { RegisterForm } from "@/features/auth/register-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Ser voluntario · Acopia" };

export default async function RegistroPage() {
  const user = await getCurrentUser();

  const centers = await prisma.center.findMany({
    where: { active: true },
    select: { id: true, name: true, address: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" aria-label="Ir al inicio">
            <Logo height={130} />
          </Link>
          <h1 className="mt-3 text-lg font-semibold text-slate-900">
            Regístrate como voluntario
          </h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Elige el centro de acopio donde quieres ayudar. Tu cuenta quedará
            activa cuando el encargado del centro la apruebe.
          </p>
        </div>

        {user && (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tienes una sesión iniciada como <strong>{user.name}</strong>. Este
            formulario crea una cuenta de voluntario aparte.{" "}
            <Link href="/inicio" className="font-medium underline">
              Volver a mi panel
            </Link>
            .
          </p>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {centers.length === 0 ? (
            <p className="text-sm text-slate-500">
              Todavía no hay centros de acopio disponibles. Vuelve más tarde.
            </p>
          ) : (
            <RegisterForm centers={centers} />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
