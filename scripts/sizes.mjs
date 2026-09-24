// Print the gzipped size of every asset in dist/ and the first-load JS total.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const dist = "dist";
const html = readFileSync(join(dist, "index.html"), "utf8");
const rows = [];
let firstLoadJs = 0;
for (const f of readdirSync(join(dist, "assets"))) {
  const p = join(dist, "assets", f);
  const raw = statSync(p).size;
  const gz = gzipSync(readFileSync(p)).length;
  const inHtml = html.includes(`/assets/${f}`);
  const kind = f.endsWith(".js") ? "js" : f.endsWith(".css") ? "css" : "asset";
  if (kind === "js" && inHtml) firstLoadJs += gz;
  rows.push({ file: f, kind, "raw KB": (raw / 1024).toFixed(1), "gzip KB": (gz / 1024).toFixed(1), "first load": inHtml ? "yes" : "lazy" });
}
console.table(rows);
const labels = statSync(join(dist, "labels.json")).size;
const labelsGz = gzipSync(readFileSync(join(dist, "labels.json"))).length;
console.log(`first-load JS (gzip): ${(firstLoadJs / 1024).toFixed(1)} KB  (budget 200 KB)`);
console.log(`labels.json: ${(labels / 1024).toFixed(1)} KB raw, ${(labelsGz / 1024).toFixed(1)} KB gzip (fetched separately)`);
if (firstLoadJs > 200 * 1024) {
  console.error("over budget");
  process.exit(1);
}
