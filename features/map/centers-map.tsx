"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import type { MapCenter } from "./data";
import { formatQuantity } from "@/lib/format";
import { Warehouse } from "lucide-react";

/**
 * Mapa de centros con Leaflet + OpenStreetMap (sin mapas de pago). Si el mapa no
 * puede cargar (sin Internet para los mosaicos, o error de la librería), se
 * muestra automáticamente la lista de centros.
 */
export function CentersMap({ centers }: { centers: MapCenter[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [failed, setFailed] = React.useState(false);
  const withCoords = centers.filter(
    (c) => c.latitude != null && c.longitude != null,
  );

  React.useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    async function init() {
      if (!ref.current || withCoords.length === 0) {
        setFailed(true);
        return;
      }
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !ref.current) return;

        map = L.map(ref.current, { scrollWheelZoom: false });
        const layer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 18,
          },
        );
        let tileErrors = 0;
        layer.on("tileerror", () => {
          tileErrors += 1;
          if (tileErrors > 3 && !cancelled) setFailed(true);
        });
        layer.addTo(map);

        const bounds: [number, number][] = [];
        for (const c of withCoords) {
          const lat = c.latitude as number;
          const lng = c.longitude as number;
          bounds.push([lat, lng]);
          const icon = L.divIcon({
            className: "",
            html: `<span style="display:flex;width:26px;height:26px;align-items:center;justify-content:center;border-radius:9999px;background:#1d4ed8;color:#fff;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${c.name.replace(/[^A-Za-z]/g, "").slice(0, 1) || "C"}</span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const top = c.topArticles
            .map(
              (a) =>
                `<li>${a.name}: ${formatQuantity(a.quantity)}</li>`,
            )
            .join("");
          L.marker([lat, lng], { icon })
            .addTo(map!)
            .bindPopup(
              `<strong>${c.name}</strong><br/>` +
                `<span style="color:#64748b">${c.campaigns.join(", ") || "Sin campañas"}</span><br/>` +
                `Inventario: <strong>${formatQuantity(c.totalStock)}</strong> unidades` +
                (top ? `<ul style="margin:4px 0 0;padding-left:16px">${top}</ul>` : ""),
            );
        }
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    init();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [withCoords]);

  if (failed || withCoords.length === 0) {
    return <CentersList centers={centers} note />;
  }

  return (
    <div className="space-y-4">
      <div
        ref={ref}
        className="h-[420px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
        role="img"
        aria-label="Mapa de centros de acopio"
      />
      <CentersList centers={centers} />
    </div>
  );
}

export function CentersList({
  centers,
  note = false,
}: {
  centers: MapCenter[];
  note?: boolean;
}) {
  return (
    <div>
      {note && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No se pudo cargar el mapa (sin conexión o sin coordenadas). Se muestra
          la lista de centros.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {centers.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <Warehouse className="size-4 text-slate-400" />
              <span className="font-medium text-slate-900">{c.name}</span>
            </div>
            {c.address && (
              <p className="mt-1 text-xs text-slate-500">{c.address}</p>
            )}
            <p className="mt-2 text-sm text-slate-700">
              Inventario: {formatQuantity(c.totalStock)} unidades
            </p>
            {c.topArticles.length > 0 && (
              <ul className="mt-1 text-xs text-slate-500">
                {c.topArticles.map((a) => (
                  <li key={a.name}>
                    {a.name}: {formatQuantity(a.quantity)}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
