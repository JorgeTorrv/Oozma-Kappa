import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  MapPin,
  ArrowRight,
  Search,
  PackageCheck,
  ClipboardList,
  HeartHandshake,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getMapCenters } from "@/features/map/data";
import { PublicCentersMap } from "@/features/public/centers-map";
import { markerBadge } from "@/components/maps/marker-badge";
import { buttonVariants } from "@/components/ui/button";
import { formatQuantity } from "@/lib/format";

export const metadata: Metadata = {
  title: "Acopio Hub — Encuentra un centro de acopio",
  description:
    "Localiza el centro de acopio más cercano para llevar tus donaciones. No necesitas cuenta.",
};

// La lista de centros cambia con la operación: siempre en tiempo real.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: Search,
    title: "Encuentra un centro",
    body: "Ubica en el mapa el centro de acopio activo más cercano a ti.",
  },
  {
    icon: PackageCheck,
    title: "Lleva artículos físicos",
    body: "Agua, alimentos no perecederos, cobijas, higiene, medicamentos básicos.",
  },
  {
    icon: ClipboardList,
    title: "El centro lo registra",
    body: "Tu donación entra al inventario y queda con trazabilidad hasta quien la recibe.",
  },
];

export default async function LandingPage() {
  const [centers, activeCampaigns] = await Promise.all([
    getMapCenters(),
    prisma.campaign.count({ where: { active: true } }),
  ]);

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      {/* ---------------------------------------------------------- Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white">
              <Boxes className="size-4" />
            </span>
            Acopio&nbsp;Hub
          </span>
          <nav className="flex items-center gap-2">
            <Link
              href="#centros"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-block"
            >
              Ver centros
            </Link>
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
          </nav>
        </div>
      </header>

      {/* ------------------------------------------------------------- Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-4 pt-14 sm:px-6 sm:pt-20">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {centers.length} centros activos · {activeCampaigns} campaña(s) en curso
        </p>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          Encuentra dónde llevar tus donaciones
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Acopio Hub coordina los centros de recolección de una campaña de ayuda.
          Aquí puedes ver los centros activos y llegar al más cercano.{" "}
          <span className="font-medium text-slate-900">
            No necesitas registrarte para donar.
          </span>
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="#centros"
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            <MapPin className="size-4" />
            Ver centros en el mapa
          </Link>
          <Link
            href="/registro"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-amber-500 px-6 text-base font-semibold text-white transition-colors hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Quiero ser voluntario
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------- Cómo donar */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Cómo donar
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <s.icon className="size-5" />
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Paso {i + 1}
                </span>
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* --------------------------------------------------------- Centros */}
      <section
        id="centros"
        className="scroll-mt-20 border-t border-slate-200 bg-slate-50/60"
      >
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Centros de acopio activos
          </h2>
          <p className="mt-1 text-slate-600">
            El pin del mapa y la tarjeta comparten la misma letra.
          </p>

          {centers.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Por ahora no hay centros de acopio activos. Vuelve más tarde.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <PublicCentersMap centers={centers} />

              <ul className="grid gap-4 sm:grid-cols-2">
                {centers.map((c, i) => {
                  const badge = markerBadge(i);
                  const maps =
                    c.latitude != null && c.longitude != null
                      ? `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          c.address ?? c.name,
                        )}`;
                  return (
                    <li
                      key={c.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
                          {badge}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">
                            {c.name}
                          </h3>
                          {c.address && (
                            <p className="mt-0.5 text-sm text-slate-500">
                              {c.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {c.campaigns.length > 0 && (
                        <p className="mt-3 text-xs text-slate-500">
                          Campaña: {c.campaigns.join(", ")}
                        </p>
                      )}
                      {c.topArticles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.topArticles.map((a) => (
                            <span
                              key={a.name}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {a.name} · {formatQuantity(a.quantity)}
                            </span>
                          ))}
                        </div>
                      )}

                      <a
                        href={maps}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
                      >
                        Cómo llegar <ArrowRight className="size-3.5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ------------------------------------------------ CTA voluntariado */}
      <section className="border-t border-slate-200 bg-brand-700 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-14 sm:px-6">
          <HeartHandshake className="size-7 text-brand-200" />
          <h2 className="text-2xl font-semibold tracking-tight">
            ¿Quieres ayudar dentro de un centro?
          </h2>
          <p className="max-w-xl text-brand-100">
            Regístrate como voluntario en el centro que elijas. El encargado
            aprobará tu cuenta y podrás registrar recepciones y entregas.
          </p>
          <Link
            href="/registro"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-6 text-base font-semibold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Registrarme como voluntario
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-400 sm:px-6">
        Acopio Hub · Sistema de registro y coordinación de centros de acopio.
      </footer>
    </div>
  );
}
