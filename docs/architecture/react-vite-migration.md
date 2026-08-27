# React and Vite migration architecture decision

**Status:** Implemented and closed through #89
**Parent:** #89
**Execution record:** `docs/closed/issue-89-execution-plan.md`
**Implementation log:** `docs/closed/issue-89-implementation-worklog.md`

## Decision

Atlas uses React 19 and Vite for the production presentation and browser-build layers while preserving the existing product engine, typed hash router, learning rules, persistence contracts and generated geography.

This was an in-place platform migration, not a product rewrite. The architecture decision remains binding after the migration: React is a presentation dependency, Vite owns browser development/build output, and the framework-independent layers remain authoritative for product semantics.

Current production uses:

- React 19 and React DOM for browser presentation;
- Vite 8 for development and the browser production build;
- strict TypeScript and TSX;
- the existing typed Atlas hash router;
- the existing `AppStore` and four round controllers;
- plain CSS and the existing Tactile Atlas semantic tokens;
- Vitest and Testing Library for React component tests;
- Playwright for production-preview browser tests;
- `vite-plugin-pwa` with Workbox InjectManifest for the custom Atlas service worker;
- GitHub Pages as the production deployment target.

React Router, Redux, Zustand, Tailwind, CSS-in-JS, Next.js, SSR and a second geography system were not introduced by #89.

## Production architecture at v1.0.0

The browser entry is `src/main.tsx`. It mounts the React error boundary and `src/react/AtlasApp.tsx`.

`AtlasApp` owns the production screen and interaction lifecycle for:

- Home and profile;
- per-domain continent indexes;
- continent/region launchers;
- Flags browse-and-reveal Learn;
- Flags Play and results;
- Outlines Learn/Play and results;
- Locations launcher, active map round and results;
- Neighbours launcher, active map/input round and results;
- notices, live announcements, document title, install UI, focus intent, keyboard handling, persistence flushing, navigation gestures and service-worker registration.

The browser dependency direction is:

```text
src/main.tsx
    |
    v
src/react/*
    |
    v
src/state/* + src/routing/* + framework-independent UI/map adapters
    |
    v
src/domain/*
    |
    v
src/data/* + generated geography

src/infrastructure/* implements persistence, assets and external boundaries
```

`src/domain`, `src/data`, persistence implementations and cartography generation do not depend on React.

## Preserved contracts

### Product and learning

The migration did not authorise changes to:

- learner-facing product name **Atlas**;
- British-English learner copy, including **Neighbours** and **Play**;
- stable internal `neighbors` and `test` identifiers;
- scoring, evidence, scheduling, mastery and earned-achievement rules;
- independent per-domain learning ledgers;
- storage keys, payload versions and migrations;
- round-controller timing/outcome semantics;
- active-round refresh policy.

### Routing

`src/routing/routes.ts` remains the canonical route model and `src/routing/router.ts` remains the browser transport boundary.

Durable navigation state remains URL-owned. Active quiz state remains ephemeral process state. A cold activity URL without its matching live round normalises back to the stable launcher without inventing persisted round state. Hash routing remains compatible with GitHub Pages, and browser Back/Forward remains native.

### Country identity and geography

- Canonical country identity remains ISO3.
- Country naming continues to follow the repository naming policy.
- Production cartography remains the pinned Natural Earth 1:10m topology pipeline.
- No handwritten country geometry, adjacency table or second topology source was introduced.
- Locations, Outlines and Neighbours continue to reuse canonical generated geography.
- Continent geography remains lazy rather than entering the initial application bundle.

### Design

The migration preserved the existing Tactile Atlas design system and plain-CSS ownership. React did not create a second visual system.

`DESIGN.md`, `.impeccable/design.json` and `src/styles/atlas-theme.css` remain normative for product presentation.

## Actual adapter implementation

The shipped implementation differs in two details from the pre-migration proposal.

### Router

The architecture proposal preferred a `useSyncExternalStore` adapter. Production instead keeps the existing router instance in the React composition root and subscribes to it through a React effect, updating React-owned route state when the typed router emits.

There is still one route model and one browser-history authority. No React Router or parallel navigation stack was introduced.

### AppStore

The proposal expected an explicit `AppStore.subscribe()/notify()` boundary. Production instead keeps one `AppStore` instance under the React composition root and explicitly invalidates the React tree after store/controller mutations through React-owned revision state.

This is an accepted v1 implementation deviation rather than an incomplete product migration: `AppStore` remains the single application-state authority and no third-party or duplicate store was introduced. A future observable-store API should be added only if asynchronous/external mutation creates a concrete need; it is not required solely to recreate the abandoned migration mechanism.

