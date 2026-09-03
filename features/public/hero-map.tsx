"use client";

import * as React from "react";
import type { MapCenter } from "@/features/map/data";
import {
  LeafletMarkersMap,
  type MapMarker,
} from "@/components/maps/leaflet-markers-map";
import { markerBadge } from "@/components/maps/marker-badge";

/**
 * Imagen del hero: el mapa real de centros recortado en una forma orgánica,
 * con un tinte duotono violeta→ámbar (estilo del diseño de referencia). Si el
 * mapa no carga, la forma se rellena con el degradado.
 */
export function HeroMap({ centers }: { centers: MapCenter[] }) {
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
        })),
    [centers],
  );
  const [failed, setFailed] = React.useState(markers.length === 0);

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* anillos concéntricos decorativos */}
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-6 -top-8 h-[115%] w-[115%] text-violet-300/40"
      >
        {[92, 74, 56, 38].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="relative aspect-square w-full overflow-hidden rounded-[42%_58%_63%_37%/45%_44%_56%_55%] shadow-[0_24px_60px_-20px_rgba(124,58,237,.45)] ring-1 ring-black/5">
        {failed ? (
          <div className="size-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400" />
        ) : (
          <LeafletMarkersMap
            markers={markers}
            minimal
            className="size-full"
            onFail={() => setFailed(true)}
          />
        )}
        {/* tinte duotono */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-700/35 via-fuchsia-600/15 to-amber-400/25 mix-blend-multiply" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
      </div>
    </div>
  );
}
