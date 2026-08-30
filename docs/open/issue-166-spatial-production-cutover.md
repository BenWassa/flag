# Issue #166 — Spatial Atlas production cutover

**Status:** implemented; verification recorded below.

Promotes the accepted Issue #119 Spatial Atlas candidate from the opt-in
`./spatial/` preview to the default Atlas navigation presentation, and fixes the
shared touch defect that blocked it.

Durable architecture lives in
[`../architecture/spatial-atlas.md`](../architecture/spatial-atlas.md). This file
records what changed, why, and the evidence.

## The product problem

The preview mounted `SpatialShell` as a fixed spatial band and rendered the
complete conventional Atlas screen underneath it. That was a deliberately safe
prototype integration, but in use it read as a globe stacked on the old
application: navigation information appeared twice, and the launcher's own page
chrome, headers and rows competed with the geography above them.

## What changed

### One navigation surface

`SpatialShell` renders the conventional panel **only** when an activity or a
results screen owns the content. For `home`, `domain`, continent and region
states the stage takes the viewport and `SpatialCommand` — a compact band of
real controls — sits directly beneath the place it names.

`deriveSpatialState` gained a `navigation` discriminator (`domains` |
`continents` | `scope` | `null`), so that decision stays inside the one pure
function that already interprets the route. No second navigation state machine
was introduced, and `SpatialCommand` dispatches the same `openScope`,
`playScope` and `learnScope` actions a geography tap does.

### Faster selection to Play

`Choose domain → tap continent → tap region → Play`, with Play on screen the
moment a scope is focused. A geography tap **selects** the durable scope and
never starts a round; choosing a place and playing it stay separate acts.

Learn now follows the framed scope rather than always naming the continent.
`learnScope` already accepted any scope id in all four domains, so this uses the
existing action unchanged.

### One model behind both presentations

`scopeModelFor` was extracted from the launcher screens. The spatial command
surface and the conventional `Launcher` are two presentations of it, so the
renderer-failure fallback cannot drift from what the spatial surface offers.

### Preview retirement

The pinned-source assembly, the isolated `flag-atlas-spatial-preview-v1` cache
namespace, the deployment spec, the in-app entry point and the three workflow
preview steps are all removed. There is one spatial implementation, and it is
production. The preview contract is closed at
[`../closed/issue-119-deployed-preview.md`](../closed/issue-119-deployed-preview.md).

## The touch blocker

Islands and microstates could stay difficult or impossible to tap at phone scale
even where Atlas appeared to configure a large hit area. Two distinct shared
defects, both fixed at the root rather than by enlarging anything visible.

### Pointer ownership

The spatial gesture layer captured the pointer on every `pointerdown`, rotated
the camera on any movement with no drag threshold, and resolved the tap at the
release point. The few pixels of jitter present in any real phone tap therefore
rotated the target out from under the finger and then picked the displaced
position.

It now follows the contract #22 established for the projected 2D map: no capture
until movement crosses the drag threshold, no rotation below it, crossing it is
sticky, and a tap reports the **pointerdown** position. Regressions in
`src/spatial/gestures.test.ts`.

### Hit resolution

Assistance was granted only to countries the simplifier left without a ring, so
it evaporated exactly when a continent's detail LOD arrived — `SGP`, `BRN`,
`BHR`, `PSE` and `CYP` all carry real polygons and no locator in their continent
asset. The world and detail indices were also consulted in sequence, letting any
detail polygon short-circuit the assistance the world asset was providing.

Picking is now one competition over a merged surface, and an **interaction
envelope** is derived from the canonical geometry already in the asset for any
country too small to aim at, at any LOD. Nothing is drawn; the envelope depends
only on geometry and the camera, never on the current question; and it retires
itself as the learner zooms in.

Precedence keeps #117's meaning rather than its letter: a country a learner can
actually aim at is never displaced, a speck owns its own land outright, and an
envelope reaching onto a neighbour is bounded by that neighbour's own room —
measured as twice area over perimeter, so a boot-shaped country is not mistaken
for its bounding box.

Constants were chosen from measurement, not taste. Across the 391 (country,
scope) pairs Atlas can frame at a 390x640 stage, the reported failures are
specks at 0–8.6 px (MDV 0.0, SGP 2.5, BHR 3.3, BRN 7.9, PSE 8.6) while the
ordinary neighbours contesting their taps are 28–378 px (ISR 28.1, MYS 69.8,
SAU 137.9, IND 196.9). The 16 px threshold sits inside that gap with 1.75x
clearance.

Countries in the 16–30 px band are small but genuinely aimable and remain
ordinary geography. Making those easier is a zoom question and belongs to #137,
which this issue deliberately does not absorb: no Asia max-zoom redesign, no
Cyprus geometry work, no Levant inset removal, no resolved-country Locations
change, no Asia curriculum change.

### Measured result

`scripts/verify-spatial-touch.mjs`, over 31 production frames and 391
reachability probes. Near-miss samples over a fingertip disc, unassisted →
assisted:

| Target | Whole-continent frame | Region frame |
| --- | --- | --- |
| `SGP` | 1 → 18 / 25 | 1 → 21 / 25 |
| `MDV` | 0 → 25 / 25 | 0 → 25 / 25 |
| `BHR` | 1 → 17 / 25 | 1 → 22 / 25 |
| `BRN` | 3 → 13 / 25 | 7 → 17 / 25 |

Brunei at the whole-Asia frame is the binding case: it is an enclave inside the
narrow Sarawak strip, and reaching further would take Malaysia's own land rather
than water.

