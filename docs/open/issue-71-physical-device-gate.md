# Issue 71 — Final physical-device gate

This is the authoritative active checklist for Issue #71. Earlier #71 documents are retained as implementation/history evidence and must not be used as the current route or architecture specification.

## Blocker — #191

**Do not execute the final physical-device/installed-PWA closure gate until Issue #191 is implemented, merged and deployed.**

#191 changes the service-worker update lifecycle that the installed-PWA pass must validate. The final #71 evidence must therefore be gathered against one exact post-#191 production `main` SHA, not the pre-update-lifecycle baseline.

After #191 lands:

1. repin this document and GitHub Issue #71 to the exact deployed `main` SHA;
2. record the corresponding green CI, GitHub Pages and Firebase deployment evidence;
3. execute the physical Android/iPhone/installed-PWA matrix below;
4. include the automatic A → B update scenarios in section C.

## Historical automated baseline

Automated hardening through Issue #150 was previously complete, and #186/#187 have since landed. The older baseline below is retained only as history and **must not be used for final #71 closure**:

- historical `main`: `4dce853225e5aa153e8ad3c68aac7cd86ae052e9`
- merged-main CI: `33649413270` — success
- GitHub Pages: `33649635266` — success
- Firebase deploy/live-origin acceptance: `33649635294` — success
- production URL: https://benwassa.github.io/flag/

Before a physical run, use the exact post-#191 production SHA recorded in GitHub Issue #71. Do not infer the tested SHA from an old screenshot or local checkout.

## Rules

- Physical hardware is required. Playwright/device emulation does not satisfy this gate.
- Record device model, OS version, browser/version or installed-PWA context, production SHA, orientation and result.
- Do not reopen the old pre-Spatial Home → Continent → Region → Country model.
- Spatial Atlas is the production navigation presentation; typed hash routing/browser history remain authoritative.
- #191's update architecture is authoritative for service-worker discovery/adoption; do not substitute manual-refresh/cache-clear rituals during the update scenarios.
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

Install the final post-#191 production build on at least one physical mobile platform; iOS is preferred.

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
- Complete or deliberately exit to the #191-defined safe boundary.
- Confirm B then applies automatically without requiring a refresh gesture or update button.
- Confirm durable progress is intact after adoption.

### Offline → online update

- Run cached A with the device genuinely offline.
- Confirm the supported cached Atlas experience remains usable.
- Make B available while the client remains offline.
- Restore connectivity without clearing/reinstalling/reloading manually.
- Confirm Atlas automatically checks for B and safely adopts it according to #191.

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

- #191 is implemented, merged, deployed and its exact final production SHA is recorded;
- this checklist is repinned to that exact post-#191 production baseline;
- physical Android Chrome evidence is recorded;
- physical iPhone Safari evidence is recorded;
- installed-PWA physical evidence is recorded, including automatic A → B adoption, active-round deferral and offline → online discovery;
- no routine manual refresh/cache-clear/reinstall step was required to receive B;
- material defects are resolved/revalidated or separately tracked.
