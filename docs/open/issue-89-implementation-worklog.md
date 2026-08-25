# Issue #89 implementation worklog

**Parent:** #89  
**Execution plan:** `docs/open/issue-89-execution-plan.md`  
**Architecture:** `docs/architecture/react-vite-migration.md`

This log records implementation decisions, failures/deviations, rollback boundaries and verification evidence for the staged React/Vite migration.

## Phase 1 — baseline and contracts (#91)

### Starting point

- Baseline branch point: `a5e49c1aa0f8bd6163bcfda71ad545a48628a04c` (`main`, `Add React and Vite migration epic`).
- Baseline CI: GitHub Actions `CI` run **#382** completed successfully for that SHA.
- Baseline Pages: `Deploy GitHub Pages` run **#359** completed successfully for that SHA.
- Runtime remains the pre-migration vanilla TypeScript application.
- `package.json` requires Node `>=22`; CI explicitly uses Node 22.
- Current production build command: `node scripts/build.mjs`.
- Current development command: `node scripts/dev.mjs`.
- Current `npm test`: `npm run check && npm run build && npm run verify`.

### Documentation recovery deviation

The prior #89 scoping work referenced:

- `docs/architecture/react-vite-migration.md`;
- `docs/open/issue-89-execution-plan.md`.

Neither file existed on the starting `main` tree. GitHub code search, branch search and PR search found no committed copy. The live epic `docs/open/issue-89-react-vite-migration.md` did exist and contains the accepted architectural boundary, staged delivery strategy, acceptance criteria and recommended 11 child workstreams.

Phase 1 therefore restores the missing two documents from the accepted #89 decisions and materialises the epic's recommended child sequence as #91–#101. The twelfth execution phase is #89 closeout. No production code or product semantics are changed by this recovery.

### Current architecture baseline

- `src/app.ts` is the production application coordinator and owns bootstrap, routing, render dispatch, notices, install UI, focus/scroll restoration, keyboard input, delegated actions, persistence flush, gestures and service-worker registration.
- Fifteen view modules are imported by `src/app.ts` as string renderers. `src/ui/views/launcher.ts` also exists but is not imported by the production coordinator.
- Material screen state is rendered with `root.innerHTML`.
- Interaction dispatch is primarily delegated from `#app` through `data-action`.
- Neighbours suggestions and launcher-map hydration also perform partial `innerHTML` updates.
- The four round controllers and `AppStore` are framework-independent and remain preservation/adaptation boundaries.
- Route grammar is typed in `src/routing/routes.ts`; browser hash transport is `src/routing/router.ts`.
- Active round state remains ephemeral. An activity URL without the matching in-memory session normalises back to its stable launcher via replacement.
- Production cartography is the pinned Natural Earth 1:10m pipeline; continent geometry is dynamically imported.
- Six production CSS sheets remain hand-authored, with `atlas-theme.css` as the Tactile Atlas override/design-system layer.

### Route baseline

Canonical examples that must remain byte-for-byte compatible in path semantics:

- `/#/`
- `/#/flags`
- `/#/flags/africa`
- `/#/flags/africa/west-africa`
- `/#/flags/africa/west-africa/learn`
- `/#/flags/test`
- `/#/locations`
- `/#/locations/africa/west-africa/test`
- `/#/outlines/africa/west-africa`
- `/#/neighbors`
- `/#/neighbors/africa/west-africa/learn`

Learner-facing copy remains **Neighbours** and **Play** while stable internal route values remain `neighbors` and `test`.

### Persistence and learning baseline

Preservation boundary:

- canonical country ID: ISO3;
- independent Flags, Locations, Outlines and Neighbours progress ledgers;
- evidence, scheduling and achievement semantics unchanged;
- existing storage namespaces and migrations unchanged;
- install-prompt dismissal persistence unchanged;
- no country-level prestige Mastery;
- region/domain mastery and perfect-round semantics unchanged.

### Geography baseline

- sole runtime geometry source: pinned Natural Earth 1:10m generated pipeline;
- no handwritten country geometry;
- no handwritten neighbour tables;
- Outlines/Locations/Neighbours reuse canonical generated geography;
- continent modules remain lazy;
- no rivers in runtime cartography;
- existing disputed/context policy remains unchanged.

