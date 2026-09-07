# Issue 71 — Final physical-device gate

This is the authoritative active checklist for Issue #71. Earlier #71 documents are retained as implementation/history evidence and must not be used as the current route or architecture specification.

## Status

**DEFERRED — run the final all-programme physical pass after #212 / PR #213 is merged and deployed, or explicitly removed from this gate.**

The automatic PWA update lifecycle from #191 is implemented and deployed. Since then the production surface has also absorbed the final Spatial/Home hardening relevant to device validation:

- #197–#202 — progressive Spatial disclosure, framing/touch parity, contained Locations feedback and three-strike Locations retrieval;
- #207 — live Flags activity owns the viewport after geography-led scope selection;
- #196 — the centred Home chooser uses ordinary opaque cool near-white Atlas chrome rather than translucent glass;
- #216 — CI/deployment architecture was restructured only; it does not change learner-facing behaviour.

#212 / PR #213 remains the sole engineering dependency because it contains the still-unmerged stationary edge-tap versus platform Back-gesture repair and broad browser reconciliation.

The exact production SHA to use for the physical gate is recorded in GitHub Issue #71. That issue is intentionally the canonical SHA pin: embedding the final housekeeping SHA in this file would itself create another build SHA and make the value self-invalidating.

Before a physical run, confirm the SHA recorded in #71 is still current `main` and has green CI, GitHub Pages and Firebase deployment evidence.

## Rules

- Physical hardware is required. Playwright/device emulation does not satisfy this gate.
- Record device model, OS version, browser/version or installed-PWA context, production SHA, orientation and result.
- Do not spend the final all-programme pass on an intermediate SHA while #212 remains capable of changing gesture evidence.
- Do not reopen the old pre-Spatial Home → Continent → Region → Country model.
- Spatial Atlas is the production navigation presentation; typed hash routing/browser history remain authoritative.
- `docs/architecture/pwa-update-lifecycle.md` is authoritative for service-worker discovery/adoption; do not substitute manual-refresh/cache-clear rituals during update scenarios.
- If a material defect appears, keep #71 as validation owner and split non-trivial implementation into a focused issue.

## A. Pixel-class Android / Chrome

Run in portrait and short landscape.

### Home and navigation

- Open production from a fresh browser tab and confirm there is no unexplained blue focus outline.
- Confirm the full-globe Home composition and centred four-mode chooser are readable and touch-friendly.
- Confirm the chooser reads as stable opaque neutral Atlas chrome rather than blue/green/ocean-tinted glass while rotating the globe through mostly ocean, mostly land and substantial night/space positions.
- Confirm the globe remains the dominant saturated object around the bounded chooser.
- Confirm Profile remains subordinate but obvious and an earned World Crown remains correctly subordinate where applicable.
- Navigate Home → domain → continent → region → deliberate Play/Learn entry.
- Confirm normal browser/system Back and Forward behaviour from nested routes; there must be no competing Atlas route stack.

### Spatial gesture ownership

- On the Spatial globe, distinguish rotate/drag from tap/select. Repeated deliberate taps must focus/select rather than being mistaken for rotation.
- Pinch/zoom and pan where supported without unreachable controls or accidental navigation.
- Exercise representative small targets, including Singapore, Maldives, Bahrain and Brunei where available in the chosen scope.
- After #212 lands, explicitly test a stationary tiny-country tap close to the platform Back gutter and then an actual edge Back swipe; the tap must select and the swipe must remain platform-owned.
- Confirm multi-touch/pinch near the edge does not accidentally select a country or steal the platform Back gesture.

### Learning surfaces

