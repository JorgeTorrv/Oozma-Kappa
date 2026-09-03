import { type NextRequest } from "next/server";
import { requireUserOrThrow } from "@/lib/auth/dal";
import { isAppError } from "@/lib/errors";

/**
 * Búsqueda de direcciones vía Nominatim (OpenStreetMap) — gratis, sin API key.
 * Se hace desde el servidor para poder enviar un `User-Agent` correcto y no
 * exponer al cliente los límites de uso. Uso educado: 1 req/s, contacto opcional.
 */
export async function GET(request: NextRequest) {
  try {
    await requireUserOrThrow();
    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 3) {
      return Response.json({ results: [] });
    }

    const contact = process.env.NOMINATIM_CONTACT_EMAIL;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "6");
    url.searchParams.set("addressdetails", "0");
    if (contact) url.searchParams.set("email", contact);

    const res = await fetch(url, {
      headers: {
        "User-Agent": `AcopioHub/1.0 (${contact ?? "sin-contacto"})`,
        "Accept-Language": "es",
      },
      // 24h de caché en el edge/CDN para búsquedas repetidas.
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return Response.json(
        { results: [], error: "El buscador de direcciones no respondió." },
        { status: 502 },
      );
    }
    const data = (await res.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>;
    return Response.json({
      results: data.map((d) => ({
        label: d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      })),
    });
  } catch (e) {
    const status = isAppError(e) && e.code === "UNAUTHENTICATED" ? 401 : 500;
    return Response.json({ results: [], error: "No disponible." }, { status });
  }
}
