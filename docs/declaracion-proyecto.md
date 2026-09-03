# Declaración de proyecto

## Nombre

**Acopio Hub** — Sistema de Registro y Coordinación de Centros de Acopio.

Repositorio: `JorgeTorrv/Oozma-Kappa`.

## Descripción breve

Aplicación web que centraliza el control de inventario de una campaña de acopio
con varios centros de recolección: registra recepciones, entregas, mermas,
transferencias y ajustes, y ofrece inventario en tiempo real, paneles por rol y
trazabilidad visual de cada recurso.

## Qué hace

- Autenticación real por sesión y **5 roles** con permisos diferenciados
  (coordinador general, encargado de centro, voluntario de centro, institución
  receptora, líder de campaña).
- **Registro rápido de recepciones** (donante anónimo u opcional).
- **Entregas** a instituciones receptoras con confirmación de recepción.
- **Mermas** con motivo obligatorio y flujo opcional de aprobación.
- **Transferencias entre centros** como operación atómica (todo o nada).
- **Ajustes de inventario** con motivo, siempre como movimiento (nunca editando
  un número de stock).
- **Historial** filtrable y paginado; los movimientos no se borran.
- **Paneles** para coordinación, centro, institución y líder de campaña, con
  gráficas útiles y comparación entre centros.
- **Trazabilidad visual**, **metas de recolección**, **exportación CSV**,
  **notificaciones internas** y **mapa de centros**.

## Diferenciador elegido

**Trazabilidad visual de los recursos.** Reconstruye, como línea de tiempo, el
recorrido de un artículo desde la donación hasta la institución receptora,
pasando por los centros y las transferencias, mostrando actor y fecha en cada
paso. Reutiliza el ledger de movimientos que el sistema ya mantiene.

## Problema que resuelve

Durante una emergencia, cada centro controla sus donaciones por separado. La
coordinación no conoce el inventario real de cada centro, no hay trazabilidad de
entradas y salidas, y es difícil decidir a dónde enviar los recursos. Acopio Hub
centraliza entradas, salidas, mermas y transferencias y ofrece inventario
actualizado y trazabilidad.

## Impacto

Permite tomar mejores decisiones durante una emergencia y distribuir los
recursos hacia donde realmente hacen falta, con un registro auditable de quién
hizo qué y cuándo.

## Quién se beneficia

- **Coordinación general de la campaña**: visibilidad total y control.
- **Encargados y voluntarios de centro**: registro rápido y menos papeleo.
- **Instituciones receptoras**: saben qué se les envió y confirman lo recibido.
- **Población afectada**: los recursos llegan mejor distribuidos.

## Alcance del MVP

Roles y permisos; gestión de campañas, centros, artículos, instituciones y
usuarios; servicio central de inventario con integridad garantizada; los cinco
flujos de movimiento; historial; y los cuatro paneles por rol. Todo verificado
contra la checklist de aceptación (`acceptance-checklist.md`).

## Checklist de criterios de aceptación

Ver [`acceptance-checklist.md`](acceptance-checklist.md). Todos los puntos de la
spec §28 están cumplidos y verificados.

## Stack utilizado

Next.js 16 (App Router), React 19, TypeScript strict; Tailwind CSS v4 y
componentes propios estilo shadcn/ui; Lucide Icons; SQLite + Prisma 6 (con
`Decimal` para cantidades); autenticación por sesión propia (cookie + tabla
`Session`, token opaco, bcrypt); Zod para validación; Recharts para gráficas;
Leaflet + OpenStreetMap para el mapa; Vitest y Playwright para pruebas; ESLint y
Prettier; Docker + docker-compose para portabilidad.

## Librerías / frameworks / APIs usadas

- **next**, **react**, **react-dom** — framework y UI.
- **prisma** / **@prisma/client** — ORM y acceso a SQLite.
- **zod** — validación de entrada en servidor.
- **bcryptjs** — hash de contraseñas.
- **tailwindcss** (v4) + **class-variance-authority**, **clsx**,
  **tailwind-merge** — estilos.
- **lucide-react** — iconos.
- **recharts** — gráficas del dashboard.
- **leaflet** + **OpenStreetMap** (mosaicos públicos) — mapa de centros. Único
  recurso de red opcional; hay respaldo en lista si no hay Internet.
- **vitest**, **@playwright/test** — pruebas.
- **eslint**, **prettier**, **tsx** — tooling.

No se usan servicios de pago, bases de datos en la nube, autenticación de
terceros, IA generativa dentro del producto, blockchain ni microservicios.

## Declaración de uso de herramientas de IA

Se utilizó un asistente de IA de programación (Claude, de Anthropic) para:

- Discutir la arquitectura y el modelo de datos.
- Generar código de andamiaje y de implementación (esquema Prisma, servicios,
  Server Actions, componentes de UI, seed, pruebas y documentación) bajo
  revisión y ajustes.
- Redactar esta documentación y el guion de demo.

Toda la lógica de negocio crítica (integridad de inventario, transacciones de
transferencia, matriz de permisos) está cubierta por pruebas automáticas
ejecutables (`npm run test`).

## Limitaciones conocidas

- Docker entregado pero no ejecutado en el entorno de desarrollo (sin Docker
  instalado). El flujo `npm` sí está probado end-to-end.
- Rate limiting de login en memoria (una sola instancia).
- Notificaciones sólo internas (sin correo/push), por diseño.
- Cobertura E2E centrada en el recorrido de demo, no exhaustiva.
- No se incluyen nombres de integrantes del equipo por no estar disponibles.
