# Issue #89 implementation worklog

**Parent:** #89  
**Execution plan:** `docs/open/issue-89-execution-plan.md`  
**Architecture:** `docs/architecture/react-vite-migration.md`

This log records the durable implementation history, deviations, compatibility boundaries and verification evidence for the React/Vite migration. Git history remains the detailed commit-by-commit record; this document records the decisions needed to understand the current programme state.

## 2026-08-25 — baseline/contracts phase

### Baseline

Issue #91 established the pre-migration contract and migration documentation before the production entry changed.

Key baseline evidence recorded by PR #102:

- baseline `main` SHA: `a5e49c1aa0f8bd6163bcfda71ad545a48628a04c`;
- baseline CI run #382: green;
- baseline Pages run #359: green;
- production source/geography unchanged by the baseline phase;
- browser/device evidence was not invented where the execution environment could not provide it.

PR #102 merged the architecture decision, execution plan and initial implementation worklog and closed #91.

## 2026-08-25 — Vite foundation and integrated React migration

### Execution shape

The original plan expected separate child PRs for Vite, PWA, React shell and each screen family. Actual implementation did not remain that granular.

PR #103 began as the #92 Vite-foundation branch, then accumulated the production React/Vite migration before tracker closeout. Its original PR body therefore describes an earlier Vite-only state and is not a reliable statement of the final merged contents.

Important commits in the integrated history include:

- `bef6c93a2d712633388343e73068e64cec429cd4` — add Vite foundation;
- `cae09eb2236f7894427e6901dc6dca87d86292ad` — configure Vite for GitHub Pages;
- `9d60b3d88b37c7e24def676786d3fb282b2d5241` — preserve verifier module emit;
- `41b45f6512a33b8e09693a07f86d132439b60df2` — verify Vite production artifact;
- `2a56d5086df303745098f285d60603f330fbef8a` — migrate Atlas production UI to React.

The production platform was then merged to `main` by:

- `006ea5d35d5867a03af783e6c1a4cdeea79c9562` — merge the React/Vite platform migration and concurrent Firebase backend work.

The release commit is:

- `336a54a050f589e4ef74bac62c7329c9eb08e12a` — bump Atlas to `1.0.0`.

The Firebase/backend changes that share the merge history are not treated as #89 implementation evidence except where they appear in the same production tree. #89 remains bounded to the presentation/build/PWA migration.

### Production ownership after the integrated migration

By `1.0.0`:

- `src/main.tsx` is the production browser entry;
- `src/react/AtlasApp.tsx` owns the application composition and global lifecycle;
- `src/react/screens/*` owns passive surfaces plus Flags, Outlines, Locations and Neighbours production screens;
- component handlers own production interactions;
- the typed hash router remains the only navigation authority;
- `AppStore` and existing round controllers remain the application/learning orchestration layer;
- Vite owns browser development and production bundling;
- `src/sw.ts` is built with Workbox InjectManifest;
- generated continent geography remains lazy.

The browser production graph no longer imports the legacy `src/app.ts` string-rendering coordinator or `src/ui/views/*` screen modules.

### Router/store deviation from the original proposal

The architecture proposal expected `useSyncExternalStore` and an explicit `AppStore.subscribe()/notify()` adapter.

The shipped React root instead:

- subscribes to the existing typed router through a React effect;
- owns a single `AppStore` instance;
- explicitly triggers React revision state after store/controller mutations.

No second router, browser-history model or third-party state store was introduced.

Post-v1 reconciliation accepts this as the actual v1 adapter architecture. Rebuilding the unused observable mechanism is not treated as necessary migration work unless a future concrete state-consistency problem demonstrates a need.

### PWA implementation

The integrated migration replaced the static service-worker shell list with Vite/Workbox build integration.

Current production policy in `src/sw.ts`:

- `precacheAndRoute(self.__WB_MANIFEST)`;
- old Atlas cache cleanup on activation;
- `skipWaiting()` and `clientsClaim()`;
- network-first same-origin runtime requests;
- cache-first `flagcdn.com` flags;
- navigation fallback to the precached `index.html`;
- lazy continent chunks excluded from precache and available through runtime caching after first fetch.

Current cache generation: `flag-atlas-v29`.

Static artifact evidence proves the policy is generated. It does not prove an actual production-browser offline/update session; that remains open under #93/#101.

### Component and browser test introduction

The integrated migration introduced:

- Vitest + Testing Library;
- Playwright configured for desktop Chromium and Pixel 7 emulation;
- production-preview browser smoke tests.

