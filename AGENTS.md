# AGENTS.md

## Overview

This is the **Design Package POC** — a client-side Vite + React + TypeScript app that renders a portable design package format using PixiJS v8. The app validates scene graphs with Zod, resolves design tokens, renders multi-artboard banners via WebGL, and supports export to PNG and `.designpkg` zip format. A Tailwind CSS + Radix UI overlay provides controls (command bar, file menu, tool indicator) layered over the canvas.

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

### Architecture

- `src/tools/types.ts` — Tool and action IDs as const objects (not enums; TS6 `erasableSyntaxOnly` is enabled)
- `src/tools/registry.ts` — Tool/action definitions and slash command builder
- `src/tools/store.ts` — Zustand store for active tool, zoom, command bar state
- `src/ui/` — Tailwind + Radix UI overlay components (CommandBar, FileMenu, ToolIndicator, Button)
- `src/app/AppShell.tsx` — Composes UI overlay on top of the PixiJS canvas
- Path alias `@/` resolves to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)

### Gotchas

- **WebGL in Cloud VM**: The PixiJS renderer uses software WebGL in cloud environments. You will see `_cancelResize` TypeErrors and `GroupMasterModel SetInterval` warnings in the browser console — these are non-blocking and the artboards still render correctly.
- **No enums**: TypeScript 6 with `erasableSyntaxOnly` does not support `enum`. Use `const` objects with `as const` and derive types via `typeof X[keyof typeof X]`.
- **JSON imports**: `tsconfig.app.json` has `resolveJsonModule: true` enabled to support direct import of `.json` scene/manifest files from `src/sample/`.
- **Sample assets**: Static assets (background image, font, SVG logo) live in `public/sample-assets/` and are served at `/sample-assets/` by Vite.
- **PixiJS TextStyle fontWeight**: PixiJS v8 requires `fontWeight` as a string literal type (e.g. `'700'`), not a number. The text renderer casts via `as TextStyleFontWeight`.
- **React 19 lint**: The `react-hooks/set-state-in-effect` rule is strict — avoid `setState` inside `useEffect`; prefer `useMemo` or handle state changes in event handlers.
