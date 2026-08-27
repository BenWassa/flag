# Issue #89 React/Vite migration — reconciled closeout plan

**Status:** Local closeout gates complete; publication and merged-main gates pending
**Parent:** #89
**Architecture decision:** `docs/architecture/react-vite-migration.md`
**Implementation log:** `docs/open/issue-89-implementation-worklog.md`

## Purpose

React and Vite already own Atlas production on `main`. This document no longer plans a future screen migration; it records the remaining #89 closeout sequence against the implementation that actually shipped.

Historical phase numbering remains so the child issues continue to map to the original programme. Remaining work must not recreate already-shipped migration work merely to match the old chronology.

## Reconciled phase ledger

| Phase | Issue | Post-v1 classification | Tracker action applied |
| --- | --- | --- | --- |
| 1 | #91 | complete | already closed before this reconciliation |
| 2 | #92 | complete and closable | closed during PR #105 reconciliation |
| 3 | #93 | implementation complete locally | keep open until the evidence commit is published and merged-main CI passes |
| 4 | #94 | materially complete; closeout documentation required | implementation deviation documented; closed during reconciliation |
| 5 | #95 | complete and closable | closed during reconciliation |
| 6 | #96 | implementation complete locally | keep open until the evidence commit is published and merged-main CI passes |
| 7 | #97 | implementation complete locally | keep open until the evidence commit is published and merged-main CI passes |
| 8 | #98 | implementation complete locally | keep open until the evidence commit is published and merged-main CI passes |
| 9 | #99 | implementation complete locally | keep open until the evidence commit is published and merged-main CI passes |
| 10 | #100 | implementation complete locally | keep open until the cleanup commit is published and merged-main CI passes |
| 11 | #101 | implementation complete locally | keep open until the final evidence is published and merged-main CI passes |
| 12 | #89 | local acceptance complete | keep open until child tracker closeout and merged-main publication gates are satisfied |

## Production foundation already shipped

The following are production facts on Atlas `1.0.0`:

- Vite owns browser development and production bundling.
- `src/main.tsx` mounts React.
- `src/react/AtlasApp.tsx` owns the production application lifecycle.
- React owns all shipped passive and active learning surfaces.
- The typed Atlas hash router remains the sole navigation/history authority.
- `AppStore` and the existing round controllers remain the application/learning orchestration layer.
- Workbox InjectManifest builds `src/sw.ts`.
- GitHub Pages deploys after successful Node 22 `main` CI.
- Generated continent geography remains canonical and lazy.
- The production browser graph does not import `src/app.ts` or `src/ui/views/*`.

Remaining work must preserve learning, routing, persistence, geography, British-English copy, Tactile Atlas behaviour and PWA semantics unless validation exposes a real defect requiring a separately reviewable fix.

## Phase 2 / #92 — Vite foundation

### Reconciled state

Complete and closed.

Evidence on reconciliation baseline `336a54a050f589e4ef74bac62c7329c9eb08e12a`:

- `package.json` uses Vite for `dev` and production browser build;
- `vite.config.ts` uses repository-relative `base: './'`;
- the React app, map viewport and neighbour map runtime are Vite browser entries with stable output names;
- supported-continent geography remains split into lazy chunks;
- `scripts/verify-vite-build.mjs` verifies relative paths, expected browser entries and lazy geography;
- Node 22 CI #401 passed;
- Pages #376 passed;
- exact CI and Pages artifacts were inspected.

No further Vite-foundation implementation belongs in #92.

## Phase 3 / #93 — PWA integration

### Shipped implementation

Current production uses `vite-plugin-pwa` with Workbox InjectManifest and the custom policy in `src/sw.ts`:

- generated shell precache;
- old Atlas cache cleanup;
- navigation fallback to the precached `index.html`;
- network-first same-origin runtime requests;
- cache-first FlagCDN flags;
- lazy continent chunks excluded from precache and runtime-cached after first successful use;
- `skipWaiting()` and `clientsClaim()` update takeover;
- current cache generation `flag-atlas-v29`.

### Remaining gate

Keep #93 open only for production-browser runtime evidence that the built app:

- reopens its shell offline after normal cache population;
- revisits previously loaded lazy geography offline;
- traverses an updated deployment without a stranded mixed-version shell;
- retains available install/update behaviour without claiming unperformed physical installed-PWA testing.