The four existing round controllers remain the orchestration boundary for active learning flows.

## Build and deployment

### Vite

`vite.config.ts` uses repository-relative output (`base: './'`) for GitHub Pages and retains stable browser entry names where Atlas integration requires them:

- `app.js` from `src/main.tsx`;
- `map-viewport.js`;
- `neighbor-map-runtime.js`.

Generated continent geography remains split into lazy Vite chunks.

### CI and Pages

`npm test` runs:

1. strict application/Vite type checks;
2. Vitest/Testing Library;
3. the Vite + Workbox production build;
4. the plain-Node invariant suite.

CI runs that gate on Node 22 and uploads `dist/`. GitHub Pages deploys only after successful CI on `main`, rebuilding the same production inputs under Node 22.

### Verifier-only emit

`npm run build` performs:

```text
vite build
then
node scripts/build-verifier-output.mjs
```

The second step emits the plain-Node verifier modules into ignored
`.verify-dist/`, never into deployable `dist/`. It is cleaned after a
successful verifier chain. `scripts/verify-vite-build.mjs` verifies that
`dist/` contains no `data/`, `domain/`, `infrastructure/`, `react/`,
`routing/`, `state/` or `ui/` compatibility trees.

On 2026-08-26 the legacy `src/app.ts` coordinator and all 16
`src/ui/views/*.ts` renderers were removed after an import audit. The local
post-cleanup artifact is 33 files / 7,281,623 bytes; the separate temporary
verifier output is 90 files / 5,735,833 bytes before its cleanup step.

## PWA architecture

Vite builds `src/sw.ts` with Workbox InjectManifest.

The current service-worker policy preserves:

- an injected generated precache for the shell;
- old Atlas cache cleanup;
- `skipWaiting()` plus `clientsClaim()` update takeover;
- navigation fallback to the precached `index.html`;
- network-first same-origin runtime requests;
- cache-first `flagcdn.com` flags;
- lazy continent chunks excluded from precache and cached after first successful use.

The current cache generation is `flag-atlas-v29`.

Static production-artifact verification proves that this policy is built and wired. Runtime offline/update behaviour still requires the production-browser validation retained in #93/#101; source inspection is not recorded as an offline session.

## CSS strategy and #100 boundary

React components intentionally retained the established semantic class names and Tactile Atlas styles during migration.

The #100 cleanup used production-markup/coverage evidence rather than visual
guesswork: only the retired continent/region Play-cell reduced-motion selectors
were removed. `atlas-theme.css` remains normative design-system truth; shared
and dynamically generated selectors remain intact.

Stable `data-action` strings may remain as inert compatibility/test metadata. What has been removed from production is the old global delegated `data-action` dispatcher.

## Verification model after v1

Verification is deliberately separated into five evidence classes:

1. **Invariant evidence** — `npm test` plain-Node geography, learning, routing, persistence, language, cartography and product contracts.
2. **Component evidence** — Vitest + Testing Library for React-owned DOM behaviour and lifecycle boundaries.
3. **Browser evidence** — Playwright against the production preview for real route, input, map and history interactions.
4. **Production/PWA evidence** — exact `dist/`/Pages artifact inspection plus service-worker/offline/update runtime checks.
5. **Physical-device evidence** — Pixel/iPhone/installed-PWA checks owned by #71, never inferred from Playwright device emulation.

At v1.0.0 the invariant layer is broad, but component/browser/PWA runtime coverage is not yet sufficient to satisfy #89's final validation definition. #101 owns that final automated/browser hardening; #71 remains the independent physical-device authority.

## #89 closeout condition

#89 remains open until the reconciled remaining children satisfy their current acceptance criteria. In particular:

- #100 must retire the verifier compatibility tail so legacy string renderers and the broad compatibility emit are no longer required in the deployable artifact;
- #101 must provide the missing component/browser/production-PWA evidence across all four learning domains;
- any earlier child left open after the post-v1 reconciliation must be closed with evidence or an explicit, justified scope transfer.

Physical Pixel/iPhone/installed-PWA validation is tracked by #71 and must be reported honestly in #89 closeout, but is not duplicated as hidden #89 evidence.

## Historical note

The original phase plan proposed Vite first, then Workbox integration, React shell adapters, passive surfaces, four active-domain ports, compatibility removal and final hardening. In practice, PR #103 accumulated the production Vite/React implementation before the tracker was reconciled. Git history and `docs/closed/issue-89-implementation-worklog.md` preserve that execution history; this document describes the architecture that actually ships.
