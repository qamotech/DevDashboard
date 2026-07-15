# N8 CyberDev — Qamelot Menu

Qamelot Menu is a flat collection of 48 browser-based tools, games, studios,
experiments, and small-business webpages. `index.html` is the complete animated
directory. Every webpage is a standalone HTML file with its local CSS,
JavaScript, fonts, and images embedded.

## Layout

- `index.html` — Qamelot Menu and the public home page
- `*.html` — standalone, lowercase, hyphenated webpages
- `page-manifest.json` — the authoritative page inventory
- `quality_check.py` — metadata, safety, reference, and menu-completeness audit
- `build_site.py` — prepares the hosting output

The published content has no nested project or asset folders. Installed
development dependencies remain in `node_modules` and are not published.

## Preview and verify

```powershell
python -m http.server 8000
npm run check
npm run build
```

Open `http://localhost:8000/` to use Qamelot Menu. Each menu card displays its
complete URL and links directly to its standalone page.
