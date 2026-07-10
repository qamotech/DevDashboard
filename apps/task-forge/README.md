# Task Forge

A focused React + Vite todo app that lives inside the DevDashboard hub.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build
```

The build emits a static `index.html` and `assets/` folder to
`../DevDashboard/task-forge/`, which the DevDashboard sidebar links to via
`launchApp('Task Forge', 'apps/DevDashboard/task-forge/index.html', ...)`.

The deploy script (`deploy_github.bat`) ships the built output with the rest
of the repo — run `npm run build` before deploying so the latest version is
committed.

## Stack

- React 18 + TypeScript
- Vite 5 (`base: './'` so built assets resolve from any subpath)
- Plain CSS (no UI library)
- `localStorage` for persistence (key: `taskforge:v1`)
