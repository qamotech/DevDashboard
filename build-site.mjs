import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
await cp("n8Prompt.html", "dist/client/n8Prompt.html");
await cp("funPromptz.html", "dist/client/funPromptz.html");
await cp("funpromptz-og.png", "dist/client/funpromptz-og.png");
await cp("n8-icon.png", "dist/client/n8-icon.png");
await cp("worker/index.js", "dist/server/index.js");
