# Issue #89 React/Vite migration — canonical execution plan

**Status:** Active  
**Parent:** #89  
**Architecture decision:** `docs/architecture/react-vite-migration.md`  
**Worklog:** `docs/open/issue-89-implementation-worklog.md`

This file is the canonical dependency/order plan for #89. The issue body remains the scope-level epic; this plan turns that scope into reviewable delivery phases.

## Recovery note

The architecture decision and this execution plan had been prepared during #89 scoping but were not present on the `main` commit that opened the epic. Phase 1 restores them from the approved migration decisions and the live Issue #89 contract. This is a documentation-state recovery, not a scope change.

## Rules for every phase

1. Start from the current merged `main` after the previous phase.
2. Read the child issue and all files it names before editing.
3. Use a dedicated branch and focused pull request.
4. Keep `main` deployable; do not rely on an unmerged later phase.
5. Preserve routing, persistence, ISO3 identity, geography, learning/mastery semantics and British-English learner copy.
6. Prefer adapters around existing product-engine code over rewrites.
7. Run focused checks continuously, then the complete `npm test` gate on Node 22.
8. Inspect the exact generated production artifact for the phase.
9. Reconcile with current `main` before finalising; resolve conflicts semantically.
10. Record implementation decisions, deviations, failures, rollback boundary and verification evidence in the worklog/PR.
11. Do not claim physical-device or browser coverage that did not actually run.
12. A later phase may begin only after its dependency phase is merged and green.

## Phase map

| Phase | Child issue | Delivery unit | Depends on | Primary rollback boundary |
| --- | --- | --- | --- | --- |
| 1 | #91 | baseline, parity matrix, architecture/contracts | #89 scope | documentation/evidence only |
| 2 | #92 | Vite build/dev/CI foundation | 1 | revert build/tooling changes; vanilla UI remains |
| 3 | #93 | build-aware PWA integration | 2 | revert service-worker build integration |
| 4 | #94 | React shell + router/store/lifecycle adapters | 3 | revert React shell; Vite vanilla app remains |
| 5 | #95 | passive navigation + launchers + Flags study | 4 | revert bounded passive surfaces to compatibility host |
| 6 | #96 | Flags active rounds | 5 | revert Flags screens only |
| 7 | #97 | Outlines active rounds | 6 | revert Outlines screens only |
| 8 | #98 | Locations map surfaces | 7 | revert Locations React ownership only |
| 9 | #99 | Neighbours map/input surfaces | 8 | revert Neighbours React ownership only |
| 10 | #100 | remove legacy renderers + CSS rationalisation | 9 | revert compatibility-removal/CSS commit |
| 11 | #101 | final production/offline/a11y/browser validation | 10 | hardening-only changes remain isolated |
| 12 | #89 | main sync, evidence reconciliation and epic closeout | 11 | no new product work; close only on satisfied evidence |

Optional AppStore decomposition is deliberately **not** a required phase. Evaluate it after parity only if the observable adapter exposes a concrete maintainability/rendering problem. A third-party state library is outside #89.

---

## Phase 1 — baseline and contracts (#91)

### Deliverables

- restore the migration architecture decision and this execution plan;
- baseline current `main` commit, CI and Pages deploy state;
- record canonical route/refresh/history contracts;
- record current build/dev/PWA structure and lazy-geography policy;
- classify existing verifiers;
- create the cross-surface parity matrix;
- record the #71 physical-device dependency honestly;
- establish the implementation worklog and child issue chain.

### Acceptance gate

No production entry point changes. Baseline contracts and comparison evidence exist before Vite lands.

### Focused checks

- current `main` CI success recorded;
- current Pages deployment success recorded;
- docs/index links resolve;
- no product source or generated asset changes in the PR.

### Rollback

Revert the documentation PR. Runtime remains untouched.

---

## Phase 2 — Vite foundation (#92)

### Deliverables

