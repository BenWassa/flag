# React and Vite migration architecture decision

**Status:** Accepted for Issue #89  
**Parent:** #89  
**Execution plan:** `docs/open/issue-89-execution-plan.md`  
**Implementation log:** `docs/open/issue-89-implementation-worklog.md`

## Decision

Atlas will migrate its presentation and build layers incrementally to React, Vite and strict TypeScript while preserving the existing product engine and compatibility contracts.

This is an in-place platform migration, not a rewrite. `main` must remain deployable between phases.

Use:

- React at the supported major selected in the Vite-foundation phase;
- Vite at a Node 22-compatible supported release;
- strict TypeScript and TSX;
- the existing typed Atlas hash router behind a React subscription adapter;
- the existing `AppStore` and round controllers behind an observable adapter first;
- plain CSS and the existing Tactile Atlas semantic tokens;
- Vitest and Testing Library for component-level behaviour;
- Playwright for critical browser flows against the production build;
- GitHub Pages as the deployment target;
- a build-aware custom service-worker integration that preserves Atlas caching semantics.

Do not introduce React Router, Redux, Zustand, Tailwind, CSS-in-JS, Next.js, SSR, a server runtime, Firebase, new geography sources or new persistence schemas as part of this migration.

## Why React

The product engine is already separated into `data`, `domain`, `infrastructure`, `routing` and `state`. The lifecycle burden is concentrated in `src/app.ts` and the string-rendered UI:

- full-root `innerHTML` replacement after material state changes;
- global delegated `data-action` dispatch;
- manual focus and scroll recovery;
- manual setup/cleanup for map and input lifecycles;
- application-shell concerns mixed with route interpretation and round orchestration.

React is adopted to give UI state, component ownership and lifecycle cleanup an explicit owner. It must not become a dependency of the domain, curriculum, persistence or cartography-generation layers.

## Why Vite

The repository currently owns compilation, atomic staging, asset copying, watching and static development serving through `scripts/build.mjs` and `scripts/dev.mjs`. Vite replaces that bespoke web-tooling surface while preserving the meanings of:

- `npm run check` — strict type-check;
- `npm run build` — complete production `dist/` artifact;
- `npm test` — type-check, production build and the complete invariant suite;
- Node 22 CI;
- GitHub Pages repository-subpath deployment.

Vite is justified independently of React. The Vite phase lands with the existing vanilla TypeScript UI before the React entry point changes.

## Preservation boundary

### Product and learning contracts

The migration must not change:

- learner-facing product name **Atlas**;
- British-English learner copy, including **Neighbours** and **Play**;
- stable internal `neighbors` and `test` identifiers;
- scoring, evidence, scheduling, mastery and earned-achievement rules;
- independent per-domain progress ledgers;
- storage keys, payload versions, migrations or install-dismissal persistence;
- round-controller timing and outcome semantics;
- active-round refresh policy.

### Routing contracts

Keep `src/routing/routes.ts` as the canonical route model and `src/routing/router.ts` as the browser transport boundary.

Durable URL state remains:

- domain;
- continent/region scope;
- activity identity while a live round exists.

Active round internals remain ephemeral process/session state. A cold refresh of an activity URL without the matching in-memory session returns to its stable launcher via replacement, preserving already-persisted evidence.

Hash URLs remain compatible on GitHub Pages. Region selection remains replace-navigation rather than history stacking. Browser Back/Forward remains native.

### Country and geography contracts

- Canonical country identity remains ISO3.
- Country naming continues to follow `docs/product/country-naming.md`.
- Production cartography remains the reproducible pinned Natural Earth 1:10m pipeline in `docs/architecture/cartography.md`.
- No handwritten country geometry, adjacency table or second topology source may be introduced.
- Outlines, Locations and Neighbours continue to consume canonical generated geometry/adjacency.
- Lazy continent modules remain lazy; React must not pull all generated geography into the initial shell.

### Design contracts

`DESIGN.md`, `.impeccable/design.json` and `src/styles/atlas-theme.css` remain normative.

The migration preserves:

- system sans-serif typography;
- cool near-white/graphite base;
- Atlas Blue ordinary action family;
- green/red transient answer semantics;
- purple mastery and scarce gold prestige;
- Tactile Atlas radius/depth/press physics;
- mode-first Home → domain continent index → launcher IA;
- geography-dominant active learning surfaces;
- visible failure notice versus hidden routine live-announcement split;
- reduced motion, visible focus, practical touch targets and safe-area behaviour.

A React port is not permission to redesign the product or replace plain CSS.

## Target dependency direction

```text
React features / shared UI
          |
          v
application adapters / existing round controllers
          |
          v
domain models and rules
          |
          v
data and generated geography

infrastructure implements storage, asset and PWA boundaries
```

React imports downward. `src/domain`, `src/data`, cartography generation and persistence implementations must not import React.

## Application adapters

### Router adapter

Expose the existing typed hash router to React with a tear-safe subscription, preferably `useSyncExternalStore`.

The adapter must not:

- create a second route model;
- reinterpret stable URLs;
- replace browser history with an application stack.

### Store adapter

Add an explicit `subscribe`/`notify` boundary to `AppStore` while preserving its current methods and state semantics. The first React phases adapt the store; they do not decompose it.

A post-parity split of `AppStore` is optional and requires demonstrated value. No third-party global state library is part of #89.

### Round controllers

Keep the four existing round controllers as the orchestration boundary during the port. Component handlers call controller methods; controllers continue to own timing, scoring/evidence orchestration and round transitions.

