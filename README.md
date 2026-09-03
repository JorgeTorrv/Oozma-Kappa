# Acopio Hub

**Sistema de Registro y Coordinación de Centros de Acopio**

Aplicación web para administrar campañas de acopio en las que participan varios
centros de recolección. Centraliza **entradas, salidas, mermas y transferencias**
para que la coordinación general tenga **inventario en tiempo real** y
**trazabilidad completa** de cada recurso.

> En este proyecto “donación” significa **artículos físicos** entregados a un
> centro (agua, arroz, cobijas, medicamentos…). **No hay pagos, tarjetas,
> pasarelas ni información financiera de ningún tipo.**

---

## Descripción

Durante una emergencia, cada centro de acopio suele llevar su propio control en
papel o en hojas de cálculo. El resultado: nadie sabe cuánto inventario real hay
en cada centro, no hay trazabilidad de entradas y salidas, y es difícil decidir
a dónde enviar los recursos.

**Acopio Hub** resuelve esto con un sistema centralizado, con autenticación y
permisos por rol, un **servicio de inventario único** que garantiza la
consistencia del stock, y paneles por rol para coordinación general, encargados
de centro, voluntarios, instituciones receptoras y líderes de campaña.

## Problema que resuelve

- No conocer en tiempo real cuánto inventario existe en cada centro.
- Falta de trazabilidad de entradas y salidas.
- Ausencia de control centralizado y de visibilidad entre centros.
- Dificultad para decidir a dónde enviar los recursos.

## Diferenciador

**Trazabilidad visual de los recursos.** A partir del historial de movimientos,
la aplicación reconstruye —como una línea de tiempo— el recorrido de un artículo:

```
Donación → Centro Tampico → Transferencia → Centro Ciudad Madero → Entrega → Cruz Roja
```

Para cada evento se muestra centro, actor, fecha, cantidad y motivo. No es
blockchain ni nada exótico: sólo aprovecha los movimientos que el sistema ya
registra para hacerlos comprensibles de un vistazo (`/trazabilidad`).

---

## Stack tecnológico

| Área | Tecnología |
| --- | --- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript (strict) |
| UI | Tailwind CSS v4 · componentes propios estilo shadcn/ui · Lucide Icons |
| Base de datos | PostgreSQL (Supabase en la nube · Postgres local para dev) |
| ORM | Prisma 6 (cantidades con `Decimal`, `DATABASE_URL` pooled + `DIRECT_URL`) |
| Hosting | Vercel (app) + Supabase (BD) — ver [`docs/deploy.md`](docs/deploy.md) |
| Autenticación | Sesión propia basada en cookie + tabla `Session` (token opaco, `sha256` en BD); login por **correo o teléfono** |
| Validación | Zod (en cada Server Action y Route Handler) |
| Contraseñas | bcrypt (coste 12); módulo aislado, intercambiable por Argon2id |
| Gráficas | Recharts |
| Mapa | OpenStreetMap + Leaflet + búsqueda Nominatim (sin key); se auto-actualiza a Google Maps si defines `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Pruebas | Vitest (lógica de inventario y permisos) · Playwright (flujo E2E de demo) |
| Calidad | ESLint · Prettier |
| Portabilidad | Docker · docker-compose (app + Postgres) |

## Requisitos

- **Node.js 20 LTS** o superior (probado con Node 20 y 26). Ver `.nvmrc`.
- **npm** (se versiona `package-lock.json` para builds reproducibles).
- **PostgreSQL**: una base de Supabase (gratis) o Postgres local
  (`brew install postgresql@16` / Docker). Ver [`docs/deploy.md`](docs/deploy.md).
- **Docker** *(opcional)* para `docker compose up` (levanta app + Postgres).

---

## Instalación desde cero

```bash
git clone <URL-del-repo> acopio-hub
cd acopio-hub
cp .env.example .env          # pon tus DATABASE_URL / DIRECT_URL de Postgres
npm install
npm run setup                 # prisma generate + migrate deploy + seed demo
npm run dev                   # http://localhost:3000
```

Alternativa de un solo comando (útil en la presentación, spec §33):

```bash
npm run demo                  # comprueba BD, migra, siembra si falta y arranca
```

Con Docker (incluye su propio Postgres, no necesitas nada más):

```bash
docker compose up --build
```

## Variables de entorno

`.env.example` (cópialo a `.env`). Claves principales:

```env
# PostgreSQL — Supabase: pooler :6543 para DATABASE_URL, directa :5432 para DIRECT_URL
DATABASE_URL="postgresql://USER:PASS@HOST:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://USER:PASS@HOST:5432/postgres"
NODE_ENV="development"
# WASTE_APPROVAL_ENABLED="true"          # "false" desactiva la aprobación de mermas
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=""     # opcional; si falta se usa OpenStreetMap
# NOMINATIM_CONTACT_EMAIL=""             # opcional, buena práctica
```

**Nunca se suben secretos.** `.env` está en `.gitignore`. En Vercel se cargan
como *Environment Variables* (secrets). Guía completa: [`docs/deploy.md`](docs/deploy.md).

## Cuentas de prueba

Todas comparten la contraseña de demostración **`Demo1234!`** (sólo para
desarrollo). Ver también [`docs/demo-accounts.md`](docs/demo-accounts.md).

Puedes iniciar sesión con el **correo o el teléfono** (los que tenga la cuenta).

| Rol | Correo | Ámbito |
| --- | --- | --- |
| Coordinador general | `coordinador@acopio.local` | Visibilidad total |
| Coordinador general | `coordinador2@acopio.local` | Visibilidad total (2º) |
| Encargado de centro | `encargado.tampico@acopio.local` | Centro Tampico |
| Voluntario de centro | `voluntario.tampico@acopio.local` | Centro Tampico |
| Encargado de centro | `encargado.madero@acopio.local` | Centro Ciudad Madero |
| Encargado de centro | `encargado.altamira@acopio.local` | Centro Altamira |
| Voluntario de centro | `voluntario.madero@acopio.local` | Centro Ciudad Madero |
| Institución receptora | `cruzroja@acopio.local` | Cruz Roja Tampico |
| Institución receptora | `dif@acopio.local` | DIF Municipal |
| Líder de campaña | `lider@acopio.local` | Apoyo por Inundaciones Zona Sur |

El seed también deja **2 solicitudes de voluntariado pendientes** (Rodrigo
Salinas → Tampico, Karla Fuentes → Ciudad Madero) para demostrar el flujo de
aprobación. Cualquiera puede crear su propia solicitud en **`/registro`**.

## Scripts disponibles

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (escribe) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (lógica crítica) |
| `npm run test:e2e` | Playwright (flujo completo de demo) |
| `npm run setup` | `prisma generate` + `migrate deploy` + `db:seed` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Carga los datos de demostración |
| `npm run db:reset-demo` | Reinicia la base y vuelve a sembrar (`prisma migrate reset --force`) |
| `npm run db:studio` | Prisma Studio |
| `npm run demo` | Prepara BD si hace falta y arranca la app (plan B para la demo) |

## Docker

```bash
docker compose up --build
```

- Levanta **dos servicios**: `db` (Postgres 16) y `app` (la aplicación).
- La app queda en `http://localhost:3000`.
- Los datos de Postgres se persisten en el volumen `acopio_pgdata`.
- Al arrancar, el contenedor `app` aplica migraciones y, **si la base está
  vacía**, carga los datos de demostración.
