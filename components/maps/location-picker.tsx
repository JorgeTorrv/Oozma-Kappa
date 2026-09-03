"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input, Label } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type LatLng = { lat: number; lng: number };
type Result = { label: string; lat: number; lng: number };

/** Centro por defecto del mapa: zona sur de Tamaulipas. */
const DEFAULT_CENTER: LatLng = { lat: 22.28, lng: -97.86 };

export function LocationPicker({
  name = { lat: "latitude", lng: "longitude", address: "address" },
  initial,
}: {
  name?: { lat: string; lng: string; address: string };
  initial?: { lat: number | null; lng: number | null; address: string | null };
}) {
  const [pos, setPos] = React.useState<LatLng | null>(
    initial?.lat != null && initial?.lng != null
      ? { lat: initial.lat, lng: initial.lng }
      : null,
  );
  const [address, setAddress] = React.useState(initial?.address ?? "");
  const [query, setQuery] = React.useState(initial?.address ?? "");
  const [results, setResults] = React.useState<Result[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const mapEl = React.useRef<HTMLDivElement>(null);
  const leafletRef = React.useRef<{
    map: import("leaflet").Map;
    marker: import("leaflet").Marker;
  } | null>(null);
  const googleRef = React.useRef<{ map: unknown; marker: unknown } | null>(null);

  const usingGoogle = Boolean(GOOGLE_KEY);

  /* ---------------------------------------------------- Mapa (Leaflet u OSM) */
  React.useEffect(() => {
    let cancelled = false;

    async function initLeaflet() {
      if (!mapEl.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;
      const start = pos ?? DEFAULT_CENTER;
      const map = L.map(mapEl.current).setView([start.lat, start.lng], pos ? 15 : 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      // Icono propio (divIcon): evita el problema del icono PNG por defecto de
      // Leaflet, que no resuelve bien la ruta con el bundler y sale roto.
      const pinIcon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#1f5c3d;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></span>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const marker = L.marker([start.lat, start.lng], {
        draggable: true,
        icon: pinIcon,
        autoPan: true,
      }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setPos({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
      });
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        setPos({
          lat: +e.latlng.lat.toFixed(6),
          lng: +e.latlng.lng.toFixed(6),
        });
      });
      leafletRef.current = { map, marker };
    }

    async function initGoogle() {
      if (!mapEl.current || !GOOGLE_KEY) return;
      await loadGoogleMaps(GOOGLE_KEY);
      if (cancelled || !mapEl.current) return;
      // @ts-expect-error google se carga globalmente
      const g = window.google.maps;
      const start = pos ?? DEFAULT_CENTER;
      const map = new g.Map(mapEl.current, {
        center: start,
        zoom: pos ? 15 : 11,
        mapTypeControl: false,
        streetViewControl: false,
      });
      const marker = new g.Marker({ position: start, map, draggable: true });
      marker.addListener("dragend", () => {
        const p = marker.getPosition();
        setPos({ lat: +p.lat().toFixed(6), lng: +p.lng().toFixed(6) });
      });
      map.addListener("click", (e: { latLng: { lat(): number; lng(): number } }) => {
        marker.setPosition(e.latLng);
        setPos({
          lat: +e.latLng.lat().toFixed(6),
          lng: +e.latLng.lng().toFixed(6),
        });
      });
      googleRef.current = { map, marker };
    }

    (usingGoogle ? initGoogle() : initLeaflet()).catch(() => {
      setMsg("No se pudo cargar el mapa. Puedes escribir la latitud/longitud a mano.");
    });

    return () => {
      cancelled = true;
      leafletRef.current?.map.remove();
      leafletRef.current = null;
      googleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------------------------- Mover mapa al cambiar `pos` */
  React.useEffect(() => {
    if (!pos) return;
    if (leafletRef.current) {
      leafletRef.current.marker.setLatLng([pos.lat, pos.lng]);
      leafletRef.current.map.setView([pos.lat, pos.lng], 15);
    }
    if (googleRef.current) {
      // @ts-expect-error tipos google
      googleRef.current.marker.setPosition(pos);
      // @ts-expect-error tipos google
      googleRef.current.map.setCenter(pos);
      // @ts-expect-error tipos google
      googleRef.current.map.setZoom(15);
    }
  }, [pos]);

  /* ------------------------------------------------------------- Búsqueda */
  async function search() {
    if (query.trim().length < 3) return;
    setSearching(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as { results: Result[]; error?: string };
      setResults(data.results ?? []);
      if ((data.results ?? []).length === 0) {
        setMsg(data.error ?? "Sin resultados. Ajusta la búsqueda o marca el punto en el mapa.");
      }
    } catch {
      setMsg("No se pudo buscar. Marca el punto directamente en el mapa.");
    } finally {
      setSearching(false);
    }
  }

  function choose(r: Result) {
    setPos({ lat: r.lat, lng: r.lng });
    setAddress(r.label);
    setResults([]);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name.lat} value={pos ? pos.lat : ""} readOnly />
      <input type="hidden" name={name.lng} value={pos ? pos.lng : ""} readOnly />
      <input type="hidden" name={name.address} value={address} readOnly />

      <div>
        <Label htmlFor="loc-search">Buscar el lugar</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="loc-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                search();
              }
            }}
            placeholder="Ej. Cruz Roja Tampico, o una dirección"
          />
          <Button type="button" variant="outline" onClick={search} disabled={searching}>
            {searching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Buscar
          </Button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Elige un resultado, o haz clic / arrastra el pin en el mapa para un
          lugar sin registrar.
        </p>
      </div>

      {results.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => choose(r)}
                className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-50"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <span>{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        ref={mapEl}
        className="h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {pos ? (
          <span className="rounded bg-slate-100 px-2 py-1">
            Ubicación: {pos.lat}, {pos.lng}
          </span>
        ) : (
          <span>Aún sin ubicación seleccionada.</span>
        )}
        {address && (
          <span className="truncate">Dirección: {address}</span>
        )}
      </div>
      {msg && <p className="text-xs text-amber-700">{msg}</p>}
    </div>
  );
}

/* --------------------------------------------------- Carga de Google Maps JS */
let googlePromise: Promise<void> | null = null;
function loadGoogleMaps(key: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  // @ts-expect-error global
  if (window.google?.maps) return Promise.resolve();
  if (googlePromise) return googlePromise;
  googlePromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("google maps load failed"));
    document.head.appendChild(s);
  });
  return googlePromise;
}
