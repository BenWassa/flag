# #235 — investigation evidence

Status: **unresolved**. [GitHub #235](https://github.com/BenWassa/flag/issues/235) owns scope and acceptance; [draft PR #236](https://github.com/BenWassa/flag/pull/236) owns the candidate. This record captures the 10 November 2026 review, not a second specification.

## Current verified limits

- Latest inspected candidate: `9ff003e2fd72091992431cdce98ad1cd410eadc5`.
- [CI 42918364163](https://github.com/BenWassa/flag/actions/runs/42918364163): repository/PWA green, desktop/mobile red. Desktop still includes an accepted-answer progression timeout. The separate temporary mobile scheduler-isolation step failed, so the full mobile product-contract step did not run.
- Mobile isolation reproduced a timer/frame stall immediately after touchscreen launch as well as after an accepted country answer. A bare button control passed. The existing timeout plus animation-frame watchdog therefore does not establish resolution.
- Local production-build isolation reproduced scheduling failures in Playwright's Chromium headless shell and the full Chromium binary. Switching binaries did not resolve them. These were emulated phone runs, not physical-device evidence.
- One local CPU profile spent approximately 2.1 seconds of a 3.1-second capture idle, with approximately 0.7 seconds in the spatial bundle. This argues against a continuously running JavaScript loop in that capture; it does not establish the browser scheduler's cause.

## Diagnostic caveats and rejected experiments

The temporary isolation test requires fifteen animation frames within a fixed 1.8-second observation. Locally that assertion also failed when the independent timeout fired and the round had already advanced. A failed frame-count probe must not be reported as an accepted-answer stall without checking the actual counter and feedback. Keep the genuine touch/ownership/progression tests authoritative.

A renderer-failure launch control had functioning timers/frames in one local run. This is a lead, not proof that WebGL owns the defect. The fallback uses different launcher labels, so a probe must actually reach the activity before its scheduling evidence is meaningful.

An experiment deferred globe construction while its stage had no layout size. Six Learn/Play touch cases passed with the existing watchdog, but a subsequent native-timer-only run had five passes and a missed-touch failure. No reliable causal conclusion followed. The experiment and local CPU-profile/fallback test changes were removed; they are not production fixes. An overlapping-run attempt also lost its preview server and is excluded from product evidence.

## Next investigation

Capture browser scheduling and spatial boot/visibility events around a genuine failed advance, distinguishing JavaScript work, native rendering, page lifecycle and pending input. Compare the same question/input path with and without concurrent renderer initialisation. Use event/lifecycle boundaries rather than artificial pre-answer sleeps. Retain controller cancellation/exactly-once tests and real mobile touch progression checks; do not enlarge timeouts or declare success from the diagnostic probes alone.

Full current-head repository, desktop, mobile, PWA, exact-artifact and deployment evidence is still required before merge or issue closure. #71 remains the separate physical-device gate.
