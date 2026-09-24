import { expect, test, type Page } from "@playwright/test";

async function open(page: Page, query = "?lang=en") {
  await page.goto("/" + query);
  await expect(page.getByTestId("sidebar")).toBeVisible();
  // labels.json has arrived once the list has rows
  await expect(page.getByTestId("label-row").first()).toBeVisible();
}

test("the app loads and the map canvas renders", async ({ page }) => {
  await open(page);
  const canvas = page.locator('[data-testid="map"] canvas').first();
  await expect(canvas).toBeVisible();
  // the skeleton fades once the first tile has loaded from Wikimedia
  await expect(page.getByTestId("map-skeleton")).toHaveCSS("opacity", "0", { timeout: 30_000 });
  // label overlays exist in the DOM
  expect(await page.locator(".lbl").count()).toBeGreaterThan(100);
});

test('searching "hisar" returns both Rumelihisarı and Anadoluhisarı', async ({ page }) => {
  await open(page);
  await page.getByRole("searchbox").fill("hisar");
  const rows = page.getByTestId("label-row");
  await expect(rows.filter({ hasText: /Rumelihisarı/ }).first()).toBeVisible();
  await expect(rows.filter({ hasText: /Anadoluhisarı/ }).first()).toBeVisible();
});

test("selecting both shows two selected overlays and the URL contains sel=", async ({ page }) => {
  await open(page);
  await page.getByRole("searchbox").fill("hisar");
  const rows = page.getByTestId("label-row");
  const rumeli = rows.filter({ hasText: /Rumelihisarı/ }).first();
  const anadolu = rows.filter({ hasText: /Anadoluhisarı/ }).first();
  await rumeli.getByRole("checkbox").click();
  await anadolu.getByRole("checkbox").click();
  await expect(page.getByTestId("selection-toolbar")).toContainText("2 selected");
  await expect(page.locator(".lbl.is-sel")).toHaveCount(2);
  await expect(page).toHaveURL(/sel=/);
  const url = new URL(page.url());
  expect(url.searchParams.get("sel")!.split(",")).toHaveLength(2);
});

test("switching to TR changes the glosses for Şeytan Akıntısı", async ({ page }) => {
  await open(page);
  await page.getByRole("searchbox").fill("cheïtan");
  const row = page.getByTestId("label-row").filter({ hasText: /CHEÏTAN-AKINDISI/ }).first();
  await expect(row).toContainText("Devil's Current");
  await page.getByTestId("lang-toggle").getByRole("radio", { name: "TR" }).click();
  await expect(page).toHaveURL(/lang=tr/);
  await expect(row).not.toContainText("Devil's Current");
  // the gloss under the French original is now the Turkish literal rendering
  await expect(row.getByTestId("gloss-fr")).toHaveText("Şeytan Akıntısı");
  // and in FR the gloss under the original disappears entirely
  await page.getByTestId("lang-toggle").getByRole("radio", { name: "FR" }).click();
  await expect(row.getByTestId("gloss-fr")).toHaveCount(0);
  await expect(row.getByTestId("gloss-ota")).toHaveText("Courant du Diable");
});

test("hovering an overlay shows the hover card", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("map-skeleton")).toHaveCSS("opacity", "0", { timeout: 30_000 });
  // fly to a label so its box is big on screen, then hover its centre
  await page.getByRole("searchbox").fill("kanlıca");
  const row = page.getByTestId("label-row").filter({ hasText: /KANDLIDGÉ/ }).first();
  const id = await row.getAttribute("data-id");
  await row.click();
  await page.waitForTimeout(1200); // animationTime is 0.6 s
  const box = page.locator(`.lbl[data-id="${id}"]`).first();
  const bb = await box.boundingBox();
  expect(bb).not.toBeNull();
  await page.mouse.move(bb!.x + bb!.width / 2, bb!.y + bb!.height / 2);
  const card = page.getByTestId("hover-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("KANDLIDGÉ");
  await expect(card).toContainText("Kanlıca");
});
