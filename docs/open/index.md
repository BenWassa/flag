# Open Work

GitHub Issues are the canonical task tracker. Closed implementation/design records belong in `docs/closed/` and are linked through [`../history.md`](../history.md).

## Production baseline

Spatial Atlas is the accepted/default navigation presentation. The automated hardening programme through Issue #150 and the subsequent #186/#187 production corrections are merged. Current `main` must preserve the typed router, learning/evidence/mastery semantics, canonical geography, offline PWA behaviour and British English unless a future issue explicitly changes one of those contracts.

## PWA update lifecycle — #191

[#191](https://github.com/BenWassa/flag/issues/191) is the next implementation gate: **Automatically discover and safely apply new Atlas PWA versions**.

Authoritative architecture:

- [`../architecture/pwa-update-lifecycle.md`](../architecture/pwa-update-lifecycle.md)

#191 owns proactive service-worker update discovery, waiting-worker/safe-boundary adoption, multi-client consistency, cache/version ownership, build identity, relevant hosting-cache policy and exact-production A → B regressions.

It must preserve offline learning and must not destroy an active ephemeral round merely to update the shell.

## Final physical-device gate — #71

[#71](https://github.com/BenWassa/flag/issues/71) remains the sole authority for real-device Android Chrome, iPhone/iOS Safari and installed-PWA physical validation, but its **final closure is blocked by #191**.

Do not spend the final installed-PWA/device gate against the pre-#191 update lifecycle. After #191 is implemented, merged and deployed green:

1. repin #71 and its checklist to the exact deployed `main` SHA;
2. physically validate automatic update discovery/adoption as part of the installed-PWA pass;
3. then complete the retained gesture, safe-area, orientation, navigation and offline matrix.

Authoritative active checklist:

- [`issue-71-physical-device-gate.md`](issue-71-physical-device-gate.md)

Historical implementation/specification evidence retained for context:

- [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
- [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md)

Do not derive new implementation work from stale pre-Spatial route or renderer assumptions in those historical records. Do not claim physical-device evidence from Playwright, CDP or browser emulation.

## Working rules

- Execute #191 before the final #71 physical gate.
- Test #71 only against the exact post-#191 deployed `main` SHA recorded in the issue/checklist.
- Record device/OS/browser or PWA context, orientation, scenarios and PASS/FAIL evidence.
- If a material physical-device defect appears, keep #71 as validation owner and split non-trivial implementation into a focused issue.
- Close #71 only after physical Android, physical iPhone and installed-PWA evidence is complete and any material defects are resolved/revalidated or separately tracked.
