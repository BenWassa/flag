# Issue #89 React/Vite migration — reconciled execution plan

**Status:** Active closeout plan after Atlas `1.0.0`  
**Parent:** #89  
**Architecture decision:** `docs/architecture/react-vite-migration.md`  
**Implementation log:** `docs/open/issue-89-implementation-worklog.md`

## Purpose

This document now records the migration sequence against what actually shipped. It is no longer a future-tense instruction to port the production UI: React and Vite already own production on `main`.

The remaining programme is a compatibility-removal and verification closeout. Historical phase numbering is retained so the child issues continue to map cleanly to the original #89 programme.

## Reconciled phase ledger

| Phase | Issue | Post-v1 classification | Tracker action |
| --- | --- | --- | --- |
| 1 | #91 | complete | already closed |
| 2 | #92 | complete and closable | close with current-main Vite/CI/Pages evidence |
| 3 | #93 | partially complete; re-scope | keep open for production PWA/offline/update runtime validation |
| 4 | #94 | materially complete; closeout documentation | document actual router/store adaptation and close |
| 5 | #95 | complete and closable | close with passive-surface/routing/component evidence |
| 6 | #96 | partially complete; re-scope | keep open for Flags active-round React/browser verification tail |
| 7 | #97 | partially complete; re-scope | keep open for Outlines active-round React/browser verification tail |
| 8 | #98 | partially complete; re-scope | keep open for Locations interaction/browser verification tail |
| 9 | #99 | partially complete; re-scope | keep open for Neighbours interaction/browser verification tail |
| 10 | #100 | partially complete; re-scope | keep open for verifier compatibility/legacy renderer/CSS cleanup |
| 11 | #101 | genuinely still open | final exact-artifact browser/offline/accessibility hardening |
| 12 | #89 | open | close only after required children and final merged-main gate |

## Shipped foundation

The following are now production facts rather than future deliverables:

- Vite owns the browser development/build path.
- `src/main.tsx` mounts React.
- `src/react/AtlasApp.tsx` owns the production application lifecycle and all shipped screen families.
- The typed Atlas hash router remains the route authority.
- `AppStore` and the existing domain round controllers remain the application orchestration layer.
- Workbox InjectManifest builds `src/sw.ts`.
- GitHub Pages deploys after successful `main` CI.
- Generated geography remains lazy and canonical.
- No production browser dependency on `src/app.ts` or `src/ui/views/*` remains.

The remaining open work must not recreate migration implementation merely to match the old phase chronology.

## Phase 2 / #92 — Vite foundation

### Reconciled state

Complete.

Current-main evidence:

- `package.json` uses Vite for `dev` and `build`;
- `vite.config.ts` uses `base: './'`;
- `src/main.tsx`, `src/map-viewport.ts` and `src/neighbor-map-runtime.ts` are Vite entries with stable output names;
- geography remains split into lazy continent chunks;
- `scripts/verify-vite-build.mjs` checks relative paths, expected entries and lazy chunks;
- current-main Node 22 CI #401 is green;
- current-main Pages run #376 is green;
- the exact CI and Pages artifacts were inspected during reconciliation.

### Closeout

Close #92. No further build-foundation implementation belongs there.

## Phase 3 / #93 — PWA integration

### What is complete

- `vite-plugin-pwa` uses Workbox InjectManifest;
- `src/sw.ts` owns the custom Atlas policy;
- the generated service worker precaches the shell;
- old Atlas caches are cleaned up;
- navigation has a precached `index.html` fallback;
- same-origin requests use network-first runtime caching;
- FlagCDN uses cache-first runtime caching;
- lazy continent chunks are excluded from precache and eligible for runtime caching;
- install metadata and React install UI are present;
- current build output uses `flag-atlas-v29`.

### Remaining acceptance tail

Static policy inspection is not the issue's behavioural exit gate.

#93 remains open only for evidence that the **production build** actually:

- opens the shell while offline after the required cache population;
- revisits previously loaded lazy geography offline;
- transitions through an updated deployment without a stranded mixed-version shell;
- retains intended install/update behaviour in an available browser environment.

Coordinate these checks with #101 so they are executed once and cited by both issues rather than duplicated.

Do not alter PWA semantics as part of closeout unless the validation exposes a real defect.

## Phase 4 / #94 — React shell and lifecycle

### Reconciled state

Materially complete.

Production React owns:

- route interpretation and screen composition;
- document title;
- visible notices and live announcements;
- error boundary/degraded render handling;
- install UI;
- focus intent;
- global keyboard handling;
- navigation gestures;
- persistence flushing;
- service-worker registration.

### Accepted implementation deviation

