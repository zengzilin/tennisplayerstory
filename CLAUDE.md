# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TennisHub** — a full-stack tennis platform with live match scores, player rankings, and multilingual sports articles. Built as an npm workspace monorepo with three apps: React frontend, Express API, and PocketBase database.

## Commands

### Root (runs all services)
```bash
npm run dev      # Start web (3000), api (3001), pocketbase (8090) concurrently
npm run build    # Build web app to dist/apps/web
npm run start    # Start api + pocketbase (no dev server)
npm run lint     # Lint web and api
```

### Web app (`apps/web`)
```bash
npm run dev      # Vite dev server on port 3000
npm run build    # Production build
npm run lint     # ESLint (quiet — errors only)
npm run lint:warn  # ESLint with warnings
```

### API (`apps/api`)
```bash
npm run dev      # Express server on port 3001
npm run lint     # ESLint
```

### PocketBase (`apps/pocketbase`)
```bash
npm run dev                  # PocketBase on port 8090 (dev)
npm run start                # PocketBase on port 8090 (production, persistent)
npm run migrations:up        # Apply migrations
npm run migrations:down      # Roll back migrations
npm run migrations:snapshot  # Snapshot current DB state
```

## Architecture

### Three-Tier Structure

| Layer | Tech | Port |
|-------|------|------|
| Frontend | React 18 + Vite + React Router v7 | 3000 |
| API | Express v5 + Cheerio scraping + node-cron | 3001 |
| Database | PocketBase (SQLite BaaS) | 8090 |

### Frontend (`apps/web/src/`)

- **Routing**: Language-prefixed routes (`/:lang/...`). Language codes: `en`, `zh`, `ja`, `es`, `fr`. Route names are localized (e.g., `/zh/球员`, `/ja/プレイヤー`).
- **Auth**: `AuthContext` wraps PocketBase `authStore`. Roles: `"user"` and `"admin"`.
- **i18n**: `i18next` with JSON locale files in `src/i18n/`. Language switching via `LanguageContext`.
- **Data fetching**: Custom hooks in `src/hooks/` (e.g., `useMatchData`, `usePlayerData`, `useStoryData`) talk to PocketBase via `src/lib/pocketbaseClient.js` and to the Express API via `src/lib/apiServerClient.js`.
- **UI**: Tailwind CSS v3 + shadcn/ui (Radix UI primitives). Component config in `components.json`. Path alias `@` → `src/`.
- **SEO**: Use `SEOHelmet` component (see `docs/SEO_IMPLEMENTATION.md`) for per-page meta tags and JSON-LD structured data.

### Route Categories
- **Public**: home, live-matches, players, rankings, stories, login/signup, privacy/terms, sitemap.xml
- **Authenticated**: profile, write-article, my-articles
- **Admin**: admin dashboard, scraping panel, player management, article moderation

### API (`apps/api/src/`)

- Single scraping route (`/scrape/all`) with rate limiting, triggered manually or by the daily node-cron job (2 AM UTC).
- Uses Cheerio to scrape ATP/WTA sources; syncs player data to PocketBase.
- `src/utils/` contains: logger, scheduler, PocketBase client, player sync logic.

### PocketBase (`apps/pocketbase/`)

- **Collections**: `users`, `players`, `articles`, `scrape_logs` (plus others).
- **Migrations**: `pb_migrations/` — version-numbered JS files. Always create new migrations rather than editing existing ones.
- **Hooks**: `pb_hooks/` — custom server-side JavaScript executed by PocketBase.
- **Types**: `database-types.d.ts` — TypeScript definitions for all collections.
- Auth supports email/password and OAuth2 (Google, GitHub).

## Key Conventions

- **Node version**: 20.19.1 (see `.nvmrc`)
- **No test framework** is configured — there are no tests in this project.
- Vite config (`apps/web/vite.config.js`) includes custom plugins for visual inline editing and iframe support used in the Horizons platform editor — do not remove them.
- PocketBase binary is committed at `apps/pocketbase/pocketbase` (31 MB executable).
