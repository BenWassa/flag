# Issue #107 — Firebase Hosting acceptance

**Status:** acceptance closeout in progress  
**Parent:** #46  
**Primary host:** GitHub Pages  
**Secondary host:** `https://atlas-3c48a.web.app/`

## Final architecture decision

Atlas keeps GitHub Pages as the declared primary production host and Firebase Hosting as an automatically deployed, live secondary target. There is no current product or operations reason to migrate the canonical public URL merely to close the Firebase programme.

The same tested Vite `dist/` remains host-portable through relative assets, relative PWA scope and typed hash routing. History routing is not part of this issue.

## Shipped deployment path

After successful `main` CI, `.github/workflows/firebase-deploy.yml`:

1. checks out the exact successful `main` SHA;
2. builds under Node 22;
3. deploys `dist/` to Firebase Hosting project/site `atlas-3c48a`;
4. deploys the checked-in `firestore.rules` to named database `atlas`;
5. installs Chromium and executes `tests/browser/firebase-hosting.spec.ts` against the live Firebase origin.

The production workflow emits the concrete Firebase Hosting version identifier for every release.

## Acceptance matrix

The live-origin matrix verifies:

- root load;
- typed hash deep-link load and refresh;
- relative JS/CSS assets served from the Firebase origin;
- manifest name/language/start URL/scope;
- service-worker registration and control;
- lazy Africa geography loading;
- cached offline revisit of already-loaded geography;
- Google provider popup reachability from the Firebase origin without an unauthorised-domain failure;
- local Flags learning while Firebase service requests are deliberately blocked.

## Failures found during acceptance

The matrix did useful work before closeout rather than being weakened to pass:

1. The first persisted failure was a Playwright test-context defect: a Node-side assertion used `location.origin`, where `location` is undefined. PR #132 changed the comparison to the configured Firebase base origin while preserving the same-origin requirement.
2. The next run passed the Hosting/PWA and Google provider-popup tests, then exposed stale selectors in the degraded-service assertion. The production React quiz renders `.quiz-shell`, an `Answer choices` region and `.answer-button`; the test still expected retired `.quiz-question` / `.answer-grid` markup. PR #134 updated only those selectors while keeping Firebase traffic blocked.

This document remains in `docs/open/` until an exact post-merge `main` SHA passes the full live-origin matrix.

## Rollback

Rollback is intentionally non-disruptive:

- GitHub Pages remains the independently deployed primary/fallback origin throughout;
- revert the offending `main` change to the known-good repository state;
- ordinary Node 22 CI rebuilds that state and the post-CI workflows redeploy GitHub Pages plus Firebase Hosting/rules;
- Hosting deploy logs retain concrete Firebase version IDs as an additional remote release trail.

The closeout does not intentionally roll a healthy live site backwards merely to demonstrate rollback. The tested mechanism is the same version-controlled revert/rebuild/redeploy path used for every production release, while the primary host remains available independently.

## Closeout gate

Move this record to `docs/closed/` and close #107 only after one exact `main` SHA has green evidence for:

- Node 22 CI / `npm test`;
- Firebase Hosting deployment;
- Firestore rules deployment;
- all three live Firebase-origin Playwright tests;
- GitHub Pages remaining green as primary.
