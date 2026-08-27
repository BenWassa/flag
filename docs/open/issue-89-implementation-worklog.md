# Issue #89 implementation worklog

**Parent:** #89
**Execution plan:** `docs/open/issue-89-execution-plan.md`
**Architecture:** `docs/architecture/react-vite-migration.md`

This worklog records durable implementation history, deviations, compatibility boundaries and verification evidence for the React/Vite migration. Git history remains the detailed commit-by-commit record.

## 2026-08-25 — baseline/contracts phase

Issue #91 established the migration contract before the production entry changed.

Baseline evidence recorded through PR #102:

- baseline `main`: `a5e49c1aa0f8bd6163bcfda71ad545a48628a04c`;
- baseline CI #382: green;
- baseline Pages #359: green;
- production source/geography unchanged by the baseline documentation phase;
- browser/device evidence not claimed where the execution environment could not provide it.

PR #102 merged the architecture decision, execution plan and initial worklog and closed #91.

## 2026-08-25 — integrated Vite/React migration

### Execution shape

The original programme expected separate focused child PRs. Actual implementation did not remain that granular: PR #103 began as the #92 Vite foundation and accumulated the production React/Vite migration before tracker closeout. Its original PR body therefore describes an earlier Vite-only state rather than the eventual merged contents.

Important implementation commits include:

- `bef6c93a2d712633388343e73068e64cec429cd4` — add Vite foundation;
- `cae09eb2236f7894427e6901dc6dca87d86292ad` — configure Vite for GitHub Pages;
- `9d60b3d88b37c7e24def676786d3fb282b2d5241` — preserve verifier module emit;
- `41b45f6512a33b8e09693a07f86d132439b60df2` — verify Vite production artifact;
- `2a56d5086df303745098f285d60603f330fbef8a` — migrate Atlas production UI to React.

The production platform landed on `main` through:

- `006ea5d35d5867a03af783e6c1a4cdeea79c9562` — merge React/Vite platform migration and concurrent Firebase backend work;
- `336a54a050f589e4ef74bac62c7329c9eb08e12a` — release version bump to Atlas `1.0.0`.

Firebase/backend work present in the same merge history is not treated as #89 evidence except where it appears in the same production tree. #89 remains bounded to presentation/build/PWA migration.

### Production ownership after migration

By Atlas `1.0.0`:

- `src/main.tsx` is the browser entry;
- `src/react/AtlasApp.tsx` owns application composition and global UI lifecycle;
- `src/react/screens/*` owns passive surfaces plus Flags, Outlines, Locations and Neighbours production screens;
- component handlers own production interactions;
- the typed hash router remains the sole navigation/history authority;
- `AppStore` and existing round controllers remain application/learning orchestration boundaries;
- Vite owns browser development and production bundling;
- `src/sw.ts` is built through Workbox InjectManifest;
- generated continent geography remains lazy and canonical.

The production browser graph no longer imports the legacy `src/app.ts` string-rendering coordinator or `src/ui/views/*` screen modules.

### Router/store implementation deviation

The pre-migration architecture proposed `useSyncExternalStore` plus an explicit `AppStore.subscribe()/notify()` API.

The shipped root instead:

- subscribes directly to the existing typed router through React lifecycle;
- owns one `AppStore` instance;
- explicitly increments React revision state after store/controller mutations.

No second router, browser-history model or third-party state store was introduced. The post-v1 reconciliation accepts this as the actual v1 architecture rather than requiring churn solely to reproduce the abandoned mechanism.

### PWA implementation

The integrated migration replaced the static shell list with Vite/Workbox build integration.

Current `src/sw.ts` policy includes:

- `precacheAndRoute(self.__WB_MANIFEST)`;
- old Atlas cache cleanup;
- `skipWaiting()` and `clientsClaim()`;
- network-first same-origin runtime requests;
- cache-first `flagcdn.com` flags;
- navigation fallback to the precached `index.html`;
- lazy continent chunks excluded from precache and available through runtime caching after first successful fetch.