The initial migration worklog recorded a local/browser smoke pass on the integrated candidate. That historical candidate evidence must not be confused with a complete current-main #101 matrix.

## 2026-08-25 — post-v1.0.0 truth reconciliation

### Reconciliation baseline

This reconciliation started from current `main` and independently re-read the migration docs, live issues, merged PR/commit history, build configuration, React production entry, PWA configuration, legacy view tree, verifier emit and current CI/Pages state.

Current baseline:

- `main`: `336a54a050f589e4ef74bac62c7329c9eb08e12a`;
- package version: `1.0.0`;
- React: `19.2.8`;
- Vite: `8.2.2`;
- `vite-plugin-pwa`: `1.3.0`;
- current cache generation: `flag-atlas-v29`.

### Actual production architecture

The production dependency chain is:

```text
index.html
  -> Vite entry
  -> app.js from src/main.tsx
  -> React AtlasApp/screens
  -> existing state/router/controllers
  -> domain/data/infrastructure
```

`index.html` uses relative asset URLs. The exact Pages artifact references the React Vite entry and the existing stable map/runtime/CSS entries; it does not reference legacy `ui/views` modules.

React currently owns:

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

### Current-main CI evidence

CI run #401 (`32843480330`) ran against exact SHA `336a54a050f589e4ef74bac62c7329c9eb08e12a`.

Environment:

- Ubuntu 24.04 runner;
- Node `22.23.2`;
- npm `10.9.8`.

Passed:

- `npm run check`;
- `npm test`;
- Vitest/Testing Library: 1 test file, 3 tests, all passing;
- Vite production build;
- Workbox InjectManifest build;
- the complete plain-Node verifier chain;
- artifact upload.

Vite reported:

- `app.js`: 785,763 bytes raw / 236.12 kB gzip;
- Africa lazy JS: 915,673 bytes;
- South America lazy JS: 883,396 bytes;
- Europe lazy JS: 1,652,595 bytes;
- Asia lazy JS: 2,997,763 bytes.

Workbox reported:

- InjectManifest mode;
- 20 precache entries;
- 1099.99 KiB precache total;
- generated `dist/sw.js`.

The build verifier reported 132 files before artifact upload and passed repository-relative asset, browser-entry, compatibility-output and lazy-geography checks.

### Exact CI artifact

Current-main CI artifact:

- name: `flag-atlas-dist`;
- artifact ID: `9561404995`;
- GitHub digest: `sha256:ef0566b34841f1404baf37b8dc59585d5fbac6e42244881e64c43fd6e463c0ac`;
- head SHA: `336a54a050f589e4ef74bac62c7329c9eb08e12a`.

The reconciliation downloaded and inspected this exact artifact.

The GitHub Actions upload excludes hidden files by default, so the uploaded CI ZIP contains 131 files rather than the 132 files observed by the build verifier (the hidden `.vite/manifest.json` is omitted from the uploaded ZIP). This does not change the tested build result.

### Current Pages evidence

Pages run #376 (`32843556646`) succeeded for the same `main` SHA.

Exact Pages artifact:

- name: `github-pages`;
- artifact ID: `9561424343`;
- GitHub digest: `sha256:4932bfc57c7c54167ec04b9c567ca4e652ab82c4a28c94803257ab7903ceadf7`;
- head SHA: `336a54a050f589e4ef74bac62c7329c9eb08e12a`.

The reconciliation downloaded the Pages artifact tar and inspected the actual deploy tree:

- 132 files;
- approximately 15.26 MB unpacked;
- relative `index.html` references;
- React `app.js` production entry;
- separate lazy continent chunks;
- `sw.js` cache generation `flag-atlas-v29`.

### Exact remaining verifier/legacy compatibility tail

The current build command is:

```text
vite build && tsc -p tsconfig.verify.json
```

`tsconfig.verify.json` compiles the verifier-compatible source tree into the same `dist/` directory after Vite.

This means the current deploy artifact contains two different kinds of files:

1. Vite/Workbox production browser output;
2. unreferenced verifier compatibility output used by plain-Node assertions.

Observed in the exact Pages artifact:

- 16 compiled legacy `ui/views/*.js` files;
- those 16 files total 58,791 bytes;
- no `index.html` or React application-bundle reference to `ui/views/*` was found;
- compatibility-style module directories (`data`, `domain`, `infrastructure`, `routing`, `state`, `ui`) total about 6.78 MB in the deploy tree, including generated/module material that the Vite browser graph already bundles/splits separately.

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

