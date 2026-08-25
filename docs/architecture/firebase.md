# Firebase architecture

**Status:** partially implemented on Atlas 1.0.0
**Reconciled against:** `fb60ccf8c5475b9c932cde0a30c46eca40ab1c01`
**Tracking issue:** #46
**Remaining cloud-data work:** #106
**Remaining Hosting work:** #107

## Purpose

Atlas has a real Firebase client boundary, but Firebase does not currently own learner progress or production hosting.

Current production remains a React/Vite PWA hosted on GitHub Pages with local browser persistence as the authoritative runtime persistence path. Firebase currently provides client configuration, Google authentication plumbing, a named Firestore database handle, a generic document helper and checked-in Firestore rules. The Firestore helper is not wired into `AppStore`, so no learning state is currently uploaded, downloaded, reconciled or restored from Firestore.

This document describes the implementation that exists. It is not a Firebase setup tutorial and does not treat repository configuration as proof of remote Firebase-console state.

## Responsibility boundary

```text
React UI
  |
  | Profile only
  v
src/react/useAuth.ts
  |
  v
src/infrastructure/firebase.ts
  |-- Firebase Auth: Google popup sign-in, auth-state observation, sign-out
  `-- Firestore: named database `atlas`

Learning sessions
  |
  v
src/state/AppStore
  |
  v
local persistence adapters
  |-- Flags progress + attempts
  |-- Locations progress + attempts
  |-- Outlines progress + attempts
  |-- Neighbours progress + attempts
  |-- earned achievements
  `-- region/domain perfect-run streaks

src/infrastructure/firestore-sync.ts
  `-- generic get/set helper exists, but has no production caller
