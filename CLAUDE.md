# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

Monorepo named `corventra` using npm workspaces. Two packages:

- `frontend-development/` — React 19 + Vite 8 + TypeScript + Tailwind v4 + react-router v7 (data router APIs not used; plain `<Routes>`).
- `backend-development/` — Node + Express 5 (CommonJS), MySQL2, JWT, bcryptjs, multer. Currently only scaffolded with a `/api/health` endpoint; real routes/controllers/models do not exist yet.

The frontend is the active development surface. The backend is a stub — do not assume any particular controller/router/model layout exists; check before referencing.

## Common commands

Run from the repo root (workspaces wire these up):

```bash
npm run dev:frontend     # Vite dev server (frontend-development)
npm run dev:backend      # nodemon src/server.js (backend-development, default PORT=3001)
npm run test:backend     # jest in backend-development
```

Per-workspace direct commands:

```bash
# frontend-development/
npm run dev              # vite
npm run build            # tsc -b && vite build  (type errors fail the build)
npm run lint             # eslint .
npm run preview          # vite preview

# backend-development/
npm run dev              # nodemon
npm start                # node src/server.js
npm test                 # jest
npx jest path/to/file    # run a single test
```

There is no frontend test runner configured. Do not invent one — use `npm run build` for type-checking and `npm run lint` for static checks.

## Frontend architecture

Read [prd_fe_structure.md](prd_fe_structure.md) before doing significant frontend work. It is the source of truth for folder layout and is written in Indonesian. The structure is **feature-based, not role-based** — role differences are handled via guards/permissions/conditional rendering inside a single feature, never by creating `features/meo/`, `features/bd/`, etc. Keep that invariant.

### Layers

- [src/app/](frontend-development/src/app/) — global app shell: router, layouts, navigation config. The PRD also specifies `guards/`, `providers/`, `permissions/`, `store/` here; **these are not yet created**. When a task needs auth/roles/global state, scaffold them under `app/` per the PRD rather than inventing a new location.
- [src/components/ui/](frontend-development/src/components/ui/) — generic, presentational primitives.
- [src/components/shared/](frontend-development/src/components/shared/) — app-aware shared pieces (the layout chrome — sidebar, header, app-shell — lives here).
- [src/features/](frontend-development/src/features/) — one folder per business feature, each with its own `pages/`, `components/`, `hooks/`, `services/`, `types/`, `mocks/`. Existing features: `auth`, `dashboard`, `campaigns`, `forms`, `bank-data`, `lead-tracker`, `lead-workspace`, `handover`.
- [src/types/](frontend-development/src/types/), `src/hooks/`, `src/utils/`, `src/config/`, `src/services/` — global cross-feature layers from the PRD; most are not yet created. Add them at the top level when needed; do not duplicate inside features.

### Routing

All routes live in [src/app/router/index.tsx](frontend-development/src/app/router/index.tsx) as a single `<Routes>` tree. Two layout branches:

- `<AuthLayout>` wraps `/login`.
- `<AppShellLayout>` wraps every authenticated page (sidebar + header + `<PageContainer>` + `<Outlet>`).

Auth/role protection is **not yet wired**. The PRD specifies `auth-guard.tsx` / `guest-guard.tsx` / `permission-guard.tsx` under `src/app/guards/` — add them there when implementing.

`lead-workspace/:leadId` uses nested routes with an index redirect to `meeting`. When adding a new workspace tab, both register the nested `<Route>` here and add the page under [src/features/lead-workspace/pages/](frontend-development/src/features/lead-workspace/pages/).

The handover feature owns its own top-level routes (`/handover`, `/handover/:id`, `/handover/:id/edit`) — it is not a workspace tab despite being listed under "Lead Workspace" in the PRD.

### Conventions

- **Filenames are kebab-case** (e.g. `lead-workspace-page.tsx`, `app-shell-layout.tsx`). A few legacy files use PascalCase (`AuthLayout.tsx`, `LoginPage.tsx`, `DashboardPage.tsx`). Prefer kebab-case for new files; if you rename, update the corresponding import in [src/app/router/index.tsx](frontend-development/src/app/router/index.tsx).
- Components are exported as named exports (e.g. `export const HandoverPage = …`). Match that style.
- Tailwind v4 is wired via `@tailwindcss/vite` — no `tailwind.config.js`, no PostCSS config; tokens go through CSS, and the Vite plugin handles the rest.
- Imports inside `features/` and `app/` use relative paths (no path aliases configured in [tsconfig.app.json](frontend-development/tsconfig.app.json)).
- Frontend is built first against **dummy/mock data** (`features/*/mocks/`); real services come later. Do not assume an HTTP client exists.

## Backend architecture

[src/server.js](backend-development/src/server.js) boots the Express app from [src/app.js](backend-development/src/app.js). The app currently mounts only `cors`, `express.json`, and a health endpoint. JWT/bcrypt/MySQL2/multer are installed but unused. When adding the first real endpoint, decide on a routes/controllers/models structure and document it here so future tasks can follow it consistently.

Env loading: `require("dotenv").config()` runs in `server.js` before `app.js` is required. Put a `.env` in `backend-development/` (gitignored). Default `PORT=3001`.
