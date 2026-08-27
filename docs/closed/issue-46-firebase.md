# Issue #46 — Firebase programme closeout

**Status:** completed  
**Completed:** 2026-08-27  
**Cloud progress:** #106 / PR #133  
**Hosting:** #107  
**Durable architecture:** [`../architecture/firebase.md`](../architecture/firebase.md)

## Final production truth

Atlas remains a local-first React/Vite PWA. GitHub Pages is the declared primary production host; Firebase Hosting at `https://atlas-3c48a.web.app/` is a verified live secondary target. Firebase provides optional Google-authenticated cloud backup/restore and does not own learning rules, scoring, routing, cartography or Mastery qualification.

PR #133 merged the account-backed cloud-progress implementation on main at `834675b578db4137f1ab60261beb78e6f8f058d9`.

The canonical cloud contract is intentionally narrow. Atlas syncs exactly:

- Flags progress;
- Locations progress;
- Outlines progress;
- Neighbours progress;
- earned achievements.

Attempt histories and perfect-run streaks remain device-local. Attempt histories do not have a safe global event identity; perfect-run streaks are resettable consecutive-run qualification state whose naïve cross-device merge could award Mastery incorrectly. Earned achievements themselves remain monotonic and do sync.

## Cloud behaviour and account lifecycle

The completed implementation preserves immediate local writes and asynchronous cloud reconciliation. Remote payloads pass the existing migration/sanitisation boundaries. Progress ledgers reconcile deterministically per country rather than by whole-document last-write-wins, and earned achievements merge monotonically.

Failed cloud writes persist pending metadata and retry after failure/reconnect. Auth-generation guards prevent stale reads or writes from a previous session from mutating current sync state. Firebase failure cannot block learning or turn an already-successful local persistence write into a learner-visible failure.

The current account policy remains deliberately single-UID/least-privilege. An authenticated non-allowlisted account is reported as unauthorised and the sync service does not attempt Firestore access.

Sign-out retains local progress. Deleting the cloud copy removes the five cloud documents and signs out while preserving local progress. Account deletion removes cloud data before Firebase Auth deletion. If cloud deletion fails, Auth deletion is not attempted. If cloud deletion succeeds but Auth deletion fails, including `auth/requires-recent-login`, cloud sync remains suspended so later local writes cannot recreate the deleted cloud state.

## Final acceptance evidence

Implementation PR head: `67a78e520ec4f14cbc75ba1c07ded90e25ccd984`.

PR CI run `33081880644` passed under Node 22 and Temurin Java 21, including `npm run check`, complete `npm test`, Firestore Emulator rules coverage, the exact production build/verifiers and artifact upload.

PR #133 merge/main implementation SHA: `834675b578db4137f1ab60261beb78e6f8f058d9`.

Post-merge evidence on that exact SHA:

- CI run `33115873006` — success;
- GitHub Pages run `33115983691` — success;
- Firebase deployment run `33115983941` — success;
- Firebase Hosting deployment step — success;
- checked-in Firestore rules deployment step — success;
- live Firebase-origin Chromium acceptance — success.

The merged CI production artifact is `flag-atlas-dist` artifact `9664491362`, 2,652,900 bytes, digest `sha256:ae83c785a5916f50b3037d2916b117d93ec835ca17ec05d4634265404a7d9c61`.

The live-origin suite verifies root/hash routing and refresh, relative assets, manifest/service-worker control, lazy geography and cached offline revisit, Google provider-popup reachability from the Firebase origin, and local learning while Firebase service requests are deliberately blocked.

The committed cloud-sync tests additionally cover first-sign-in backfill, same-account restore into a clean local context through normal migration/sanitisation, divergent-state reconciliation, malformed payload handling, pending-write retry/reconnect, stale Auth generation races, unauthorised accounts, sign-out retention, cloud-copy deletion, account deletion, partial-deletion failures and prevention of cloud-state recreation after a partial account-deletion failure.

Firestore Emulator coverage verifies the five permitted state keys and rejects excluded/unknown states, unauthenticated access, cross-user/nonallowlisted access and malformed envelopes/payloads.

The GitHub Actions metadata available through the repository API exposes the successful live Hosting deployment but not the concrete Hosting version identifier for this release; the workflow logs/Hosting service retain that remote version trail.

## Programme conclusion

#107 is closed and remains accepted. #106 is complete and the account-backed learner-state promise is now real, local-first and truthfully represented by the Profile surface. The checked-in Firebase architecture document is the source of truth for the five-state sync model, security boundary, retry semantics, deletion behaviour and host strategy.

No geography, scoring, routing, storage namespace or Mastery semantics were changed as part of the Firebase programme closeout.
