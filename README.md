# N8 CyberDev — Qamelot Menu

Qamelot Menu is a flat collection of 42 browser-based tools, games, studios,
experiments, and small-business webpages. `index.html` is the complete animated
directory. Every webpage is a standalone HTML file with its local CSS,
JavaScript, fonts, and images embedded.

## Layout

- `index.html` — Qamelot Menu and the public home page
- `*.html` — standalone, lowercase, hyphenated webpages
- `page-manifest.json` — the authoritative page inventory
- `quality_check.py` — metadata, safety, reference, and menu-completeness audit
- `qamelot-media-assets/` — organized Qamelot Media brand kit and source artwork
- `build-site.mjs` and `worker/` — the hosted N8 Prompt and funPromptz build
- `.openai/hosting.json` — hosted site configuration
- `deploy_github.bat` — verifies and publishes the collection to GitHub Pages

The 42 standalone pages and their runtime assets remain at the repository root.
The Qamelot Media brand kit is kept in its own source folder so campaign files
stay together without becoming dependencies of the standalone pages. GitHub
Pages serves the repository root directly, while the Sites build publishes the
N8 Prompt and funPromptz experience. Installed development dependencies remain
in `node_modules` and are not published.

## Preview and verify

```powershell
python -m http.server 8000
npm run check
npm run check:links
npm run build
```

Open `http://localhost:8000/` to use Qamelot Menu. Each menu card displays its
complete URL and links directly to its standalone page.