Coordinate this evidence with #101 and cite the same run from both issues rather than duplicating it. Physical installed-PWA/device evidence remains #71.

## Phase 4 / #94 — React shell and lifecycle

### Reconciled state

Materially complete and closed after closeout documentation.

React owns route interpretation, document title, notices/live status, render failure handling, install UI, focus intent, global keyboard handling, gestures, persistence flushing and service-worker registration.

### Accepted v1 implementation deviation

The pre-migration plan proposed `useSyncExternalStore` plus an explicit `AppStore.subscribe()/notify()` API. Production instead:

- subscribes directly to the existing typed router from the React composition root;
- owns one `AppStore` instance in that root;
- explicitly invalidates React revision state after store/controller mutations.

This preserves one router and one application store. Rebuilding the abandoned adapter mechanism after v1 would not complete a missing production surface and is not a #89 requirement absent a demonstrated state-consistency need.

## Phase 5 / #95 — passive React surfaces

### Reconciled state

Complete and closed.

React owns Home, profile, per-domain continent indexes, launchers, unavailable/shell states and Flags browse-and-reveal study.

Evidence includes routing/IA/British-English/action-feedback invariants, current passive/launcher React component tests, available direct-route/Back browser smoke evidence and exact production artifact inspection.

Final cross-domain browser hardening remains #101 rather than reopening passive-surface migration work.

## Phase 6 / #96 — Flags active rounds

### Shipped implementation

Flags Play, feedback, results and round actions are React-owned. Existing Flags, evidence, achievement, routing and language invariants are green.

### Remaining gate

#96 is verification-only closeout:

- representative React/component evidence for active Flags feedback/lifecycle boundaries;
- one complete production-preview Flags round through results;
- correct/wrong feedback and accessible outcome semantics;
- refresh fallback without a live in-memory round;
- persisted evidence / earned-achievement reload behaviour;
- review/repeat/exit coverage using a justified component/browser split.

Do not alter scoring, evidence, timing, storage or route semantics unless validation exposes a genuine defect.

## Phase 7 / #97 — Outlines active rounds

### Shipped implementation

Outlines Learn/Play/results are React-owned and continue to use canonical generated outline geometry plus the existing round/evidence semantics.

### Remaining gate

#97 is verification-only closeout:

- representative React/component active-round semantics;
- one complete production-preview Outlines flow through results;
- correct/wrong feedback, keyboard/focus and answer-safe accessible naming;
- refresh fallback and persisted evidence/achievement behaviour;
- review/repeat/exit coverage through an appropriate component/browser split.

Do not change canonical geometry or learning semantics.

## Phase 8 / #98 — Locations map surfaces

### Shipped implementation

Locations launcher, active map and results are React-owned. Framework-independent map geometry, viewport maths, the round controller and canonical Natural Earth data remain authoritative. Existing map/cartography/routing/gesture invariants are broad and green.

### Remaining gate

#98 is verification-only closeout:

- answer/feedback/results in the production preview;
- pointer/mouse pan and zoom during an active round;
- available mobile-browser emulation labelled accurately as emulation;
- route/exit/repeat behaviour and persisted progress reload;
- reduced-motion/keyboard checks where browser coverage materially complements invariants;
- confirmation that continent geography remains lazy.

Physical Pixel/iPhone gesture and safe-area validation remains #71.

## Phase 9 / #99 — Neighbours map and input

### Shipped implementation

Neighbours launcher, active map/input and results are React-owned. Topology-derived adjacency, zero-land-neighbour semantics, keyboard/input rules, persistence and canonical geography remain framework-independent.

### Remaining gate

#99 is verification-only closeout:

- production-preview keyboard/input/suggestion selection;
- representative correct/wrong/duplicate feedback;
- zero-land-neighbour claim path;
- map feedback and results;
- review/repeat/exit and persisted progress reload as required by the issue contract;
- useful mobile-browser emulation without claiming a physical software-keyboard/device test.

Physical mobile keyboard and gesture validation remains #71.

## Phase 10 / #100 — compatibility removal and CSS rationalisation

### Production state already achieved

- React owns every shipped production screen.
- The production browser graph does not import `src/app.ts` or `src/ui/views/*`.
- Global delegated `data-action` dispatch is no longer the production interaction model.

