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

Hash routing is the lowest-risk production choice. A URL such as `/#/locations/africa/west-africa` still requests the known application root from GitHub Pages because the fragment is client-side only. Clean History API paths would require an additional 404 redirect/fallback mechanism for cold loads before the service worker controls the page.

**Change**

Choose hash URLs for the current GitHub Pages PWA, while keeping path parsing/serialization independent from the hash transport so a future hosting move can swap the browser adapter rather than rewrite product navigation.

Choose active-round refresh policy **B**: the URL may identify the stable domain/scope/activity, but an activity route without its matching in-memory round canonicalizes to its stable scope screen. Round internals are not serialized into the URL.

**Verification**

The decision is consistent with the current Pages workflow, relative application shell, service-worker fallback, and Issue #10 acceptance criteria.

**Evaluation**

Hash routing provides durable deep links and native Back/Forward today without introducing deployment-only routing machinery. Session-state reset on refresh is explicit, deterministic, and safer than partial quiz restoration.

### 11:50 — Typed routing and product hierarchy implemented

**Observation**

The existing flag and map engines already separate learning-session state from most rendering concerns. The unstable layer is the app-level translation from UI actions to `ViewState`, plus parallel flag/map navigation conventions.

**Assessment**

The smallest durable change is to introduce shared learning-domain/activity primitives and a transport-neutral typed route model above the existing game engines. Home and scope views can then emit semantic navigation actions without embedding raw URLs or maintaining separate route trees.

**Change**

Added:

- `LearningDomain` for Flags, Locations, Outlines, and Neighbors;
- `LearningActivity` for Learn, Test, and Review;
- one `AppRoute`/`LearningRoute` model;
- one route parser and serializer using canonical continent/region IDs;
- conceptual `parentRoute`, `stableRoute`, and predictable route-title helpers;
- a hash-router browser adapter;
- a route → `ViewState` interpretation layer in `app.ts`;
- first-class domain landing screens for Flags and Locations plus reserved planned homes for Outlines and Neighbors;
- consistent domain/scope/activity labels on flag and location screens;
- unified scope/result Back semantics;
- PWA `./#/` start URL and shell-cache bump;
- `docs/ROUTING.md` plus architecture updates.

The former `viewStack` and numeric `historyIndex` were removed as route authority. Quiz question order, index, guesses, feedback, map session details, timers, and result objects remain in application/session state.

**Verification**

The PR changed routing/IA/state/view/PWA/documentation files only. No map SVG, topology, geometry source, water layer, map viewport implementation, or production-cartography asset was changed.

**Evaluation**

Flags and Locations now share one navigation architecture while preserving independent learning engines. Planned domains have a route home without pretending their gameplay is already implemented.

### 11:51–11:58 — CI compatibility loop

**Observation**

Early CI runs exposed four integration assumptions in sequence:

1. TypeScript inferred the route serializer segment array too narrowly.
2. The legacy flag verifier called `renderHome(progress)` with the old signature.
3. The same verifier also called `renderHome(progress, boolean)` to simulate blocked storage.
4. The map verifier asserted the removed map-only navigation action name and the previous service-worker cache version.

**Assessment**

The first three were backward-compatibility defects in the new implementation. The fourth was stale test coupling to the pre-Issue-10 navigation mechanism rather than a map-gameplay regression.

**Change**

Widened the serializer segment type, preserved the existing Home renderer test contract while allowing real location progress, and migrated only the map-navigation/cache assertions to the unified route exit and new cache version. All geometry, hit-target, scoring, feedback, naming, viewport, and small-country map assertions were retained unchanged.

**Verification**

CI run #60 completed successfully. It passed build/TypeScript, the complete 195-country flag verifier, full Africa map verification, the v4 map edge regression suite, and the new routing/IA verification suite. The CI artifact upload also completed successfully.

**Evaluation**

The routing migration is compatible with the existing flag and location learning behavior. No map-engine workaround or cartography regression was required to make the suite green.

### 12:00 — Concurrent-main sync gate

**Observation**

Fetched `main` immediately after the first fully green run. `main` remains `f71429f81f0b3269303e3a73234418099bc7bfc4`, exactly the commit from which `agent/issue-10-routing-ia` was created.

**Assessment**

No concurrent commit has landed on `main` since branch creation, so there is no newer tree to merge/rebase and no semantic conflict to resolve. The branch already contains current `main` by ancestry.

**Change**

No merge/rebase commit was necessary. The base was explicitly re-fetched and verified rather than assumed.

**Verification**

GitHub branch metadata confirms current `main` is still `f71429f81f0b3269303e3a73234418099bc7bfc4`.

**Evaluation**

The successful integrated CI run is valid against current `main` at this checkpoint.

### 12:01 — Browser-history contract strengthened

**Observation**

The initial routing verifier covered parse/serialize, hierarchy, invalid routes, refresh fallback, IA, and PWA contracts but did not execute the hash adapter's Back/Forward behavior directly.

**Assessment**

Issue #10 explicitly names cold deep links and browser-native Back/Forward as release criteria. These can be tested deterministically in Node with a minimal fake browser history without claiming real browser/device E2E coverage.

**Change**

Extended `verify-routing.mjs` with a fake GitHub Pages-style browser window. It cold-loads `https://example.test/flag/#/locations/africa/west-africa`, verifies the server-visible `/flag/` pathname remains unchanged, pushes typed routes, exercises Back and Forward, verifies replace navigation, and checks result Review/Repeat/Exit contracts for both Flags and Locations.

**Verification**

CI run #61 completed successfully with the strengthened routing verifier. The complete build + flag + Africa map + map-edge + routing suite remained green.

**Evaluation**

Automated coverage now tests browser-history semantics in addition to pure route functions while keeping the documented limitation clear: there is still no real-browser E2E/device test harness in this repository. The final production artifact is inspected only after this worklog closeout commit so the artifact corresponds to the exact final branch head.
