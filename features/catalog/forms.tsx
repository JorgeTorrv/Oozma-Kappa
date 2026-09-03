"use client";

import * as React from "react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { LocationPicker } from "@/components/maps/location-picker";
import {
  ROLE_LABELS,
  ROLE_LIST,
  ROLES,
  SUGGESTED_CATEGORIES,
  SUGGESTED_UNITS,
} from "@/lib/constants";
import {
  createArticleAction,
  createCampaignAction,
  createCenterAction,
  createGoalAction,
  createInstitutionAction,
  createUserAction,
  updateCampaignAction,
  updateCenterAction,
  updateUserAction,
} from "./actions";

type Opt = { id: string; name: string };

/* ------------------------------------------------------------- Campaña */
export function CampaignForm({
  mode = "create",
  campaignId,
  defaults,
}: {
  mode?: "create" | "edit";
  campaignId?: string;
  defaults?: {
    name: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
  };
}) {
  const action =
    mode === "edit" && campaignId
      ? updateCampaignAction.bind(null, campaignId)
      : createCampaignAction;
  return (
    <ActionForm
      action={action}
      successToast={mode === "edit" ? "Campaña actualizada." : "Campaña creada."}
      resetOnSuccess={mode === "create"}
      className="grid gap-4 sm:grid-cols-2"
    >
      {(s) => (
        <>
          <Field label="Nombre" htmlFor="name" required error={s && !s.ok ? s.fieldErrors?.name : undefined}>
            <Input id="name" name="name" required defaultValue={defaults?.name} />
          </Field>
          <Field label="Inicio" htmlFor="startDate" required>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={defaults?.startDate}
            />
          </Field>
          <Field label="Fin (opcional)" htmlFor="endDate">
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={defaults?.endDate ?? ""}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción (opcional)" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={2}
                defaultValue={defaults?.description ?? ""}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <SubmitButton>
              {mode === "edit" ? "Guardar cambios" : "Crear campaña"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/* -------------------------------------------------------------- Centro */
export function CenterForm({
  mode = "create",
  centerId,
  defaults,
}: {
  mode?: "create" | "edit";
  centerId?: string;
  defaults?: {
    name: string;
    institution: string | null;
    address: string | null;
    phone: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}) {
  const action =
    mode === "edit" && centerId
      ? updateCenterAction.bind(null, centerId)
      : createCenterAction;
  const [addManager, setAddManager] = React.useState(false);
  return (
    <ActionForm
      action={action}
      successToast={mode === "edit" ? "Centro actualizado." : "Centro creado."}
      resetOnSuccess={mode === "create"}
      className="space-y-4"
    >
      {(s) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="name" required error={s && !s.ok ? s.fieldErrors?.name : undefined}>
              <Input id="name" name="name" required defaultValue={defaults?.name} />
            </Field>
            <Field label="Institución responsable (opcional)" htmlFor="institution">
              <Input
                id="institution"
                name="institution"
                defaultValue={defaults?.institution ?? ""}
              />
            </Field>
            <Field
              label="Teléfono de contacto (opcional)"
              htmlFor="phone"
              hint="Se muestra en la página pública para que la gente pueda llamar."
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={defaults?.phone ?? ""}
                placeholder="833 123 4567"
              />
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Ubicación en el mapa
            </p>
            <LocationPicker
              initial={{
                lat: defaults?.latitude ?? null,
                lng: defaults?.longitude ?? null,
                address: defaults?.address ?? null,
              }}
            />
          </div>

          {mode === "create" && (
            <fieldset className="rounded-md border border-slate-200 p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={addManager}
                  onChange={(e) => setAddManager(e.target.checked)}
                />
                Registrar también al primer encargado de este centro
              </label>
              {addManager && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre del encargado" htmlFor="managerFirstName" required>
                    <Input id="managerFirstName" name="managerFirstName" required />
                  </Field>
                  <Field label="Apellido del encargado" htmlFor="managerLastName" required>
                    <Input id="managerLastName" name="managerLastName" required />
                  </Field>
                  <Field
                    label="Teléfono del encargado"
                    htmlFor="managerPhone"
                    required
                    error={s && !s.ok ? s.fieldErrors?.managerPhone : undefined}
                  >
                    <Input
                      id="managerPhone"
                      name="managerPhone"
                      type="tel"
                      inputMode="tel"
                      required
                      placeholder="833 123 4567"
                    />
                  </Field>
                  <Field
                    label="Correo del encargado (opcional)"
                    htmlFor="managerEmail"
                    error={s && !s.ok ? s.fieldErrors?.managerEmail : undefined}
                  >
                    <Input id="managerEmail" name="managerEmail" type="email" />
                  </Field>
                  <Field
                    label="Contraseña temporal"
                    htmlFor="managerPassword"
                    required
                    error={s && !s.ok ? s.fieldErrors?.managerPassword : undefined}
                  >
                    <Input
                      id="managerPassword"
                      name="managerPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                  </Field>
                </div>
              )}
            </fieldset>
          )}

          <SubmitButton>
            {mode === "edit" ? "Guardar cambios" : "Crear centro"}
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

/* ------------------------------------------------------------ Artículo */
export function ArticleForm() {
  return (
    <ActionForm
      action={createArticleAction}
      successToast="Artículo creado."
      resetOnSuccess
      className="grid gap-4 sm:grid-cols-3"
    >
      {(s) => (
        <>
          <Field label="Nombre" htmlFor="name" required error={s && !s.ok ? s.fieldErrors?.name : undefined}>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Categoría" htmlFor="category" required>
            <Input
              id="category"
              name="category"
              list="cat-list"
              required
              placeholder="p. ej. Alimentos"
            />
            <datalist id="cat-list">
              {SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Unidad" htmlFor="unit" required>
            <Input
              id="unit"
              name="unit"
              list="unit-list"
              required
              placeholder="p. ej. kg"
            />
            <datalist id="unit-list">
              {SUGGESTED_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Field>
          <div className="sm:col-span-3">
            <SubmitButton>Agregar artículo</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/* --------------------------------------------------------- Institución */
export function InstitutionForm() {
  return (
    <ActionForm
      action={createInstitutionAction}
      successToast="Institución creada."
      resetOnSuccess
      className="grid gap-4 sm:grid-cols-2"
    >
      {() => (
        <>
          <Field label="Nombre" htmlFor="name" required>
            <Input id="name" name="name" required />
          </Field>
          <Field label="Persona de contacto (opcional)" htmlFor="contactName">
            <Input id="contactName" name="contactName" />
          </Field>
          <Field label="Teléfono (opcional)" htmlFor="phone">
            <Input id="phone" name="phone" />
          </Field>
          <Field label="Dirección (opcional)" htmlFor="address">
            <Input id="address" name="address" />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Agregar institución</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/* ------------------------------------------------------------- Usuario */
export function UserForm({
  mode = "create",
  centers,
  institutions,
  campaigns,
  defaults,
}: {
  mode?: "create" | "edit";
  centers: Opt[];
  institutions: Opt[];
  campaigns: Opt[];
  defaults?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
    centerId: string | null;
    institutionId: string | null;
    campaignId: string | null;
  };
}) {
  const [role, setRole] = React.useState(defaults?.role ?? "");
  const needsCenter =
    role === ROLES.ENCARGADO_CENTRO || role === ROLES.VOLUNTARIO_CENTRO;
  const needsInstitution = role === ROLES.INSTITUCION_RECEPTORA;
  const needsCampaign = role === ROLES.LIDER_CAMPANA;

  return (
    <ActionForm
      action={mode === "edit" ? updateUserAction : createUserAction}
      successToast={mode === "edit" ? "Usuario actualizado." : "Usuario creado."}
      resetOnSuccess={mode === "create"}
      className="grid gap-4 sm:grid-cols-2"
    >
      {(s) => (
        <>
          {mode === "edit" && defaults && (
            <input type="hidden" name="id" value={defaults.id} />
          )}
          <Field label="Nombre" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={defaults?.name} />
          </Field>
          <Field
            label="Teléfono"
            htmlFor="phone"
            required={mode === "create"}
            error={s && !s.ok ? s.fieldErrors?.phone : undefined}
            hint="Es el identificador de acceso."
          >
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required={mode === "create"}
              defaultValue={defaults?.phone ?? ""}
              placeholder="833 123 4567"
            />
          </Field>
          <Field
            label="Correo (opcional)"
            htmlFor="email"
            error={s && !s.ok ? s.fieldErrors?.email : undefined}
          >
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={defaults?.email ?? ""}
            />
          </Field>
          <Field label="Rol" htmlFor="role" required>
            <Select
              id="role"
              name="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Selecciona…</option>
              {ROLE_LIST.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={
              mode === "edit"
                ? "Nueva contraseña (dejar vacío para no cambiar)"
                : "Contraseña"
            }
            htmlFor="password"
            required={mode === "create"}
            error={s && !s.ok ? s.fieldErrors?.password : undefined}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required={mode === "create"}
            />
          </Field>

          {needsCenter && (
            <Field label="Centro" htmlFor="centerId" required>
              <Select
                id="centerId"
                name="centerId"
                required
                defaultValue={defaults?.centerId ?? ""}
              >
                <option value="">Selecciona…</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {needsInstitution && (
            <Field label="Institución" htmlFor="institutionId" required>
              <Select
                id="institutionId"
                name="institutionId"
                required
                defaultValue={defaults?.institutionId ?? ""}
              >
                <option value="">Selecciona…</option>
                {institutions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {needsCampaign && (
            <Field label="Campaña" htmlFor="campaignId" required>
              <Select
                id="campaignId"
                name="campaignId"
                required
                defaultValue={defaults?.campaignId ?? ""}
              >
                <option value="">Selecciona…</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="sm:col-span-2">
            <SubmitButton>
              {mode === "edit" ? "Guardar cambios" : "Crear usuario"}
            </SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

/* ---------------------------------------------------------------- Meta */
export function GoalForm({
  campaignId,
  articles,
}: {
  campaignId: string;
  articles: { id: string; name: string; unit: string }[];
}) {
  const [articleId, setArticleId] = React.useState("");
  return (
    <ActionForm
      action={createGoalAction}
      successToast="Meta agregada."
      resetOnSuccess
      className="grid gap-3 sm:grid-cols-4"
    >
      {(s) => (
        <>
          <input type="hidden" name="campaignId" value={campaignId} />
          <Field label="Artículo" htmlFor="articleId">
            <Select
              id="articleId"
              name="articleId"
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
            >
              <option value="">— o por categoría —</option>
              {articles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.unit})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Categoría" htmlFor="category">
            <Input
              id="category"
              name="category"
              disabled={Boolean(articleId)}
              placeholder="si no eliges artículo"
            />
          </Field>
          <Field
            label="Meta"
            htmlFor="targetQty"
            required
            error={s && !s.ok ? s.fieldErrors?.targetQty : undefined}
          >
            <Input id="targetQty" name="targetQty" inputMode="decimal" required />
          </Field>
          <Field label="Unidad" htmlFor="unit" required>
            <Input id="unit" name="unit" required placeholder="kg / caja / pieza" />
          </Field>
          <div className="sm:col-span-4">
            <SubmitButton>Agregar meta</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
