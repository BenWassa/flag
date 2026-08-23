# Issue 71 Implementation Notes

This document tracks implementation decisions after the Issue 71 mobile interaction specification.

## Status

Navigation-gesture layer implemented and verified in a browser. Physical-device validation still outstanding.

---

## Confirmed defect: the gesture never fired on touch devices

The original pointer-event implementation (`a046c01`) could not work on a real device, confirmed by driving CDP touch events in Chromium at a 390×844 viewport:

```
down touch x=6 y=500 tgt=MAIN
move touch x=31
(stream ends — browser claimed the drag as a scroll and cancelled the pointer)
```

Because the drag was never `preventDefault`ed, the browser took the touch for scrolling and cancelled the pointer stream after roughly one move. The 72 px threshold was unreachable, so edge-swipe back silently did nothing.

### Fix

`src/navigation-gestures.ts` now drives the gesture from touch events and *claims* it with `preventDefault()` once horizontal intent is unambiguous (`dx > 12 px` and `dx > dy`). Vertical scrolling is unaffected because vertical drift past 48 px disarms the gesture before any claim is made — verified: a drag from the edge gutter still scrolls the page (`scrollY` 0 → 503).

### Ownership hardening

Per the specification's priority model (controls → maps → scrolling → navigation):

- yields to `[data-map-viewport]` and to interactive elements including `summary`, `label`, `[role="button"]`, `[role="slider"]`, `[role="textbox"]`;
- yields to any genuinely horizontally scrollable ancestor, detected from real `scrollWidth`/`clientWidth` overflow rather than a hardcoded selector list;
- a disqualified gesture is abandoned for the rest of the touch instead of re-arming mid-scroll (the previous code could navigate after a scroll wandered sideways);
- requires horizontal dominance and disarms on any leftward reversal.

Note: the abandoned `feature/issue-71-mobile-interaction-upgrade` branch contains a competing `src/ui/mobile-gestures.ts` that is never imported, and excludes `[data-map-surface]` — an attribute that does not exist anywhere in the codebase. The real attribute is `[data-map-viewport]`. That branch should not be merged.

---

## Browser verification

`scripts/verify-mobile-gestures.mjs` guards the deterministic contract and runs in `npm test`. Behavioural checks were run separately in Chromium 151 (Playwright 1.62.1), 390×844 DPR 2 with touch, against the production `dist/` build — 13/13 passing:

- edge swipe navigates back from a nested route;
- swipe at Home does nothing (never exits the app);
- vertical-dominant drag does not navigate;
- mid-screen swipe does not navigate;
- a drag starting on a live Locations map pans the map and does not navigate;
- vertical scrolling from the edge gutter still scrolls;
- no persistent map zoom controls render;
- `overscroll-behavior-y: contain` applies (no PWA pull-to-refresh mid-round);
- no horizontal page scroll at 390 px or in short landscape.

## Screen-by-screen audit

Home, Progress, Atlas continent, all four domain launchers and Flags study, each at 390×844, 844×390, 320×568 and 768×1024:

- **no horizontal overflow on any surface at any of the four viewports;**
- Home touch targets all ≥ 44 px.

One accepted finding: on the launcher mini-map at 320 px and in short landscape, the smallest tappable SVG region shapes measure ~36×56 px (Southern Africa) and ~44×78 px (Central Africa). These are rendered geography, not icons — resizing them would distort the map — and every region also has a full-width row below the map with a ≥ 44 px target, satisfying the specification's accessible-fallback requirement. No change made.

## PWA

`viewport-fit=cover` is present and browser zoom is not suppressed (no `user-scalable=no` / `maximum-scale`). `overscroll-behavior-y: contain` was added to `body` so a pull-to-refresh cannot discard an in-progress round in the installed PWA; horizontal overscroll is deliberately left alone so platform edge-back still works.

Shell cache advanced to `flag-atlas-v25`.

---

## Not verified

No physical device was used. Chromium CDP touch emulation is not iOS Safari or Android Chrome, and emulated safe-area insets are not a notched device. The acceptance criteria requiring physical Pixel/iPhone/installed-PWA validation remain genuinely open.

## Repository touch points

Primary areas to inspect before implementation:

- `src/app.ts` — application routing and event ownership.
- `docs/architecture/routing.md` — route/history contracts.
- `src/ui/` — mobile surfaces and interaction components.
- `src/map-viewport.ts` — shared viewport behaviour.
- `src/neighbor-map-runtime.ts` — Neighbours map runtime.
- `src/ui/components/neighbor-map.ts` — Neighbours map rendering.
- `src/ui/views/neighbor-quiz.ts` — keyboard/map interaction surface.
- `atlas-theme.css` and related styles — safe areas, touch targets, responsive rules.

## Implementation order

