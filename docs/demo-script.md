# Guion de demostración

Duración objetivo: **6–8 minutos**. Todo es local; no se necesita Internet.

## Preparación (antes de empezar)

```bash
npm run demo         # o: npm run setup && npm run dev
```

Abrir `http://localhost:3000`. Tener a mano las cuentas (contraseña `Demo1234!`).

> Plan B: si algo se rompe, `npm run db:reset-demo` restaura los datos en
> segundos y se vuelve a `npm run dev`.

---

## Antes de iniciar sesión (versión post-evento)

- **Landing pública (`/`)** — mapa + lista de centros activos con “cómo llegar”.
  Sin cuenta para donar.
- **Registro de voluntario (`/registro`)** — nombre, apellido, teléfono y centro
  → “tu cuenta quedará activa cuando el encargado la apruebe”. Al intentar
  entrar: *pendiente de aprobación*.
- Más tarde: **Encargado → `/mi-equipo`** aprueba la solicitud; el voluntario ya
  puede entrar (con correo **o** teléfono).

## Recorrido

1. **Login como Coordinador** — `coordinador@acopio.local`.
2. **Panel global**: señalar KPIs (campañas, centros, inventario total,
   recepciones, entregas, merma, transferencias), las gráficas
   (inventario por centro, recepciones por día, artículos más recibidos,
   categorías, merma por centro, progreso de campañas) y la **comparación entre
   centros**.
3. **Campaña**: `Campañas → Apoyo por Inundaciones Zona Sur`. Mostrar los tres
   centros participantes y las **metas** con su barra de progreso (dos ya
   alcanzadas).
4. **Centros**: `Centros` — mostrar la lista y el formulario de alta (crear uno
   nuevo si se quiere; se puede desactivar después).
5. **Cambiar a Voluntario** (Tampico) — `voluntario.tampico@acopio.local`.
   - `Registrar recepción`: campaña ya seleccionada (sólo hay una), elegir
     *Agua embotellada*, cantidad `48`, dejar “Donación anónima”, **Registrar**.
   - Aparece el toast “Recepción registrada. El inventario aumentó.”
6. **Mostrar que el stock aumentó**: en el mismo panel del voluntario, el
   “Stock total” y la fila de *Agua embotellada* reflejan el alta.
   (El voluntario **no** ve Mermas/Transferencias/Ajustes: menos opciones en el
   menú — eso es la matriz de permisos.)
7. **Cambiar a Encargado de Ciudad Madero** — `encargado.madero@acopio.local`.
   - `Mermas`: hay **una merma pendiente** (Arroz, 10 kg, Caducidad) que este
     centro registró. Explicar que **no descuenta stock** hasta aprobarse.
8. **Registrar una merma nueva** desde este encargado (p. ej. *Cobijas*, `3`,
   motivo *Daño*). Queda `PENDING_APPROVAL`.
9. **Historial** (`Movimientos`): filtrar por tipo *Merma* y por *Ciudad
   Madero*. Mostrar badges por tipo y que **no hay botón de borrar**.
10. **Transferir artículos**: `Transferencias` — origen bloqueado a *Ciudad
    Madero*, destino *Altamira*, artículo *Arroz*, cantidad `40`, **Realizar
    transferencia**.
11. **Mostrar origen ↓ y destino ↑**: volver al panel del encargado (Arroz de
    Madero baja) y, si se quiere, entrar como `encargado.altamira@acopio.local`
    para ver Arroz subir. El total de la campaña no cambia.
12. **Registrar una entrega**: como encargado de Madero, `Entregas` →
    institución *Cruz Roja Tampico*, artículo *Medicamentos básicos*, `10`.
    Queda `PENDING`.
13. **Cambiar a Institución** — `cruzroja@acopio.local`.
    - `Entregas recibidas`: aparece la entrega pendiente. Pulsar **Confirmar
      recepción** → pasa a `CONFIRMED`.
14. **Volver a Coordinador** — `coordinador@acopio.local`.
    - `Mermas`: **Aprobar** la merma pendiente de Arroz (10 kg). Ahora sí
      descuenta stock. (O **Rechazar** para mostrar el otro camino.)
    - `Panel global`: los KPIs y gráficas reflejan todo lo anterior.
15. **Trazabilidad** (`Trazabilidad`): elegir la campaña y el artículo *Cobijas*
    (o *Agua*). Mostrar la **línea de tiempo**: donación → centro →
    transferencia → centro → entrega → institución, con actor y fecha en cada
    paso. También se llega con el botón **“Trazar”** desde el historial.
16. **Extras rápidos**:
    - `Mapa de centros`: marcadores con inventario resumido (si no hay Internet,
      cae a lista automáticamente).
    - `Movimientos → Exportar CSV`: descarga respetando los filtros.
    - `Notificaciones`: merma pendiente, metas alcanzadas, entrega por confirmar.

---

## Mini pitch

**Problema.** En una emergencia, cada centro de acopio controla sus donaciones
por separado. La coordinación no conoce el inventario real de cada centro, no hay
trazabilidad de entradas y salidas, y es difícil saber a dónde enviar los
recursos.

**Solución.** Acopio Hub centraliza entradas, salidas, mermas y transferencias
en un solo sistema con roles y permisos, y ofrece inventario actualizado y un
historial auditable de quién hizo qué y cuándo.

**Diferenciador.** Permite **seguir visualmente** cómo un recurso pasa de una
donación a un centro, entre centros y finalmente a una institución receptora,
como una línea de tiempo.

**Impacto.** Ayuda a tomar mejores decisiones durante la emergencia y a
distribuir los recursos hacia donde realmente hacen falta.

*(Sin estadísticas inventadas: el valor es la visibilidad y la trazabilidad.)*
