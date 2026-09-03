# Arquitectura

## Principios

1. **La lógica de inventario está centralizada** en `services/`. Los componentes
   de React nunca calculan stock.
2. **Los movimientos son la fuente de verdad.** El stock se puede reconstruir
   sumando/restando `Movement`. `InventoryItem` es sólo un caché materializado
   que se actualiza en la misma transacción.
3. **La autorización se comprueba en el servidor** en cada Server Action y Route
   Handler. Ocultar un botón no es autorización.
4. **Errores de dominio tipados** → mensajes en español, sin stack traces al
   usuario.

## Capas

```
┌───────────────────────────────────────────────────────────────┐
│ app/(app)/**          Rutas y páginas (Server Components)      │
│ features/**/ui        Formularios y vistas (Client Components) │
├───────────────────────────────────────────────────────────────┤
│ features/**/actions   Server Actions: auth + Zod + orquestación│
│ app/api/**            Route Handlers (export CSV)              │
├───────────────────────────────────────────────────────────────┤
│ services/**           Lógica de negocio (server-only)          │
│   inventory.service   getStock, assertAvailable, recordMovement,│
│                       adjustInventory, verifyConsistency        │
│   transfer.service    executeTransfer (transacción atómica)     │
│   movements.service   reception/delivery/waste + aprobación     │
│   dashboard.service   agregaciones para los 4 paneles           │
│   goal.service        progreso de metas                         │
│   traceability.service línea de tiempo de un recurso            │
│   export.service      CSV (movimientos, inventario)             │
│   notification.service avisos internos                          │
├───────────────────────────────────────────────────────────────┤
│ repositories/**       Acceso a datos fino (Prisma)             │
│ lib/db.ts             Cliente Prisma (singleton)               │
├───────────────────────────────────────────────────────────────┤
│ Prisma  ·  PostgreSQL (Supabase en prod, Postgres local en dev)│
│           DATABASE_URL = conexión con pooling (runtime)         │
│           DIRECT_URL   = conexión directa (migraciones)         │
└───────────────────────────────────────────────────────────────┘
             ▲
   lib/permissions.ts  (matriz de capacidades, usada por UI y servidor)
   lib/auth/**         (sesión, DAL, hashing, verificación de origen)
   validators/**       (esquemas Zod compartidos)
```

## Autenticación, registro y aprobación

- **Login por correo O teléfono**: `parseIdentifier` decide el tipo; el teléfono
  se compara normalizado (sólo dígitos).
- **Auto-registro** (`/registro`, público): crea `User` con
  `role = VOLUNTARIO_CENTRO`, `active = false`, `approvalStatus = "PENDING"`,
  `createdVia = "SELF_REGISTRATION"`. No puede iniciar sesión hasta que
  `approvalStatus = "APPROVED"` (lo comprueba `getSessionUser` además del login).
- **Aprobación**: un `ENCARGADO_CENTRO` (capacidad `team.manage`, sólo su centro
  vía `canManageVolunteer`) o un `COORDINADOR_GENERAL` (`users.manage`, cualquier
  centro) aprueba/rechaza/reactiva desde `/mi-equipo` o `/usuarios`.
- **Alta de centro + primer encargado**: `createCenterAction` crea el `Center` y
  el `User` encargado en una `$transaction`.

## Sesión

- Login → `verifyPassword` (bcrypt) → `createSession`.
- `Session` guarda `sha256(token)`. La cookie (`acopio_session`) lleva sólo el
  token aleatorio de 256 bits: `HttpOnly`, `SameSite=Lax`, `Secure` en
  producción, expiración deslizante (se renueva al pasar de la mitad de su vida).
- Un volcado de la tabla `Session` no permite reutilizar sesiones (sólo hay
  hashes). Desactivar un usuario borra sus sesiones.
- `proxy.ts` (antes “middleware”, renombrado en Next 16) hace sólo una
  comprobación **optimista** de presencia de cookie para redirigir rápido. La
  verificación real (sesión válida, rol, pertenencia) está en la DAL
  (`lib/auth/dal.ts`) y en cada acción.
- Mitigación CSRF: los Server Actions son POST y además `assertSameOrigin()`
  compara `Origin` con `Host` en cada mutación.
- Rate limiting de login en memoria por `IP:correo`.

## Modelo de datos (resumen)

`User`, `Session`, `Campaign`, `Center`, `CampaignCenter` (puente N:M),
`Article`, `Movement`, `Transfer`, `InventoryItem` (snapshot único por
centro+campaña+artículo), `Donor`, `RecipientInstitution`, `CampaignGoal`,
`Notification`, `AuditLog`.

- `Movement.type` ∈ `RECEPTION | DELIVERY | WASTE | TRANSFER_IN | TRANSFER_OUT |
  ADJUSTMENT_POSITIVE | ADJUSTMENT_NEGATIVE` (guardados como `String` y validados
  con Zod contra `lib/constants.ts`, para no acoplar el dominio a migraciones de
  tipo). Igual con `role` y `approvalStatus`.
- `Movement.status` para ciclos de vida: entregas `PENDING|CONFIRMED`, mermas
  `PENDING_APPROVAL|APPROVED|REJECTED`.
- Índices en `Movement`: `campaignId`, `centerId`, `articleId`, `createdAt`,
  `type`, `transferId` y el compuesto `(centerId, campaignId, articleId)`.
- Cantidades: `Decimal` (Prisma) — nunca coma flotante para stock.

## Regla de inventario

```
stock(centro, campaña, artículo) =
    Σ recepciones
  + Σ transferencias de entrada
  + Σ ajustes positivos
  − Σ entregas
  − Σ mermas (aprobadas)
  − Σ transferencias de salida
  − Σ ajustes negativos
```

`recordMovement()` valida la cantidad, comprueba que el centro participa en la
campaña, verifica disponibilidad para salidas, crea el `Movement` y aplica el
delta al snapshot **en la misma transacción**; si el resultado quedara `< 0`,
lanza `InsufficientStockError` y revierte.

## Transferencia (flujo atómico)

`executeTransfer()` abre **una** transacción: valida que ambos centros
participen en la campaña, comprueba stock en origen, crea `Transfer`, y registra
`TRANSFER_OUT` (origen) + `TRANSFER_IN` (destino) con el mismo `transferId`.
Resultado: origen −, destino +, total de campaña sin cambio. Si algo falla, no
se guarda nada.

## Rendimiento

- Paginación en el historial (20 por página).
- `select`/`include` acotados; agregaciones con `groupBy`/`aggregate` de Prisma.
- Snapshot materializado para no recorrer el ledger en cada lectura de stock.
- Índices sobre las claves usadas en filtros de inventario e historial.
