import { build } from "vite";
const groups = {};
await build({
  configFile: "vite.config.ts",
  logLevel: "silent",
  build: {
    outDir: "/Users/ardaoz/.claude/jobs/7950a64d/tmp/dist-analyze",
    write: false,
    rollupOptions: { output: { manualChunks: undefined, chunkFileNames: "[name].js" } },
  },
  plugins: [
    {
      name: "sizes",
      generateBundle(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== "chunk") continue;
          for (const [id, mod] of Object.entries(chunk.modules)) {
            let key = "src";
            if (id.includes("node_modules")) {
              const parts = id.split("node_modules/").pop().split("/");
              key = parts[0].startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
            }
            groups[key] = (groups[key] || 0) + mod.renderedLength;
          }
        }
      },
    },
  ],
});
const rows = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 30);
for (const [k, v] of rows) console.log(String(v).padStart(8), k);