Current cache generation: `flag-atlas-v29`.

Static artifact evidence proves this policy is generated. It does not prove a production-browser offline/update session.

### Test infrastructure added

The migration introduced:

- Vitest + Testing Library;
- Playwright against the production preview;
- desktop Chromium and Pixel 7 emulation projects.

Historical candidate smoke evidence must not be mistaken for a complete current-main #101 matrix.

## 2026-08-25 — post-v1.0.0 truth reconciliation

### Reconciliation baseline

PR #105 independently re-read the live issues, #89 documentation, merged PR/commit history, package/build configuration, React production entry, PWA/service worker, legacy renderer tree, verifier emit and current CI/Pages state.

Baseline:

- `main`: `336a54a050f589e4ef74bac62c7329c9eb08e12a`;
- package version: `1.0.0`;
- React: `19.2.8`;
- Vite: `8.2.2`;
- `vite-plugin-pwa`: `1.3.0`;
- cache generation: `flag-atlas-v29`.

### Actual production architecture

```text
index.html
  -> Vite browser entry
  -> app.js from src/main.tsx
  -> React AtlasApp/screens
  -> existing state/router/round controllers
  -> domain/data/infrastructure
```

React owns:

- Home and profile;
- domain continent indexes;
- launchers;
- Flags study;
- Flags active rounds/results;
- Outlines active rounds/results;
- Locations active map/results;
- Neighbours active map/input/results;
- visible notices and routine live status;
- document title;
- focus intent;
- keyboard handling;
- navigation gestures;
- persistence flushing;
- install UI;
- service-worker registration.

The exact Pages artifact references relative Vite/browser assets and does not reference legacy `ui/views` modules.

### Current-main Node 22 CI evidence

CI run #401 (`32843480330`) executed exact SHA `336a54a050f589e4ef74bac62c7329c9eb08e12a`.

Environment:

- Ubuntu 24.04;
- Node `22.23.2`;
- npm `10.9.8`.

Passed:

- `npm run check`;
- full `npm test`;
- Vitest/Testing Library: 1 file, 3 tests, all passing;
- Vite production build;
- Workbox InjectManifest build;
- complete plain-Node verifier chain;
- production artifact upload.

Build evidence:

- `app.js`: 785,763 bytes raw / 236.12 kB gzip;
- Africa lazy JS: 915,673 bytes;
- South America lazy JS: 883,396 bytes;
- Europe lazy JS: 1,652,595 bytes;
- Asia lazy JS: 2,997,763 bytes;
- Workbox InjectManifest: 20 precache entries / 1099.99 KiB;
- generated `dist/sw.js`;
- build verifier observed 132 files before artifact upload.

### Exact CI artifact

Current-main CI artifact:

- name: `flag-atlas-dist`;
- artifact ID: `9561404995`;
- digest: `sha256:ef0566b34841f1404baf37b8dc59585d5fbac6e42244881e64c43fd6e463c0ac`;
- head SHA: `336a54a050f589e4ef74bac62c7329c9eb08e12a`.

The reconciliation downloaded and inspected this exact artifact.

GitHub Actions artifact upload excludes hidden files by default, so the uploaded ZIP contains 131 files rather than the 132 files observed by the build verifier; hidden `.vite/manifest.json` is omitted from the uploaded ZIP. The tested build itself remains the 132-file `dist/` observed during CI.

### Exact Pages evidence

Pages run #376 (`32843556646`) succeeded for the same SHA.

Exact Pages artifact:

- name: `github-pages`;
- artifact ID: `9561424343`;
- digest: `sha256:4932bfc57c7c54167ec04b9c567ca4e652ab82c4a28c94803257ab7903ceadf7`;
- head SHA: `336a54a050f589e4ef74bac62c7329c9eb08e12a`.

The downloaded deploy tree contained:

- 132 files;
- approximately 15.26 MB unpacked;
- relative `index.html` references;
- React `app.js` as the production application entry;
- separate lazy continent chunks;
- `sw.js` with `flag-atlas-v29`.