### 2026-08-26 implementation result

The compatibility tail is complete locally. `npm run build` now runs Vite and
Workbox into deployable `dist/`, then invokes `scripts/build-verifier-output.mjs`
to cleanly emit the plain-Node modules into ignored `.verify-dist/`. The
verifier suite reads that isolated tree; production HTML, CSS, icon and
service-worker assertions still read `dist/`. Successful `npm run verify`
removes `.verify-dist/` through the fixed-path cleanup command.

`src/app.ts`, the 16 `src/ui/views/*.ts` renderers, and the unused pre-Vite
build/dev scripts are gone. The import audit found no production or verifier
dependency on them. `verify-vite-build` now rejects the former verifier-only
directory families in `dist/`. Full local `npm test` passed. The post-cleanup
artifact is 33 files / 7,281,623 bytes; no renderer source or compatibility
module is deployable. Only two obsolete reduced-motion selectors for retired
Play cells were removed; shared CSS remains deliberately retained.

### Historical reconciliation baseline (superseded by the result above)

Current `npm run build` performs:

```text
vite build && tsc -p tsconfig.verify.json
```

The second step emits verifier-compatible modules into the same `dist/` directory that Pages deploys.

The exact reconciliation Pages artifact therefore contains:

- 16 compiled legacy `ui/views/*.js` files not referenced by `index.html` or the React app bundle;
- additional unbundled verifier modules under `data/`, `domain/`, `infrastructure/`, `routing/`, `state/` and `ui/`;
- verifier expectations such as `scripts/verify-vite-build.mjs` deliberately requiring compatibility output;
- source-side `src/app.ts` and `src/ui/views/*` fixtures still used by implementation-coupled verification.

### Executed #100 work order

1. inventory every verifier coupled to `src/app.ts`, `src/ui/views/*` or verifier-only compiled markup;
2. replace each implementation-coupled assertion with the correct framework-independent invariant, React component assertion or production-browser assertion without weakening coverage;
3. narrow, relocate or remove the `tsconfig.verify.json` compatibility emit so verifier-only modules are not appended to deployable `dist/`;
4. remove legacy string-renderer/coordinator source only after no verifier depends on it;
5. inspect actual React production markup/coverage and remove dead CSS selectors with evidence;
6. preserve Tactile Atlas tokens, learner behaviour and stable compatibility identifiers.

Stable inert `data-action` values may remain as metadata where useful; gratuitous identifier churn is not an objective.

### Exit gate

- no verifier requires the legacy string renderers or old coordinator implementation;
- verifier-only compatibility output is absent from the deployable artifact;
- obsolete legacy renderer/coordinator source is removed;
- CSS cleanup is evidence-based and behaviour-neutral;
- full Node 22 verification remains green;
- the exact production artifact is inspected after cleanup.

GitHub tracker closure should cite the local commit and subsequent CI evidence;
this implementation does not itself run a release or push.

## Phase 11 / #101 — final integrated validation

#101 is the final gate after #100. Its local gate is complete; publication and
merged-main evidence remain before tracker closure.

Evidence must remain separated by class rather than collapsed into “tests pass”.

### A. Invariant verification

Required on the final tree:

- Node 22 `npm run check`;
- full `npm test`;
- geography, routing, learning, persistence, language, achievement and cartography verifiers.

Local closeout status: `npm run check` and full `npm test` are green on the
post-#100 tree. Merged-main CI remains pending publication.

### B. Vitest / Testing Library

Required: component evidence for material React lifecycle/interaction boundaries, especially assertions replacing legacy implementation fixtures.

Local closeout status: 29 Vitest tests pass, including 13 active-round tests
over Flags, Outlines, Locations and Neighbours.

### C. Playwright / browser

Required against the production preview:

- Home/launcher/Learn/Play navigation;
- Back/Forward/direct hash/refresh recovery;
- complete Flags and Outlines flows;
- Locations answer/pan/zoom/results;
- Neighbours keyboard/input/map/results including zero-land-neighbour behaviour;
- unavailable/failed lazy-load feedback;
- stored-progress reload;
- practical responsive/accessibility checks in automated browsers.

Local closeout status: the complete Playwright run passed 67 tests with one
intentional skip across desktop Chromium and Pixel-class mobile emulation. It
includes the four domain matrices, navigation/recovery, responsive/accessibility
checks, lazy-load failure/retry and the PWA runtime scenario. This remains
emulation, not #71 physical-device evidence.

