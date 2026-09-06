# Issue #207: Let Flags own the full activity viewport, and the scope-selection decision

**GitHub:** [#207](https://github.com/BenWassa/flag/issues/207)
**Refs:** #90 · #119 · #166 · #187 · #197 · #198 · #71

## Problem

Flags was the last live activity that kept the Spatial globe mounted above it.
`deriveSpatialState` special-cased the live `quiz` view as `mode: 'context'`, and
`spatial.css` gave that mode a `22svh` stage; Locations, Outlines, Neighbours and
Flags Learn all yielded the stage completely.

The globe was answer-safe there — a flag cannot be read off a map, and the mode
already published no country states, no scope status and no labels. It was still
the wrong trade. Once the learner has chosen a region, the geography contributes
nothing to recognising a flag, and on a phone it was charging a repeated-recognition
game roughly a fifth of the viewport for a backdrop: the flag lost its dominance,
the answer set moved towards and past the fold, and the round read as a page
underneath a map rather than a game surface.

## What shipped

### 1. The live round yields, through the existing contract

`quiz` joined `YIELDING_VIEWS`, and the `context` branch and the `'context'` mode
itself were removed from `SpatialStageMode`. There is no second hide-the-canvas
mechanism: the live Flags round yields exactly as the map-native domains and Flags
Learn already did, so the stage leaves the layout, `scene.setActive(false)` pauses
the renderer, and `.spatial-shell[data-mode='yielded']` collapses to a plain block
so `.quiz-shell` resolves `100svh` against the real viewport again.

Two CSS blocks retired with the mode: the `22svh` stage height with its
`pointer-events: none` surface, and the short-landscape override that used to
stand `context` down at `844×390`. Every live activity now yields at every
viewport, so there is no shared composition left for a layout tier to undo.

### 2. Two latent defects the freed space exposed

Removing the strip was not sufficient on its own.

- **The short-viewport answer height never applied.** `atlas-theme.css` loads after
  `styles.css` and sets `.answer-button { min-height: 60px }` unconditionally, so
  the `52px` step-down written in `styles.css` under `@media (max-height: 720px)`
  lost on source order regardless of the media query, and a small phone was still
  paying 60px per option. The step-down now lives in `atlas-theme.css` beside the
  baseline it has to beat, at the established `--control-height-standard`. The
  short-landscape `46px` declaration was dead for the same reason and was deleted
  rather than revived: the landscape layout is proven to fit at the full tactile
  height.
- **The flag stage had no small-phone tier.** A new `@media (max-height: 640px)`
  tier steps `--flag-stage-height` to `min(200px, 32svh)` and the feedback reserve
  to `72px`. The stage keeps a determined block-size, so #90's guarantee is
  untouched; it is simply a smaller determined size where 38svh does not fit.
- **Short landscape overflowed.** `--flag-stage-height` at `844×390` moved from
  `60svh` to `min(220px, 54svh)`, which clears the viewport exactly.
- **A yielded stage never retired its projected names.** `stageController.apply`
  returned early for `yielded` before reaching `labels.set(...)`, so the real-DOM
  scope controls anchored over the Earth stayed in the DOM for the whole activity.
  `display: none` took them off the screen and out of the accessibility tree, but
  they were still controls for a scope the learner had stopped choosing, and
  nothing would have cleared them on the way out. This was latent on `main` for
  Locations, Outlines, Neighbours and Profile — the Flags path only happened to
  clear them because `context` fell through to the same call. The yielded branch
  now applies the authoritative (empty) label state before returning, and
  `spatial-disclosure.spec.ts` asserts retirement in all four domains.

### 3. Measured result

Exact production `dist`, Chromium with coarse-pointer emulation, four intrinsic
geometries (2:1, 3:2, 1:1 and a genuine non-rectangular Nepal-shaped pennant at
0.82:1). The flag stage height, the flag stage top, the answer-panel top and the
last option's bottom are identical to within 1px across all four at every tier.

| Viewport | Flag stage | Last option bottom | Document scroll |
| --- | --- | --- | --- |
| 320×568 | 181.8 | 555 | 659 / 568 — reserve only |
| 390×844 | 300.0 | 705 | none |
| 412×915 | 300.0 | 705 | none |
| 844×390 | 210.6 | 330 | none |
| 768×1024 | 380.0 | 647 | none |
| 1440×900 | 380.0 | 647 | none |

Before the change, `390×844` scrolled and `320×568` put the fourth option 53px
below the fold.

The residual scroll at `320×568` is the permanently reserved feedback area, not
the question: header, flag and all four options are inside the viewport. That
reserve is what stops the floating feedback card from resizing anything above it,
and a 568px screen cannot hold four standard-height controls, a dominant flag and
a 48px card at once. It is accepted deliberately, and the learner never has to
reach it to answer.

## The scope-selection decision — Model A

#207 asked, separately, whether Flags should choose its scope on the Earth at all,
or through a compact Flags-specific continent/area list. **Model A — geography-led
selection, then a full-screen activity — is the shipped answer**, decided against
the resulting production flow rather than for architectural uniformity.

Walking exact production at 320×568, 390×844 and 412×915, every step identical:

- **Four taps to a live round** — Flags → Africa → West Africa → **Play**. A list
  is also four. Whole-continent Play is three either way, from continent focus.
- **Every scope control already clears 44px**, even at the 320px floor. A row list
  would offer the same target, not a better one.
- **Every navigation step already fits the viewport with no scrolling.**
- **The globe is Home.** It is mounted and drawn before a domain is chosen, so a
  Flags list would avoid no 3D cost whatsoever.

Against zero saving, Model B would discard the geographic orientation that region
names like *West Africa* and *Southern Africa* carry for free, and would add a
second scope-choice presentation — its own layout, focus order and forced-colours
behaviour — for one domain.

This is a judgement about this flow, not a permanent prohibition. #198's removal
of duplicated bottom scope lists stays right and does not forbid a deliberate
Flags-specific presentation later. The anti-pattern is duplication: geography owns
the choice, or rows own it, never both on one screen.

## Preserved

Typed routes as durable navigation authority; the round as ephemeral session
state; curriculum, ISO3 identity, question ordering and option generation;
scoring, evidence, region × domain Mastery, continent crest and World Crown
semantics; storage namespaces; renderer fallback; British English; true flag
artwork and aspect ratios. No answer or scoring rule changed.

## Verification

- `tests/browser/flags-activity-viewport.spec.ts` — 19 assertions over exact
  production: the yield itself (stage box height `0`, no command surface, question
  at the top of the screen), Learn unchanged, results reframing the scope, exit
  and Back/Forward on the durable route, cold-refresh fallback, renderer failure,
  per-viewport reachability and ratio stability, answered-state geometry, reduced
  motion and 200% text zoom.
- `tests/browser/flag-stage.spec.ts` — #90's own contract, unchanged and passing.
- `tests/browser/spatial-atlas.spec.ts` — the inert-context assertion became the
  yield assertion.
- `scripts/verify-spatial-atlas.mjs` and `scripts/verify-spatial-disclosure.mjs`
  moved `quiz` onto the yielding contract inside the repository gate.
- `npm test` (check, unit, Firebase rules, build, 40 verifiers) green.

Headless Chromium is engineering evidence. #71 remains the physical device and
installed-PWA gate; no physical-device claim is made here.
