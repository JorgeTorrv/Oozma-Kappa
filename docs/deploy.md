# Despliegue en Vercel + Supabase

Acopio Hub corre en **Vercel** (Next.js) con la base de datos en **Supabase**
(PostgreSQL gestionado, plan gratuito). Nada de esto necesita tarjeta.

> El código ya está listo: Prisma usa `provider = "postgresql"` y lee
> `DATABASE_URL` (con pooling) + `DIRECT_URL` (sin pooling). Sólo hay que
> conectar los servicios y cargar las variables.

---

## 1. Base de datos — Supabase

1. Crea un proyecto en <https://supabase.com> (Free). Elige región cercana
   (p. ej. `us-east-1`).
2. Cuando termine de aprovisionar, ve a **Project Settings → Database →
   Connection string**. Copia dos cadenas:
   - **Transaction pooler** (puerto `6543`) → será `DATABASE_URL`.
     Añádele al final: `?pgbouncer=true&connection_limit=1`
   - **Session pooler / Direct** (puerto `5432`) → será `DIRECT_URL`.
3. Sustituye `[YOUR-PASSWORD]` por la contraseña de la base (la que definiste al
   crear el proyecto, o genera una en esa misma pantalla).

Ejemplo:

```
DATABASE_URL="postgresql://postgres.abcd1234:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.abcd1234:TU_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Aplicar el esquema y los datos demo (una sola vez, desde tu máquina)

```bash
# en la raíz del repo, con esas dos variables exportadas o en .env
export DATABASE_URL="...pooler...:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="...pooler...:5432/postgres"

npm ci
npx prisma migrate deploy      # crea todas las tablas
npm run db:seed                # carga campaña, centros, artículos y cuentas demo
```

Comprueba en Supabase → **Table editor** que aparecen las tablas y filas.

---

## 2. Aplicación — Vercel

1. Sube el repo a GitHub (ya está en `JorgeTorrv/Oozma-Kappa`).
2. En <https://vercel.com> → **Add New → Project** → importa el repo.
3. Framework preset: **Next.js** (autodetectado). Build command y output por
   defecto. **Install command:** `npm ci` (para respetar `package-lock.json`).
4. **Environment Variables** (Project Settings → Environment Variables), para
   *Production* y *Preview*:

   | Nombre | Valor |
   | --- | --- |
   | `DATABASE_URL` | cadena pooler `:6543` + `?pgbouncer=true&connection_limit=1` |
   | `DIRECT_URL` | cadena directa `:5432` |
   | `NODE_ENV` | `production` |
   | `WASTE_APPROVAL_ENABLED` | `true` *(opcional)* |
   | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | *(opcional, ver §3)* |
   | `NOMINATIM_CONTACT_EMAIL` | tu correo *(opcional, buena práctica)* |

   Todas quedan guardadas como **secrets** cifrados por Vercel.
5. **Deploy**. El `postinstall` corre `prisma generate` en el build de Vercel.
6. Cuando cambies el esquema en el futuro: crea la migración en local
   (`npx prisma migrate dev --name algo`), commitea `prisma/migrations/**`, y en
   Vercel añade un **Build Command** override:
   `prisma migrate deploy && next build`
   (o corre `npx prisma migrate deploy` manualmente contra `DIRECT_URL`).

### Notas

- Las cookies de sesión ya se marcan `Secure` cuando `NODE_ENV=production`.
- El dominio `*.vercel.app` sirve HTTPS por defecto; la verificación de origen
  (`assertSameOrigin`) seguirá funcionando.
- Rate limiting de login es en memoria: en Vercel (varias lambdas) es
  best-effort. Suficiente para una demo; para producción real usar Upstash Redis.

---

## 3. Mapa con Google Maps (opcional)

Por defecto el mapa y el buscador de lugares usan **OpenStreetMap + Nominatim**,
sin API key ni costo. Si quieres Google Maps (autocompletado de lugares de
Google), necesitas una API key propia. **No se puede crear una key que se
autodestruya**; lo más parecido es restringirla y borrarla tú luego.

1. <https://console.cloud.google.com> → crea/usa un proyecto → habilita
   **Maps JavaScript API** y **Places API**.
2. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
3. Restringe la key:
   - *Restricción de aplicación*: **Sitios web (HTTP referrers)** →
     `https://TU-APP.vercel.app/*` (y `http://localhost:3000/*` para local).
   - *Restricción de API*: sólo *Maps JavaScript API* y *Places API*.
4. En **Facturación**, pon un **presupuesto/alerta** en `$1` para enterarte si
   algo se dispara (el crédito gratis mensual cubre de sobra este uso).
5. Añade `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en Vercel (y en `.env` local).
6. **Recordatorio para desactivar en 2–3 días**: agenda en tu calendario
   "borrar API key de Google Maps – Acopio Hub". Para borrarla:
   Console → Credenciales → (la key) → **Eliminar**. La app vuelve sola a
   OpenStreetMap sin tocar código.

---

## 4. Restaurar / reiniciar datos demo

```bash
# CUIDADO: borra y recarga todo (útil sólo en la base de demo/preview)
npx prisma migrate reset --force        # aplica migraciones + seed
# o sólo re-sembrar:
npm run db:seed
```