Temporary render/focus compatibility hooks must be named, documented and removed by Phase 10.

## React ownership model

React progressively takes ownership in this order:

1. stable application shell and lifecycle;
2. passive navigation and Flags study;
3. Flags active rounds;
4. Outlines active rounds;
5. Locations map surfaces;
6. Neighbours map/input surfaces.

Map projection, viewport maths, gesture maths and generated geometry remain framework-independent. React owns their DOM attachment through refs/effects with deterministic setup and cleanup.

The completed migration has no production screen rendered through string-template `innerHTML`, no root-wide `innerHTML` replacement and no global `data-action` dispatcher.

## Build and asset strategy

### Vite base

The production build must work under the repository subpath used by GitHub Pages. Asset URLs must not assume `/` is the application root.

Hash routing remains independent of Vite path handling.

### Static assets

Stable manifest/icon/service-worker identities should not be renamed unless a separately documented migration is necessary. Existing install metadata and iOS metadata remain intact.

### Lazy geography

Keep dynamic continent imports as the runtime split boundary. Build verification records raw/gzip lazy-continent output and rejects accidental eager inclusion in the shell.

### Complete artifact

`dist/` remains the sole deployable static artifact. Verification inspects the exact generated HTML, asset references, manifest, service worker and lazy chunks.

## PWA strategy

The service worker remains an Atlas-specific policy boundary rather than being replaced by a generic cache recipe.

Preserve:

- versioned shell lifecycle and old-cache cleanup;
- offline navigation fallback to the built shell;
- network-first same-origin application/geography requests;
- cache-first external `flagcdn.com` flags;
- caching of lazy geography after first successful load;
- install prompt/dismissal behaviour;
- mixed-version deployment safety.

The Vite build must generate or inject the current hashed shell-asset list into the custom service worker. The implementation may use a Vite PWA/Workbox InjectManifest path or a small explicit build plugin, but the runtime policy above is the contract.

Service-worker behaviour is verified against the production build, not only the Vite dev server.

## CSS strategy

Do not rewrite CSS during the component port.

Initial React components preserve existing semantic class names and Tactile Atlas markup contracts. CSS deletion/rationalisation occurs only after the corresponding legacy markup is gone.

`atlas-theme.css` remains the normative design-system truth unless a dedicated, reviewable change moves the same tokens/primitives elsewhere.

Dead-selector removal requires production-markup/coverage evidence; visual difference alone is not sufficient.

## Testing strategy

### Existing invariant suite

Plain-Node verifiers remain active for geography, routing, product language, evidence, achievements, map behaviour and generated assets. Verifiers that import `dist/` are adapted deliberately to the Vite output; they are not silently removed.

### Component tests

Use Vitest + Testing Library for React-owned behaviour where DOM semantics matter: controls, visible/hidden feedback, accessible names, focus intent, input interaction and shell lifecycle boundaries.

### Browser tests

Playwright covers at minimum:

- Home → launcher → Learn/Play navigation;
- Back/Forward, direct hash URL and refresh recovery;
- complete Flags and Outlines flows;
- Locations load/answer/pan/zoom/results;
- Neighbours input/keyboard selection/map feedback/results;
- unavailable geometry and failed lazy-load feedback;
- stored progress reload;
- service-worker/offline production-build smoke tests.

### Manual/device evidence

Physical-device evidence is never inferred from emulation or code inspection. Issue #71 remains open and owns the Pixel/iPhone/installed-PWA physical interaction audit. #89 records that status explicitly at closeout.

## Performance gates

Record before/after:

- initial shell JS/CSS size;
- each lazy continent module raw/gzip size;
- geography load behaviour;
- map interaction responsiveness under browser tests.

Existing cartography budgets remain hard constraints unless a migration-specific build wrapper changes chunk packaging; any budget change requires measured equivalence and an explicit verifier update.

## Rollback model

Each phase is independently revertible because `main` remains deployable after every merge.

- Phase 1 is documentation/evidence only.
- Phase 2 changes build tooling while keeping the vanilla UI.
- Phase 3 changes PWA build integration while keeping the vanilla UI.
- Phase 4 introduces React shell compatibility without requiring screen rewrites.
- Phases 5–9 migrate bounded surface groups.
- Phase 10 removes compatibility only after all surfaces are React-owned.
- Phase 11 hardens and verifies the final production artifact.
- Phase 12 closes the epic only after merged evidence is reconciled.

A failing phase is reverted or repaired within its own boundary; later phases do not mask an earlier regression.

## Rejected alternatives

### Full rewrite/new scaffold

Rejected because the product engine, data model, storage and router already have strong boundaries. A new app would create unnecessary parity and migration risk.

### React Router

Rejected because Atlas already has a typed URL grammar and GitHub-Pages-compatible hash transport with explicit refresh/Back/Forward semantics.

### Redux/Zustand

Rejected because state semantics already live in `AppStore` and round controllers. Adapt first; decompose only after parity if evidence supports it.

### Tailwind/CSS-in-JS

Rejected because the existing CSS and Tactile Atlas tokens are valuable product assets and do not cause the lifecycle problem motivating React.

### Generic service worker replacement

Rejected because Atlas has deliberate lazy-geography, flag-CDN and mixed-version/offline behaviour that must survive the tooling migration.

### Hosting/storage migration at the same time

Rejected. Issue #46 is sequenced separately so #89 does not combine UI/build migration with Firebase/URL/storage changes.
