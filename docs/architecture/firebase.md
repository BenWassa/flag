# Firebase architecture

**Status:** implemented on Atlas 1.1.0  
**Tracking:** #46, #106, #107  
**Primary production host:** GitHub Pages  
**Secondary production host:** `https://atlas-3c48a.web.app/`

## Architecture boundary

Atlas remains a local-first React/Vite PWA. Firebase is an optional infrastructure layer for account-backed backup/restore and a secondary static deployment target; it does not own learning rules, routing, cartography, scoring, evidence or Mastery qualification.

Learning state is still updated locally first. A Firebase outage, sign-out or unauthorised account cannot block a learning session.

```text
React learning UI
  |
  v
AppStore + local persistence adapters  <--- immediate learner state
  |
  | learner-storage write event
  v
cloud-sync-service (optional, asynchronous)
  |
  +--> migration/sanitisation + deterministic reconciliation
  |
  v
Firestore exact documents
users/{uid}/state/{stateKey}
```

## Firebase project and authentication

The repository selects Firebase project `atlas-3c48a`; the client uses the named Firestore database `atlas` and Google popup authentication.

Cloud backup remains deliberately restricted to the single allow-listed owner UID encoded consistently in `cloud-sync-service.ts` and `firestore.rules`. Other Google accounts may authenticate, but the Profile surface reports that cloud backup is unavailable and the sync service does not attempt Firestore access for them.

Authentication is optional. Signed-out learning remains fully local.

## Canonical cloud data contract

Only five durable learner states sync:

| Cloud state | Stable key |
| --- | --- |
| Flags progress | `flag-atlas:progress:v1` |
| Locations progress | `flag-atlas:location-progress:v1` |
| Outlines progress | `flag-atlas:outline-progress:v1` |
| Neighbours progress | `flag-atlas:neighbor-progress:v1` |
| Earned achievements | `flag-atlas:earned-achievements:v1` |

The following remain intentionally device-local:

- Flags, Locations, Outlines and Neighbours attempt histories;
- `flag-atlas:region-domain-perfect-run-streaks:v1`.

Attempt histories are append-style diagnostic/session history without a global event identity. Merging arrays across independently advanced devices would duplicate or discard events, and the old array payload also conflicted with the Firestore map-envelope rules.

Perfect-run streaks are resettable qualification state for #108's consecutive-perfect region Mastery semantics. Naively unioning or maxing them across devices could award Mastery incorrectly. Earned achievements themselves are monotonic and therefore safe to union in the cloud.

No compatibility path pretends that ten learner namespaces sync.

## Remote trust boundary and reconciliation

Firestore data is never trusted merely because it came from an authenticated account. Remote payloads pass the same existing migration/sanitisation functions as local persisted state before reconciliation.

For each progress ledger, reconciliation is deterministic per country. It preserves valid learned evidence from independently advanced copies rather than applying whole-document last-write-wins. Durable counters and evidence are merged monotonically; scheduler/current state and timestamps are selected without regressing stronger/newer valid evidence; confusion evidence is preserved. Domain-specific sanitisation remains owned by the existing persistence adapters.

Earned achievements reconcile monotonically by set union / boolean OR. A device cannot remove an already-earned cloud or local achievement through reconciliation.

If a remote document is missing, the valid local state becomes the merged state and is backfilled. If remote data is malformed or cannot be loaded safely, Atlas enters a degraded cloud state and leaves local learner data untouched.

When reconciliation changes local persisted state, Atlas emits one restore signal and reconstructs `AppStore` through the ordinary local loaders. The cloud path therefore does not bypass migration boundaries or create a second application-state implementation.

## First sign-in and cross-context restore

On an authorised sign-in the service reconciles all five states, writes the merged result locally, then persists the merged result to Firestore.

This preserves progress that existed before the learner first enabled cloud backup. The cross-context test covers a legacy local payload being migrated/backfilled, a second clean local persistence context signing in with the same UID, restoration through the normal sanitisation path, and continued local use after cloud writes subsequently become unavailable.

## Write, retry and offline behaviour

Local persistence is synchronous with the learning flow; cloud persistence is not.

Cloud writes are:

- triggered only for the five canonical learner-state keys;
- debounced for 750 ms;
- recorded in persisted pending metadata (`flag-atlas:cloud-sync-pending:v1`);
- idempotent exact-document `setDoc` writes;
- retried after failure and on browser `online` recovery;
- guarded by an Auth generation token so stale reads/writes from a previous user/session cannot mutate current sync state.