```

Firebase must remain an infrastructure concern. Domain rules, evidence, mastery, routing, geography and React presentation do not depend on Firestore APIs.

## Firebase project and client configuration

The repository selects Firebase project `atlas-3c48a` in `.firebaserc`.

`src/infrastructure/firebase.ts` embeds the ordinary Firebase Web application configuration and initialises:

- one Firebase application;
- Firebase Auth;
- Firestore database `atlas` rather than `(default)`.

The browser Firebase Web configuration is intentionally client-visible. Those identifiers are not an access-control boundary and must not be treated as secrets. Access control belongs to Firebase Auth, Firestore Security Rules and any future server-side policy.

Repository state does **not** prove that the corresponding remote project settings are currently deployed or enabled. Provider enablement, authorised domains, deployed Firestore rules and other console-side settings require explicit verification under #106/#107.

## Authentication

### Shipped client behaviour

`src/react/useAuth.ts` observes Firebase Auth state and exposes Google sign-in and sign-out to the React Profile screen.

The Profile screen currently supports:

- signed-out state;
- Google popup sign-in;
- signed-in display name, email and avatar where supplied by the provider;
- sign-out;
- a generic sign-in failure message.

Authentication is optional for learning. `AppStore` is constructed and local progress is loaded independently of Auth, so a learner can use Atlas while signed out.

### Incomplete account lifecycle

Current main does not implement:

- account deletion;
- deletion of Firestore learner data;
- an anonymous-account upgrade path;
- a documented retention policy for Firebase-backed data;
- a documented relationship between local data and account deletion;
- a production sync lifecycle tied to sign-in/sign-out.

The current Profile copy says signing in saves progress to the account. That describes the intended feature, not current behaviour, because Firestore sync is not connected to application state.

## Local persistence is the current source of truth

The production learning path remains local-first and, today, local-only.

`AppStore` loads and persists state through the existing local adapters:

| State | Stable local namespace |
| --- | --- |
| Flags progress | `flag-atlas:progress:v1` |
| Flags attempts | `flag-atlas:attempts:v1` |
| Locations progress | `flag-atlas:location-progress:v1` |
| Locations attempts | `flag-atlas:location-attempts:v1` |
| Outlines progress | `flag-atlas:outline-progress:v1` |
| Outlines attempts | `flag-atlas:outline-attempts:v1` |
| Neighbours progress | `flag-atlas:neighbor-progress:v1` |
| Neighbours attempts | `flag-atlas:neighbor-attempts:v1` |
| Earned achievements | `flag-atlas:earned-achievements:v1` |
| Perfect-run streaks | `flag-atlas:region-domain-perfect-run-streaks:v1` |

The four progress ledgers keep their stable namespace suffix while their payloads have their own schema/migration boundary. Current ledger loaders accept version 1 or 2 payloads, sanitise records and produce version 2 in-memory state. Achievement and perfect-run state have their own versioned migration/sanitisation boundaries.

Attempt logs are local arrays, capped at 2,000 entries and written on a short debounce with page-hide flushing.

These existing loaders/sanitisers remain the trust boundary for persisted learner data. Future Firestore data must not bypass them merely because it came from an authenticated account.

## Firestore data model

`src/infrastructure/firestore-sync.ts` defines the intended document path:

```text
users/{uid}/state/{stateKey}
```

and an allow-list matching the ten stable local namespaces above.

Each helper write currently proposes this envelope:

```text
{
  data: <opaque state>,
  schemaVersion: 1,
  updatedAt: server timestamp
}
```

`saveState()` performs one `setDoc`; `loadState()` performs one `getDoc`. Both convert Firebase errors to `false`/`null` rather than throwing to callers.

### What actually syncs

**Nothing on current main.**

No production module calls `saveState()` or `loadState()`. `AppStore` does not import the Firestore helper, and its learning/update paths continue to use only the local persistence adapters.

The helper therefore proves that a Firestore boundary was started; it does not prove cloud backup, cross-device restore, write retry, conflict handling or migration/backfill.

## Security boundary

`firestore.rules` is scoped to `users/{uid}/state/{stateKey}` and currently requires:

- an authenticated request;
- the path UID to match the authenticated UID;
- the authenticated UID to equal one specifically allow-listed account;
- a known state key;
- exactly `data`, `schemaVersion` and `updatedAt` on create/update;
- positive integer schema version;
- a recent timestamp;
- `data` to be a map with a bounded top-level key count.

This is deliberately narrower than "any signed-in Google user" and is a meaningful least-privilege boundary for the present solo-use intent. It also creates a product mismatch: the Profile screen permits any Google account to authenticate, while the checked-in rules permit Firestore access only for the allow-listed account.

There is also a schema mismatch to resolve before attempts can be mirrored directly: local attempt histories are arrays, while the checked-in rules require `data` to be a map. #106 must either define an explicit attempt envelope/schema or intentionally exclude attempt histories from cloud state.

The presence of `firestore.rules` does not prove that those exact rules are deployed. Current main also has no Firebase Emulator Suite/rules-unit-testing configuration or tests. Rule deployment and rule behaviour remain verification work under #106.

## Sync, queueing and conflict behaviour

Current main has no application-level cloud synchronisation protocol.

Specifically, it does not currently define or implement:

- first-sign-in upload/backfill of existing local data;
- cloud-to-local restore;
- a persistent cloud write queue;
- retry scheduling after Firestore failures;
- conflict resolution between divergent devices;
- merge semantics for achievements or perfect-run streaks;
- attempt-log reconciliation;
- deletion propagation;
- remote schema migration beyond the unused helper's envelope version.

Firebase SDK internals must not be confused with an Atlas application contract for these behaviours. #106 owns defining and verifying the product-level semantics.

## Degraded and offline behaviour

### Shipped local behaviour

Learning does not depend on Firebase. Quiz updates are applied to in-memory state and local persistence directly. If Firebase is unavailable while the learner is signed out—or because the unused Firestore helper never runs—the learning loop continues normally.

The existing storage guards also expose when browser local storage itself is unavailable, allowing the UI to warn that progress will be lost after the tab closes.

### Incomplete cloud behaviour

Because cloud sync is not connected, Atlas has no meaningful cloud-offline queue, reconnect, conflict or recovery behaviour to validate yet. The Firestore helper merely converts individual failures to `false`/`null`.

Once #106 wires cloud state, the preservation contract is:

1. update in-memory/local learning state immediately;
2. never require network availability to start or complete a learning session;
3. reconcile cloud state asynchronously and deterministically;
4. never allow a failed cloud request to regress valid local progress silently.

## PWA and service-worker interaction

The service worker is generated from `src/sw.ts` through Workbox InjectManifest.

Current policy includes:

- generated shell precaching;
- navigation fallback to precached `index.html`;
- network-first same-origin runtime requests;
- cache-first FlagCDN assets;
- lazy geography runtime caching after first use;
- old Atlas cache cleanup and immediate update takeover.

The React application registers `./sw.js`; the manifest uses relative scope and `./#/` as its start URL. Firebase Auth/Firestore network requests are not intentionally cached by Atlas's service-worker routes.

