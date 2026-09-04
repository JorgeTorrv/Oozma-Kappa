import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Package,
  Route,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { getMapCenters } from "@/features/map/data";
import { PublicCentersMap } from "@/features/public/centers-map";
import { HeroMap } from "@/features/public/hero-map";
import { markerBadge } from "@/components/maps/marker-badge";
import { Logo } from "@/components/brand/logo";
import { formatPhone, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Acopia — Dónde llevar tus donaciones",
  description:
    "Centros de acopio activos: dirección, teléfono y cómo llegar. No necesitas cuenta para donar.",
};

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: MapPin,
    title: "Encuentra el centro",
    body: "Ubica en el mapa el centro de acopio activo más cercano a ti.",
  },
  {
    icon: Package,
    title: "Lleva tus donaciones",
    body: "Agua, alimentos no perecederos, cobijas, higiene y medicamentos básicos.",
  },
  {
    icon: Route,
    title: "Con trazabilidad",
    body: "Tu donación entra al inventario y queda registrada hasta quien la recibe.",
  },
];

function mapsUrl(c: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  name: string;
}) {
  const q =
    c.latitude != null && c.longitude != null
      ? `${c.latitude},${c.longitude}`
      : encodeURIComponent(c.address ?? c.name);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default async function LandingPage() {
  const centers = await getMapCenters();

  return (
    <div className="overflow-x-hidden bg-white text-slate-900">
      {/* ===================== Primera pantalla ===================== */}
      <section className="relative flex min-h-svh flex-col">
        {/* nav */}
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" aria-label="Acopia — inicio">
            <Logo height={88} />
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium sm:gap-2">
            <Link
              href="#centros"
              className="hidden rounded-md px-3 py-2 text-slate-600 hover:text-slate-900 sm:inline-block"
            >
              Centros
            </Link>
            <Link
              href="/registro"
              className="rounded-md px-2.5 py-2 text-slate-600 hover:text-slate-900 sm:px-3"
            >
              <span className="sm:hidden">Voluntario</span>
              <span className="hidden sm:inline">
                Regístrate como voluntario
              </span>
            </Link>
            <Link
              href="/login"
              className="rounded-md px-2.5 py-2 text-brand-700 hover:bg-brand-50 sm:px-3"
            >
              <span className="sm:hidden">Acceso</span>
              <span className="hidden sm:inline">Acceso equipo</span>
            </Link>
          </nav>
        </header>

        {/* hero */}
        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:gap-6 lg:py-10">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Centros de acopio
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              No busques mucho.
              <br />
              <span className="text-brand-700">DONA CERCA DE TI.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
              Lleva tus donaciones al centro de acopio activo más cercano.
              No necesitas cuenta.
            </p>

            <div className="mt-8 flex flex-col items-start gap-4">
              <Link
                href="#centros"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand-700 px-7 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-brand-700/25 transition-colors hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                Ver los {centers.length} centros
                <ChevronRight className="size-4" />
              </Link>
              <p className="text-sm text-slate-500">
                ¿Colaboras dentro de un centro?{" "}
                <Link
                  href="/registro"
                  className="font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
                >
                  Regístrate como voluntario
                </Link>
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <HeroMap centers={centers} />
          </div>
        </div>

        {/* fila de características */}
        <div className="relative z-10 border-t border-slate-100">
          <ul className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ========================= Centros ========================= */}
      <section
        id="centros"
        className="scroll-mt-4 border-t border-slate-200 bg-slate-50/60"
      >
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Centros de acopio
          </h2>
          <p className="mt-1 text-slate-600">
            La letra del mapa corresponde a la de cada tarjeta.
          </p>

          {centers.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Por ahora no hay centros de acopio activos.
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <PublicCentersMap centers={centers} />

              <ul className="grid gap-3 sm:grid-cols-2">
                {centers.map((c, i) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
                        {markerBadge(i)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {c.name}
                        </h3>
                        {c.institution && (
                          <p className="text-sm text-slate-500">
                            {c.institution}
                          </p>
                        )}
                        <div className="mt-2 space-y-1.5 text-sm">
                          {c.address && (
                            <p className="flex gap-2 text-slate-600">
                              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                              {c.address}
                            </p>
                          )}
                          {c.phone && (
                            <p className="flex gap-2">
                              <Phone className="mt-0.5 size-4 shrink-0 text-slate-400" />
                              <a
                                href={telHref(c.phone)}
                                className="font-medium tabular-nums text-brand-700 hover:underline"
                              >
                                {formatPhone(c.phone)}
                              </a>
                            </p>
                          )}
                        </div>
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-6 text-sm text-slate-500 sm:px-6">
          <Logo height={40} />
          <span>· coordinación de centros de acopio.</span>
          <Link href="/login" className="text-brand-700 hover:underline">
            Acceso del equipo
          </Link>
        </div>
      </footer>
    </div>
  );
}
