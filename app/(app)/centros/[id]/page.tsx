import { redirect } from "next/navigation";

/**
 * La edición de centros ahora vive en una ventana flotante dentro de /centros
 * (botón "Editar" de cada fila). Esta ruta se conserva sólo para no romper
 * enlaces antiguos y redirige al listado.
 */
export default async function CenterEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/centros");
}
