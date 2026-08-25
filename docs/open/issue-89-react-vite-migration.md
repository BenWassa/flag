# Issue #89: Migrate Atlas to React and Vite without rewriting the product engine

**Status:** Open — production migration shipped in Atlas `1.0.0`; compatibility and validation closeout remain

## Current state

Atlas `1.0.0` ships the production presentation and browser-build layers on React 19 and Vite 8.

Current `main` at the post-v1 reconciliation baseline is:

- SHA `336a54a050f589e4ef74bac62c7329c9eb08e12a`;
- package version `1.0.0`;
- Node 22 CI run #401: green;
- GitHub Pages run #376: green.

The migration is therefore no longer an in-flight question of whether React/Vite will own production. They already do.

The epic remains open because its original definition of done also requires the legacy verifier compatibility tail to be retired and the final browser/PWA validation matrix to be completed.

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
| #92 | complete and closable | Vite owns dev/build output; relative Pages paths and lazy geography are verified; current Node 22 CI and Pages are green; exact current artifacts inspected. |
| #93 | partially complete; re-scope | Workbox InjectManifest and the intended cache policy ship, but production-browser offline/update recovery has not been demonstrated. Keep open as a runtime PWA validation tail coordinated with #101. |
| #94 | materially complete; closeout documentation | React owns the shell/global lifecycle. Router/store adaptation shipped through a simpler root-owned implementation rather than the proposed observable-store API. No parallel router/store exists. |
| #95 | complete and closable | Passive React surfaces and Flags study ship; routing/IA/action-feedback invariants, React component coverage and available browser smoke evidence cover the phase boundary. |
| #96 | partially complete; re-scope | Flags production UI is React-owned and invariants are green, but the issue's required complete active-round component/browser coverage is not present. |
| #97 | partially complete; re-scope | Outlines production UI is React-owned and invariants are green, but complete React component/browser coverage is not present. |
| #98 | partially complete; re-scope | Locations production UI is React-owned and map/cartography invariants are broad; browser coverage currently reaches round launch only, not answer/pan/zoom/results parity. |
| #99 | partially complete; re-scope | Neighbours production UI is React-owned and invariant coverage is broad; there is no current Playwright Neighbours flow or equivalent React component closeout coverage. |
| #100 | partially complete; re-scope | Production runtime no longer depends on legacy string renderers/global dispatch, but legacy renderer fixtures and the broad verifier emit remain and are physically deployed as unreferenced files. |
| #101 | genuinely still open | Final browser/offline/accessibility/production hardening is materially incomplete; physical-device evidence remains explicitly owned by #71. |

The live GitHub issues must match this matrix after this reconciliation branch merges.

## Exact remaining compatibility tail (#100)

Current production dependency inspection shows:

- the browser entry graph does **not** import `src/app.ts` or `src/ui/views/*`;
- `src/app.ts` remains in source as compatibility/reference material for existing verifiers;
- the legacy `src/ui/views` string-renderer tree remains in source;
- `tsconfig.verify.json` intentionally compiles the verifier-compatible TypeScript tree into `dist/` after the Vite build;
- `scripts/verify-vite-build.mjs` currently asserts that compatibility output exists, including `dist/ui/views/map-quiz.js`;
- the exact current GitHub Pages artifact contains 16 compiled `ui/views/*.js` files even though `index.html`/`app.js` do not reference them;
- the same compatibility emit places additional unbundled framework-independent modules under `data/`, `domain/`, `infrastructure/`, `routing/`, `state/` and `ui/` in the deployable directory.

#100 therefore remains real work. It is no longer “finish moving production screens to React”; it is “replace implementation-coupled verifier coverage, stop emitting compatibility fixtures into the deployable artifact, then remove the obsolete source/render/CSS tail with evidence.”

This reconciliation task does not perform that implementation.

## Current verification truth

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

## Remaining closeout sequence

1. Close #92, #94 and #95 with evidence-backed comments after this reconciliation is recorded.
2. Re-scope #93 and #96–#100 to current remaining work rather than historical migration implementation.
3. Complete the verification-only tails for #93/#96–#99 or explicitly transfer non-duplicated final checks into #101 before closing those children.
4. Complete #100 compatibility/verifier cleanup without product-semantic changes.
5. Complete #101 against the exact post-#100 production artifact.
6. Reconcile #71 physical-device status without duplicating it.
7. Run the final merged-main Node 22 gate, inspect the exact production artifact and close #89 only when every required child gate is genuinely satisfied.

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
