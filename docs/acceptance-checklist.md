# Checklist de criterios de aceptación del MVP (spec §28)

Estado: **todos cumplidos.** Verificación manual (navegando la app con las
cuentas demo) + automática (`npm run test`, 20 pruebas de
`services/inventory.service.ts`, `services/transfer.service.ts`,
`services/movements.service.ts` y `lib/permissions.ts`).

| # | Criterio | Estado | Dónde se verifica |
| --- | --- | --- | --- |
| 1 | El coordinador puede registrar un centro | ✅ | `/centros` · `createCenterAction` |
| 2 | El coordinador puede registrar una campaña | ✅ | `/campanas` · `createCampaignAction` |
| 3 | Un encargado o voluntario puede registrar una recepción | ✅ | `/recepciones` · `createReceptionAction` |
| 4 | Una recepción aumenta el stock | ✅ | test *“la recepción aumenta el stock”* |
| 5 | Una recepción puede ser anónima | ✅ | form “Donación anónima”; test *“recepción anónima vs. con datos”* |
| 6 | Una recepción puede guardar datos opcionales del donante | ✅ | mismo test; se crea `Donor` sólo si hay datos |
| 7 | Se puede registrar una entrega | ✅ | `/entregas` · `createDeliveryAction` |
| 8 | Una entrega reduce el stock | ✅ | test *“la entrega reduce el stock”* |
| 9 | Se registra una merma con motivo | ✅ | `/mermas`; `wasteSchema` exige motivo; test *“merma requiere motivo”* |
| 10 | La merma aparece en el historial | ✅ | `/movimientos` (tipo Merma, incl. `PENDING_APPROVAL`) |
| 11 | Se puede transferir stock entre centros | ✅ | `/transferencias` · `executeTransfer` |
| 12 | El stock disminuye en origen | ✅ | test *“la transferencia mueve stock…”* |
| 13 | El stock aumenta en destino | ✅ | mismo test |
| 14 | Se puede corregir inventario mediante ajuste | ✅ | `/ajustes` · `adjustInventory` (genera `ADJUSTMENT_*`) |
| 15 | El ajuste requiere motivo | ✅ | `adjustmentSchema` + servicio; test *“el ajuste requiere motivo”* |
| 16 | El coordinador ve dashboard global | ✅ | `/` con rol coordinador (`CoordinatorDashboard`) |
| 17 | El encargado ve dashboard de su centro | ✅ | `/` con rol encargado (`CenterDashboard`) |
| 18 | Existe trazabilidad de actor y fecha | ✅ | cada `Movement` guarda `actorUserId` y `createdAt`; `/trazabilidad` |
| 19 | Nunca se permite stock negativo | ✅ | guardas en `InventoryService`; test *“nunca se permite stock negativo”* |
| 20 | El sistema puede iniciarse desde una instalación limpia | ✅ | `npm install && npm run setup && npm run dev` |

## Reglas críticas adicionales verificadas

- **Atomicidad de la transferencia**: si una parte falla, no se guarda nada
  (`prisma.$transaction`); test *“la transferencia falla completamente si una
  parte falla”* y *“sin stock suficiente no escribe nada”*.
- **Conservación del inventario de campaña** en una transferencia: test
  *“…conserva el total de la campaña”*.
- **Cantidades inválidas** (`0`, negativas, `NaN`, > 3 decimales) rechazadas:
  test *“rechaza cantidades inválidas”*.
- **Decimales (kg)** sin error de coma flotante: test *“maneja decimales…”*.
- **Snapshot == ledger**: `verifyConsistency`; test *“el snapshot coincide con el
  ledger”* y verificación al final del seed.
- **Permisos por rol** y **anti-IDOR**: tests de `lib/permissions.ts`
  (*“un encargado sólo puede operar sobre su propio centro”*, *“el voluntario NO
  puede registrar merma…”*). Además, cada Server Action llama a
  `requireCapability` + `assertActOnCenter` en el servidor.
- **Aprobación de merma**: la merma `PENDING_APPROVAL` no descuenta stock hasta
  aprobarse; test *“…NO descuenta stock hasta aprobarse”*.
