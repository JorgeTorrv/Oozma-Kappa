"use client";

import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { WASTE_REASONS } from "@/lib/constants";
import type { ActionState } from "@/lib/result";
import {
  createAdjustmentAction,
  createDeliveryAction,
  createReceptionAction,
  createTransferAction,
  createWasteAction,
} from "./actions";

type Cat = { id: string; name: string; unit?: string };
type Catalogs = {
  campaigns: Cat[];
  articles: { id: string; name: string; unit: string; category: string }[];
  institutions?: Cat[];
  centers?: Cat[];
};

function ErrText({ state, field }: { state?: ActionState; field: string }) {
  if (!state || state.ok || !state.fieldErrors?.[field]) return null;
  return (
    <p className="text-xs text-red-600">{state.fieldErrors[field].join(" ")}</p>
  );
}

/** Selector de campaña que auto-selecciona si sólo hay una (registro rápido, spec §24). */
function CampaignField({ campaigns }: { campaigns: Cat[] }) {
  const only = campaigns.length === 1 ? campaigns[0].id : "";
  return (
    <Field label="Campaña" htmlFor="campaignId" required>
      <Select
        id="campaignId"
        name="campaignId"
        defaultValue={only}
        required
        autoFocus={campaigns.length > 1}
      >
        {campaigns.length !== 1 && <option value="">Selecciona…</option>}
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function ArticleField({
  articles,
}: {
  articles: Catalogs["articles"];
}) {
  return (
    <Field label="Artículo" htmlFor="articleId" required>
      <Select id="articleId" name="articleId" required defaultValue="">
        <option value="">Selecciona…</option>
        {articles.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.unit} ({a.category})
          </option>
        ))}
      </Select>
    </Field>
  );
}

function QuantityField() {
  return (
    <Field
      label="Cantidad"
      htmlFor="quantity"
      required
      hint="Número mayor que cero. Admite hasta 3 decimales (p. ej. 10.5)."
    >
      <Input
        id="quantity"
        name="quantity"
        inputMode="decimal"
        placeholder="0"
        required
      />
    </Field>
  );
}

