import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * Proxy (antes "middleware", renombrado en Next.js 16). Comprobación OPTIMISTA
 * mínima: si NO hay cookie de sesión y la ruta no es pública, redirige a
 * `/login`. Nada más.
 *
 * NO redirige a los usuarios "con cookie" fuera de `/login` o `/registro`: esas
 * páginas hacen su propia verificación real contra la base y redirigen a
 * `/inicio` sólo si la sesión es válida. Así una cookie caduca/inválida no
 * provoca un bucle de redirecciones.
 *
 *  - `/`, `/login`, `/registro` → públicas
 *  - resto                      → requiere cookie de sesión
 */
const PUBLIC_EXACT = new Set(["/", "/login", "/registro"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession && !PUBLIC_EXACT.has(pathname)) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