The pre-migration plan expected `useSyncExternalStore` plus `AppStore.subscribe()/notify()`. Production instead:

- subscribes directly to the existing typed router from the React root;
- owns a single `AppStore` instance in that root;
- explicitly invalidates React state after store/controller mutations.

This preserves one router and one application store without introducing a second state model. Rebuilding the abandoned adapter mechanism after v1 would add churn without completing a missing production surface.

### Closeout

Document the deviation and close #94.

## Phase 5 / #95 — passive React surfaces

### Reconciled state

Complete.

React owns Home, profile, domain continent indexes, launchers, unavailable/shell states and Flags browse-and-reveal study.

Evidence includes:

- current routing, IA, British-English and action-feedback invariant suites;
- current React component tests for Home/launcher behaviour and inert unsupported geography;
- available Playwright direct-route/Back smoke evidence;
- current production artifact inspection.

Final cross-domain browser hardening remains #101 rather than reopening passive-surface migration implementation.

### Closeout

Close #95.

## Phase 6 / #96 — Flags active rounds

### What is complete

Flags Play, feedback, results, repeat/review/exit and evidence orchestration are React-owned in production. Existing Flags/product/evidence invariants remain green.

### Remaining acceptance tail

The original issue explicitly required active-round component and browser evidence. Current React component tests do not exercise Flags rounds, and the current Playwright smoke only proves that a Flags round starts.

Re-scope #96 to verification only:

- React/component evidence for answer feedback and active-round lifecycle where appropriate;
- a complete browser Flags round including correct/wrong handling and results;
- review/repeat/exit or an explicitly justified representative subset;
- refresh fallback and persisted evidence/achievement reload assertions.

No scoring, evidence, route or timing semantics should change unless a test exposes a genuine defect.

## Phase 7 / #97 — Outlines active rounds

### What is complete

Outlines Learn/Play/results are React-owned and continue to use canonical outline geometry plus existing round/evidence semantics. Invariant coverage is green.

### Remaining acceptance tail

Current React component and Playwright suites do not provide the complete Outlines active-round coverage required by the issue.

Re-scope #97 to verification only:

- representative React component semantics for active Outlines state;
- one complete browser Outlines flow through results;
- refresh fallback and persisted evidence/achievement behaviour;
- accessible naming/focus/keyboard semantics appropriate to the port.

Do not change canonical geometry or learning semantics as part of this closeout.

## Phase 8 / #98 — Locations map surfaces

### What is complete

Locations launcher/active/results surfaces are React-owned. Existing map/cartography verifiers cover generated geometry, framing, feedback state, viewport maths, pan/zoom persistence, responsive contracts and lazy loading.

### Remaining acceptance tail

The current Playwright suite reaches a Locations round but does not exercise the issue's browser interaction exit gate.

Re-scope #98 to verification only:

- answer a Locations target in the production browser build;
- exercise pointer/mouse pan/zoom and the available mobile-emulation path without claiming physical touch hardware;
- verify results/repeat/exit and route behaviour;
- verify reduced-motion/keyboard paths where browser-level coverage materially adds to existing invariants;
- preserve lazy continent loading and cartography policy.

Physical mobile interaction remains #71.

## Phase 9 / #99 — Neighbours map and input

### What is complete

Neighbours map/input/results surfaces are React-owned. Existing invariant coverage is broad across topology-derived adjacency, zero-land-neighbour handling, autocomplete, keyboard layout contracts, map state, persistence and responsive behaviour.

### Remaining acceptance tail

There is no current Playwright Neighbours flow and no active-round React component coverage equivalent to the issue's exit gate.

Re-scope #99 to verification only:

- browser keyboard/input/suggestion selection;
- correct/wrong/duplicate or representative feedback state;
- zero-land-neighbour path;
- map feedback and results;
- review/repeat/persistence reload where required by the issue contract.

Physical software-keyboard/mobile-device validation remains #71.

## Phase 10 / #100 — compatibility removal and CSS rationalisation

### What production has already achieved

- React owns every shipped production screen.
- The production browser graph does not import `src/app.ts` or `src/ui/views/*`.
- Global delegated `data-action` dispatch is no longer the production interaction model.

### Exact remaining compatibility tail

Current `npm run build` performs `vite build` and then `tsc -p tsconfig.verify.json` into the same `dist/` directory.

As a result:

- the legacy string-renderer source tree still exists under `src/ui/views/`;
- `src/app.ts` remains as a source fixture/reference for implementation-coupled verifiers;
- verifier-compatible unbundled modules are emitted into `dist/`;
- the exact current Pages artifact contains 16 compiled `ui/views/*.js` files that are not referenced by `index.html` or the React application bundle;
- `scripts/verify-vite-build.mjs` deliberately asserts some of this compatibility output exists;
- other verifier scripts still read legacy compiled views or `src/app.ts` source to assert historical markup/orchestration contracts.

