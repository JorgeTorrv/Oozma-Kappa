"use client";

import * as React from "react";
import { Warehouse } from "lucide-react";
import type { MapCenter } from "./data";
import { formatQuantity } from "@/lib/format";
import {
  LeafletMarkersMap,
  type MapMarker,
} from "@/components/maps/leaflet-markers-map";

function toMarkers(centers: MapCenter[]): MapMarker[] {
  return centers
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => {
      const top = c.topArticles
        .map((a) => `<li>${a.name}: ${formatQuantity(a.quantity)}</li>`)
        .join("");
      return {
        id: c.id,
        lat: c.latitude as number,
        lng: c.longitude as number,
        label: c.name,
        popupHtml:
          `<strong>${c.name}</strong><br/>` +
          `<span style="color:#64748b">${c.campaigns.join(", ") || "Sin campañas"}</span><br/>` +
          `Inventario: <strong>${formatQuantity(c.totalStock)}</strong> unidades` +
          (top ? `<ul style="margin:4px 0 0;padding-left:16px">${top}</ul>` : ""),
      };
    });
}

/** `/mapa`: mapa + lista; si el mapa no carga, sólo lista con aviso. */
export function CentersMap({ centers }: { centers: MapCenter[] }) {
  const markers = React.useMemo(() => toMarkers(centers), [centers]);
  const [failed, setFailed] = React.useState(markers.length === 0);

  if (failed) return <CentersList centers={centers} note />;

  return (
    <div className="space-y-4">
      <LeafletMarkersMap markers={markers} onFail={() => setFailed(true)} />
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
