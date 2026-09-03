"use client";

import * as React from "react";
import "leaflet/dist/leaflet.css";
import { markerBadge } from "./marker-badge";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** Texto del pin (por defecto A, B, C… según el orden). */
  badge?: string;
  /** HTML del popup (ya escapado por el emisor). */
  popupHtml?: string;
};

/**
 * Mapa de sólo lectura con marcadores (Leaflet + OpenStreetMap, sin key ni
 * costo). Llama a `onFail` si la librería o los mosaicos no cargan, para que el
 * contenedor muestre una lista de respaldo.
 */
export function LeafletMarkersMap({
  markers,
  className = "h-[420px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100",
  onFail,
  minimal = false,
}: {
  markers: MapMarker[];
  className?: string;
  onFail?: () => void;
  /** Modo decorativo: sin controles ni arrastre (para el hero). */
  minimal?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    async function init() {
      if (!ref.current || markers.length === 0) {
        onFail?.();
        return;
      }
      try {
        const L = (await import("leaflet")).default;
        if (cancelled || !ref.current) return;

        const theMap = L.map(ref.current, {
          scrollWheelZoom: false,
          zoomControl: !minimal,
          dragging: !minimal,
          doubleClickZoom: !minimal,
          attributionControl: !minimal,
          keyboard: !minimal,
        });
        map = theMap;
        const layer = L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          { attribution: "&copy; OpenStreetMap", maxZoom: 18 },
        );
        let tileErrors = 0;
        layer.on("tileerror", () => {
          tileErrors += 1;
          if (tileErrors > 3 && !cancelled) onFail?.();
        });
        layer.addTo(theMap);

        const bounds: [number, number][] = [];
        markers.forEach((m, i) => {
          bounds.push([m.lat, m.lng]);
          const badge = m.badge ?? markerBadge(i);
          const icon = L.divIcon({
            className: "",
            html: `<span style="display:flex;min-width:26px;height:26px;padding:0 6px;align-items:center;justify-content:center;border-radius:9999px;background:#1d4ed8;color:#fff;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${badge}</span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });
          const marker = L.marker([m.lat, m.lng], { icon }).addTo(theMap);
          if (m.popupHtml) {
            marker.bindPopup(
              `<strong style="color:#1d4ed8">${badge}.</strong> ${m.popupHtml}`,
            );
          }
        });
        theMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch {
        if (!cancelled) onFail?.();
      }
    }

    init();
    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  return (
    <div
      ref={ref}
      className={className}
      role="img"
      aria-label="Mapa de centros de acopio"
    />
  );
}