### Current #100 scope

#100 should now do only the following, in this order:

1. inventory every verifier that depends on `src/app.ts`, `src/ui/views/*` or verifier-only `dist/` markup;
2. replace each implementation-coupled assertion with the correct framework-independent invariant, React component assertion or production-browser assertion without weakening coverage;
3. move/narrow/remove the `tsconfig.verify.json` compatibility emit so verifier-only modules are not appended to the deployable `dist/`;
4. remove legacy string-renderer source and obsolete coordinator compatibility only after no verifier relies on it;
5. use actual React production markup/coverage evidence to remove dead CSS selectors;
6. preserve Tactile Atlas tokens, learner behaviour and stable compatibility identifiers.

Stable inert `data-action` values may remain as metadata where useful; the target is obsolete global dispatch, not gratuitous identifier churn.

### Exit gate

- no verifier requires the legacy string renderers or old coordinator implementation;
- the deployable artifact contains only production-required output plus deliberately shipped static assets;
- obsolete legacy renderer/coordinator source is removed;
- CSS cleanup is evidence-based and behaviour-neutral;
- full Node 22 verification remains green.

This reconciliation branch does **not** implement #100.

## Phase 11 / #101 — final validation

#101 remains the final integration gate after the compatibility tail is resolved.

Evidence must be recorded separately rather than collapsed into “tests pass.”

### A. Invariant verification

Required:

- Node 22 `npm run check`;
- full `npm test`;
- all geography, routing, learning, persistence, language, achievement and cartography verifiers.

Current-main status: green in CI #401.

### B. Vitest / Testing Library

Required: component coverage for material React lifecycle/interaction boundaries, especially those replacing legacy implementation-coupled fixtures.

Current-main status: only three passive/launcher tests; active-round coverage is missing.

### C. Playwright / browser

Required against the production preview:

- Home/launcher/Learn/Play navigation;
- Back/Forward/direct hash/refresh recovery;
- complete Flags and Outlines flows;
- Locations answer/pan/zoom/results;
- Neighbours keyboard/input/map/results including zero-neighbour behaviour;
- unavailable/failed lazy-load feedback;
- stored-progress reload;
- responsive/accessibility checks practical in automated browsers.

Current-main status: three smoke tests configured for desktop Chromium and Pixel 7 emulation; current CI does not run `npm run test:browser`.

### D. Production artifact

Required:

- inspect the exact post-#100 `dist/` artifact;
- confirm Pages-relative asset paths;
- confirm lazy geography remains lazy;
- confirm compatibility-only output has been removed as intended;
- review bundle/chunk evidence without rewriting cartography.

Current-main baseline artifact has already been inspected for reconciliation, but #101 must use the final post-#100 artifact.

### E. PWA/offline

Required against production output:

- service-worker registration/control smoke;
- offline shell fallback;
- previously loaded geography offline;
- deployment/update recovery appropriate to the #93 contract.

Current-main status: static Workbox policy is verified; runtime offline/update evidence is missing.

### F. Physical devices — explicit boundary

#71 remains the source of truth for:

- physical Pixel/Android Chrome;
- physical iPhone/iOS Safari;
- installed-PWA physical validation;
- device safe areas, real software keyboard and gesture interaction.

Do not make #101 duplicate those tests. Record #71's status and keep emulator/browser evidence labelled accurately.

## Phase 12 / #89 closeout

Close #89 only when:

- all required child issues are closed or explicitly superseded with evidence-preserving scope transfer;
- #100 compatibility cleanup is complete;
- #101 final automated/browser/PWA gates are complete;
- the final branch is synchronised with current `main`;
- final Node 22 CI is green;
- the exact final production artifact has been inspected;
- #71 physical-device status is stated honestly without being reclassified as automated evidence.

If any of those conditions remains unmet, #89 stays open even though Atlas is already `1.0.0`.

## Branch and PR discipline for remaining work

For any remaining child implementation/verification:

1. start from current `main`;
2. read the reconciled issue body and these #89 documents;
3. use a dedicated focused branch/PR;
4. do not change learning, routing, persistence, cartography, UI design or PWA semantics unless a discovered defect requires separately justified repair;
5. run the required focused checks continuously;
6. run Node 22 `npm test` before merge;
7. inspect the exact production artifact when the issue affects build/browser/PWA output;
8. sync current `main` before merge and resolve conflicts semantically;
9. record only testing that actually occurred.
