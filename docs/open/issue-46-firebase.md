# Issue #46 — Firebase reconciliation and remaining execution plan

**Status:** open; historical migration scope reconciled against Atlas 1.0.0
**Baseline:** `d8f52ec94105043f3105f79209da6e4c62745b4a`
**Architecture:** [`../architecture/firebase.md`](../architecture/firebase.md)
**Cloud-data follow-up:** #106
**Hosting follow-up:** #107

## Reconciled objective

Issue #46 is no longer a proposal to "port Atlas to Firebase" from a zero-runtime-framework browser application.

React 19 and Vite are established production architecture. Firebase client
infrastructure is already present. GitHub Pages remains the declared primary
production host, and a second live deployment now exists at
`https://atlas-3c48a.web.app/`. Local browser persistence remains the only
production learning-state repository because the checked-in Firestore helper
has no application caller.

The remaining objective is to finish two independently valuable Firebase capabilities without replacing Atlas's existing architecture:

1. **optional account-backed cloud progress** with explicit merge/retry/security/privacy semantics (#106);
2. **Firebase Hosting deployment and cutover** of the same tested static application (#107).

Issue #46 remains the umbrella closeout gate. It should not close until the genuinely required implementation and Firebase-specific verification below are evidenced.

## Current-state classification

| # | Historical #46 area | Classification | Reconciled reality |
| --- | --- | --- | --- |
| 1 | Firebase project/configuration | **PARTIAL** | `.firebaserc`, public Web config and project `atlas-3c48a` are checked in; Firestore targets named database `atlas`. Remote console state is not proven by repository files. |
| 2 | Google Auth | **PARTIAL** | Google popup sign-in, auth observation and sign-out ship in the React Profile screen. Provider enablement/authorised domains remain remote verification. |
| 3 | Account lifecycle | **PARTIAL** | Sign-in/sign-out exists. Account deletion, cloud-data deletion, retention/privacy semantics and anonymous upgrade do not. |
| 4 | Firestore database/repository | **PARTIAL** | Firestore initialises and a generic `getDoc`/`setDoc` helper exists. It is not integrated with `AppStore` or the local repositories. |
| 5 | Progress/achievement data sync | **REMAINING** | No current production caller invokes `saveState()` or `loadState()`. None of the ten intended namespaces actually syncs. |
| 6 | Local-first behaviour | **SHIPPED** | All four domains, achievements and perfect-run streaks update/load through local persistence independently of Firebase. This is a preservation contract for #106. |
| 7 | Offline behaviour | **PARTIAL** | Local/PWA operation is implemented; generic production-browser evidence remains #93/#101. Firebase-specific offline sync/reconnect behaviour cannot exist until sync is integrated. |
| 8 | Write queue/retry | **REMAINING** | No Atlas cloud write queue or retry policy exists. One helper write simply returns `false` on failure. |
| 9 | Conflict resolution | **REMAINING** | No cross-device merge/conflict policy exists. Whole-document timestamps are not an implemented conflict protocol. |
| 10 | Migration/backfill of existing local data | **REMAINING** | Local migrations exist, but no first-sign-in local-to-cloud backfill or safe cloud-to-local restoration exists. |
| 11 | Firestore Security Rules | **PARTIAL** | Checked-in owner rules plus a single-UID allow-list and fixed state keys are deployed by the successful `d8f52ec` workflow. Emulator coverage is absent, authorised-account policy is not remotely verified, and attempt arrays conflict with the rules' `data is map` requirement. |
| 12 | Emulator/security-rule testing | **REMAINING** | No Firebase Emulator Suite/rules-unit-testing configuration or tests are checked in. |
| 13 | Firestore indexes | **SUPERSEDED for current model** | Current exact-document `getDoc`/`setDoc` access needs no custom composite index. Add indexes only if #106 introduces a query that requires them. |
| 14 | Degraded Firebase behaviour | **PARTIAL** | Learning remains local and Auth has generic failure UI; the unused Firestore helper swallows errors. Actual cloud-sync degradation/recovery semantics remain unimplemented. |
| 15 | Privacy/data retention/account deletion docs | **REMAINING** | No complete Firebase-specific policy or deletion contract exists. |
| 16 | Firebase Hosting | **PARTIAL** | `firebase.json` targets `dist/`; the post-CI workflow deployed `d8f52ec` successfully to `atlas-3c48a.web.app`. Firebase-origin acceptance, primary-host cutover and rollback evidence remain. |
| 17 | GitHub Pages production hosting | **SHIPPED / VERIFIED** | Current main CI and Pages deployment are green; `.github/workflows/pages.yml` is the current production deployment path. |
| 18 | Hash routing vs clean paths | **SHIPPED / SUPERSEDED** | Hash routing is established and works independently of host. Clean History paths are no longer a #46 requirement and should not be bundled into Hosting. |
| 19 | CI/deployment/rollback | **PARTIAL** | Node 22 CI, Pages deployment and automatic Firebase Hosting/rules deployment are shipped. Host decision and exercised rollback remain #107. |
| 20 | PWA/service-worker interaction | **PARTIAL** | Workbox/Vite PWA integration is shipped. Generic runtime evidence belongs to #93/#101; Firebase-origin/cloud-service-specific evidence belongs to #106/#107. |

## Already completed items

The following historical #46 work no longer needs to be implemented from scratch:

- Firebase SDK dependency and application initialisation;
- repository-selected Firebase project configuration;
- named Firestore database initialisation;
- React-owned optional Profile surface;
- Google popup sign-in and sign-out client functions;
- an infrastructure-only Firestore document helper;
- stable state-key allow-list shared conceptually with local storage;
- checked-in owner-scoped, single-account Firestore rules;
- established local-first persistence for all four learning domains and achievements;
- React/Vite static production build suitable for host-independent deployment;
- relative Vite assets, relative PWA scope/service-worker registration and hash routing;
- GitHub Pages CI/deployment on Node 22.
- Firebase Hosting configuration for `dist/` with SPA fallback;
- a credential-safe post-CI workflow targeting `atlas-3c48a`;
- a successful live Hosting and Firestore-rules deployment for `d8f52ec`.

These are foundations and real deployment evidence, not evidence that cloud
progress or the full Firebase-origin acceptance/cutover gate is complete.

## Remaining implementation work

### #106 — cloud progress and account lifecycle

#106 owns the actual data feature:

- connect cloud sync behind application/infrastructure seams without moving domain rules into Firebase;
- define which of the ten current namespaces are canonical cloud state;
- preserve immediate local writes and offline learning;
- reconcile existing local data safely on first sign-in;
- validate cloud payloads through existing storage migration/sanitisation boundaries;
- define deterministic conflict handling instead of implicit whole-document last-write-wins;
- define retry/queue/reconnect semantics;
- resolve or deliberately exclude the attempt-history array/rules mismatch;
- align the general Google sign-in UI with the current single-account Firestore allow-list or deliberately widen authorised use;
- implement account/cloud-data deletion and define local-data semantics;
- document privacy and retention;
- add Firebase Emulator Suite/rules coverage.

### #107 — Hosting deployment and cutover

#107 has completed configuration and repeatable deployment. It still owns:

- retain hash routing and current React/Vite build semantics;
- verify relative assets, manifest, service-worker scope and lazy geography on the Firebase origin;
- verify Google Auth authorised-domain behaviour for that origin;
- document and validate production cutover and rollback;
- keep Hosting independent from #106 cloud sync.

Current evidence: [workflow run `33025732947`](https://github.com/BenWassa/flag/actions/runs/33025732947)
built `d8f52ec`, deployed Hosting version `8f3c77e24df97f29` to
`https://atlas-3c48a.web.app/`, compiled `firestore.rules`, and released the
rules successfully. #107 remains open because a successful deploy log does not
substitute for the browser/origin, Auth, degraded-state, host-decision and
rollback evidence in its exit gate.

## Hosting and #100 sequencing

Current `dist/` is valid and can be previewed on Firebase Hosting without waiting for #100. The known compatibility emit is not a Hosting correctness blocker.

However, #100 owns removing/narrowing the temporary verifier compatibility tree that currently adds roughly 6.78 MB to the deployable artifact, including 16 unreferenced compiled legacy `ui/views/*.js` files.

Recommended dependency relationship:

1. #107 has added Hosting configuration and a live deployment of current `dist/`;
2. #100 removes the known temporary compatibility output;
3. production Firebase Hosting cutover should normally use the post-#100 artifact;
4. #107 then re-baselines the exact post-#100 Firebase-hosted artifact/origin and records rollback evidence before any primary-host cutover.

Do not make #107 fix #100, and do not block useful Hosting configuration work merely because #100 is still open.

## Remaining verification work

Repository presence is not remote-state evidence. Before #46 can close, record the Firebase-specific verification that applies to the final implementation:

- actual Firebase project/database configuration used by production;
- Google provider enablement and authorised domains;
- exact deployed Firestore rules and database target;
- Emulator Suite security-rule tests, including cross-user denial and malformed state rejection;
- first-sign-in/backfill and clean-profile cloud restore;
- deterministic divergent-state reconciliation;
- write failure, reconnect and retry behaviour;
- account/cloud-data deletion and documented local-state result;
- Firebase Hosting preview/production origin behaviour;
- Hosting cutover and rollback procedure;
- local learning with Auth/Firestore unavailable;
- Firebase-origin service-worker/manifest/hash-route behaviour.

Do not duplicate generic validation already owned elsewhere:

- #93 — production-browser PWA/offline/update runtime evidence;
- #101 — final cross-domain production/browser validation;
- #71 — physical Pixel/iPhone/installed-PWA validation.

If a check is specifically introduced by the Firebase origin or cloud sync, record it under #106/#107. Otherwise cite the owning issue's evidence rather than creating a parallel Firebase test programme.

## Local-first preservation contract

#46 must not redefine Atlas around connectivity.

Any completed Firebase implementation must preserve these contracts:

1. learning sessions start and finish without an account;
2. in-memory and local progress update before any cloud round trip;
3. Firebase failure does not block learning interaction;
4. sign-out does not erase local progress;
5. cloud restore cannot bypass existing payload migration/sanitisation boundaries;
6. cloud reconciliation cannot silently discard valid newer/stronger local evidence or earned achievements;
7. stable localStorage namespaces remain compatible unless a separately documented migration has product value;
8. React/Vite, typed routing, evidence/mastery rules and geography architecture remain unchanged by the Firebase integration.

## Security and privacy requirements

The public Firebase Web configuration is not secret material. Security review should focus on identity, rules, data shape and lifecycle.

Before #46 closes:

- every Firestore learner document must remain scoped to its authenticated owner;
- any single-user allow-list must match actual product availability or be deliberately revised;
- rules must be tested rather than only inspected;
- cloud payload types must match rule validation, including any attempt-history design;
- unauthorised cross-user reads/writes must be denied;
- uploaded data categories and retention must be documented;
- sign-out, account deletion, cloud-data deletion and local-data retention must have explicit semantics;
- remote provider/rule/authorised-domain state must be verified directly.

## Explicit non-goals

The reconciled #46 does **not** authorise:

- replacing or altering the established React/Vite architecture;
- introducing React (already shipped) or re-running #89 migration work;
- changing learning, scoring, evidence or mastery semantics;
- moving domain rules into Firestore;
- renaming stable routes, storage keys, cache identifiers or country IDs;
- replacing hash routing with clean History paths;
- changing cartography/geography sources or policy;
- fixing #100's verifier compatibility output inside Firebase work;
- duplicating #93/#101 generic PWA/browser validation or #71 physical-device validation;
- making network connectivity or an account mandatory for learning.

## Closeout criteria for #46

Do **not** close #46 until all of the following are evidenced:

- #106 is complete: intended learner data actually syncs and restores across authenticated contexts;
- first-sign-in/backfill preserves existing local progress;
- conflict, retry/reconnect and degraded-state behaviour are deterministic and tested;
- account lifecycle includes sign-out plus documented deletion/privacy/retention semantics;
- Firestore rules enforce the intended ownership/account model and pass Emulator Suite tests;
- exact remote Firebase Auth/Firestore configuration required by production is verified;
- #107 is complete: Firebase Hosting can reproducibly deploy the tested `dist/` with Firebase-origin routing/PWA/Auth behaviour verified;
- Hosting cutover/rollback is documented and the intended production-host state is explicit;
- hash-route compatibility and the local-first preservation contract remain intact;
- relevant generic #93/#101 evidence is cited rather than duplicated, and #71 physical-device status is stated accurately where relevant;
- Node 22 `npm test` remains green on the implementation tree;
- the exact production artifact used for final Hosting acceptance is inspected.

At this reconciliation point, those criteria are not satisfied. Issue #46 must remain open.