/* ------------------------------------------------------------- Recepción */
export function ReceptionForm({ catalogs }: { catalogs: Catalogs }) {
  const [anon, setAnon] = React.useState(true);
  return (
    <ActionForm
      action={createReceptionAction}
      successToast="Recepción registrada. El inventario aumentó."
      resetOnSuccess
      className="space-y-4"
    >
      {(state) => (
        <>
          <CampaignField campaigns={catalogs.campaigns} />
          <ErrText state={state} field="campaignId" />
          <ArticleField articles={catalogs.articles} />
          <ErrText state={state} field="articleId" />
          <QuantityField />
          <ErrText state={state} field="quantity" />

          <fieldset className="rounded-md border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-700">
              Donante
            </legend>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
                className="size-4"
              />
              Donación anónima (no se piden datos)
            </label>
            {!anon && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Nombre" htmlFor="donorName">
                  <Input id="donorName" name="donorName" />
                </Field>
                <Field label="Teléfono" htmlFor="donorPhone">
                  <Input id="donorPhone" name="donorPhone" />
                </Field>
                <Field label="Correo" htmlFor="donorEmail">
                  <Input id="donorEmail" name="donorEmail" type="email" />
                </Field>
              </div>
            )}
          </fieldset>

          <Field label="Notas (opcional)" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
          </Field>

          <SubmitButton pendingText="Registrando…">
            Registrar recepción
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/* --------------------------------------------------------------- Entrega */
export function DeliveryForm({ catalogs }: { catalogs: Catalogs }) {
  return (
    <ActionForm
      action={createDeliveryAction}
      successToast="Entrega registrada. El inventario disminuyó."
      resetOnSuccess
      className="space-y-4"
    >
      {(state) => (
        <>
          <CampaignField campaigns={catalogs.campaigns} />
          <Field label="Institución receptora" htmlFor="recipientInstitutionId" required>
            <Select
              id="recipientInstitutionId"
              name="recipientInstitutionId"
              required
              defaultValue=""
            >
              <option value="">Selecciona…</option>
              {catalogs.institutions?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>
          <ArticleField articles={catalogs.articles} />
          <QuantityField />
          <ErrText state={state} field="quantity" />
          <Field label="Observaciones (opcional)" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
          </Field>
          <SubmitButton pendingText="Registrando…">
            Registrar entrega
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/* ----------------------------------------------------------------- Merma */
export function WasteForm({ catalogs }: { catalogs: Catalogs }) {
  return (
    <ActionForm
      action={createWasteAction}
      resetOnSuccess
      className="space-y-4"
    >
      {(state) => (
        <>
          <CampaignField campaigns={catalogs.campaigns} />
          <ArticleField articles={catalogs.articles} />
          <QuantityField />
          <ErrText state={state} field="quantity" />
          <Field label="Motivo" htmlFor="reason" required>
            <Select id="reason" name="reason" required defaultValue="">
              <option value="">Selecciona…</option>
              {WASTE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <ErrText state={state} field="reason" />
          <Field label="Detalle (opcional)" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
          </Field>
          <SubmitButton variant="destructive" pendingText="Registrando…">
            Registrar merma
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/* --------------------------------------------------------- Transferencia */
export function TransferForm({
  catalogs,
  lockedFromCenterId,
}: {
  catalogs: Catalogs & { centers: Cat[] };
  lockedFromCenterId?: string | null;
}) {
  const [campaignId, setCampaignId] = React.useState(
    catalogs.campaigns.length === 1 ? catalogs.campaigns[0].id : "",
  );
  return (
    <ActionForm
      action={createTransferAction}
      successToast="Transferencia completada."
      resetOnSuccess
      className="space-y-4"
    >
      {(state) => (
        <>
          <Field label="Campaña" htmlFor="campaignId" required>
            <Select
              id="campaignId"
              name="campaignId"
              required
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {catalogs.campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Centro de origen" htmlFor="fromCenterId" required>
              <Select
                id="fromCenterId"
                name="fromCenterId"
                required
                defaultValue={lockedFromCenterId ?? ""}
                disabled={Boolean(lockedFromCenterId)}
              >
                <option value="">Selecciona…</option>
                {catalogs.centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {lockedFromCenterId && (
                <input
                  type="hidden"
                  name="fromCenterId"
                  value={lockedFromCenterId}
                />
              )}
            </Field>
            <Field label="Centro de destino" htmlFor="toCenterId" required>
              <Select id="toCenterId" name="toCenterId" required defaultValue="">
                <option value="">Selecciona…</option>
                {catalogs.centers
                  .filter((c) => c.id !== lockedFromCenterId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <p className="text-xs text-slate-500">
            Sólo se permiten centros que participan en la misma campaña. La
            operación es atómica: si algo falla, no se guarda nada.
          </p>

          <ArticleField articles={catalogs.articles} />
          <QuantityField />
          <ErrText state={state} field="quantity" />
          <Field label="Notas (opcional)" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
          </Field>
          <SubmitButton pendingText="Transfiriendo…">
            Realizar transferencia
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/* ----------------------------------------------------------------- Ajuste */
export function AdjustmentForm({ catalogs }: { catalogs: Catalogs }) {
  return (
    <ActionForm
      action={createAdjustmentAction}
      successToast="Ajuste aplicado."
      resetOnSuccess
      className="space-y-4"
    >
      {(state) => (
        <>
          <CampaignField campaigns={catalogs.campaigns} />
          <ArticleField articles={catalogs.articles} />
          <Field label="Tipo de ajuste" htmlFor="direction" required>
            <Select id="direction" name="direction" required defaultValue="">
              <option value="">Selecciona…</option>
              <option value="POSITIVE">
                Ajuste positivo (el stock físico es mayor)
              </option>
              <option value="NEGATIVE">
                Ajuste negativo (el stock físico es menor)
              </option>
            </Select>
          </Field>
          <QuantityField />
          <ErrText state={state} field="quantity" />
          <Field
            label="Motivo"
            htmlFor="reason"
            required
            hint="Obligatorio. Queda visible en el historial como ajuste manual."
          >
            <Input
              id="reason"
              name="reason"
              required
              placeholder="p. ej. Conteo físico: sobrante"
            />
          </Field>
          <ErrText state={state} field="reason" />
          <Field label="Notas (opcional)" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
          </Field>
          <SubmitButton pendingText="Aplicando…">Aplicar ajuste</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
