# Cuentas de demostración

> **Sólo para desarrollo y presentación.** No usar en producción. Todas las
> cuentas comparten la misma contraseña de demo y se crean con el seed
> (`npm run db:seed`). Los hashes se guardan con bcrypt (coste 12); nunca hay
> contraseñas en texto plano en la base.

**Contraseña para todas las cuentas:** `Demo1234!`
**Se puede iniciar sesión con el correo O el teléfono** de la cuenta.

| Rol | Correo | Ámbito | Para qué sirve en la demo |
| --- | --- | --- | --- |
| Coordinador general | `coordinador@acopio.local` | Global | Ve todo; crea campañas/centros/usuarios; aprueba mermas y voluntarios; exporta; dashboard global |
| Coordinador general | `coordinador2@acopio.local` | Global | Demuestra que un coordinador puede crear más coordinadores |
| Encargado de centro | `encargado.tampico@acopio.local` | Centro Tampico | Recepción, entrega, merma, transferencia, ajuste; dashboard del centro |
| Voluntario de centro | `voluntario.tampico@acopio.local` | Centro Tampico | Sólo recepción y entrega (NO merma/ajuste/transferencia) |
| Encargado de centro | `encargado.madero@acopio.local` | Centro Ciudad Madero | Destino/origen de transferencias; tiene una merma pendiente de aprobar |
| Encargado de centro | `encargado.altamira@acopio.local` | Centro Altamira | Tercer centro de la campaña |
| Voluntario de centro | `voluntario.madero@acopio.local` | Centro Ciudad Madero | Segundo voluntario |
| Institución receptora | `cruzroja@acopio.local` | Cruz Roja Tampico | Ve y confirma entregas dirigidas a Cruz Roja |
| Institución receptora | `dif@acopio.local` | DIF Municipal | Ve y confirma entregas dirigidas al DIF |
| Líder de campaña | `lider@acopio.local` | Apoyo por Inundaciones Zona Sur | Panel de campaña: centros, metas, inventario agregado |

## Datos sembrados

- **Campaña activa:** “Apoyo por Inundaciones Zona Sur”.
- **Centros:** Tampico, Ciudad Madero, Altamira (con coordenadas del sur de
  Tamaulipas).
- **Instituciones:** Cruz Roja Tampico, DIF Municipal, Albergue Temporal Unidad
  Deportiva.
- **Artículos:** Agua embotellada, Arroz, Frijol, Atún enlatado, Cobijas,
  Pañales, Papel higiénico, Medicamentos básicos, Productos de limpieza.
- **2 solicitudes de voluntariado PENDIENTES** (auto-registro): Rodrigo Salinas
  (tel. 833-555-8080 → Centro Tampico) y Karla Fuentes
  (karla.fuentes@example.com → Centro Ciudad Madero). Sirven para demostrar la
  aprobación desde `/mi-equipo` (encargado) o `/usuarios` (coordinador).
- **~39 movimientos**: varias recepciones (anónimas y con donante), entregas
  (con al menos una `PENDING` y una `CONFIRMED`), una merma aprobada y **una
  merma pendiente de aprobación**, tres transferencias y varios ajustes.
- **Metas:** Arroz 500 kg, Medicamentos básicos 100 caja, Agua 1000 pieza,
  categoría Higiene 200 paquete (dos de ellas ya alcanzadas → notificación).
- Todos los inventarios resultantes son **coherentes y ≥ 0** (el seed lo
  verifica al terminar).

## Reiniciar los datos

```bash
npm run db:reset-demo    # reinicia la base y vuelve a sembrar
# o
npm run db:seed          # sólo re-siembra (borra y recarga)
```
