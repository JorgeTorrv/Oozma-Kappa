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

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/");
}

async function logout(page: Page) {
  // Botón "Salir" del encabezado (escritorio).
  await page.getByRole("button", { name: "Salir" }).click();
  await page.waitForURL("**/login");
}

test("recorrido de demostración: recepción → transferencia → entrega → confirmación", async ({
  page,
}) => {
  // 1. Coordinador ve el panel global.
  await login(page, "coordinador@acopio.local");
  await expect(
    page.getByRole("heading", { name: "Panel global" }),
  ).toBeVisible();
  await logout(page);

  // 2. Voluntario registra una recepción y el stock aumenta.
  await login(page, "voluntario.tampico@acopio.local");
  await expect(
    page.getByRole("heading", { name: "Panel del centro" }),
  ).toBeVisible();

  const stockText = await page
    .getByText("Stock total")
    .locator("xpath=following-sibling::*[1]")
    .innerText();
  const stockBefore = Number(stockText.replace(/[^\d.]/g, ""));

  await page.goto("/recepciones");
  await selectByText(page.getByLabel("Artículo"), "Agua embotellada");
  await page.getByLabel("Cantidad").fill("40");
  await page.getByRole("button", { name: "Registrar recepción" }).click();
  await expect(page.getByText(/Recepción registrada/)).toBeVisible();

  await page.goto("/");
  const stockAfterText = await page
    .getByText("Stock total")
    .locator("xpath=following-sibling::*[1]")
    .innerText();
  const stockAfter = Number(stockAfterText.replace(/[^\d.]/g, ""));
  expect(stockAfter).toBe(stockBefore + 40);
  await logout(page);

  // 3. Encargado de Madero registra una entrega a Cruz Roja.
  await login(page, "encargado.madero@acopio.local");
  await page.goto("/entregas");
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
