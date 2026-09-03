import { Select } from "@/components/ui/primitives";

/**
 * Selector para que el coordinador general alterne entre la vista global
 * (todos los centros combinados) y los gráficos de un centro concreto.
 * Es un `<form method="get">`: cambia el parámetro `?centro=` de la URL.
 */
export function CenterScopePicker({
  centers,
  current,
}: {
  centers: { id: string; name: string }[];
  current?: string;
}) {
  return (
    <form method="get" className="mb-5 flex flex-wrap items-center gap-2">
      <label htmlFor="centro" className="text-sm font-medium text-slate-700">
        Ver:
      </label>
      <Select
        id="centro"
        name="centro"
        defaultValue={current ?? ""}
        className="h-9 w-auto min-w-56"
      >
        <option value="">Todos los centros (global)</option>
        {centers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <button
        type="submit"
        className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50"
      >
        Aplicar
      </button>
    </form>
  );
}