### PWA/build baseline

Current static inputs:

- `public/manifest.webmanifest`;
- `public/sw.js`;
- `public/icons/*`.

Current app registers `./sw.js` on window load. The service worker owns Atlas-specific shell/offline/runtime caching. Phase 2 must not change this policy; Phase 3 makes its built-shell asset list Vite-aware.

### Existing verification classification

**Preserved product-contract verifiers:** the existing geography/cartography, learning evidence, routing, IA, achievement, progress, British-English, map, outline, neighbour, gesture and domain-integration scripts remain required.

**Implementation-coupled assertions:** build-output/import and old template/`data-action` assumptions are adapted only in the phase that changes their implementation. Removal requires replacement evidence.

**Coverage to add:** React DOM semantics, lifecycle cleanup, browser history/direct/refresh flows, production service-worker/offline behaviour and cross-surface browser flows.

### Baseline evidence limitations

The Phase 0 epic text requested representative screenshots at phone portrait, short landscape and desktop. No browser/computer-use execution environment was available in this implementation session after Work-mode handoff was declined, so no screenshot or physical-device evidence is claimed here. Browser screenshots/tests will be generated by Playwright CI as the migration reaches the relevant phases. Physical Pixel/iPhone/installed-PWA validation remains explicitly owned by open Issue #71.

This limitation does **not** change the visual parity contract; it is recorded so later evidence cannot be misrepresented as a pre-migration physical baseline.

### Child issue chain

- #91 — baseline/parity/contracts
- #92 — Vite foundation
- #93 — PWA integration
- #94 — React shell/adapters
- #95 — passive navigation/launchers/Flags study
- #96 — Flags active rounds
- #97 — Outlines active rounds
- #98 — Locations map surfaces
- #99 — Neighbours map/input surfaces
- #100 — legacy removal/CSS rationalisation
- #101 — final production/offline/accessibility/browser validation
- #89 — Phase 12 sync/evidence reconciliation/closeout

### Phase 1 rollback boundary

Documentation and issue metadata only. Reverting the Phase 1 PR returns the repository runtime to the exact same baseline code.

## Phase evidence ledger

| Phase | Child | Branch/PR | `npm test` | Artifact/CI evidence | Status |
| --- | --- | --- | --- | --- | --- |
| 1 | #91 | merged baseline docs on `origin/main` | baseline CI #382 green | Pages #359 baseline green | complete |
| 2 | #92 | `origin/issue-92-vite-foundation` | inherited green foundation; candidate gate green | Vite artifact verified | candidate integrated |
| 3 | #93 | `issue-89-react-vite-completion` | candidate gate green | Workbox InjectManifest artifact verified | candidate integrated |
| 4 | #94 | same integrated branch | candidate gate green | React shell/error boundary inspected | candidate integrated |
| 5 | #95 | same integrated branch | component + invariant coverage green | browser flow exercised | candidate integrated |
| 6 | #96 | same integrated branch | invariant coverage green | Flags Play browser smoke green | candidate integrated |
| 7 | #97 | same integrated branch | invariant coverage green | production route/render inspected | candidate integrated |
| 8 | #98 | same integrated branch | map/cartography verifiers green | desktop/mobile launcher map green | candidate integrated |
| 9 | #99 | same integrated branch | neighbour/keyboard verifiers green | production route/render inspected | candidate integrated |
| 10 | #100 | same integrated branch | production graph migrated | legacy verifier fixtures remain | partial |
| 11 | #101 | same integrated branch | `npm test` + Playwright matrix green | physical/offline install gates outstanding | partial |
| 12 | #89 | pending merge/reconciliation | pending merged-tree gate | pending | blocked by remaining gates |

## Parity evidence ledger

