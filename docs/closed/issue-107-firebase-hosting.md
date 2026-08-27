# Issue #107 — Firebase Hosting acceptance

**Status:** completed  
**Completed:** 2026-08-27  
**Parent:** #46  
**Primary host:** GitHub Pages  
**Secondary host:** `https://atlas-3c48a.web.app/`

## Final decision

Atlas keeps GitHub Pages as its declared primary production host and Firebase Hosting as an automatically deployed live secondary target. No History-routing migration or canonical-host cutover was required.

After successful `main` CI, `.github/workflows/firebase-deploy.yml` checks out the exact successful main SHA, builds under Node 22, deploys `dist/` to Firebase Hosting, deploys the checked-in Firestore rules, then runs Chromium acceptance against the live Firebase origin.

## Accepted live-origin behaviour

The Firebase-origin suite verifies:

- root load plus typed hash deep-link load and refresh;
- relative JavaScript/CSS assets from the Firebase origin;
- manifest name, language, start URL and scope;
- service-worker registration/control;
- lazy Africa geography loading and cached offline revisit;
- Google provider-popup reachability without an unauthorised-domain failure;
- local Flags learning while Firebase service requests are blocked.

## Closeout evidence

The final #107 acceptance was completed before the cloud-progress merge. The programme was then re-verified after PR #133 on implementation SHA `834675b578db4137f1ab60261beb78e6f8f058d9`:

- main CI `33115873006` — success;
- GitHub Pages `33115983691` — success;
- Firebase deploy `33115983941` — success;
- Hosting deploy — success;
- Firestore rules deploy — success;
- live Firebase-origin Chromium acceptance — success.

This post-#106 run proves the accepted Hosting path remains valid with cloud progress enabled and that Firebase service failure still cannot block local learning.

## Rollback

GitHub Pages remains an independently deployed primary/fallback origin. A bad Firebase-hosted release is rolled back by reverting the offending main change to a known-good repository state and allowing normal CI and post-CI workflows to rebuild/redeploy that state. Firebase Hosting retains its own release/version trail as an additional remote rollback aid.