### Exact remaining compatibility tail

Current build command:

```text
vite build && tsc -p tsconfig.verify.json
```

`tsconfig.verify.json` compiles verifier-compatible TypeScript into the same `dist/` directory after Vite.

The deployed artifact therefore contains both:

1. Vite/Workbox production browser output;
2. unreferenced verifier compatibility output used by plain-Node assertions.

Observed in the exact Pages artifact:

- 16 compiled legacy `ui/views/*.js` files;
- those 16 files total 58,791 bytes;
- no `index.html` or React application-bundle reference to `ui/views/*`;
- compatibility-style `data`, `domain`, `infrastructure`, `routing`, `state` and `ui` module directories total about 6.78 MB in the deploy tree, including generated/module material already represented through Vite browser output.

Legacy compiled view files present:

- `domain.js`;
- `flags-study.js`;
- `home.js`;
- `launcher.js`;
- `map-home.js`;
- `map-quiz.js`;
- `map-results.js`;
- `neighbor-home.js`;
- `neighbor-quiz.js`;
- `neighbor-results.js`;
- `outline-home.js`;
- `outline-quiz.js`;
- `outline-results.js`;
- `quiz.js`;
- `results.js`;
- `scope.js`.

Source-side compatibility remains because:

- `src/app.ts` remains and is read by implementation-coupled verifiers;
- `src/ui/views/*` remains in source;
- `scripts/verify-vite-build.mjs` explicitly requires verifier compatibility output including `dist/ui/views/map-quiz.js`;
- other verifiers still read compiled legacy views or `src/app.ts` source.

This is the exact remaining #100 scope. It does **not** mean the browser still renders through legacy views.

### Current component evidence

`src/react/test/components.test.tsx` contains three tests:

1. Home opens a domain through a component-owned event;
2. unsupported continents remain non-interactive;
3. launcher rows invoke Play/Learn actions.

There is no current active-round React component coverage for Flags, Outlines, Locations or Neighbours.

### Current browser evidence

`tests/browser/atlas.spec.ts` contains three Playwright tests:

1. Home → Flags → Africa → start whole-continent Play;
2. direct Flags/Africa route → Play West Africa → Back to the continent launcher;
3. direct Locations/Africa route → start West Africa Play.

`playwright.config.ts` configures:

- desktop Chromium;
- Pixel 7 emulation (`mobile-chromium`).

Current-main CI #401 does **not** execute `npm run test:browser`.

Missing browser evidence relative to #89/#101 includes:

- complete Flags round/result flow;
- complete Outlines round/result flow;
- Neighbours input/map/results;
- Locations answer/pan/zoom/results;
- full Back/Forward/direct-hash/refresh matrix;
- stored-progress reload;
- failed lazy-load feedback;
- production service-worker/offline/update smoke.

### PWA/offline evidence still missing

Static inspection proves Workbox output and the intended runtime strategies are built.

No current evidence demonstrates in a production browser session:

- offline shell open/reopen;
- previously loaded lazy geography while offline;
- update transition between deployments;
- installed-PWA update behaviour.

#93/#101 retain those runtime validation requirements.

### Physical-device boundary — #71

Issue #71 remains open and is the sole authority for physical-device evidence.

Its acceptance criteria include:

- physical Pixel/Android Chrome;
- physical iPhone/iOS Safari;
- installed-PWA validation;
- real edge-swipe/map gesture interaction;
- safe-area behaviour;
- real software-keyboard behaviour.

Playwright Pixel 7 emulation is not physical Pixel evidence. Code inspection, responsive CSS verifiers and browser emulation are not substitutes for #71.

#89/#101 must record #71's status honestly without duplicating its physical-device work.

### Child issue status matrix