Generic production-browser offline/update evidence belongs to #93 and #101. Physical Pixel/iPhone/installed-PWA evidence belongs to #71. #106/#107 should add only Firebase-specific evidence such as cloud-service failure while local learning remains usable and service-worker/Auth behaviour on the Firebase Hosting origin.

## Hosting

### Current production host

GitHub Pages is the verified production host. `.github/workflows/pages.yml` deploys a Node 22 Vite build after successful main CI. The current-main CI and Pages runs for `fb60ccf8c5475b9c932cde0a30c46eca40ab1c01` both completed successfully during this reconciliation.

### Firebase Hosting status

Firebase Hosting is not configured in `firebase.json`; there is no checked-in Hosting deployment workflow, cutover procedure or rollback procedure. Repository evidence therefore does not show Firebase Hosting as a current deployment target.

The Vite build is already host-portable:

- `base: './'` produces relative asset URLs;
- service-worker registration is relative;
- manifest scope/start URLs are relative;
- the typed router already uses hash URLs.

Hash routing should remain the #46 preservation boundary. Fragments are not sent to the host, so moving the same static artifact to Firebase Hosting does not require a History-path migration. Clean paths are a separate routing/product decision, not a Hosting prerequisite.

#107 owns Firebase Hosting configuration, preview/deployment, Firebase-origin verification, production cutover and rollback.

## Relationship to #100

Current `npm run build` appends the temporary `tsconfig.verify.json` compatibility emit to deployable `dist/`. #100 owns removing/narrowing that verifier-only output; the current artifact remains valid but includes approximately 6.78 MB of compatibility modules, including 16 unreferenced compiled legacy `ui/views/*.js` files.

Firebase Hosting configuration and preview work can use that same valid `dist/` independently. Production Hosting cutover should normally follow #100 so Atlas does not deliberately establish a new production target around known temporary deployment output and then immediately re-baseline artifact/cache evidence.

This is a cutover-sequencing relationship, not a reason to make #107 implement #100.

## Indexes

No `firestore.indexes.json` exists. The current helper addresses exact document paths with `getDoc`/`setDoc` and therefore does not require a custom composite index.

The old #46 blanket requirement to add indexes is superseded for the current exact-document model. If #106 introduces queries that require indexes, those indexes should be added because of that concrete query design rather than as ceremonial Firebase setup.

## Privacy and retention

Current main has no durable Firebase privacy/data-retention/account-deletion documentation. Before cloud backup can be considered complete, Atlas must document at minimum:

- which learner state is uploaded;
- what identity data Firebase Auth exposes to the application;
- how long cloud learner state is retained;
- what sign-out does and does not delete;
- how account/cloud-data deletion works;
- what happens to local browser data after account deletion;
- whether any allow-list or single-user restriction remains part of the product.

#106 owns implementing and verifying those account/data semantics. This documentation branch does not change Auth, rules or stored data.

## Current completion summary

| Area | Current state |
| --- | --- |
| Firebase SDK + app initialisation | Shipped |
| Project/client configuration in repository | Shipped; remote console state not verified |
| Google Auth client integration | Partially shipped |
| Account deletion/privacy lifecycle | Remaining |
| Firestore handle + generic get/set helper | Shipped as infrastructure only |
| Actual learner-state cloud sync | Remaining; zero production callers today |
| Local-first persistence | Shipped |
| Cloud queue/retry/conflict/backfill | Remaining |
| Checked-in least-privilege rules | Partially shipped; deployment/tests not verified |
| Emulator/rules tests | Remaining |
| Custom Firestore indexes | Not required by current exact-document design |
| Firebase Hosting | Remaining |
| GitHub Pages hosting | Shipped and verified |
| Hash routing | Shipped and retained |
| Clean History paths | Superseded as a #46 requirement |
| Generic Workbox PWA integration | Shipped; runtime evidence continues in #93/#101 |

Issue #46 remains open until #106 and #107, plus their required Firebase-specific verification, satisfy the reconciled closeout criteria.