- Flags Play: confirm the live activity owns the viewport with no inert globe strip; the flag and answer geometry remain stable across different flag shapes.
- Locations: pan/pinch, first wrong guess, second wrong guess, third-strike reveal, assisted recovery/correct resolution and subsequent question interaction.
- Confirm wrong/correct/reveal colour stays geographically contained inside canonical country geometry.
- Repeat the relevant Locations feedback with Android reduced motion enabled; no stale wrong-state colour may remain.
- Outlines: confirm representative interaction remains stable and readable.
- Neighbours: open input, filter suggestions, choose a suggestion, dismiss/reopen the software keyboard and continue the round.
- Confirm system gesture areas, top/bottom safe areas and short-landscape controls remain usable.
- Reload a nested/activity route and confirm the app recovers through the existing hash-routing/fallback contract.

## B. Physical iPhone / Safari

Run in portrait and short landscape.

### Home and navigation

- Confirm fresh boot has no unexplained focus ring.
- Confirm the full-globe Home chooser remains readable/usable and its neutral chrome does not tint as geography moves behind it.
- Navigate Home → domain → continent → region → Play/Learn.
- Exercise Safari edge-swipe/back and browser Back/Forward from nested routes; confirm no duplicate Atlas navigation gesture.

### Spatial and learning interaction

- Rotate/tap the Spatial globe and verify intentional taps remain distinguishable from drags.
- Exercise representative small-country targets.
- After #212 lands, test the stationary edge-tap/platform Back boundary on real Safari hardware.
- Flags Play: verify the live flag activity owns the viewport cleanly.
- Locations: verify three-strike retrieval, pan/pinch/tap behaviour and geographically contained feedback.
- Neighbours: verify suggestion input and software keyboard behaviour.
- Expand/collapse Safari browser chrome and confirm important controls never become unreachable.
- Check notch/Dynamic Island and home-indicator clearance as applicable.
- Reload a nested/activity route and confirm correct recovery.
- With iOS reduced motion enabled, verify affected Locations feedback resolves to the correct neutral resting state.

## C. Installed PWA — physical mobile

Install the production build pinned in #71 on at least one physical mobile platform; iOS is preferred.

### Normal standalone use

- Launch standalone and confirm Home matches browser Home materially and spatially.
- Navigate through Spatial scope selection into a round.
- Confirm standalone safe areas/home-indicator clearance.
- Confirm platform-appropriate Back behaviour and absence of a competing custom route stack.
- Rotate/tap the globe; pan/pinch/tap Locations; use Neighbours with the software keyboard.
- Confirm Flags Play owns the viewport in standalone mode as it does in-browser.
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
| Android |  |  | Chrome |  | portrait | Home material / Spatial navigation / Back | PASS / FAIL |  |
| Android |  |  | Chrome |  | short landscape | globe / edge gesture / learning surfaces | PASS / FAIL |  |
| iPhone |  |  | Safari |  | portrait | Home / Spatial navigation / edge Back | PASS / FAIL |  |
| iPhone |  |  | Safari |  | short landscape | globe / Locations / Neighbours | PASS / FAIL |  |
| Installed PWA |  |  | standalone |  | portrait + landscape | Home / safe areas / offline revisit / relaunch | PASS / FAIL |  |
| Installed PWA update |  |  | standalone | A → B | applicable | automatic update / safe adoption | PASS / FAIL |  |
| Installed PWA update |  |  | standalone | A → B | applicable | active-round deferral | PASS / FAIL |  |
| Installed PWA update |  |  | standalone | A → B | applicable | offline → online discovery | PASS / FAIL |  |

## Exit gate

Close #71 only when:

- #212 is resolved or explicitly removed from this gate;
- GitHub Issue #71 records the exact current production SHA used for the physical run;
- that SHA is green on merged-main CI, GitHub Pages and Firebase/live-origin deployment;
- physical Android Chrome evidence is recorded;
- physical iPhone Safari evidence is recorded;
- installed-PWA physical evidence is recorded, including automatic A → B adoption, active-round deferral and offline → online discovery;
- no routine manual refresh/cache-clear/reinstall step was required to receive B;
- material defects are resolved/revalidated or separately tracked.
