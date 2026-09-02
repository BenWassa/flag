# Open Work

GitHub Issues are the canonical task tracker. Closed implementation/design records belong in `docs/closed/` and are linked through [`../history.md`](../history.md).

## Production baseline

Spatial Atlas is the accepted/default navigation presentation. The automated hardening programme through Issue #150 is complete. Current `main` must preserve the typed router, learning/evidence/mastery semantics, canonical geography, PWA behaviour and British English unless a future issue explicitly changes one of those contracts.

## Remaining gate — #71

[#71](https://github.com/BenWassa/flag/issues/71) is the sole remaining open product gate. It owns real-device Android Chrome, iPhone/iOS Safari and installed-PWA validation only.

Authoritative active checklist:

- [`issue-71-physical-device-gate.md`](issue-71-physical-device-gate.md)

Historical implementation/specification evidence retained for context:

- [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
- [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md)

Do not derive new implementation work from stale pre-Spatial route or renderer assumptions in those historical records. Do not claim physical-device evidence from Playwright, CDP or browser emulation.

## Working rules

- Test the final deployed `main` SHA recorded in Issue #71.
- Record device/OS/browser or PWA context, orientation, scenarios and PASS/FAIL evidence.
- If a material physical-device defect appears, keep #71 as validation owner and split non-trivial implementation into a focused issue.
- Close #71 only after physical Android, physical iPhone and installed-PWA evidence is complete and any material defects are resolved/revalidated or separately tracked.
