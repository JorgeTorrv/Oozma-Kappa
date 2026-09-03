import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { RegisterForm } from "@/features/auth/register-form";
import { Boxes } from "lucide-react";

export const metadata: Metadata = { title: "Ser voluntario · Acopio Hub" };

export default async function RegistroPage() {
  const user = await getCurrentUser();
  if (user) redirect("/inicio");

  const centers = await prisma.center.findMany({
    where: { active: true },
    select: { id: true, name: true, address: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link
            href="/"
            className="mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-700 text-white transition-colors hover:bg-brand-800"
            aria-label="Ir al inicio"
          >
            <Boxes className="size-6" />
          </Link>
          <h1 className="text-lg font-semibold text-slate-900">
            Regístrate como voluntario
          </h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Elige el centro de acopio donde quieres ayudar. Tu cuenta quedará
            activa cuando el encargado del centro la apruebe.
          </p>
        </div>

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