- No se usan rutas absolutas del equipo del desarrollador.

> **Limitación conocida:** los archivos de Docker se entregan listos pero **no se
> ejecutó `docker compose up`** en el entorno de desarrollo (sin Docker
> instalado). El flujo probado end-to-end es el de `npm` con una base Postgres
> (Supabase o local). Guía de despliegue: [`docs/deploy.md`](docs/deploy.md).

## Estructura del proyecto

```
app/                 Rutas (App Router). (app)/ = área autenticada con shell.
  (app)/…            Paneles y flujos: recepciones, entregas, mermas,
                     transferencias, ajustes, movimientos, inventario,
                     trazabilidad, mapa, campañas, centros, artículos,
                     instituciones, usuarios, notificaciones.
  api/export/…       Route Handlers de exportación CSV.
components/           UI presentacional (sin lógica de inventario) + charts.
features/             Módulos por funcionalidad: cada uno con actions.ts,
                     esquemas y componentes (auth, movements, catalog,
                     dashboard, institution, history, traceability, map,
                     notifications).
lib/                 Núcleo: auth (sesión, DAL, hashing), permissions.ts
                     (matriz de capacidades), errores, formato es-MX,
                     rate-limit, auditoría, cliente Prisma.
services/            Lógica de negocio CENTRALIZADA:
                     inventory.service.ts, transfer.service.ts,
                     movements.service.ts, dashboard.service.ts,
                     goal.service.ts, traceability.service.ts,
                     export.service.ts, notification.service.ts.
repositories/        Acceso a datos fino (movimientos, inventario).
validators/          Esquemas Zod compartidos.
prisma/              schema.prisma · migrations/ · seed.ts
tests/               Vitest (inventory, permissions) + Playwright (e2e).
docs/                Documentación de entrega.
docker/              entrypoint.sh del contenedor.
```

## Funciones implementadas

**MVP**

- Autenticación real por sesión (cookie `HttpOnly`/`SameSite`/`Secure` en prod,
  token opaco, revocable; rate-limit de login; verificación de origen en las
  mutaciones).
- 5 roles con **matriz central de permisos** (`lib/permissions.ts`), aplicada en
  UI **y** en el servidor. Protección anti-IDOR (un encargado no puede tocar otro
  centro cambiando un id).
- Gestión de campañas, centros (con lat/long), artículos (categoría y unidad
  libres), instituciones receptoras y usuarios.
- **InventoryService** central: calcula stock por (centro + campaña + artículo),
  impide stock negativo, valida cantidades (sin `NaN`/`Infinity`/0/negativos,
  hasta 3 decimales), y mantiene un snapshot materializado consistente con el
  ledger de movimientos.
