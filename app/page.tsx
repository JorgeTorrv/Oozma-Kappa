import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, MapPin, HeartHandshake, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getMapCenters } from "@/features/map/data";
import { PublicCentersMap } from "@/features/public/centers-map";
import { buttonVariants } from "@/components/ui/button";
import { formatQuantity } from "@/lib/format";

export const metadata: Metadata = {
  title: "Acopio Hub — Encuentra un centro de acopio",
  description:
    "Localiza el centro de acopio más cercano para llevar tus donaciones. No necesitas cuenta.",
};

// La lista de centros cambia con la operación: siempre en tiempo real.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const [centers, activeCampaigns] = await Promise.all([
    getMapCenters(),
    prisma.campaign.count({ where: { active: true } }),
  ]);

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Boxes className="size-4" />
            </span>
            Acopio Hub
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/registro"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ser voluntario
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Encuentra dónde llevar tus donaciones
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Estos son los centros de acopio activos. Lleva artículos físicos —agua,
          alimentos no perecederos, cobijas, artículos de higiene, medicamentos
          básicos—. <strong>No necesitas registrarte para donar.</strong>
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {centers.length} centros activos
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {activeCampaigns} campaña(s) en curso
          </span>
        </div>
      </section>

      {/* Mapa + lista */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {centers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Por ahora no hay centros de acopio activos.
          </div>
        ) : (
          <div className="space-y-6">
            <PublicCentersMap centers={centers} />

            <ul className="grid gap-4 sm:grid-cols-2">
              {centers.map((c) => {
                const maps =
                  c.latitude != null && c.longitude != null
                    ? `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        c.address ?? c.name,
                      )}`;
                return (
                  <li
                    key={c.id}
                    className="rounded-lg border border-slate-200 p-5"
                  >
                    <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                      <MapPin className="size-4 text-brand-700" />
                      {c.name}
                    </h2>
                    {c.address && (
                      <p className="mt-1 text-sm text-slate-500">{c.address}</p>
                    )}
                    {c.campaigns.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Campaña: {c.campaigns.join(", ")}
                      </p>
                    )}
                    {c.topArticles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-slate-600">
                          Ya recibido aquí:
                        </p>
                        <ul className="mt-1 text-xs text-slate-500">
                          {c.topArticles.map((a) => (
                            <li key={a.name}>
                              {a.name}: {formatQuantity(a.quantity)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <a
                      href={maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                    >
                      Cómo llegar <ArrowRight className="size-3.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* CTA voluntario */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-4 py-12 sm:px-6">
          <HeartHandshake className="size-6 text-brand-700" />
          <h2 className="text-xl font-semibold text-slate-900">
            ¿Quieres ayudar en un centro?
          </h2>
          <p className="max-w-xl text-sm text-slate-600">
            Regístrate como voluntario en el centro que elijas. El encargado del
            centro aprobará tu cuenta y podrás registrar recepciones y entregas.
          </p>
          <Link
            href="/registro"
            className={buttonVariants({ variant: "default" })}
          >
            Registrarme como voluntario
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-400 sm:px-6">
        Acopio Hub · Sistema de registro y coordinación de centros de acopio.
      </footer>
    </main>
  );
}
