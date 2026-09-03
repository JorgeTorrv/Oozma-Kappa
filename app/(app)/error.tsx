"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Se registra en el servidor; al usuario nunca se le muestra el stack.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="size-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900">
        No se pudo completar la acción
      </h1>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        Ocurrió un problema al procesar tu solicitud. Puedes reintentar o volver
        al inicio. Si el problema persiste, avisa al coordinador.
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Link
          href="/inicio"
          className="inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm hover:bg-slate-50"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
