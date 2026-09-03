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
3. El repo trae `vercel.json`: framework **Next.js**, `installCommand: npm ci` y
   `buildCommand: npm run vercel-build`. No hay que configurar nada de build a
   mano. `vercel-build` corre `prisma generate && prisma migrate deploy &&
   next build`, así que **cada deploy aplica las migraciones pendientes solo**
   (necesita `DIRECT_URL` en las variables, ver abajo).
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
5. **Deploy**. `npm run vercel-build` genera el cliente Prisma, aplica
   migraciones y compila.
6. Cuando cambies el esquema en el futuro: crea la migración en local
   (`npx prisma migrate dev --name algo`) y commitea `prisma/migrations/**`. El
   siguiente deploy de Vercel la aplica solo vía `vercel-build`.

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

---

## 5. Pasar a producción real (sin datos demo)

Cuando quieras dejar la base **vacía de datos demo** y con **una sola cuenta de
coordinador general**, usa `npm run db:go-live`. No toca el esquema; sólo borra
filas y crea el admin.

```bash
# 1) Apunta a la base de PRODUCCIÓN (las mismas cadenas de Supabase que Vercel)
export DATABASE_URL="postgresql://...pooler...:6543/postgres?pgbouncer=true&connection_limit=1"
export DIRECT_URL="postgresql://...pooler...:5432/postgres"

# 2) Datos del único admin
export ADMIN_PHONE="833 111 2233"        # obligatorio — es el identificador de acceso
export ADMIN_PASSWORD="una-contraseña-larga-y-propia"   # obligatorio, >= 8
export ADMIN_EMAIL="admin@tudominio.mx"  # opcional
export ADMIN_NAME="Coordinación general" # opcional

# 3) Simulacro: muestra qué borraría, sin cambiar nada
npm run db:go-live

# 4) De verdad: añade CONFIRM=WIPE
CONFIRM=WIPE npm run db:go-live
```

Después entras en `/login` con ese teléfono (o correo) y la contraseña. Desde
ahí el coordinador crea centros, encargados, campañas, etc.

Mientras tanto los datos demo siguen intactos: `db:go-live` sólo actúa cuando lo
corres tú con `CONFIRM=WIPE`. Para volver a datos demo en cualquier base:
`npm run db:seed`.

> El borrado es irreversible. Si la base ya tiene datos reales, haz antes un
> backup en Supabase → **Database → Backups**.