- select current supported React/Vite versions, but add only build dependencies needed by this phase;
- add `vite.config.ts` with GitHub Pages repository-relative base behaviour;
- make Vite own dev and production builds while retaining the vanilla TypeScript entry point;
- preserve all static manifest/icon/service-worker inputs until Phase 3;
- remove/retire bespoke build/dev scripts only after all their useful guarantees are replaced;
- adapt TypeScript/CI/build verification to Vite output;
- preserve lazy continent dynamic imports and output budgets;
- keep `npm run check`, `npm run build`, `npm test` meanings stable.

### Acceptance gate

The unchanged vanilla Atlas UI is built and deployed by Vite. Full invariant suite passes; direct hash URLs and repository-subpath asset URLs remain correct; exact `dist/` inspected.

### Rollback

Revert Vite/tooling PR to the custom build. No React dependency is required by production yet.

---

## Phase 3 — PWA integration (#93)

### Deliverables

- replace hard-coded built shell assets in the service worker with Vite-build-aware injection/generation;
- preserve cache naming/version lifecycle and old-cache cleanup;
- preserve offline navigation fallback;
- preserve network-first same-origin app/geography policy;
- preserve cache-first `flagcdn.com` policy;
- preserve lazy geography cache-after-first-use behaviour;
- preserve manifest/icons/iOS metadata/install-prompt persistence;
- add production-build PWA verification including mixed-version update safety.

### Acceptance gate

Production-built shell opens offline; already-loaded geography revisits offline; flags use intended cache path; manifest/install metadata are intact; deploy update cannot strand old HTML against missing hashed assets.

### Rollback

Revert PWA integration while retaining Vite foundation.

---

## Phase 4 — React shell and compatibility adapters (#94)

### Deliverables

- add React entry point and stable application shell;
- add typed-router React subscription adapter;
- add explicit AppStore subscribe/notify boundary;
- retain existing round controllers;
- move route normalisation/document title into stable React/application ownership;
- React-own visible notices, hidden live announcements and install banner;
- preserve focus/scroll, pagehide/visibility flushing, gestures and service-worker registration;
- add error boundary/degraded render state;
- host still-unmigrated screens through one named temporary compatibility boundary;
- establish Vitest/Testing Library infrastructure.

### Acceptance gate

React owns the shell but learner-visible screens remain parity-compatible. Routing, active-round refresh, install/notice behaviour and persistence continue to work.

### Rollback

Revert React shell PR; Vite/PWA vanilla app remains deployable.

---

## Phase 5 — passive navigation and Flags study (#95)

### Deliverables

Port to React:

- Home;
- per-domain continent indexes;
- continent/region launcher;
- launcher map and unavailable states;
- Flags browse-and-reveal Learn surface.

Add only proven shared primitives: page/header controls, mode cards, geography rows, progress strip, semantic icon component, notices/busy UI and flag image wrapper.

### Acceptance gate

Mode-first IA, route URLs, region replace-navigation, Back/Forward, direct links, Flags study reveal accessibility, unavailable shells, focus and responsive behaviour match baseline.

### Rollback

Revert passive-surface port; compatibility shell remains available for these bounded screens.

---

## Phase 6 — Flags active rounds (#96)

### Deliverables

Port Flags:

- Play question surface;
- answer feedback;
- result surface;
- review mistakes;
- repeat;
- exit;
- keyboard shortcuts and auto-advance lifecycle.

Keep the flags round controller and all scoring/evidence/achievement semantics intact.

### Acceptance gate

Complete Flags Play, feedback, review/repeat, refresh recovery, persistence and achievement flows pass invariant, component and browser tests.

### Rollback

Revert Flags React screens only; passive React surfaces remain.

---

## Phase 7 — Outlines active rounds (#97)

### Deliverables

Port Outlines equivalent flows while reusing canonical generated outline geometry and existing controller/state contracts.

### Acceptance gate

