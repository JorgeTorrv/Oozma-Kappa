import Link from "next/link";
import { Field, Select } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import { ROLE_LABELS, type Role } from "@/lib/constants";

/**
 * Filtro de personas por rol / centro / estado. `centers` es opcional: si no se
 * pasa (p. ej. dentro de la ficha de un centro concreto) no se muestra ese
 * selector, porque el centro ya está fijo.
 */
export function PeopleFilters({
  roles,
  centers,
  current,
  basePath,
}: {
  roles: readonly Role[];
  centers?: { id: string; name: string }[];
  current: { role?: string; centerId?: string; status?: string };
  basePath: string;
}) {
  return (
    <form
      method="get"
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="Rol" htmlFor="role">
        <Select id="role" name="role" defaultValue={current.role ?? ""}>
          <option value="">Todos</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>

      {centers && (
        <Field label="Centro" htmlFor="centerId">
          <Select id="centerId" name="centerId" defaultValue={current.centerId ?? ""}>
            <option value="">Todos</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Estado" htmlFor="status">
        <Select id="status" name="status" defaultValue={current.status ?? ""}>
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </Select>
      </Field>

      <div className="flex items-end gap-2">
        <Button type="submit">Filtrar</Button>
        <Link href={basePath} className={buttonVariants({ variant: "ghost" })}>
          Limpiar
        </Link>
      </div>
    </form>
  );
}