1. Audit existing gesture, routing and map ownership.
2. Implement navigation gestures through existing history.
3. Resolve gesture conflicts between navigation, maps, scrolling and input.
4. Harden Locations and Neighbours direct map interaction.
5. Audit all mobile layouts for safe areas and touch ergonomics.
6. Validate PWA behaviour and production build.

## Gesture ownership

Priority:

1. Active controls and text input.
2. Map gestures.
3. Scroll containers.
4. Navigation gestures.

Navigation gestures must never steal an intentional map, input or control interaction.

## Verification

Required before closing Issue 71:

- npm test passes.
- Production artifact inspected.
- Physical Android validation.
- Physical iOS Safari/PWA validation.
- Evidence recorded in Issue 71.

---

## Re-verification on current `main` (2026-08-22)

Re-run after `main` moved on (floating Play answer feedback, `0.4.2`, and the
Issue #72 CSS ownership pass), to confirm the gesture layer had not regressed.
Chromium 151 (Playwright 1.62.1), 390×844 DPR 2 with touch, CDP touch events
against the production `dist/` build — **12/12 passing**:

| check | evidence |
|---|---|
| edge swipe navigates back from a nested route | `#/flags/africa/west-africa` → `#/atlas/africa` |
| swipe at Home does not exit the app | `#/` → `#/` |
| mid-screen swipe does not navigate | route unchanged |
| vertical-dominant edge drag does not navigate | route unchanged |
| vertical scroll from the edge gutter still scrolls | `scrollY` 0 → 616 |
| drag on a live Locations map does not navigate | route unchanged |
| drag on a live Locations map pans it | `viewBox` x 88.2 → 0 |
| no persistent map zoom/reset controls | 0 found |
| `overscroll-behavior-y: contain` on `body` | `contain` |
| `viewport-fit=cover` present | `width=device-width, initial-scale=1, viewport-fit=cover` |
| browser zoom not suppressed | no `user-scalable=no`, no `maximum-scale` |
| no horizontal overflow | 32 surface/viewport combinations clean |

The last row covers 8 surfaces (Home, Progress, Atlas continent, and the Flags,
Locations, Outlines and Neighbours launchers plus a region launcher) at 390×844,
844×390, 320×568 and 768×1024.

The Issue #72 CSS pass was independently proven to be a rendering no-op
(5,761 cascade winners and 406,800 computed-style comparisons unchanged), and
these gesture results confirm it did not disturb map or scroll ownership.

**This does not advance the issue's remaining acceptance criteria.** They require
physical hardware, and CDP touch emulation is still not iOS Safari or Android
Chrome. Issue #71 stays open on:

- physical Pixel / Android Chrome;
- physical iPhone / iOS Safari and the installed PWA;
- real notch / Dynamic Island / gesture-bar safe-area behaviour.

## Repository hygiene note

`origin/feature/issue-71-mobile-interaction-upgrade` still exists and still holds
the unmergeable `src/ui/mobile-gestures.ts` described above (never imported,
keyed to a `[data-map-surface]` attribute that does not exist). It should be
deleted rather than merged. `origin/docs/issue-71-mobile-interaction-spec` and
`origin/issue-72-legacy-code-css-audit-fix` are both fully merged into `main` and
can also be deleted.

---

## Re-verification on the v0.7.0 integration (2026-08-23)

Re-run after South America, Europe and Asia shipped, `#77` restored full-width
continent/region navigation and `#78` made Locations Play feedback explicit —
all of which change the surfaces the gesture layer shares ownership with.
Chromium (Playwright 1.62.1), Pixel 7 profile 412×915 with touch, CDP touch
events against the production `dist/` build:

| check | evidence |
|---|---|
| edge swipe navigates back from a nested route | `#/locations/europe/western-europe` → `#/locations` |
| swipe at Home does not exit the app | `#/` → `#/` |
| mid-screen swipe does not navigate | route unchanged |
| no persistent map zoom/reset controls | 0 found on the Asia launcher |
| no horizontal overflow at 320 px | 12 routes clean, including the new Europe/Asia/South America surfaces and `/locations/asia/middle-east` |
| no row-level Quick Play remains | 0 across all four domain indexes |
| launcher geography renders per continent | Africa 70, Europe 61, Asia 70, South America 23 SVG paths |
| Play rounds are tappable in the new continents | Western Europe 9, Middle East 17, Andean 5 countries |
| explicit Play feedback reaches the new continents | `map-country--current-wrong map-country--wrong-pulse` on a wrong tap |
| no console or page errors | clean across the run |

The gesture layer did not regress under the merged navigation and feedback
changes.

**Still not verified.** No physical device was used. The acceptance criteria
requiring physical Pixel/Android Chrome, iPhone/iOS Safari and installed-PWA
validation remain genuinely open, and are the only reason #71 stays open.
