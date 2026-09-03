import { Field, Input, Select } from "@/components/ui/primitives";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_LIST,
} from "@/lib/constants";
import Link from "next/link";

export type FilterCatalogs = {
  campaigns: { id: string; name: string }[];
  centers: { id: string; name: string }[];
  articles: { id: string; name: string }[];
  users: { id: string; name: string }[];
  showCampaign: boolean;
  showCenter: boolean;
};

export function HistoryFilters({
  catalogs,
  current,
  basePath = "/movimientos",
}: {
  catalogs: FilterCatalogs;
  current: Record<string, string | undefined>;
  basePath?: string;
}) {
  return (
    <form
      method="get"
      className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {catalogs.showCampaign && (
        <Field label="Campaña" htmlFor="campaignId">
          <Select id="campaignId" name="campaignId" defaultValue={current.campaignId ?? ""}>
            <option value="">Todas</option>
            {catalogs.campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {catalogs.showCenter && (
        <Field label="Centro" htmlFor="centerId">
          <Select id="centerId" name="centerId" defaultValue={current.centerId ?? ""}>
            <option value="">Todos</option>
            {catalogs.centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Artículo" htmlFor="articleId">
        <Select id="articleId" name="articleId" defaultValue={current.articleId ?? ""}>
          <option value="">Todos</option>
          {catalogs.articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Tipo" htmlFor="type">
        <Select id="type" name="type" defaultValue={current.type ?? ""}>
          <option value="">Todos</option>
          {MOVEMENT_TYPE_LIST.map((t) => (
            <option key={t} value={t}>
              {MOVEMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>

      {catalogs.users.length > 0 && (
        <Field label="Usuario" htmlFor="actorUserId">
          <Select
            id="actorUserId"
            name="actorUserId"
            defaultValue={current.actorUserId ?? ""}
          >
            <option value="">Todos</option>
            {catalogs.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Desde" htmlFor="from">
        <Input id="from" name="from" type="date" defaultValue={current.from ?? ""} />
      </Field>
      <Field label="Hasta" htmlFor="to">
        <Input id="to" name="to" type="date" defaultValue={current.to ?? ""} />
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
