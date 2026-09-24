// Phone-sized screenshots (map, and the list sheet open) for a layout check.
import { chromium, devices } from "@playwright/test";
import { mkdirSync } from "node:fs";

const url = process.argv[2] ?? "http://localhost:4173/?lang=tr";
mkdirSync("docs", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
await page.goto(url);
await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="map-skeleton"]')).opacity === "0", null, { timeout: 30000 });
await page.screenshot({ path: "docs/mobile-map.png" });
await page.getByTestId("open-list").click();
await page.waitForTimeout(800);
await page.screenshot({ path: "docs/mobile-list.png" });
await browser.close();
console.log("ok");