The cost to every other country is bounded and measured: the worst retained
interior across all 391 pairs is **91%** (Saudi Arabia at the Asia frame). No
country anywhere became unreachable.

Representative small-island targets in the other five continents are audited
too: `STP` `SYC` `CPV` `COM` `MUS`, `MLT` `MCO` `SMR` `VAT` `AND` `LIE`,
`ATG` `KNA` `GRD` `VCT` `LCA` `DMA` `BRB`, `NRU` `TUV` `MHL` `PLW` `FSM` `KIR`
`TON`, `SUR` `GUY` `URY`.

## Preserved

ISO3 identity, Natural Earth 1:10m source and provenance, typed hash routing and
the `/{domain}/{continent}/{region}` schema, Back/Forward, cold deep links,
scoring, evidence, Mastery, achievement qualification, storage namespaces,
Firebase contracts, the ephemeral active-round model, supported/unavailable
geography truth, PWA/offline behaviour, and the WebGL-failure fallback.

The activity boundary is unchanged: Locations, Outlines, Neighbours, Flags Learn
and Profile yield the screen; Flags Play keeps quiet non-leaking context;
results reframe the scope just played.

## Verification

### Node gate

`npm run check`, 74 unit tests (19 of them new, covering the picking contract and
gesture ownership), the Firebase rules suite, the production build and all 32
verifiers pass under Node 22.22.

Two verifiers are new: `verify-spatial-touch.mjs` proves the touch contract
against every production frame, and `verify-ia.mjs` and
`verify-british-english.mjs` now render `SpatialCommand` so the IA and copy
contracts are asserted on the production surface rather than only on the
fallback launcher.

### Exact production artifact

48 files, 11 MB. No `dist/spatial/`. `<title>Atlas</title>`, `spatial.css` linked
once. Service worker on `flag-atlas-v30` with zero occurrences of the retired
preview namespace, precaching `stage-controller-*.js` and `world-*.js`. Manifest
unchanged (`Atlas`, `en-GB`, `start_url ./#/`, `scope ./`). `app.js` 103,161
bytes gzip against a 120 kB budget; the spatial entry is 178,833 gzip against
256,000; continent detail stays lazy.

### Browser

Chromium under SwiftShader, desktop and Pixel 7 projects. Directly verified
against the built artifact at 390x844, 320x568, 320x480, 768x1024 and 844x390:
all four domains reach a focused scope with Play on screen and no launcher page
beneath, deep links and hashes resolve, refusing every WebGL context falls back
to the conventional launcher with the route intact, a Locations round yields the
screen entirely, and Flags Play keeps the globe inert and unhighlighted.

At 320x480 with Asia — the widest area list on the smallest phone — the globe
keeps 163 px, Play stays fully visible, the command band scrolls internally
rather than clipping, and neither axis of the page overflows.

Full matrix, both projects: **161 passed, 22 failed**, reduced to 21 by the last
fix below. Every remaining failure was attributed against a build of
`origin/main` in a worktree rather than assumed.

#### Pre-existing on `main` (21)

- `north-america` — the full Caribbean answer system across five viewports, and
  Central America dense targets (12 across both projects);
- `oceania` — all 14 Locations pointer-answerable, two viewports (4);
- `map-neighbors-rounds` — two Neighbours cases (3);
- `pwa-runtime` — the production PWA shell case (1);
- `map-pointer-capture` — *sub-threshold movement preserves assisted-tap
  scoring* (1).

The Caribbean case fails on `main` with a byte-identical measurement: an assisted
hit surface of **16.814376831054688 px** against a required 43.5. That is the
projected 2D map's assistance, not the globe's, and the same family of defect
#137 owns. The spatial shell was ruled out directly: with WebGL enabled and with
it refused, the Locations map renders an identical `viewBox` and an identical
382x506 stage. `map-pointer-capture` taps those same undersized surfaces on an
unseeded round order; repeated five times it fails once on **both** branches.

None of these is absorbed here. Fixing the 2D map's assist sizing is #137's
workstream and needs its own evidence.

#### Caused here, and fixed (6)

Four were errors in this work rather than in the tests:

- the command surface had replaced Home's brand heading with an instruction,
  compressed the World Crown block into one line and dropped the Modes heading.
  #138 owns the Crown's learner-facing presentation and the brand heading is a
  contract several suites assert, so all three are restored verbatim;
- it had demoted ordinary progress from the retrieval strip the design system
  fixes it as to a figure in a text line. The `ProgressStrip` is back on the
  focused scope, which also restores the accessible name `recognition-rounds`
  reads;
- the layout matrix read `bottom`/`top` off a Playwright `boundingBox`, which
  carries only x, y, width and height — so the no-scroll assertion threw instead
  of measuring, and had never actually run;
- two fixtures expected a region's Play while on a continent surface.

Two were timing, and were measured rather than waved through. Against the built
artifact at 1280x800 with no contention the Locations map reaches
`data-map-positioned` in **184–258 ms** with the globe booting ahead of it and
**25–48 ms** without: a real cost, two orders of magnitude inside the 5 s the
assertion allowed. The failures were load starvation under three parallel
SwiftShader workers, so that assertion now carries the same 40 s allowance as the
prompt assertion above it, and the inset fixture waits for the frame to land
before measuring geometry against it. Eight consecutive runs pass.

### Not performed

**Physical-device testing.** Everything above is headless Chromium under
SwiftShader, which is engineering evidence and not device evidence. GPU frame
pacing, thermals, battery and platform edge gestures are unverified, and so is
the thing this issue most cares about — whether a real thumb reaches Singapore.
The touch work is measured geometrically and in-browser; real-device feel remains
open, as it already is under #71.