Learn/Play, keyboard 1–4, feedback/advance, review/repeat, persistence, refresh recovery and achievement flows pass invariant/component/browser tests.

### Rollback

Revert Outlines React screens only.

---

## Phase 8 — Locations map surfaces (#98)

### Deliverables

- React-own Locations launcher/quiz/results DOM;
- retain generated map asset model and canonical geometry;
- retain framework-independent viewport maths;
- attach imperative pan/zoom/pointer behaviour through refs/effects with deterministic cleanup;
- preserve lazy geometry loading and stale-request invalidation;
- preserve answer/busy/error/feedback/framing states;
- preserve map keyboard semantics and reduced motion.

### Acceptance gate

Every currently supported continent/scope passes routing, lazy-load, answer, pan/zoom, result/review/repeat, cartography and persistence checks. React does not eagerly import continent geometry.

### Rollback

Revert Locations port while retaining React ownership of earlier domains.

---

## Phase 9 — Neighbours map/input surfaces (#99)

### Deliverables

- React-own Neighbours map and form lifecycle;
- preserve typed-country resolution and canonical ISO3 IDs;
- port combobox/suggestions without losing keyboard semantics;
- preserve zero-land-neighbour truthfulness;
- preserve feedback/result/review/repeat flows;
- preserve mobile keyboard/map anchoring and map interaction;
- preserve direct-land adjacency policy and topology-derived data.

### Acceptance gate

Keyboard, mobile viewport, map, zero-neighbour, persistence and browser flows pass across supported continents.

### Rollback

Revert Neighbours port only.

---

## Phase 10 — compatibility removal and CSS rationalisation (#100)

### Deliverables

- delete migrated string screen renderers;
- delete root-wide `innerHTML` rendering path;
- delete global `data-action` dispatch;
- remove obsolete `src/app.ts` coordinator/temporary adapters;
- replace remaining string UI helpers with React components where they own markup;
- rationalise CSS by final component ownership;
- preserve `atlas-theme.css` tokens/behaviour;
- remove dead selectors only with evidence;
- update architecture and contributor docs.

### Acceptance gate

All production UI/lifecycles are React-owned; no untracked legacy compatibility path remains; complete test suite and production artifact stay green.

### Rollback

Revert this cleanup PR to restore compatibility code without reverting completed React ports.

---

## Phase 11 — final hardening and validation (#101)

### Deliverables

- complete Vitest/Testing Library coverage for new lifecycle boundaries;
- Playwright critical-flow suite against the production build;
- route/direct-link/refresh/Back/Forward suite;
- Flags + Outlines complete flows;
- Locations load/answer/pan/zoom/results;
- Neighbours input/keyboard/map/results;
- unavailable geography and failed-lazy-load feedback;
- stored progress reload;
- service-worker/offline production smoke;
- bundle and lazy-continent size inspection;
- phone portrait, short-landscape, desktop and 200% text browser coverage where automation supports it;
- exact `dist/`/manifest/service-worker/build-artifact inspection;
- final documentation evidence.

### Physical-device boundary

Issue #71 remains open for physical Pixel/Android Chrome and iPhone/iOS Safari/installed-PWA evidence. Browser automation or responsive emulation is not physical-device testing. If #71 is not complete, #101 and #89 must state that remainder rather than manufacture evidence.

### Acceptance gate

All available automated/browser gates are green on current `main`-equivalent code and any physical-device-only remainder is explicit.

### Rollback

Hardening-only fixes are individually revertible; no new architecture is introduced here.

---

## Phase 12 — final sync and epic closeout (#89)

### Procedure