| Issue | Classification | Tracker state after reconciliation | Evidence / remaining work |
| --- | --- | --- | --- |
| #92 | complete and closable | **closed** | Vite dev/build/CI foundation live; current CI/Pages and exact artifacts confirm it. |
| #93 | partially complete; re-scope | **open, re-scoped** | Workbox integration ships; production-browser offline/update runtime evidence remains. |
| #94 | materially complete; closeout documentation | **closed** | React shell/global lifecycle ships; actual router/store adaptation documented. |
| #95 | complete and closable | **closed** | Passive React surfaces/Flags study ship with routing/IA/action/component evidence. |
| #96 | partially complete; re-scope | **open, re-scoped** | React Flags ships; complete active-round component/browser evidence remains. |
| #97 | partially complete; re-scope | **open, re-scoped** | React Outlines ships; complete component/browser evidence remains. |
| #98 | partially complete; re-scope | **open, re-scoped** | React Locations ships; browser answer/pan/zoom/results evidence remains. |
| #99 | partially complete; re-scope | **open, re-scoped** | React Neighbours ships; active input/map component/browser evidence remains. |
| #100 | partially complete; re-scope | **open, re-scoped** | Runtime React ownership is complete; verifier emit/legacy source/CSS compatibility tail remains. |
| #101 | genuinely still open | **open, re-scoped** | Final cross-domain browser, PWA/offline and React lifecycle hardening remains. |

### GitHub tracker administration applied

During PR #105 reconciliation:

- #92 received an evidence-backed closeout comment and was closed as completed;
- #94 received an evidence-backed closeout/deviation comment and was closed as completed;
- #95 received an evidence-backed closeout comment and was closed as completed;
- #93, #96, #97, #98, #99 and #100 were rewritten around only their current remaining work;
- #101 was rewritten as the separated invariant/component/browser/artifact/PWA final validation gate;
- #89 was rewritten around current v1 truth and intentionally left open;
- #71 was not modified and remains the physical-device authority.

### Recommended #89 closeout condition

Keep #89 open.

Close only after:

1. #93/#96–#99 complete their verification tails or transfer non-duplicated final checks explicitly into #101 before closure;
2. #100 removes the verifier compatibility/legacy renderer tail without weakening invariant coverage or changing product semantics;
3. #101 passes the final post-#100 invariant/component/browser/PWA matrix against the exact production artifact;
4. the final branch is synchronised with current `main` and Node 22 CI is green;
5. the exact final production artifact is inspected;
6. #71 physical-device status is referenced honestly without being claimed as completed by emulation.

Atlas `1.0.0` is evidence that the platform migration shipped. It is not, by itself, evidence that the whole #89 closeout definition is satisfied.

### Reconciliation execution-environment limitation

The documentation/tracker reconciliation container could not resolve `github.com` from its local shell, so a local repository clone and local Node 22 `npm test` were not available.

The reconciliation therefore used:

- the connected GitHub repository as the read/write source of truth;
- current-main CI #401 as authoritative Node 22 `npm test` evidence;
- downloaded exact CI and Pages artifacts for production inspection;
- PR #105 GitHub CI as the branch verification gate.

No local `npm test`, manual browser session or physical-device session is claimed by this reconciliation task.

## Step 3a — active-round component coverage (2026-08-26)

Branch `claude/open-issues-review-plan-tz6n9e`, under the owner-approved
re-sequencing recorded in `issue-89-execution-plan.md`.

`src/react/test/active-rounds.test.tsx` adds 13 React/Testing Library tests over
the four shipped active-round surfaces, built on real domain sessions and the
real generated assets rather than hand-made fixtures:

- **Flags** — question, choices and round position render; a press calls
  `answerFlag` with the chosen id; an answered question shows the shared Play
  outcome (`Not quite` / `Answer: <name>`) and disables every choice; a wrong
  answer reaches Review on the results screen, driven through a real `AppStore`
  round rather than a synthesised result.
- **Outlines** — the silhouette is asked without naming itself: its only
  accessible name is `Country silhouette to identify`, and the stage's text
  never contains the answer; a press calls `answerOutline`.
- **Locations** — the prompt names one target at a time over a rendered map;
  every scoped country is an answerable target; a missed round reports the miss
  count and offers Review mistakes; a clean round says so, shows the perfect
  badge and offers no review.
