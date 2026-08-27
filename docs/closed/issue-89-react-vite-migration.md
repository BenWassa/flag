# Issue #89: Migrate Atlas to React and Vite without rewriting the product engine

**Status:** Complete — merged through PR #128; final merged-main CI green

## Current state

Atlas `1.0.0` ships the production presentation and browser-build layers on React 19 and Vite 8.

Current `main` at the post-v1 reconciliation baseline is:

- SHA `336a54a050f589e4ef74bac62c7329c9eb08e12a`;
- package version `1.0.0`;
- Node 22 CI run #401: green;
- GitHub Pages run #376: green.

The migration is therefore no longer an in-flight question of whether React/Vite will own production. They already do.

The closeout candidate merged through PR #128 as `4275f1f8f3c3fc120ff3f267412db8373f450a91`.
Merged-main CI [#33069168541](https://github.com/BenWassa/flag/actions/runs/33069168541)
passed `npm run check` and `npm test` on that commit.

## Closeout

- **Merged commit:** `4275f1f8f3c3fc120ff3f267412db8373f450a91` (PR #128).
- **Merged-main verification:** CI #33069168541 green (`npm run check`, `npm test`).
- **Browser verification:** 67 Playwright tests passed, one intentional skip,
  across desktop Chromium and Pixel-class mobile emulation; focused flag-stage
  matrix 6/6 passed.
- **PWA verification:** persistent-context, two-artifact production-output
  runtime test passed for service-worker control, cached shell/geography offline
  reopening, first-use offline recovery and update takeover.
- **Independent boundary:** #71 remains open for physical Pixel, iPhone Safari
  and installed-PWA validation. No physical-device claim is made here.

## What production now uses

- `src/main.tsx` is the browser entry;
- `src/react/AtlasApp.tsx` is the React composition root;
- React owns Home, profile, domain indexes, launchers, Flags study, all four active learning domains, results, notices, live announcements, focus, keyboard handling, install UI and global browser lifecycle;
- the existing typed hash router remains the navigation authority;
- `AppStore` and the existing round controllers remain the application/learning orchestration boundary;
- Vite owns browser development and the production build;
- `src/sw.ts` is built through Workbox InjectManifest;
- GitHub Pages deploys the built `dist/` after successful `main` CI;
- canonical Natural Earth geography, ISO3 identity, learning rules, persistence and British-English product copy remain preserved.

The pre-migration proposal for `useSyncExternalStore` plus `AppStore.subscribe()/notify()` was not used. Production instead keeps the typed router subscription and a single `AppStore` under the React root, with explicit React revision invalidation after store/controller mutations. The architecture decision records this as an accepted v1 implementation deviation rather than requiring a second state authority solely to match the abandoned mechanism.

## Post-v1 child issue reconciliation

| Issue | Reconciled status | Current evidence / remaining gate |
| --- | --- | --- |
| #91 | closed | Baseline/contracts phase was completed before production migration. |
| #92 | closed — complete | Vite owns dev/build output; relative Pages paths and lazy geography are verified; current Node 22 CI and Pages are green; exact current artifacts inspected. |
| #93 | implementation complete locally; tracker closeout pending | The exact built PWA now has persistent-context browser evidence for service-worker control, cached-shell offline reopening, previously loaded lazy Africa offline, explicit first-time lazy offline failure, and same-origin two-artifact update recovery. Physical installed-PWA/device work remains #71. |
| #94 | closed — material completion documented | React owns the shell/global lifecycle. Router/store adaptation shipped through a simpler root-owned implementation rather than the proposed observable-store API. No parallel router/store exists. |
| #95 | closed — complete | Passive React surfaces and Flags study ship; routing/IA/action-feedback invariants, React component coverage and available browser smoke evidence cover the phase boundary. |
| #96 | implementation complete locally; tracker closeout pending | Flags has React component coverage plus deterministic complete-round, wrong/review, repeat/exit, refresh/persistence and responsive browser evidence. |
| #97 | implementation complete locally; tracker closeout pending | Outlines has React component coverage plus deterministic complete-round, wrong/review, keyboard/focus, answer-safe silhouette and refresh browser evidence. |
| #98 | implementation complete locally; tracker closeout pending | Locations has React component coverage plus answer, pan, zoom, results, review, repeat/exit, refresh/persistence and mobile-emulation evidence. |
| #99 | implementation complete locally; tracker closeout pending | Neighbours has React component coverage plus input, correct/wrong/duplicate, map, results/review, persistence, refresh and zero-neighbour browser evidence. |
| #100 | implementation complete locally; tracker closeout pending | The verifier emit now lives outside `dist/`; the obsolete coordinator and all 16 string renderers are removed; full local `npm test` is green. |
| #101 | implementation complete locally; tracker closeout pending | The final post-#100 artifact passes the complete invariant, component, desktop/mobile browser and PWA runtime matrix. Publication, merged-main CI and tracker administration remain; physical hardware remains independently owned by #71. |

Live GitHub state was reconciled to this matrix during PR #105: #92, #94 and #95 were closed with evidence comments; #93 and #96–#101 were rewritten around current remaining work; #89 was rewritten and intentionally left open.

## Historical compatibility baseline (#100; superseded below)

Current production dependency inspection shows:

- the browser entry graph does **not** import `src/app.ts` or `src/ui/views/*`;
- `src/app.ts` remains in source as compatibility/reference material for existing verifiers;
- the legacy `src/ui/views` string-renderer tree remains in source;
- `tsconfig.verify.json` intentionally compiles the verifier-compatible TypeScript tree into `dist/` after the Vite build;
- `scripts/verify-vite-build.mjs` currently asserts that compatibility output exists, including `dist/ui/views/map-quiz.js`;
- the exact current GitHub Pages artifact contains 16 compiled `ui/views/*.js` files even though `index.html`/`app.js` do not reference them;
- the same compatibility emit places additional unbundled framework-independent modules under `data/`, `domain/`, `infrastructure/`, `routing/`, `state/` and `ui/` in the deployable directory.

#100 therefore remains real work. It is no longer “finish moving production screens to React”; it is “replace implementation-coupled verifier coverage, stop emitting compatibility fixtures into the deployable artifact, then remove the obsolete source/render/CSS tail with evidence.”

### 2026-08-26 implementation update

#100's compatibility boundary is now removed on the closeout branch. `npm run
build` runs Vite/Workbox for deployable `dist/`, then emits only the plain-Node
verifier modules into ignored `.verify-dist/`. The verifier family imports that
separate output while its production-artifact assertions continue to read
`dist/`. `scripts/verify-vite-build.mjs` now rejects verifier-only `data/`,
`domain/`, `infrastructure/`, `react/`, `routing/`, `state/` and `ui/` trees
in the deployable artifact.

The source coordinator `src/app.ts`, all 16 `src/ui/views/*.ts` string
renderers, and the unused pre-Vite `scripts/build.mjs`/`scripts/dev.mjs` path
are deleted after an import/verifier dependency audit. A real-production-markup
CSS audit removed only the two now-unreferenced reduced-motion selectors for
the retired continent/region Play cells; shared map and React selectors remain
intact.

Local evidence: `npm test` passed with 29 Vitest tests and the full plain-Node
suite. The resulting `dist/` contains 33 Vite/Workbox files totalling
7,281,623 bytes, versus the prior 132-file roughly 15.26 MB mixed artifact.
The temporary 90-file, 5,735,833-byte verifier tree is ignored and removed by
the successful `npm run verify` cleanup step. GitHub/CI closeout remains a
separate tracker action.

## Pre-closeout reconciliation verification baseline (superseded by the 2026-08-26 worklog)

### Invariant / Node 22 evidence

Current-main CI #401 ran Node `22.23.2` and passed:

- `npm run check`;
- `npm test`;
- 3 Vitest/Testing Library tests;
- the complete plain-Node verifier chain;
- Vite/Workbox production build;
- exact `flag-atlas-dist` artifact upload.

The build verifier reported 132 files before CI artifact upload and confirmed repository-relative paths plus lazy Africa, South America, Europe and Asia chunks.

### Component evidence

The current React component suite contains three tests covering:

- Home domain action dispatch;
- unsupported-continent inertness;
- launcher row Play/Learn actions.

It does not yet provide active-round component coverage for Flags, Outlines, Locations or Neighbours.

### Browser evidence

The checked-in Playwright suite contains three smoke tests, configured for desktop Chromium and Pixel 7 emulation:

- Home → Flags → Africa → active round start;
- direct Flags/Africa route → West Africa Play → Back to launcher;
- direct Locations/Africa route → West Africa round start.

Current `main` CI does **not** run `npm run test:browser`.

The suite therefore does not currently prove:

- complete Flags or Outlines flows;
- Neighbours browser behaviour;
- Locations answer/pan/zoom/results;
- full Back/Forward/direct-link/refresh matrix;
- stored-progress reload;
- failed lazy-load feedback;
- production service-worker/offline/update behaviour.

### Production artifact evidence

The exact current-main CI artifact and the exact Pages artifact were inspected during this reconciliation.

Confirmed:

- React `app.js` is the browser application entry;
- Vite-generated relative asset URLs are used;
- lazy continent browser chunks remain separate;
- `sw.js` uses `flag-atlas-v29`;
- 16 legacy view modules exist only as unreferenced verifier compatibility output in the Pages artifact.

### PWA/offline evidence

Static build/source evidence confirms the intended Workbox policy. It is not equivalent to a browser actually opening an offline shell, revisiting runtime-cached geography, or traversing an update between deployments. Those runtime checks remain open.

### Physical-device boundary

Issue #71 is the authority for physical Pixel/Android Chrome, iPhone/iOS Safari and installed-PWA validation.

Playwright's Pixel 7 project is emulation, not physical-device evidence. #89/#101 must state #71's status honestly and must not duplicate or silently claim those checks.

## Preserved migration boundaries

Closeout work under #89 must not change, merely to finish migration bookkeeping:

- learning/scoring/evidence/mastery semantics;
- storage namespaces or payload schemas;
- typed route grammar or refresh policy;
- ISO3 country identity;
- Natural Earth topology or adjacency policy;
- British-English learner copy;
- Tactile Atlas design behaviour;
- PWA caching semantics except where a validation-discovered defect requires a separately reviewable fix.

## Remaining publication closeout sequence

1. #92, #94 and #95 were closed during this reconciliation with evidence-backed comments.
2. #93 and #96–#101 were re-scoped to current remaining work rather than historical migration implementation.
3. The verification tails for #93/#96–#99, #100 cleanup and #101 final local
   acceptance are complete on the local closeout branch.
4. Publish and review the local commits without running a release.
5. Merge, then run the final Node 22 gate on merged `main` and inspect the exact
   merged artifact.
6. Move the completed child/epic records to `docs/closed/`, fix inbound links
   and close #93/#96–#101 followed by #89 with reachable commit/CI evidence.
7. Keep #71 open and execute its independent physical-device schedule; do not
   duplicate or infer that evidence from #89 automation.

## Definition of done

The original architectural definition remains intentionally strict:

- Vite owns development and the production browser build;
- React owns every production application surface and lifecycle;
- typed routing, product engine, persistence formats and round semantics remain intact;
- all four learning domains have behavioural, accessibility, responsive and persistence evidence appropriate to the React implementation;
- PWA install/offline/update and GitHub Pages behaviour are verified against production output;
- existing invariant coverage remains active and component/browser coverage protects the React lifecycle boundaries;
- legacy string renderers, root-wide legacy rendering/global action dispatch and temporary verifier compatibility output are removed from the production/deploy artifact;
- durable architecture/build/PWA decisions describe what actually ships;
- required child issues are closed with concrete evidence;
- final merged `main` passes the Node 22 repository gate.

Atlas being `1.0.0` is not, by itself, evidence that these closeout requirements are complete.
