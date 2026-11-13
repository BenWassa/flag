# #235 — investigation evidence

Status: **closed** (13 November 2026). The cause was a browser-harness artefact; PR #236 merged with green CI and deploys. [GitHub #235](https://github.com/BenWassa/flag/issues/235) owns scope and acceptance. This record captures the evidence, not a second specification.

## Cause

The stall is a browser-harness artefact, not a Locations controller defect.

The Playwright projects launch Chromium with SwiftShader so the globe has a WebGL surface. With no further flag, Chromium also rasterises ordinary page content through that software GL device. A Locations map is roughly 900 KB of SVG path data, and one full repaint of it costs about 0.8 s of GPU-process time on a fast laptop (about two thirds of that is boundary and coastline stroking). Each accepted answer rebuilds the map twice, and launching a round repaints it several times.

While those rasters are outstanding the renderer's main thread waits on compositor commits. Timers queued in that window fire late: the 620 ms advance timer was observed firing after 4.2 s locally under a raised device scale factor, and CI runners are several times slower again, which matches the 15 s stalls recorded there. Animation frames and microtasks still slip through between commits, which is why earlier probes saw frames continue while timers did not.

No physical phone paints page content through a software GPU, so this timing was never the application's own.

## Evidence (13 November 2026, local production build, Pixel 7 emulation)

- A trace across round launch showed 250–850 ms `RasterDecoderImpl::DoEndRasterCHROMIUM` slices back to back in the GPU process, with no main-thread long task. Frame gaps of 1.4 s and 1.25 s followed launch.
- Hiding `.map-boundaries` cut one full raster from 818 ms to 293 ms; removing all strokes gave the same figure. Fill animation, `vector-effect`, clip paths and hit targets made no measurable difference.
- At device scale factor 9, an answer tapped straight after launch advanced after 4.9 s, with the 500 ms and 620 ms timers both firing at 4,174 ms. With boundaries hidden the same run advanced in 1.06 s.
- With `--disable-gpu-rasterization` added and nothing else changed, the same runs at scale factors 2.625, 9 and 14 advanced in 1.02–1.08 s with every timer on time and no frame gap above 300 ms. Without the flag, scale factors 9 and 14 took 3.5–3.7 s.

## Repair

`playwright.config.ts` adds `--disable-gpu-rasterization`. WebGL still runs on SwiftShader; page content returns to Chromium's CPU raster path.

The earlier candidate changes on PR #236 were removed because the cause is not in the application: the timeout-plus-animation-frame watchdog in the Locations round controller, the map markup memoisation, the single-observer viewport change, the temporary scheduler-isolation spec with its CI step, and the timer-trace diagnostics in the framing and island specs. The controller unit tests for dwell, single advance, exit cancellation and third-miss reveal stay, as does the real-touch mobile acceptance spec and the Playwright clock correction in the feedback-geometry spec.

## Verification

- [CI 43438262382](https://github.com/BenWassa/flag/actions/runs/43438262382) on `c7ed36a`: repository verify, mobile acceptance, desktop acceptance and PWA lifecycle all green. This is the first fully green run on PR #236; the three before it failed desktop or mobile acceptance. The run took 7 minutes against 12 to 15 previously.
- Local production build: mobile acceptance 89 passed, desktop acceptance 120 passed.
- Not verified: physical devices. #71 remains the separate owner-run gate; nothing here is device evidence.

## Possible follow-up, not part of this repair

The map's raster cost is real work on any device, only far cheaper on a hardware GPU. Unrelated shell mutations currently reach `applyBox` through the viewport mutation observer and rewrite an unchanged `viewBox`, which repaints the whole map, and the map shares compositor tiles with the prompt text. Neither was shown to affect a real device, so neither is changed here.
