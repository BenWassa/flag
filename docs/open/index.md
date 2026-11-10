# Open Work

GitHub Issues are the canonical task tracker. Closed implementation/design records belong in `docs/closed/` and are linked through [`../history.md`](../history.md).

## Production baseline

Spatial Atlas is the accepted/default navigation presentation. The automated hardening programme, #186/#187 Home/focus corrections, #191 automatic PWA update lifecycle, #207 Flags live-activity viewport ownership, #196 Home chooser material correction and #216 CI restructuring are merged and deployed. Current `main` must preserve the typed router, learning/evidence/mastery semantics, canonical geography, offline/PWA behaviour and British English unless a future issue explicitly changes one of those contracts.

Geographic detail is progressively disclosed (#197): world navigation reads as continents, a framed continent reveals its learner-facing areas, and country boundaries appear only where the activity is about countries. Continent and area shells are derived from the canonical country geometry by cancelling shared edges — there is no second geography source — and each selectable scope is named on the Earth by a real DOM control. See [`../architecture/spatial-atlas.md`](../architecture/spatial-atlas.md) and `DESIGN.md`.

The centred Home chooser now uses ordinary opaque cool near-white Atlas chrome rather than a translucent material, while the full globe remains the dominant saturated object. Live Flags questions yield the Spatial stage completely after geography-led scope selection.

Authoritative PWA update architecture:

- [`../architecture/pwa-update-lifecycle.md`](../architecture/pwa-update-lifecycle.md)

Routine Atlas releases now use application-owned update discovery/adoption. The learner should not need manual refresh/cache-clearing/reinstallation rituals, and active ephemeral learning work must not be discarded merely to update the shell.

Permanent CI is also now settled: `.github/workflows/ci.yml` produces the single tested `flag-atlas-dist`, then reusable exact-production desktop Chromium, mobile Chromium and PWA jobs run independently in parallel against that same verified artifact. GitHub Pages and Firebase deploy only the successful tested-main artifact.

## Remaining engineering gate — #212

[#212](https://github.com/BenWassa/flag/issues/212) / [PR #213](https://github.com/BenWassa/flag/pull/213) is the only remaining implementation stream.

It reconciles the broad Playwright suite with the current post-#197–#202, #207 and #196 product contracts and carries the still-unmerged #200 stationary edge-tap versus platform Back-gesture repair. The branch predates the current CI architecture, so #218's parallel exact-production jobs are authoritative during its final sync; temporary #212 broad-evidence workflow steps must not become permanent infrastructure.

Do not begin the final all-programme physical-device pass while #212 can still alter gesture evidence.

## Final physical-device gate — #71

[#71](https://github.com/BenWassa/flag/issues/71) remains the final owner-run product gate after #212 is merged/deployed or explicitly removed from its dependency set.

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
- current Home material and Flags full-viewport composition;
- retained gesture, safe-area, orientation, navigation and offline behaviour;
- the stationary edge-tap/platform Back boundary once #212 lands.

Historical implementation/specification evidence retained for context:

- [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
- [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md)

Do not derive new implementation work from stale pre-Spatial route or renderer assumptions in those historical records. Do not claim physical-device evidence from Playwright, CDP or browser emulation.

## Working rules

- Finish #212 before treating #71 as the final all-programme physical gate.
- Test #71 only against the exact deployed `main` SHA recorded in the issue.
- Record device/OS/browser or PWA context, orientation, scenarios and PASS/FAIL evidence.
- If a material physical-device defect appears, keep #71 as validation owner and split non-trivial implementation into a focused issue.
- Close #71 only after physical Android, physical iPhone and installed-PWA evidence is complete and any material defects are resolved/revalidated or separately tracked.