### D. Exact production artifact

Use the final post-#100 artifact. Confirm:

- repository-relative Pages paths;
- React production entry;
- lazy geography remains lazy;
- intended manifest/service-worker/static assets;
- verifier-only compatibility output has been removed as intended;
- bundle/chunk evidence is recorded without changing cartography merely to optimise numbers.

### E. PWA/offline/update

Required against production output:

- service-worker registration/control smoke;
- offline shell fallback;
- previously loaded geography offline;
- deployment/update recovery satisfying #93.

Local closeout status: the persistent-context two-artifact runtime matrix
passes and covers each item above. It is localhost production-output evidence,
not Firebase-origin, installed-PWA or physical-device evidence.

### F. Physical-device boundary

#71 remains the source of truth for physical Pixel/Android Chrome, physical iPhone/iOS Safari, installed-PWA validation, device safe areas, real software keyboard and gesture interaction.

Do not duplicate those tests in #101 and do not report Playwright Pixel emulation as physical-device evidence.

## Phase 12 / #89 closeout

Close #89 only when:

- all required child issues are closed or explicitly superseded with evidence-preserving scope transfer;
- #100 compatibility cleanup is complete;
- #101 final automated/browser/PWA gates are complete;
- the final branch is synchronised with current `main`;
- final Node 22 CI is green;
- the exact final production artifact has been inspected;
- #71 physical-device status is stated honestly without being reclassified as automated evidence.

If any condition remains unmet, #89 stays open even though Atlas already ships as `1.0.0`.

## Approved re-sequencing of the remaining closeout (2026-08-26)

The phase ledger above lists the remaining children as #93 → #96 → #97 → #98 →
#99 → #100 → #101. Executed in that order the closeout runs its browser matrix
twice, because #93 and #96–#99 would gather their evidence against the current
artifact while #101 section D explicitly refuses that artifact for final
acceptance — it "intentionally exposed the #100 debt".

The two halves are also entangled in the other direction. #100's work order step
2 requires replacing each implementation-coupled verifier assertion with "the
appropriate framework-independent invariant, React/Testing Library assertion or
production-browser assertion" — which is exactly the component coverage #96–#99
owe. Neither can be finished first without redoing part of the other.

The owner approved this order instead. Phase numbering and every exit gate are
unchanged; only the sequence in which the shared evidence is produced moves.

| Step | Work | Serves |
| --- | --- | --- |
| 3a | React/Testing Library coverage for the four active-round surfaces | component half of #96–#99, and supplies #100's replacement assertions |
| 3b | #100 work-order steps 1–4: retire implementation-coupled assertions, narrow the `tsconfig.verify.json` emit, delete the legacy string renderers | #100 |
| 3c | One production-browser evidence pass against the cleaned post-#100 preview | browser half of #96–#99, #93, and #101 section C |
| 3d | #100 step 5 (dead CSS, evidenced from real React markup) and #101 section D artifact inspection | #100, #101 |
| 3e | #101 sections A/B/E and the final gate, then #89 | #101, #89 |

What this does **not** change:

- no exit gate is weakened, and no verifier coverage is dropped to remove a
  fixture — #100's step 2 constraint still binds;
- #71 remains the sole authority for physical-device evidence, and 3c must not
  be described as satisfying it;
- each step still owns a focused, separately reviewable commit boundary, so a
  step can be reverted without unwinding the others;
- Node 22 `npm test` and exact-artifact inspection still gate the closeout.

The one accepted cost is that 3b lands before the browser evidence for #96–#99,
so a defect that only a browser would expose is found after the cleanup rather
than before it. That is the same risk #101 already carries, and 3c precedes
every close.

## Discipline for remaining child work

For any remaining child:

1. start from current `main`;
2. read its reconciled live issue body and these #89 documents;
3. use a dedicated focused branch/PR;
4. do not change learning, routing, persistence, cartography, UI design or PWA semantics unless validation exposes a real defect requiring a separately justified repair;
5. run focused checks continuously;
6. run Node 22 `npm test` before merge;
7. inspect the exact production artifact when build/browser/PWA output is affected;
8. sync current `main` before merge and resolve conflicts semantically;
9. record only testing that actually occurred.
