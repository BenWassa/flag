# Open Work

GitHub Issues are the canonical task tracker. Closed implementation/design records belong in `docs/closed/` and are linked through [`../history.md`](../history.md).

## Production baseline

Spatial Atlas is the accepted/default navigation presentation. The automated hardening programme, #186/#187 Home/focus corrections and #191 automatic PWA update lifecycle are merged and deployed. Current `main` must preserve the typed router, learning/evidence/mastery semantics, canonical geography, offline/PWA behaviour and British English unless a future issue explicitly changes one of those contracts.

Authoritative PWA update architecture:

- [`../architecture/pwa-update-lifecycle.md`](../architecture/pwa-update-lifecycle.md)

Routine Atlas releases now use application-owned update discovery/adoption. The learner should not need manual refresh/cache-clearing/reinstallation rituals, and active ephemeral learning work must not be discarded merely to update the shell.

## Final physical-device gate — #71

[#71](https://github.com/BenWassa/flag/issues/71) is the remaining product gate.

Its final pass must use the exact deployed production SHA recorded in the GitHub issue. The issue, rather than this file, is the canonical SHA pin so documentation commits do not invalidate their own recorded build identity.

Authoritative active checklist:

- [`issue-71-physical-device-gate.md`](issue-71-physical-device-gate.md)

The final physical pass covers:

- physical Android Chrome;
- physical iPhone/iOS Safari;
- installed-PWA behaviour;
- automatic A → B version discovery/adoption;
- active-round update deferral;
- offline → online update discovery;
- retained gesture, safe-area, orientation, navigation and offline behaviour.

Historical implementation/specification evidence retained for context:

- [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
- [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md)

Do not derive new implementation work from stale pre-Spatial route or renderer assumptions in those historical records. Do not claim physical-device evidence from Playwright, CDP or browser emulation.

## Working rules

- Test #71 only against the exact deployed `main` SHA recorded in the issue.
- Record device/OS/browser or PWA context, orientation, scenarios and PASS/FAIL evidence.
- If a material physical-device defect appears, keep #71 as validation owner and split non-trivial implementation into a focused issue.
- Close #71 only after physical Android, physical iPhone and installed-PWA evidence is complete and any material defects are resolved/revalidated or separately tracked.
