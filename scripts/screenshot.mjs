// Take the README screenshot from a running preview server (default http://localhost:4173).
// Usage: node scripts/screenshot.mjs [url] [out]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:4173/?lang=en&sel=rumelihisari,anadoluhisari-beykoz";
const out = process.argv[3] ?? "docs/screenshot.png";
mkdirSync("docs", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(url);
await page.getByTestId("label-row").first().waitFor();
await page.getByTestId("map-skeleton").waitFor({ state: "hidden" }).catch(() => {});
await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="map-skeleton"]')).opacity === "0", null, { timeout: 30000 });
await page.getByRole("searchbox").fill("hisar");
await page.getByTestId("selection-toolbar").getByRole("button", { name: /show on map/i }).click();
await page.waitForTimeout(2500);
// hover the Rumelihisarı box so the card shows
const box = await page.locator('.lbl[data-id="rumelihisari"]').first().boundingBox();
if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(600);
await page.screenshot({ path: out });
await browser.close();
console.log("wrote", out);
