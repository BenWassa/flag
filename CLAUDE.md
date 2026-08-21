# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Flag Atlas — a mobile-first, zero-runtime-framework TypeScript PWA for learning world geography across four learning domains: **Flags**, **Locations**, **Outlines**, and **Neighbours**. Deployed as a static site to GitHub Pages. Product copy is modern British English (`en-GB`); the learner-facing domain label is **Neighbours** and the learner-facing activity is **Play**, but stable technical identifiers (`neighbors`, `/neighbors`, `neighbors.css`, `/test` route segment, `test` activity value, `start-test` data actions, storage namespaces) are compatibility contracts that must **not** be renamed to match copy.

## Commands

```bash
npm install
npm run check    # tsc --noEmit type-check only
npm run build    # tsc compile to dist/ + copy HTML/CSS/manifest/sw/icons
npm run verify   # run every verify script against the built dist/ output
npm test         # build + verify (this is what CI runs)
npm run maps:generate            # regenerate src/data/maps/africa.ts from pinned Natural Earth sources
npm run maps:generate -- --update-hashes   # only after a reviewed, intentional upstream source change
```

There is no unit-test framework (no jest/mocha/vitest). "Tests" are plain Node scripts in `scripts/verify-*.mjs` that `assert` invariants by importing compiled JS from `dist/`. **They require a build first.** To run one verification script in isolation:

```bash
npm run build && node scripts/verify-neighbors.mjs
```

`npm run verify` runs these in sequence (see `package.json`): `verify.mjs` (core curriculum/quiz), `verify-map.mjs`, `verify-map-v4-edge.mjs`, `verify-routing.mjs`, `verify-ia.mjs`, `verify-cartography.mjs`, `verify-map-generation-entry.mjs`, `verify-outline.mjs`, `verify-neighbors.mjs`, `verify-neighbor-map.mjs`, `verify-domain-integration.mjs`, `verify-british-english.mjs`. CI (`.github/workflows/ci.yml`) runs `npm test` on push/PR to `main`; a separate workflow (`pages.yml`) deploys `dist/` to GitHub Pages after CI succeeds on `main`.

Requires Node 22+.

## Architecture

Layered, framework-free TypeScript under `src/`, composed in the browser by `src/app.ts`:

```
src/data/            Static curriculum (195-country catalogue, continents/regions) + generated map/neighbor fixtures
src/domain/          Pure learning logic: mastery, quiz generation, map/outline/neighbor games — no DOM dependency
src/infrastructure/  Persistence (localStorage) and asset providers (flag images), one adapter per domain
src/routing/         Typed route model (routes.ts) + browser hash-URL transport adapter (router.ts)
src/state/           AppStore: session orchestration, applies domain transitions, exposes state to views
src/ui/               Render-only view functions + components; emit data-action attributes, app.ts handles interaction routing
```

Key architectural rules, enforced by the verify scripts and documented in `docs/architecture/`:

- **Domain layer has zero DOM dependency** — `data/`, `domain/`, and most of `infrastructure/` could move to React Native/Expo/backend without rewrite.
- **`data/countries.ts` and `data/continents.ts` are the single source of truth** for geography identity; other domains (maps, outlines, neighbours) reuse those IDs rather than maintaining parallel geography trees.
- **Routing is a typed model, not a UI concern.** `routing/routes.ts` owns one `AppRoute` union (Home / Progress / `{domain, scope?, activity?}`) with pure parse/serialize/parent/title helpers; `routing/router.ts` is just the hash-URL transport adapter and can be swapped for clean History paths later without touching navigation call sites. There is no per-domain router.
- **URL owns durable navigation state** (domain, scope, stable screen, active activity); **session state owns round internals** (quiz order, current index, guesses, feedback, timers, in-flight result object). A hard refresh mid-round intentionally discards round state and falls back to the stable launcher route (see `docs/architecture/routing.md`).
- **Map/outline/neighbor geometry is generated, not hand-authored.** `src/data/maps/africa.ts` is a build artifact of `npm run maps:generate` from pinned Natural Earth sources (`scripts/map-sources/natural-earth.json`); never hand-edit country paths. Full provenance/projection/simplification policy is in `docs/architecture/cartography.md`. The neighbor land-adjacency graph is derived from this same topology, not maintained manually.
- Currently only **Flags** supports the full world/195-country curriculum; **Locations**, **Outlines**, and **Neighbours** support Africa and its five curriculum regions only. Route parsing accepts the full continent/region hierarchy for all domains, but out-of-Africa routes for those three domains are canonicalised to the Africa launcher rather than rejected — availability is domain-data, not a routing concern.

## Where to look before changing things

- `docs/index.md` is the documentation entry point (`architecture/` = durable technical decisions, `product/` = current requirements/behaviour, `open/` = active issue plans, `closed/` = completed worklogs). Move a doc from `open/` to `closed/` when its issue ships.
- `docs/architecture/routing.md` — full route schema, URL-vs-session-state contract, Back/Forward semantics, refresh-during-round policy. Read before touching `src/routing/` or navigation actions in `src/app.ts`.
- `docs/architecture/cartography.md` — Natural Earth source policy, projection/simplification parameters, disputed-territory handling (e.g. Somaliland dissolved into `SOM`, Western Sahara/Bir Tawil kept non-scoring). Read before touching `scripts/generate-map-assets.mjs`, `scripts/map-sources/`, or map data.
- `PRODUCT.md` — product truth (positioning, capabilities/constraints, product-language rules, brand commitments). `docs/product/requirements.md` has the full requirements; `docs/product/country-naming.md` and `docs/product/outlines.md` govern content-specific policy.
- `DESIGN.md` — shipped visual system.
- Persisted localStorage keys are versioned (e.g. `flag-atlas:progress:v1`) with a separate namespace per domain; introducing a new persisted shape needs a migration layer, not a silent key change.
