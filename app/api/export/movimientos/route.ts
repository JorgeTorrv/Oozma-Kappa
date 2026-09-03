import { type NextRequest } from "next/server";
import { requireCapability, assertSameOrigin } from "@/lib/auth/dal";
import { buildScopedFilter, type RawParams } from "@/features/history/query";
import { exportMovementsCsv } from "@/services/export.service";
import { isAppError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await assertSameOrigin();
    const { user } = await requireCapability("export.data");

    const raw: RawParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );
    const { filter } = buildScopedFilter(user, raw);
    const csv = await exportMovementsCsv(filter);

    const date = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="movimientos-${date}.csv"`,
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
