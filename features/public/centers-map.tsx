"use client";

import * as React from "react";
import type { MapCenter } from "@/features/map/data";
import {
  LeafletMarkersMap,
  type MapMarker,
} from "@/components/maps/leaflet-markers-map";
import { markerBadge } from "@/components/maps/marker-badge";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!,
  );

/**
 * Mapa de la landing pública. Cada pin lleva su letra (A, B, C…) en el mismo
 * orden que la lista de centros de la página. Si no puede cargar, no muestra
 * nada: debajo la landing ya renderiza la lista.
 */
export function PublicCentersMap({ centers }: { centers: MapCenter[] }) {
  const markers = React.useMemo<MapMarker[]>(
    () =>
      centers
        .map((c, i) => ({ c, badge: markerBadge(i) }))
        .filter(({ c }) => c.latitude != null && c.longitude != null)
        .map(({ c, badge }) => ({
          id: c.id,
          lat: c.latitude as number,
          lng: c.longitude as number,
          label: c.name,
          badge,
          popupHtml:
            `<strong>${esc(c.name)}</strong>` +
            (c.address
              ? `<br/><span style="color:#64748b">${esc(c.address)}</span>`
              : "") +
            (c.phone
              ? `<br/><a href="tel:${esc(c.phone.replace(/\s+/g, ""))}" style="color:#1f5c3d">${esc(c.phone)}</a>`
              : ""),
        })),
    [centers],
  );
  const [failed, setFailed] = React.useState(markers.length === 0);

  if (failed) return null;
  return (
    <LeafletMarkersMap
      markers={markers}
      className="h-[360px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:h-[440px]"
      onFail={() => setFailed(true)}
    />
  );
}
