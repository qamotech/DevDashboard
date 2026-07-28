import { cp, mkdir, readdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
const files = await readdir(".");
for (const file of files.filter((name) => name.endsWith(".html"))) {
  await cp(file, `dist/client/${file}`);
}
await cp("page-manifest.json", "dist/client/page-manifest.json");
await cp("n8-tools-transformers.css", "dist/client/n8-tools-transformers.css");
await cp("n8-tools-transformers.js", "dist/client/n8-tools-transformers.js");
await cp("funpromptz-og.png", "dist/client/funpromptz-og.png");
await cp("n8-icon.png", "dist/client/n8-icon.png");
await cp("loc-me-in", "dist/client/loc-me-in", { recursive: true });
await cp("worker/index.js", "dist/server/index.js");