Source-side dependencies on the compatibility layer also remain:

- `src/app.ts` remains in source and is read by implementation-coupled verifiers;
- `src/ui/views/*` remains in source;
- `scripts/verify-vite-build.mjs` explicitly requires verifier compatibility output including `dist/ui/views/map-quiz.js`;
- other verifiers read compiled legacy view modules or `src/app.ts` source.

This is the remaining #100 scope. It is not evidence that the browser still renders through the old views; it is evidence that the verification system and deploy directory have not yet been cleaned up.

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

`playwright.config.ts` configures both:

- desktop Chromium;
- Pixel 7 emulation (`mobile-chromium`).

Current-main CI #401 does **not** execute `npm run test:browser`, so checked-in coverage and historical candidate smoke evidence are not equivalent to current-main browser CI evidence.

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

Static inspection proves the Workbox service worker is built and the intended strategies are present.

No current evidence demonstrates, in a production browser session:

- an offline shell open/reopen;
- previously loaded lazy geography while offline;
- an update transition between deployments;
- installed-PWA update behaviour.

#93/#101 retain those runtime validation requirements.

### Physical-device boundary (#71)

Issue #71 remains open and is the sole authority for physical-device evidence.

Its acceptance criteria include:

- physical Pixel/Android Chrome;
- physical iPhone/iOS Safari;
- installed-PWA validation;
- real edge-swipe/map gesture interaction;
- safe-area behaviour;
- real software-keyboard behaviour.

Playwright Pixel 7 emulation is not physical Pixel evidence. Code inspection, responsive CSS verifiers and desktop/mobile browser emulation are not substitutes for #71.

#89 and #101 should record the state of #71 at closeout but must not duplicate its physical-device work.

### Child issue status matrix

| Issue | Classification at v1 reconciliation | Evidence basis / remaining work |
| --- | --- | --- |
| #92 | **complete and closable** | Vite dev/build/CI foundation is live; current CI/Pages and exact artifacts confirm it. |
| #93 | **partially complete and needing re-scope** | Workbox integration ships; production-browser offline/update runtime verification remains. |
| #94 | **materially complete, requiring closeout documentation** | React shell/global lifecycle ships; accepted router/store adapter deviation documented. |
| #95 | **complete and closable** | Passive React surfaces/Flags study ship with routing/IA/action/component evidence. |
| #96 | **partially complete and needing re-scope** | React Flags implementation ships; complete active-round component/browser coverage remains. |
| #97 | **partially complete and needing re-scope** | React Outlines implementation ships; complete component/browser coverage remains. |
| #98 | **partially complete and needing re-scope** | React Locations implementation ships; browser answer/pan/zoom/results evidence remains. |
| #99 | **partially complete and needing re-scope** | React Neighbours implementation ships; browser/component active-flow evidence remains. |
| #100 | **partially complete and needing re-scope** | Runtime React ownership is complete; verifier emit/legacy source/CSS compatibility tail remains. |
| #101 | **genuinely still open** | Final cross-domain browser, PWA/offline and React lifecycle hardening is incomplete. |

### Recommended #89 closeout condition

Keep #89 open.

Close it only after:

1. #92/#94/#95 closeout is recorded;
2. #93/#96–#99 complete their verification tails or transfer non-duplicated final validation requirements explicitly into #101 before closure;
3. #100 removes the verifier compatibility/legacy renderer tail without weakening invariant coverage or changing product semantics;
4. #101 passes the final post-#100 invariant/component/browser/PWA matrix against the exact production artifact;
5. the final branch is synchronised with current `main` and Node 22 CI is green;
6. #71 physical-device status is referenced honestly without being claimed as completed by emulation.

Atlas `1.0.0` is production evidence that the platform migration shipped. It is not, on its own, evidence that the entire #89 closeout definition is satisfied.

### Reconciliation environment limitation

The execution container used for this documentation/tracker reconciliation could not resolve `github.com` from its local shell, so a local repository clone and local Node 22 `npm test` were not available.

The reconciliation therefore used:

- the connected GitHub repository as the read/write source of truth;
- current-main CI #401 as the authoritative Node 22 `npm test` evidence;
- downloaded exact CI and Pages artifacts for production inspection;
- the reconciliation PR's own GitHub CI as the branch verification gate.

No local `npm test`, manual browser session or physical-device session is claimed by this reconciliation task.
