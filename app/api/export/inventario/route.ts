import { type NextRequest } from "next/server";
import { requireCapability, assertSameOrigin } from "@/lib/auth/dal";
import { ROLES } from "@/lib/constants";
import { exportInventoryCsv } from "@/services/export.service";
import { isAppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await assertSameOrigin();
    const { user, principal } = await requireCapability("export.data");

    const params = request.nextUrl.searchParams;
    let campaignId = params.get("campaignId") ?? undefined;
    let centerId = params.get("centerId") ?? undefined;

    // Aplica el ámbito del usuario (anti-IDOR).
    if (
      principal.role === ROLES.ENCARGADO_CENTRO ||
      principal.role === ROLES.VOLUNTARIO_CENTRO
    ) {
      centerId = user.centerId ?? "__none__";
    } else if (principal.role === ROLES.LIDER_CAMPANA) {
      campaignId = user.campaignId ?? "__none__";
    }

    const csv = await exportInventoryCsv({ campaignId, centerId });
    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventario-${date}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const status = isAppError(e)
      ? e.code === "FORBIDDEN"
        ? 403
        : e.code === "UNAUTHENTICATED"
          ? 401
          : 400
      : 500;
    const message = isAppError(e)
      ? e.message
      : "No se pudo generar la exportación.";
    return Response.json({ error: message }, { status });
  }
}
