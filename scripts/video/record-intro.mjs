// English 10-second demo take (docs/demo-10s-en.mp4): search "hisar", tick both fortresses, show on map, hover.
// Headed Chromium at 2x device scale, CDP screencast, frames re-timed to 60 fps CFR and motion-interpolated.
//   node scripts/video/record-intro.mjs [outDir=take] [url=http://localhost:4173/?lang=en]
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [outDir = "take", url = "http://localhost:4173/?lang=en"] = process.argv.slice(2);
const W = 1280, H = 800, FPS = 60, DPR = 2;
mkdirSync(join(outDir, "frames"), { recursive: true });

const browser = await chromium.launch({ headless: false, args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal", "--force-device-scale-factor=2"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const frames = [];
let n = 0;
cdp.on("Page.screencastFrame", (ev) => {
  const file = join(outDir, "frames", `f${String(n++).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(ev.data, "base64"));
  frames.push({ t: ev.metadata.timestamp, file });
  cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(() => {});
});
const events = [];
const extra = {};
const now = () => performance.timeOrigin / 1000 + performance.now() / 1000;
const log = (event, data) => { events.push({ t: now(), event, data }); console.log(event, data ?? ""); };
const centre = async (loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); return b ? [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.getByTestId("label-row").first().waitFor({ timeout: 40000 });
await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="map-skeleton"]')).opacity === "0", null, { timeout: 60000 });
await sleep(800);
// Warm-up: fit the map to the two fortresses so the full-resolution image is decoded
// and cached before the take, then go back home and clear the selection.
await page.getByRole("searchbox").fill("hisar");
const wr = page.getByTestId("label-row");
await wr.filter({ hasText: /Rumelihisar/ }).first().getByRole("checkbox").click();
await wr.filter({ hasText: /Anadoluhisar/ }).first().getByRole("checkbox").click();
await page.getByTestId("selection-toolbar").getByRole("button").first().click();
await sleep(6000);
await page.getByTestId("selection-toolbar").getByRole("button").nth(1).click();
await page.getByRole("searchbox").fill("");
await page.getByTestId("map-home").click();
await sleep(2500);
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 });
while (frames.length === 0) await sleep(5);
const wallAtFirstFrame = now();
log("rec_start");
await sleep(1800);

const search = page.getByRole("searchbox");
extra.search = await centre(search);
await search.click(); log("click_search");
await sleep(250);
await search.pressSequentially("hisar", { delay: 130 }); log("typed");
await sleep(1200);

const rows = page.getByTestId("label-row");
const cb1 = rows.filter({ hasText: /Rumelihisar/ }).first().getByRole("checkbox");
const cb2 = rows.filter({ hasText: /Anadoluhisar/ }).first().getByRole("checkbox");
extra.cb1 = await centre(cb1); await cb1.click(); log("click_cb1");
await sleep(800);
extra.cb2 = await centre(cb2); await cb2.click(); log("click_cb2");
await sleep(1000);
const show = page.getByTestId("selection-toolbar").getByRole("button").first();
extra.show = await centre(show); await show.click(); log("click_show");
await sleep(2400);

const box = (await page.locator('.lbl[data-id="rumelihisari"]').first().boundingBox());
const hx = Math.round(box.x + box.width / 2), hy = Math.round(box.y + box.height / 2);
extra.hover = [hx, hy];
await page.mouse.move(hx - 180, hy + 140); await sleep(200);
log("hover_start");
await page.mouse.move(hx, hy, { steps: 25 }); log("hover");
await sleep(2400);
log("end");
await sleep(400);
await cdp.send("Page.stopScreencast");
await sleep(300);
await browser.close();

const lines = [];
for (let i = 0; i < frames.length; i++) {
  const dur = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1 / FPS;
  lines.push(`file '${frames[i].file.replace(outDir + "/", "")}'`, `duration ${Math.max(dur, 0.001).toFixed(4)}`);
}
lines.push(`file '${frames[frames.length - 1].file.replace(outDir + "/", "")}'`);
writeFileSync(join(outDir, "frames.txt"), lines.join("\n") + "\n");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(outDir, "frames.txt"), "-vf", "fps=30,scale=2560:1600", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p", join(outDir, "raw30.mp4")], { stdio: "inherit" });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", join(outDir, "raw30.mp4"), "-vf", "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff:scd_threshold=12", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-pix_fmt", "yuv420p", join(outDir, "raw.mp4")], { stdio: "inherit" });
const ev = Object.fromEntries(events.map((e) => [e.event, +(e.t - wallAtFirstFrame).toFixed(3)]));
writeFileSync(join(outDir, "take.json"), JSON.stringify({ url, fps: FPS, frames: frames.length, span: +(frames[frames.length - 1].t - frames[0].t).toFixed(3), events: ev, ...extra }, null, 2));
console.log(`frames ${frames.length} -> ${outDir}/raw.mp4`);
