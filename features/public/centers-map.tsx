"use client";

import * as React from "react";
import type { MapCenter } from "@/features/map/data";
import { formatQuantity } from "@/lib/format";
import {
  LeafletMarkersMap,
  type MapMarker,
} from "@/components/maps/leaflet-markers-map";

/**
 * Mapa de la landing pública. Si no puede cargar, no muestra nada: debajo del
 * mapa la landing ya renderiza la lista de centros.
 */
export function PublicCentersMap({ centers }: { centers: MapCenter[] }) {
  const markers = React.useMemo<MapMarker[]>(
    () =>
      centers
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => ({
          id: c.id,
          lat: c.latitude as number,
          lng: c.longitude as number,
          label: c.name,
          popupHtml:
            `<strong>${c.name}</strong>` +
            (c.address ? `<br/><span style="color:#64748b">${c.address}</span>` : "") +
            `<br/>Inventario: <strong>${formatQuantity(c.totalStock)}</strong>`,
        })),
    [centers],
  );
  const [failed, setFailed] = React.useState(markers.length === 0);

  if (failed) return null;
  return <LeafletMarkersMap markers={markers} onFail={() => setFailed(true)} />;
}
