# Issue 71 — Final physical-device gate

This is the authoritative active checklist for Issue #71. Earlier #71 documents are retained as implementation/history evidence and must not be used as the current route or architecture specification.

## Status

**ACTIVE — #191 is implemented, merged and deployed.**

The automatic PWA update lifecycle shipped in PR #193. Its runtime implementation baseline is:

- implementation merge: `39a7a07246540df5b8cdc80576700bb9a009f0dd`
- merged-main verification: success
- GitHub Pages deployment: success
- Firebase deployment/live verification: success
- production URL: https://benwassa.github.io/flag/

The exact production SHA to use for the physical gate is recorded in GitHub Issue #71. That issue is intentionally the canonical SHA pin: embedding the final housekeeping SHA in this file would itself create another build SHA and make the value self-invalidating.

Before a physical run, confirm the SHA recorded in #71 is still current `main` and has green CI, GitHub Pages and Firebase deployment evidence.

## Rules

- Physical hardware is required. Playwright/device emulation does not satisfy this gate.
- Record device model, OS version, browser/version or installed-PWA context, production SHA, orientation and result.
- Do not reopen the old pre-Spatial Home → Continent → Region → Country model.
- Spatial Atlas is the production navigation presentation; typed hash routing/browser history remain authoritative.
- `docs/architecture/pwa-update-lifecycle.md` is authoritative for service-worker discovery/adoption; do not substitute manual-refresh/cache-clear rituals during update scenarios.
- If a material defect appears, keep #71 as validation owner and split non-trivial implementation into a focused issue.

## A. Pixel-class Android / Chrome

Run in portrait and short landscape.

- Open production from a fresh browser tab and navigate Spatial Home → domain → continent → region → deliberate Play/Learn entry.
- Confirm fresh boot has no unexplained blue focus outline.
- Confirm the full-globe Home composition, centred mode chooser, four mode choices and touch ergonomics remain readable/usable.
- Confirm normal browser/system Back and Forward behaviour from nested routes; there must be no competing Atlas route stack.
- On the Spatial globe, distinguish rotate/drag from tap/select. Repeated deliberate taps must focus/select rather than being mistaken for rotation.
- Pinch/zoom and pan where supported without unreachable controls or accidental navigation.
- Exercise representative small targets, including Singapore, Maldives, Bahrain and Brunei where available in the chosen scope.
- Locations: pan/pinch, wrong target, correct target, feedback dwell and subsequent question interaction.
- Repeat the relevant Locations feedback with Android reduced motion enabled; no stale wrong-state colour may remain.
- Neighbours: open input, filter suggestions, choose a suggestion, dismiss/reopen the software keyboard and continue the round.
- Confirm system gesture areas, top/bottom safe areas and short-landscape controls remain usable.
- Reload a nested/activity route and confirm the app recovers through the existing hash-routing/fallback contract.

## B. Physical iPhone / Safari

Run in portrait and short landscape.

- Navigate Spatial Home → domain → continent → region → Play/Learn.
- Confirm fresh boot has no unexplained focus ring and the full-globe Home chooser remains readable/usable.
- Exercise Safari edge-swipe/back and browser Back/Forward from nested routes; confirm no duplicate Atlas navigation gesture.
- Rotate/tap the Spatial globe and verify intentional taps remain distinguishable from drags.
- Exercise representative small-country targets.
- Locations and Neighbours: map manipulation, target taps, suggestion input and software keyboard.
- Expand/collapse Safari browser chrome and confirm important controls never become unreachable.
- Check notch/Dynamic Island and home-indicator clearance as applicable.
- Reload a nested/activity route and confirm correct recovery.
- With iOS reduced motion enabled, verify the affected Locations wrong-answer feedback resolves to the correct neutral resting state.

## C. Installed PWA — physical mobile

Install the production build pinned in #71 on at least one physical mobile platform; iOS is preferred.

### Normal standalone use

