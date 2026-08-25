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
| 1 | #91 | `issue-91-react-vite-baseline` | baseline `main` CI #382 green; branch gate pending | Pages #359 baseline green | in progress |
| 2 | #92 | pending | pending | pending | blocked by Phase 1 |
| 3 | #93 | pending | pending | pending | blocked |
| 4 | #94 | pending | pending | pending | blocked |
| 5 | #95 | pending | pending | pending | blocked |
| 6 | #96 | pending | pending | pending | blocked |
| 7 | #97 | pending | pending | pending | blocked |
| 8 | #98 | pending | pending | pending | blocked |
| 9 | #99 | pending | pending | pending | blocked |
| 10 | #100 | pending | pending | pending | blocked |
| 11 | #101 | pending | pending | pending | blocked |
| 12 | #89 | pending | pending | pending | blocked |

## Parity evidence ledger

| Contract | Baseline source | Migrated evidence |
| --- | --- | --- |
| mode-first IA | `DESIGN.md`, routing verifier | pending |
| hash URL grammar | `docs/architecture/routing.md`, routing verifier | pending |
| refresh-to-launcher | `src/app.ts`, routing verifier | pending |
| storage compatibility | infrastructure/storage modules + verifiers | pending |
| learning/evidence/mastery | domain/state + verifiers | pending |
| ISO3/naming | country data + naming policy/verifiers | pending |
| canonical geography | cartography docs/generator/verifiers | pending |
| British English | `verify-british-english.mjs` | pending |
| visible failure vs live status | `DESIGN.md`, `src/app.ts` | pending |
| keyboard/focus | current app/view behaviour + verifiers | pending |
| lazy geography | dynamic imports + cartography verifiers | pending |
| PWA/offline/update | `public/sw.js` + production build | pending |
| physical mobile | #71 | not performed / still open |

Subsequent phases append their evidence below rather than rewriting the baseline record.
