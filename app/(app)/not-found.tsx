import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <FileQuestion className="size-6" />
      </div>
      <h1 className="text-lg font-semibold text-slate-900">
        No encontramos esta página
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        El recurso no existe o no tienes acceso a él.
      </p>
      <Link
        href="/inicio"
        className="mt-5 inline-flex h-9 items-center rounded-md border border-slate-300 px-4 text-sm hover:bg-slate-50"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