A duplicate learner-write notification cannot create duplicate concurrent writes. Pending metadata survives reload for the same authorised UID. A failed cloud read or write produces `degraded`; learning and local persistence continue.

The learner-storage event hook is best-effort by design. If DOM event APIs are unavailable, an already-successful local write remains successful; cloud notification can never turn local persistence into a reported failure.

## Account lifecycle

### Sign out

Sign-out stops cloud reconciliation/writes but does not erase local progress.

### Delete cloud copy

Atlas suspends sync, deletes all five cloud documents, then signs out. Local browser progress remains. If Firestore deletion fails, Atlas reports failure and does not claim deletion.

### Delete account

Atlas first suspends writes and deletes the five cloud documents, then requests Firebase Auth account deletion. Local browser progress remains in every case.

If Firestore deletion fails, Auth deletion is not attempted. If cloud deletion succeeds but Auth deletion fails (including `auth/requires-recent-login`), sync remains suspended so a later local write cannot recreate the deleted cloud data. Atlas reports the partial result precisely and signs out where possible rather than displaying false success.

## Profile states

The learner-facing Profile surface deliberately exposes only useful states:

- signed out;
- checking sign-in / reconciling;
- saving;
- synced;
- degraded/offline;
- unauthorised;
- deletion confirmation and failure.

It does not expose Firebase internals. Degraded and unauthorised copy explicitly states that progress remains saved on the device. Destructive confirmation defaults focus to the safe Cancel action; long account/error text wraps on narrow screens; actual failures use alert semantics.

## Firestore document and rules contract

Path:

```text
users/{uid}/state/{stateKey}
```

Envelope:

```text
{
  data: <validated state payload>,
  schemaVersion: 1,
  updatedAt: <server timestamp>
}
```

`firestore.rules` permits only:

- authenticated requests from the single allow-listed UID;
- the authenticated user's own path;
- the five canonical state keys;
- schema version 1 envelopes with exactly `data`, `schemaVersion`, `updatedAt`;
- recent timestamps;
- versioned progress or earned-achievement payload shapes within documented bounds.

Unknown keys, all attempt-history keys, perfect-run streaks, malformed envelopes and invalid payload versions/types are rejected. Owner deletion is allowed only for known cloud-state keys.

The Firebase Emulator Suite executes the checked-in `firestore.rules` itself. CI provisions Java 21 because current `firebase-tools` requires it; Atlas application/test execution remains Node 22. The suite covers all five valid writes plus unauthenticated, non-allowlisted, cross-user read/write/delete, excluded/unknown-key, malformed-envelope, invalid-schema/payload and owner-delete cases.

No Firestore composite index is required because the implementation uses exact-document reads/writes/deletes rather than queries.

## Development sandbox

Development sandbox builds remain isolated from production account services and production learner storage. Cloud sync starts only when remote account services are enabled. The Firebase feature does not alter the established `flag-atlas:dev-sandbox:*` separation.

## PWA and Hosting

GitHub Pages remains Atlas's declared primary production host. Firebase Hosting is an automatically deployed live secondary target using the same tested production `dist/`.

After successful `main` CI, the Firebase deployment workflow checks out that exact SHA, builds under Node 22, deploys Hosting and checked-in Firestore rules, then runs live-origin Playwright acceptance. Deployment concurrency is scoped to the actual deploy job so skipped PR-triggered workflow runs cannot cancel a valid main deployment.

#107 final acceptance used main SHA `13b63871d4e48caab46b64ce6562cc52ca27b996`:

- main CI `33081243731` — success;
- GitHub Pages `33081333037` — success;
- Firebase `33081333094` — success;
- Hosting version `6eff68d4478619d3`;
- Firestore rules compiled/released;
- live Firebase-origin Playwright matrix — 3/3 passed.

The live matrix covers root/static assets, hash deep-link + refresh, manifest, service-worker control, lazy Africa geography, cached offline revisit, Google provider-popup reachability without an unauthorised-domain error, and local learning with Firebase service requests blocked.

## Hosting rollback

Firebase Hosting remains secondary, so GitHub Pages is independently available during a bad Firebase release. The normal rollback is to revert the offending `main` change and allow Node 22 CI plus the post-CI workflows to rebuild/redeploy that known-good state. Hosting logs retain concrete remote version IDs as an additional release trail.

No canonical-host migration or History-routing change is required by Firebase.

## Verification ownership

Firebase-specific verification belongs to #106/#107. Generic PWA/browser validation remains with the existing platform tests, and physical-device claims remain separate. Repository configuration is not treated as proof of unobserved Firebase Console state; the programme records only remote behaviour that was actually exercised by deployment/browser evidence.