- Launch standalone and navigate through Spatial scope selection into a round.
- Confirm standalone safe areas/home-indicator clearance.
- Confirm platform-appropriate Back behaviour and absence of a competing custom route stack.
- Rotate/tap the globe; pan/pinch/tap Locations; use Neighbours with the software keyboard.
- Confirm overscroll/pull-to-refresh does not unexpectedly discard an active round.
- After warming the current service-worker cache online, revisit already-cached content offline where the shipped policy supports it.
- Relaunch and return online; progress/session state must not be corrupted.

### Automatic deployed-version update

Record the exact A and B production SHAs/build identities used for this scenario. Use a real production deployment transition or another controlled same-origin method that exercises the shipped production lifecycle; do not satisfy this item by manually refreshing, calling browser devtools update commands, clearing storage or reinstalling.

- Begin with installed Atlas running production build A.
- Make/deploy production build B through the ordinary release path.
- With a network connection, launch or foreground the installed PWA without pull-to-refresh or manual reload.
- Confirm Atlas discovers B automatically and converges onto B at a safe boundary.
- Confirm exactly one controlled adoption/reload occurs rather than a reload loop.
- Confirm the running build identity/recorded deployment proves B is actually active rather than relying on visual guesswork.

### Active-round update deferral

- Begin a real learning round on A.
- Allow B to become available while that round remains active.
- Confirm update discovery/download does not destroy the round or current text entry.
- Complete or deliberately exit to the documented safe boundary.
- Confirm B then applies automatically without requiring a refresh gesture or update button.
- Confirm durable progress is intact after adoption.

### Offline → online update

- Run cached A with the device genuinely offline.
- Confirm the supported cached Atlas experience remains usable.
- Make B available while the client remains offline.
- Restore connectivity without clearing/reinstalling/reloading manually.
- Confirm Atlas automatically checks for B and safely adopts it according to the shipped update lifecycle.

## D. Renderer/WebGL fallback

Only if the real device provides a practical, non-destructive way to reach the conventional renderer/WebGL fallback:

- confirm fallback navigation remains usable and semantically equivalent;
- confirm earned Mastery/completion semantics remain available;
- confirm the fallback does not create a second navigation model.

Do not block the physical gate solely because the device offers no legitimate way to force this fallback.

## Evidence table

Record one row per meaningful scenario or grouped scenario set.

| Target | Device | OS | Browser/PWA | Production SHA(s) | Orientation | Scenario | Result | Notes / reproduction |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android |  |  | Chrome |  | portrait | Spatial navigation / Back | PASS / FAIL |  |
| Android |  |  | Chrome |  | short landscape | globe / Locations / Neighbours | PASS / FAIL |  |
| iPhone |  |  | Safari |  | portrait | Spatial navigation / edge Back | PASS / FAIL |  |
| iPhone |  |  | Safari |  | short landscape | globe / Locations / Neighbours | PASS / FAIL |  |
| Installed PWA |  |  | standalone |  | portrait + landscape | safe areas / offline revisit / relaunch | PASS / FAIL |  |
| Installed PWA update |  |  | standalone | A → B | applicable | automatic update / safe adoption | PASS / FAIL |  |
| Installed PWA update |  |  | standalone | A → B | applicable | active-round deferral | PASS / FAIL |  |
| Installed PWA update |  |  | standalone | A → B | applicable | offline → online discovery | PASS / FAIL |  |

## Exit gate

Close #71 only when:

- GitHub Issue #71 records the exact current production SHA used for the physical run;
- that SHA is green on merged-main CI, GitHub Pages and Firebase/live-origin deployment;
- physical Android Chrome evidence is recorded;
- physical iPhone Safari evidence is recorded;
- installed-PWA physical evidence is recorded, including automatic A → B adoption, active-round deferral and offline → online discovery;
- no routine manual refresh/cache-clear/reinstall step was required to receive B;
- material defects are resolved/revalidated or separately tracked.
