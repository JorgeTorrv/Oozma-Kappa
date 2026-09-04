"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, Select } from "@/components/ui/primitives";

type Article = { id: string; name: string; category: string };
type Campaign = { id: string; name: string; articles: Article[] };

/**
 * Filtros de trazabilidad SIN botón intermedio: al elegir campaña se llenan de
 * inmediato los desplegables de artículo y categoría (los datos ya vienen del
 * servidor). Elegir un artículo O una categoría navega directo al trazado; son
 * excluyentes.
 */
export function TraceControls({
  campaigns,
  current,
}: {
  campaigns: Campaign[];
  current: { campaignId?: string; articleId?: string; category?: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [campaignId, setCampaignId] = useState(current.campaignId ?? "");
  const articleId = current.articleId ?? "";
  const category = current.category ?? "";

  const campaign = campaigns.find((c) => c.id === campaignId);
  const articles = campaign?.articles ?? [];
  const categories = [...new Set(articles.map((a) => a.category))].sort();

  const go = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    startTransition(() => router.push(qs ? `/trazabilidad?${qs}` : "/trazabilidad"));
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
      <Field label="Campaña" htmlFor="t-campaign">
        <Select
          id="t-campaign"
          value={campaignId}
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value;
            setCampaignId(id);
            // Solo fija la campaña; el trazado se pide al elegir artículo o categoría.
            go(id ? { campaignId: id } : {});
          }}
        >
          <option value="">Selecciona…</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Artículo" htmlFor="t-article">
        <Select
          id="t-article"
          value={articleId}
          disabled={pending || !campaignId}
          onChange={(e) => {
            const id = e.target.value;
            go(id ? { campaignId, articleId: id } : { campaignId });
          }}
        >
          <option value="">
            {campaignId ? "Todos / elige categoría" : "Elige campaña primero"}
          </option>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Categoría" htmlFor="t-category">
        <Select
          id="t-category"
          value={category}
          disabled={pending || !campaignId}
          onChange={(e) => {
            const cat = e.target.value;
            go(cat ? { campaignId, category: cat } : { campaignId });
          }}
        >
          <option value="">
            {campaignId ? "Elige categoría…" : "Elige campaña primero"}
          </option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