- Flujos: **recepción** (anónima o con donante opcional, alta en pocos clics),
  **entrega** (estados `PENDING`/`CONFIRMED`), **merma** (motivo obligatorio),
  **transferencia entre centros** (transacción atómica, `TRANSFER_OUT` +
  `TRANSFER_IN` con el mismo `transferId`), **ajuste** (`+`/`-` con motivo).
- **Historial de movimientos** con filtros (campaña, centro, artículo, tipo,
  usuario, rango de fechas), paginación y badges por tipo. No se borran
  movimientos desde la interfaz.
- Paneles: **coordinador** (KPIs globales + 6 gráficas + comparación entre
  centros), **centro** (stock, entradas/salidas, alertas de stock bajo,
  movimientos recientes), **institución** (entregas pendientes/recibidas +
  botón confirmar), **líder de campaña** (centros, inventario agregado, metas).
- Trazabilidad de actor y fecha en cada movimiento (`AuditLog` para acciones
  administrativas).

**Extras (spec §19)**

1. **Líder de campaña** — panel propio de sólo lectura de su campaña.
2. **Metas de recolección** — por artículo o categoría, con barra de progreso.
3. **Aprobación de mermas** — `PENDING_APPROVAL → APPROVED/REJECTED`; la merma no
   descuenta stock hasta ser aprobada por el coordinador
   (`WASTE_APPROVAL_ENABLED`).
4. **Exportación CSV** — inventario y movimientos, respetando los filtros
   aplicados y el ámbito del usuario.
5. **Notificaciones internas** — centro de notificaciones dentro de la app
   (recepción, merma pendiente/resuelta, transferencia recibida, entrega
   pendiente, meta alcanzada). Sin correo ni servicios externos.
6. **Mapa de centros** — Leaflet + OpenStreetMap con marcadores e inventario
   resumido; si no hay Internet para los mosaicos, cae automáticamente a una
   lista.
7. **Trazabilidad visual** — línea de tiempo del recorrido de un recurso
   (diferenciador principal).

**Añadido para la versión post-evento**

- **Landing pública (`/`)** — cualquier persona encuentra centros de acopio
  activos (mapa + lista + “cómo llegar”) para ir a donar, **sin cuenta**.
- **Auto-registro de voluntarios (`/registro`)** — el ciudadano elige el centro
  y deja nombre + apellido y teléfono y/o correo. La cuenta nace **inactiva
  (PENDING)** hasta que un encargado (o el coordinador) de ese centro la aprueba.
- **Login por correo o teléfono.**
- **Gestión de equipo (`/mi-equipo`)** — el encargado aprueba/rechaza solicitudes
  y activa/desactiva a los voluntarios **de su centro**; el coordinador ve las
  solicitudes de todos los centros en `/usuarios` y puede aprobar cualquiera.
- **Alta de centro + primer encargado** en un solo formulario (coordinador);
  el coordinador también puede crear más coordinadores generales.
- **Dashboard del encargado con gráficas** de su propio centro.
- **Selector de ubicación en el mapa** al crear/editar un centro: búsqueda de
  lugares (OpenStreetMap/Nominatim, sin key) + soltar un pin para lugares no
  registrados. Se cambia solo a **Google Maps + Places** al definir
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- **PostgreSQL** (Supabase) + guía de despliegue a Vercel:
  [`docs/deploy.md`](docs/deploy.md).

## Criterios del MVP

La lista completa con su estado está en
[`docs/acceptance-checklist.md`](docs/acceptance-checklist.md). Todos los
criterios de la spec §28 están cubiertos y verificados (manualmente y con
pruebas automáticas de `services/inventory.service.ts` y
`lib/permissions.ts`).

## Funciones opcionales

Ver arriba (“Extras”). Todas están implementadas y demostrables.

## Limitaciones conocidas

- **Docker no verificado**: los archivos (app + Postgres) están completos pero no
  se ejecutó `docker compose up` (sin Docker en el entorno de desarrollo). El
  flujo `npm` con Postgres (local o Supabase) sí está probado end-to-end
  (lint, 21 pruebas Vitest, build y 1 flujo Playwright).
- **Google Maps**: no se incluye API key (no se puede crear una que se
  autodestruya). Por defecto funciona con OpenStreetMap sin key; `docs/deploy.md`
  explica cómo añadir una key de Google restringida y cómo borrarla luego.
- **Rate limiting en memoria**: suficiente para una instancia local/demo; en
  Vercel (varias lambdas) es best-effort — para producción real, Upstash Redis.
- **Notificaciones**: son avisos internos (filas en BD); no hay push ni correo,
  por diseño.
- **Alta de institución**: sólo el formulario básico (nombre/contacto/dirección);
  no se le asigna ubicación en el mapa ni usuario inicial automáticamente.
- **Playwright**: el flujo E2E cubre el recorrido de demo (incluye registro y
  aprobación de voluntario); no hay cobertura E2E exhaustiva de todas las
  pantallas.
- La emulación de zona horaria usa `America/Mexico_City` de forma fija.
