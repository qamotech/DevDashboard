# 🧭⚡ Qamelot Development Dashboard

**Directory of standalone browser tools, games, creative studios, utilities, and business pages, with page inventory and static-site verification tooling.**

🏷️ Maintained in [qamotech/DevDashboard](https://github.com/qamotech/DevDashboard) · 🌐 Public repository

## ✨ What is here

- 🧭 Animated directory and compatibility menu entry.
- 🎮 Games, creative studios, calculators, and productivity pages.
- 📚 Page manifest, local brand assets, and link/metadata checks.
- 🏗️ Static build tooling and a separate hosted prompt-tool experience.

## 🧭 Try the project

Serve the repository, open index.html, choose a page from the directory, then run the existing checks before altering navigation or adding another page.

## 🚀 Local setup

```sh
git clone https://github.com/qamotech/DevDashboard.git
cd DevDashboard
```

Use a current browser. Serve the repository root to preserve relative assets and a stable browser origin:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/index.html`. Keep related assets beside the entry file. No npm setup is declared in the inspected repository.

## 🗂️ Source map

- 📄 [`MiyagiThrow.html`](MiyagiThrow.html)
- 📄 [`QamelotMenu.html`](QamelotMenu.html)
- 📄 [`acai-adaptive-cyber-analysis-interface.html`](acai-adaptive-cyber-analysis-interface.html)
- 📄 [`blob-bash-royale.html`](blob-bash-royale.html)
- 📄 [`blood-and-gold-panther-arena.html`](blood-and-gold-panther-arena.html)
- 📄 [`build-site.mjs`](build-site.mjs)
- 📄 [`contractor-tool-belt-tactical-utility-engine.html`](contractor-tool-belt-tactical-utility-engine.html)
- 📄 [`css-visuals-library-40.html`](css-visuals-library-40.html)
- 📄 [`cyber-count-calcun8r-edison-hwy.html`](cyber-count-calcun8r-edison-hwy.html)
- 📄 [`devdash-svg-studio.html`](devdash-svg-studio.html)
- 📄 [`eco-tech-motion-library.html`](eco-tech-motion-library.html)
- 📄 [`ecotechcomm-secure-frequency.html`](ecotechcomm-secure-frequency.html)
- 📄 [`worker`](worker) — source directory

## ⚙️ Configuration & data

The authoritative inventory is page-manifest.json, not a fixed marketing count. Individual pages have different dependencies and maturity. The static directory and hosted worker build are separate deployment surfaces.

Keep credentials, private exports, customer records, and personal information out of commits and screenshots. A local browser demo is not evidence of account security, reliable persistence, or connected external services. Preserve exports before changing storage keys or resetting an application.

## 🧪 Verification checklist

- 🔎 Confirm the entry file and asset paths above exist in your checkout.
- ▶️ Start the documented runtime and inspect browser or terminal errors.
- 🧭 Exercise the project-specific workflow described above using sample data.
- 📱 Check narrow and wide layouts when the project has a browser interface.
- 💾 Verify save/export and recovery behavior before trusting important work to it.
- 📝 Record the exact command, browser, operating system, and outcome of your checks.

This guide was prepared from repository files and manifests. It does not claim a fresh build, deployment, security audit, or full functional test of this project.

## 🤝 Contributions & useful reports

Keep changes focused and explain the user-visible result. Preserve existing assets and configuration unless a change requires updating them. Include reproduction steps, expected and actual behavior, and relevant screenshots with personal information removed. For UI work, include the viewport and browser; for runtime issues, include the command and error text.

## 🛠️ Maintenance priorities

- 📚 Keep this guide aligned with implemented behavior and current entry points.
- 🧪 Add or maintain checks for the core workflow before expanding features.
- ♿ Review labels, keyboard navigation, contrast, and responsive layout.
- 📦 Document external services, asset rights, and deployment prerequisites.

## 📜 Licensing & attribution

This documentation update does not grant a new software or asset license. Consult existing license files, source headers, package metadata, and original asset terms; resolve inconsistencies with the owner before redistribution. Third-party names and resources retain their own terms.

---

## 📚 Preserved earlier documentation

The material below is retained verbatim for history and project-specific context. Template instructions and older claims may differ from the source inventory above.

# N8 CyberDev — Qamelot Menu

Qamelot Menu is a flat collection of 48 browser-based tools, games, studios,
experiments, and small-business webpages. `index.html` is the complete animated
directory. Every webpage is a standalone HTML file with its local CSS,
JavaScript, fonts, and images embedded.

## Layout

- `index.html` — Qamelot Menu and the public home page
- `*.html` — standalone, lowercase, hyphenated webpages
- `QamelotMenu.html` — compatibility copy of the complete animated directory
- `page-manifest.json` — the authoritative page inventory
- `quality_check.py` — metadata, safety, reference, and menu-completeness audit
- `enhance-pages.mjs` — repeatable 40-point metadata, navigation, and accessibility enhancer
- `qamelot-media-assets/` — organized Qamelot Media brand kit and source artwork
- `build-site.mjs` and `worker/` — the hosted N8 Prompt and funPromptz build
- `.openai/hosting.json` — hosted site configuration
- `deploy_github.bat` — verifies and publishes the collection to GitHub Pages

The 48 standalone pages and their runtime assets remain at the repository root.
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