- **Neighbours** — the target and task headings render; typing reaches
  `setNeighborQuery`; the explicit **No land neighbours** claim is present as a
  deliberate answer; a wrong guess is reported back in the feedback region.

Node 22 `npm run check` and full `npm test` green locally. This is the component
half of #96–#99; their browser half is step 3c. No production behaviour changed.

## Step 3b — #100 assertion migration: approach proven, first verifier migrated

### The inventory

19 verifiers are coupled to the retired presentation layer: 17 import
`dist/ui/views/*` renderers (about 115 call sites) and 7 assert against
`src/app.ts` source text (about 38 assertions). Those files carry roughly 1,080
assertions in total, so this is the substantial part of #100 rather than a
mechanical sweep.

### The approach

The invariants themselves are still worth asserting — British-English copy, IA
structure, routing labels, accessibility semantics. What is wrong is only what
they are asserted *against*. `scripts/lib/react-markup.mjs` renders the
production React screens to static markup for the plain-Node suite, so the same
invariants can point at what learners are actually served.

Two obstacles were resolved:

- the screens import PNG assets that Vite resolves and plain Node cannot, so
  `scripts/lib/asset-stub-loader.mjs` redirects static asset specifiers to a
  URL-shaped stub;
- the screens call `useAtlasActions()`, so the helper wraps each screen in an
  `AtlasActionsContext` provider whose every action is a no-op. Behaviour is
  covered by the component and browser layers; these assertions are about
  rendered output.

This keeps the plain-Node verifier architecture intact. Moving the whole suite
into vitest was the alternative and would have been far more disruptive.

### What the migration is not

It is not find-and-replace. React expresses an action through the control it
renders, while the legacy renderers emitted `data-action` attributes, so each
assertion needs re-expressing against the real markup. `verify-action-feedback`
is migrated as the worked example, and doing it exposed that its continent-row
check counted a class rather than an element: React renders a shipped continent
as `<button class="continent-row__open">` and an unshipped one as an inert
`<span>` carrying the same class. The replacement asserts both, which is
stronger than what it replaced.

### State

- `verify-action-feedback.mjs`: migrated, passing.
- 18 verifiers remain, plus the `tsconfig.verify.json` emit narrowing (#100
  step 3) and the legacy source removal (step 4), which cannot start until no
  verifier imports `dist/ui/views/*`.

Node 22 `npm run check`, full `npm test` (twice, for flake) and the 15-test
Chromium suite are green.

## Step 3b — #100 compatibility boundary removed (2026-08-26)

The remaining migration inventory was rechecked before deletion. No production
entry or verifier imported `src/app.ts` or `src/ui/views/*`; the only live
compatibility reference was the build verifier's deliberate assertion that
compiled legacy files existed. That assertion was inverted to protect the
production boundary instead.

- `tsconfig.verify.json` now emits to ignored `.verify-dist/`.
- `scripts/build-verifier-output.mjs` clears only that fixed directory before
  emitting, and `npm run verify:clean` removes it after a successful verifier
  chain.
- Plain-Node module imports/read checks now use `.verify-dist/`; deployed-file
  checks continue to use `dist/`.
- `src/app.ts`, all 16 `src/ui/views/*.ts` string renderers, and unused
  `scripts/build.mjs`/`scripts/dev.mjs` were deleted.
- `verify-vite-build` rejects the old unbundled verifier directory families in
  deployable `dist/`.
- The CSS audit removed only `.continent-row__play` and `.region-row__play`
  from an obsolete reduced-motion selector group; the remaining candidate
  selectors were retained because they are shared, dynamic, or insufficiently
  proven dead.

Local full `npm test` passed: 29 Vitest tests plus all plain-Node verifiers.
The Vite/Workbox artifact is 33 files / 7,281,623 bytes. The temporary verifier
tree measured 90 files / 5,735,833 bytes before cleanup and is absent after a
successful test run. This removes the previous deployed compatibility tail
(132 files / approximately 15.26 MB), without changing learner behaviour.
