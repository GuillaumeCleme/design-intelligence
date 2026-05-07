# AGENTS.md

## Overview

This is the **Design Package POC** — a client-side Vite + React + TypeScript app that renders a portable design package format using PixiJS v8. The app validates scene graphs with Zod, resolves design tokens, renders multi-artboard banners via WebGL, and supports export to PNG and `.designpkg` zip format.

## Cursor Cloud specific instructions

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Vite dev server | `npm run dev` | Serves the SPA at http://localhost:5173 |

No backend, database, or external services are required.

### Key Commands

- **Dev server**: `npm run dev` (or `npm run dev -- --host 0.0.0.0` for external access)
- **Lint**: `npm run lint`
- **Type check**: `npx tsc -b`
- **Build**: `npm run build` (runs tsc then vite build)

### Gotchas

- **WebGL in Cloud VM**: The PixiJS renderer uses software WebGL in cloud environments. You will see `_cancelResize` TypeErrors and `GroupMasterModel SetInterval` warnings in the browser console — these are non-blocking and the artboards still render correctly.
- **JSON imports**: `tsconfig.app.json` has `resolveJsonModule: true` enabled to support direct import of `.json` scene/manifest files from `src/sample/`.
- **Sample assets**: Static assets (background image, font, SVG logo) live in `public/sample-assets/` and are served at `/sample-assets/` by Vite.
- **PixiJS TextStyle fontWeight**: PixiJS v8 requires `fontWeight` as a string literal type (e.g. `'700'`), not a number. The text renderer casts via `as TextStyleFontWeight`.
