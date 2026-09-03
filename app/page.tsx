import type { Metadata } from "next";
import Link from "next/link";
import { Boxes, MapPin, Phone, ChevronDown, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getMapCenters } from "@/features/map/data";
import { PublicCentersMap } from "@/features/public/centers-map";
import { markerBadge } from "@/components/maps/marker-badge";

export const metadata: Metadata = {
  title: "Acopio Hub — Dónde llevar tus donaciones",
  description:
    "Centros de acopio activos: dirección, teléfono y cómo llegar. No necesitas cuenta para donar.",
};

// La lista de centros cambia con la operación: siempre en tiempo real.
export const dynamic = "force-dynamic";

function mapsUrl(c: { latitude: number | null; longitude: number | null; address: string | null; name: string }) {
  const q =
    c.latitude != null && c.longitude != null
      ? `${c.latitude},${c.longitude}`
      : encodeURIComponent(c.address ?? c.name);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default async function LandingPage() {
  const [centers, campaign] = await Promise.all([
    getMapCenters(),
    prisma.campaign.findFirst({
      where: { active: true },
      orderBy: { startDate: "desc" },
      select: { name: true },
    }),
  ]);

  return (
    <div className="bg-white text-slate-900">
      {/* ============================ Primera pantalla completa ============ */}
      <section className="flex min-h-svh flex-col">
        <header className="border-b border-slate-200">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
            <span className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded bg-brand-700 text-white">
                <Boxes className="size-4" />
              </span>
              Acopio Hub
            </span>
            <Link
              href="/login"
              className="-mr-2 rounded px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Acceso equipo
            </Link>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
          {campaign && (
            <p className="text-sm font-medium text-slate-500">
              Campaña activa: {campaign.name}
            </p>
          )}
          <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
            ¿Quieres donar? Aquí están los centros de acopio.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Lleva artículos físicos: agua, alimentos no perecederos, cobijas,
            productos de higiene y medicamentos básicos. No necesitas cuenta.
          </p>

          <div className="mt-8">
            <Link
              href="#centros"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-700 px-6 font-medium text-white hover:bg-brand-800 sm:w-auto"
            >
              Ver los {centers.length} centros
              <ChevronDown className="size-4" />
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              ¿Vas a colaborar dentro de un centro?{" "}
              <Link
                href="/registro"
                className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800"
              >
                Regístrate como voluntario
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ============================ Centros ============================= */}
      <section id="centros" className="scroll-mt-4 border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Centros de acopio
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            La letra del mapa corresponde a la de cada tarjeta.
          </p>

          {centers.length === 0 ? (
            <div className="mt-6 rounded-md border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Por ahora no hay centros de acopio activos.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <PublicCentersMap centers={centers} />

              <ul className="divide-y divide-slate-200 border-y border-slate-200">
                {centers.map((c, i) => (
                  <li key={c.id} className="py-4">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-brand-300 text-xs font-bold text-brand-800">
                        {markerBadge(i)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900">{c.name}</h3>
                        {c.institution && (
                          <p className="text-sm text-slate-500">
                            {c.institution}
                          </p>
                        )}
                        <dl className="mt-2 space-y-1.5 text-sm">
                          {c.address && (
                            <div className="flex gap-2 text-slate-600">
                              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                              <span>{c.address}</span>
                            </div>
                          )}
                          {c.phone && (
                            <div className="flex gap-2">
                              <Phone className="mt-0.5 size-4 shrink-0 text-slate-400" />
                              <a
                                href={`tel:${c.phone.replace(/\s+/g, "")}`}
                                className="font-medium text-brand-700 hover:underline"
                              >
                                {c.phone}
                              </a>
                            </div>
                          )}
                        </dl>
                        <a
                          href={mapsUrl(c)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
                        >
                          Cómo llegar <ArrowRight className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-slate-500 sm:px-6">
          Acopio Hub · coordinación de centros de acopio.{" "}
          <Link href="/login" className="text-brand-700 hover:underline">
            Acceso del equipo
          </Link>
        </div>
      </footer>
    </div>
  );
}
