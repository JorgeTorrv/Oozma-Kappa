import { test, expect, type Page, type Locator } from "@playwright/test";

const PASSWORD = "Demo1234!";

/** Selecciona la opción de un <select> cuyo texto contiene `text`. */
async function selectByText(select: Locator, text: string) {
  const value = await select
    .locator("option", { hasText: text })
    .first()
    .getAttribute("value");
  if (!value) throw new Error(`Opción no encontrada: ${text}`);
  await select.selectOption(value);
}

async function login(page: Page, identifier: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Correo o teléfono").fill(identifier);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/inicio");
}

async function logout(page: Page) {
  // Botón "Salir" del encabezado (escritorio).
  await page.getByRole("button", { name: "Salir" }).click();
  await page.waitForURL("**/login");
}

test("recorrido de demostración: recepción → transferencia → entrega → confirmación", async ({
  page,
}) => {
  // 0. Un ciudadano se registra como voluntario (queda pendiente).
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Tomás");
  await page.getByLabel("Apellido").fill("Rivera");
  await page.getByLabel("Teléfono").fill("833 900 1234");
  await selectByText(page.getByLabel("Centro de acopio"), "Centro Tampico");
  await page.getByLabel("Contraseña").fill("voluntario123");
  await page.getByRole("button", { name: "Enviar solicitud" }).click();
  await page.waitForURL("**/login**");
  await expect(page.getByText(/quedará activa cuando el encargado/)).toBeVisible();

  // La cuenta pendiente no puede entrar todavía.
  await page.goto("/login");
  await page.getByLabel("Correo o teléfono").fill("833 900 1234");
  await page.getByLabel("Contraseña").fill("voluntario123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(/pendiente de aprobación/)).toBeVisible();

  // 1. Coordinador ve el panel global.
  await login(page, "coordinador@acopio.local");
  await expect(
    page.getByRole("heading", { name: "Panel global" }),
  ).toBeVisible();
  await logout(page);

  // 1b. El encargado de Tampico aprueba la solicitud.
  await login(page, "encargado.tampico@acopio.local");
  await page.goto("/mi-equipo");
  const approveRow = page.getByRole("row", { name: /Tomás Rivera/ });
  page.once("dialog", (dlg) => dlg.accept());
  await approveRow.getByRole("button", { name: "Aprobar" }).click();
  await expect(page.getByText(/Voluntario aprobado/)).toBeVisible();
  await logout(page);

  // 1c. Ahora el nuevo voluntario sí puede iniciar sesión (por teléfono).
  await login(page, "833 900 1234", "voluntario123");
  await logout(page);

  // 2. Voluntario registra una recepción y el stock aumenta.
  await login(page, "voluntario.tampico@acopio.local");
  await expect(
    page.getByRole("heading", { name: "Panel del centro" }),
  ).toBeVisible();

  const stockBefore = Number(
    (
      await page.locator('[data-stat-value="Stock total"]').innerText()
    ).replace(/[^\d.]/g, ""),
  );

  await page.goto("/recepciones");
  await page.getByRole("button", { name: "Nueva recepción" }).click();
  await selectByText(page.getByLabel("Artículo"), "Agua embotellada");
  await page.getByLabel("Cantidad").fill("40");
  await page.getByRole("button", { name: "Registrar recepción" }).click();
  await expect(page.getByText(/Recepción registrada/)).toBeVisible();

  await page.goto("/inicio");
  await expect
    .poll(async () =>
      Number(
        (
          await page.locator('[data-stat-value="Stock total"]').innerText()
        ).replace(/[^\d.]/g, ""),
      ),
    )
    .toBe(stockBefore + 40);
  await logout(page);

  // 3. Encargado de Madero registra una entrega a Cruz Roja.
  await login(page, "encargado.madero@acopio.local");
  await page.goto("/entregas");
  await page.getByRole("button", { name: "Nueva entrega" }).click();
  await selectByText(
    page.getByLabel("Institución receptora"),
    "Cruz Roja",
  );
  await selectByText(page.getByLabel("Artículo"), "Medicamentos");
  await page.getByLabel("Cantidad").fill("5");
  await page.getByRole("button", { name: "Registrar entrega" }).click();
  await expect(page.getByText(/Entrega registrada/)).toBeVisible();
  await logout(page);

  // 4. La institución confirma la entrega.
  await login(page, "cruzroja@acopio.local");
  await page.goto("/institucion");
  await expect(
    page.getByRole("heading", { name: /Entregas a tu institución/ }),
  ).toBeVisible();
  const confirmBtn = page
    .getByRole("button", { name: "Confirmar recepción" })
    .first();
  await expect(confirmBtn).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await confirmBtn.click();
  await expect(page.getByText(/Entrega confirmada/)).toBeVisible();
});
