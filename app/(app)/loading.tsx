import { Skeleton } from "@/components/ui/primitives";

/**
 * Esqueleto instantáneo al navegar entre módulos: Next.js lo muestra en cuanto
 * arranca la navegación y va reemplazándolo por el contenido real conforme el
 * servidor lo transmite. Evita la sensación de "clic sin respuesta".
 */
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-5/6" />
      </div>
    </div>
  );
}
