# Issue #10 — Routing and information architecture worklog

**Branch:** `agent/issue-10-routing-ia`  
**Started:** 2026-08-19 11:32 EDT (America/Toronto)  
**Tracking:** GitHub Issue #10 — App information architecture and routing beyond flags

## Method

Material work is recorded as **observation → assessment → change → verification → evaluation**. This workstream owns routing, product information architecture, and navigation. It deliberately does not redesign map SVG/topology/viewport internals owned by Issue #9.

## 2026-08-19

### 11:32 — Audit started

**Observation**

The application route authority is an in-memory `ViewState[]` called `viewStack`. `history.pushState` stores only an integer index. Stable screens do not have meaningful URLs, a page refresh reconstructs neither the stack nor the selected domain/scope, and Back/Forward can only restore entries that still exist in the current JavaScript process.

Flags and locations also implement parallel navigation trees. Flag scope pages use `home` as their back target, while location regions explicitly route back to Africa. Results likewise differ: flag results close to Home while map results return to their active location scope.

**Assessment**

The browser history API is being used as storage for an application-owned navigation stack instead of the URL being the durable route model. This cannot scale cleanly to Flags, Locations, Outlines, and Neighbors. The product also lacks an explicit separation between learning domain, geographic scope, and activity.

**Change**

No code change yet. The implementation target is one typed route model with one parser/serializer and a browser transport adapter. Stable navigation will be encoded in the URL; quiz order, question index, guesses, feedback, timers, and result objects remain session state.

**Verification**

Audit covered `src/app.ts`, `src/state/store.ts`, flag/location home and scope views, quiz/results views, canonical continent/region data, map-scope metadata, `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/PRD.md`, map planning/UX/gameplay logs, CI, Pages deployment, manifest, service worker, and existing verification scripts.

**Evaluation**

The route layer can be replaced above the flag/map learning engines. No cartography or SVG gameplay refactor is required.

### 11:42 — Routing transport and refresh policy decided

**Observation**

GitHub Pages deploys the generated `dist/` directory with no server rewrite or `404.html` SPA fallback. The PWA service worker is network-first for same-origin application requests and falls back to cached `index.html` for navigation when offline.

**Assessment**

Hash routing is the lowest-risk production choice. A URL such as `/#/locations/africa/west-africa` still requests the deployed application root from GitHub Pages because the fragment is client-side only. Clean History API paths would require an additional 404 redirect/fallback mechanism for cold loads before the service worker controls the page.

**Change**

Choose hash URLs for the current GitHub Pages PWA, while keeping path parsing/serialization independent from the hash transport so a future hosting move can swap the browser adapter rather than rewrite product navigation.

Choose active-round refresh policy **B**: the URL may identify the stable domain/scope/activity, but an activity route without its matching in-memory round canonicalizes to its stable scope screen. Round internals are not serialized into the URL.

**Verification**

The decision is consistent with the current Pages workflow, relative application shell, service-worker fallback, and Issue #10 acceptance criteria.

**Evaluation**

Hash routing provides durable deep links and native Back/Forward today without introducing deployment-only routing machinery. Session-state reset on refresh is explicit, deterministic, and safer than partial quiz restoration.
