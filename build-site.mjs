import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
await cp("n8Prompt.html", "dist/client/n8Prompt.html");
await cp("masterPrompt.html", "dist/client/masterPrompt.html");
await cp("funPromptz.html", "dist/client/funPromptz.html");
await cp("funpromptz-og.png", "dist/client/funpromptz-og.png");
await cp("n8-icon.png", "dist/client/n8-icon.png");
await cp("loc-me-in-llc.html", "dist/client/loc-me-in-llc.html");
await cp("loc-me-in-enhanced.css", "dist/client/loc-me-in-enhanced.css");
await cp("loc-me-in-enhanced.js", "dist/client/loc-me-in-enhanced.js");
await cp("loc-me-in-icon.png", "dist/client/loc-me-in-icon.png");
await cp("loc-me-in-og.png", "dist/client/loc-me-in-og.png");
await cp("loc-me-in.webmanifest", "dist/client/loc-me-in.webmanifest");
await cp("worker/index.js", "dist/server/index.js");
