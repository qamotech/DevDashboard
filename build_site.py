"""Build the flat Qamelot page collection for Sites hosting."""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
CLIENT = DIST / "client"
SERVER = DIST / "server"

if DIST.exists():
    shutil.rmtree(DIST)
CLIENT.mkdir(parents=True)
SERVER.mkdir(parents=True)

for page in ROOT.glob("*.html"):
    shutil.copy2(page, CLIENT / page.name)
for extension in ("*.mp3", "*.png", "*.ico", "*.svg"):
    for asset in ROOT.glob(extension):
        shutil.copy2(asset, CLIENT / asset.name)
shutil.copy2(ROOT / "page-manifest.json", CLIENT / "page-manifest.json")

(SERVER / "index.js").write_text(
    '''export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") url.pathname = "/index.html";
    if (!env.ASSETS?.fetch) {
      return new Response("Static asset service unavailable", { status: 500 });
    }
    return env.ASSETS.fetch(new Request(url, request));
  }
};
''',
    encoding="utf-8",
    newline="\n",
)
print(f"Built {len(list(CLIENT.glob('*.html')))} webpages")