1. Fetch current `main` and verify the Phase 11 head includes it.
2. Resolve any late conflicts semantically against the preserved contracts.
3. Re-run the complete Node 22 `npm test` gate and browser/PWA CI.
4. Inspect the exact generated production artifact and its manifest/service worker/lazy chunks.
5. Confirm GitHub Actions CI is green and GitHub Pages deploy is green on merged `main`.
6. Reconcile child issue/PR links and close completed children with evidence.
7. Update `docs/open/issue-89-implementation-worklog.md` with final SHA, tests, artifact evidence, deviations and any manual/device remainder.
8. Move #89 documentation to closed only if the repository convention and completion state justify it.
9. Close #89 only when its definition of done is actually satisfied. If physical-device validation remains required, leave the tracking issue open and name that exact remainder.

No new feature or refactor work belongs in Phase 12.

## Parity matrix

The implementation worklog maintains status/evidence against this matrix.

| Surface/contract | Baseline invariant | React/Vite parity requirement |
| --- | --- | --- |
| Home | four mode cards; no round starts | same mode-first IA and evidence visibility |
| Domain index | six continent rows/shells | same supported/inert state and full-width scan |
| Launcher | continent + selected region, Play/Learn | same replace-selection and deliberate start actions |
| Flags study | reveal state ephemeral; no evidence | same answer-safe accessible names and local reveal |
| Flags Play | controller timing/evidence/achievements | exact semantic parity |
| Outlines | canonical geometry + controller | exact semantic parity |
| Locations | lazy canonical map + viewport state | same geometry/loading/framing/pan/zoom/answers |
| Neighbours | topology adjacency + input/keyboard/map | same guesses, zero-neighbour truth and mobile contract |
| Routing | typed hash URLs | identical serialisation/normalisation/history |
| Refresh | activity without live session → launcher | identical replacement behaviour |
| Progress | versioned independent ledgers | existing payloads load unchanged |
| Achievements | existing earned semantics | no mastery/scoring rule changes |
| Naming | ISO3 + canonical labels | no identity/name drift |
| Cartography | pinned Natural Earth pipeline | no second source or handwritten geometry |
| British English | Neighbours/Play etc. | no learner-facing regression |
| Notice/live status | visible failures vs hidden routine | split preserved without duplicate announcements |
| Focus/keyboard | explicit focus + shortcuts | equivalent or improved semantics |
| Mobile | direct map gestures/safe areas | no regression; physical evidence separate |
| PWA | install/offline/lazy cache/update | build-aware equivalent behaviour |
| Performance | lazy geography + size budgets | no eager map bundling; measured budgets |

## Verifier classification

Use three classes during the migration:

1. **Preserved contract verifier** — geography, learning, evidence, achievements, routing, British English, map generation and other product invariants. Keep active.
2. **Implementation-coupled verifier** — asserts the old string-template/build output shape. Adapt when its phase changes ownership; do not silently delete.
3. **Missing browser/component coverage** — lifecycle, focus, live DOM semantics, service worker and browser history. Add Vitest/Testing Library or Playwright coverage.

Every removed assertion must have either an unchanged higher-level contract test or an explicit replacement named in the PR.

## Focused PR template

Each phase PR should include:

```md
## Parent
#89 / child #NN

## Phase boundary
What this PR changes and explicitly does not change.

## Preserved contracts
Routing / storage / learning / geography / language / PWA items relevant here.

## Implementation
Key adapters/components/build changes and why.

## Verification
- focused checks
- `npm test` on Node 22
- component/browser/PWA checks actually run
- exact production artifact inspection
- CI links/status

## Deviations/failures
Anything that differed from the plan and the resolution.

## Rollback
Exact independent revert boundary.

## Manual evidence
Only testing actually performed; physical-device evidence identified explicitly.
```

## Merge discipline

A phase PR is not merged merely because its local diff looks correct. Before merge:

- compare against current `main`;
- update/rebase/merge current `main` into the branch as appropriate;
- resolve semantic conflicts;
- run the complete gates on the final head;
- inspect the final artifact generated from that head;
- confirm CI is green.

The next phase branches from merged `main`, not from an unmerged predecessor.