| Contract | Baseline source | Migrated evidence |
| --- | --- | --- |
| mode-first IA | `DESIGN.md`, routing verifier | React component + IA/routing verifiers green |
| hash URL grammar | `docs/architecture/routing.md`, routing verifier | preserved; routing verifier green |
| refresh-to-launcher | `src/app.ts`, routing verifier | React normalisation + routing verifier green |
| storage compatibility | infrastructure/storage modules + verifiers | unchanged namespaces/schemas; full suite green |
| learning/evidence/mastery | domain/state + verifiers | unchanged engines/controllers; full suite green |
| ISO3/naming | country data + naming policy/verifiers | unchanged; full suite green |
| canonical geography | cartography docs/generator/verifiers | lazy generated modules and all cartography gates green |
| British English | `verify-british-english.mjs` | green against generated application artifact |
| visible failure vs live status | `DESIGN.md`, `src/app.ts` | React-owned channels; action-feedback verifier green |
| keyboard/focus | current app/view behaviour + verifiers | React focus intent + keyboard verifiers green; physical gate pending |
| lazy geography | dynamic imports + cartography verifiers | four lazy continent chunks verified and excluded from precache |
| PWA/offline/update | `public/sw.js` + production build | Workbox-generated worker verified; installed/offline manual gate pending |
| physical mobile | #71 | not performed / still open |

Subsequent phases append their evidence below rather than rewriting the baseline record.

## Integrated migration candidate — Phases 2–11

Branch `issue-89-react-vite-completion` continues from the completed Vite-foundation branch and integrates the remaining browser-runtime work as one review candidate. This is intentionally not recorded as issue closeout: physical-device evidence remains with #71, remote hosting remains with #46, and the old string renderers are still emitted solely for the existing plain-Node verifier family until those assertions are replaced.

### Implemented runtime

- React 19 owns the production entry point, application shell, Home/domain indexes, launchers, Flags study, all four active-round surfaces, results, notices, announcements and install UI.
- The typed hash router, `AppStore`, round controllers, storage schemas, product language and learning/achievement rules are preserved.
- Component handlers replace global delegated interaction routing. Stable action names remain compatibility metadata where required.
- Vite and `@vitejs/plugin-react` own development and production builds.
- `vite-plugin-pwa` uses Workbox InjectManifest to build `src/sw.ts`; cache generation is `flag-atlas-v29`, generated shell assets are precached, outdated Workbox entries and older Atlas shell/runtime caches are removed, and lazy continent chunks remain runtime-loaded.
- A React error boundary provides a visible reload path without changing or clearing saved progress.

### Verification added and adapted

- Vitest + Testing Library cover Home navigation, inert unsupported continent shells, region selection and deliberate Play actions.
- Playwright covers Home → Flags → live Play and Locations launcher-map loading in desktop Chromium and Pixel 7 emulation.
- Existing geography, learning, evidence, routing, cartography, PWA, British-English, accessibility-semantic and achievement verifiers remain active. Build assertions now inspect the generated Workbox artifact rather than a handwritten shell array.
- Production bundle at this candidate: `app.js` about 321 KB raw / 98 KB gzip; all continent geometry remains in separate lazy chunks.

Verification run on 2026-08-24:

- `npm test` — passed: strict application/config type checks, 3 React component tests, Vite/Workbox production build and the complete plain-Node invariant suite.
- `npm run test:browser` — passed: 4/4 production-preview tests across desktop Chromium and Pixel 7 emulation.
- `git diff --check` — passed.
- No physical-device, installed-PWA or remote Firebase deployment gate is claimed.

### Release and Firebase boundary

- This is a major-release candidate, but `package.json` remains at `0.7.0`. The release workflow should perform the deliberate `1.0.0` version bump, changelog/release notes, tag and publication only after this branch is reviewed and merged and the remaining release gates are accepted.
- No Firebase project was guessed or created. Firebase tooling is not authenticated in this environment and Issue #46 requires an explicit existing project ID or approval to create a project before local `firebase.json` configuration or deployment is coupled to remote infrastructure.
- GitHub Pages and hash URLs remain the deployable default, so this candidate does not broaden the migration into auth, Firestore, clean URLs or storage sync.

### Known compatibility tail

The production graph no longer imports `src/app.ts` or legacy `src/ui/views/*` string screens. Those modules remain temporarily compiled by `tsconfig.verify.json` because the invariant suite still uses their deterministic markup as product-contract fixtures. Removing them requires replacing those remaining fixture assertions with React component/browser equivalents; it is the outstanding Phase 10 cleanup, not a production runtime dependency.
