# Issue #90: Keep the Flags question layout stable between flags

**Status:** Implemented — awaiting review/merge  
**GitHub:** [#90](https://github.com/BenWassa/flag/issues/90)

## Problem

National flags have different aspect ratios. In Flags Play, the flag can change
the question stage's height, moving the answer choices between questions. This
makes repeated touch targets less predictable and creates visible page bounce.

## Goal

Reserve a stable visual area for the flag within each supported layout so flag
aspect ratios do not move the multiple-choice answers. Preserve the complete
flag image without stretching or cropping it.

## Scope

- Give the React-owned Flags question surface a consistent media-stage height
  within each responsive layout.
- Centre flags in that stage and retain `object-fit: contain` behaviour.
- Preserve the geometry during image loading and visible image failure.
- Keep the stage responsive across phone portrait, short landscape and desktop.
- Confirm Learn and feedback transitions do not unnecessarily move answers.
- Add focused regression coverage for the stable-stage contract.

## Design constraints

- The flag remains the dominant learning object without pushing answers below a
  practical phone viewport.
- No flag is stretched, cropped or given a misleading treatment.
- Existing Tactile Atlas spacing, framing, focus and answer controls remain.
- Size the enclosing stage independently of the image's intrinsic dimensions.
- Do not animate layout position as a substitute for stability.

## Acceptance criteria

- [x] Wide, standard and near-square flags leave the answer group at the same
      vertical position within the same viewport.
- [x] The stage remains stable before load, after load and on image failure.
- [x] Every flag remains fully visible at its intrinsic aspect ratio.
- [x] Phone portrait, short landscape and desktop retain reachable,
      non-overlapping answer controls.
- [x] Keyboard use, focus order, accessible names and live feedback are unchanged.
- [x] Reduced-motion behaviour has no incidental layout animation.
- [x] A focused automated assertion protects the stage-sizing contract.
- [x] The production build is browser-checked with representative aspect ratios.
- [x] `npm run check` and `npm test` pass under Node 22.

## Implementation

The stage reserved minima (`min-height` on `.flag-stage` and
`.flag-frame--stage`, `max-height` in `dvh` on `.flag-image`) and let the flag's
intrinsic ratio decide the used height.

- `.flag-stage` now owns a determined block-size through `--flag-stage-height` /
  `--flag-stage-inset`, with `--flag-stage-cap` derived from them. Each
  responsive tier re-declares only those values. `svh` replaces `dvh` so a
  retracting mobile URL bar cannot resize the stage either.
- `.flag-frame--stage` takes its width as
  `min(100%, 470px, ratio * --flag-stage-cap)` and derives its height through
  `aspect-ratio`. This is what lets one box scale up to fill the stage and stay
  inside the height cap without letterboxing — capping the image's height
  directly leaves the box at full width, which is what previously drew the
  flag's border around empty space beside a near-square flag.
- CSS cannot read an image's ratio, so `FlagImage` publishes the loaded ratio as
  `--flag-ratio`, falling back to 3:2 until it is known. The ratio is read on
  mount as well as on load, because a cached image can already be complete
  before React attaches `onLoad`.
- A tall, wide viewport keeps a larger cap so the fix costs no desktop
  presentation: a 3:2 flag still renders at the full 470px frame width.

## Verification

`tests/browser/flag-stage.spec.ts` serves stand-in flags at 2:1, 3:2 and 1:1 and
asserts the answer panel's offset and the stage height are unchanged across all
three, that the rendered flag keeps its own ratio, and that a failed image holds
the same geometry. Confirmed to fail on the pre-fix build and pass after.

Measured answer-panel offset across the three ratios (production preview,
Chromium):

| Viewport | Before | After |
| --- | --- | --- |
| 1280x900 desktop | 415 / 493 / 593 px | 511 px |
| 320x568 portrait | 311 / 348 / 371 px | 347 px |
| 740x360 landscape | stable (answers are in their own column) | stable |

Automated evidence is Chromium against the production preview. Physical-device
validation remains #71's.

## Verification matrix

Use at least one wide flag, one common 3:2 flag and one near-square flag. Record
the flag-stage and first-answer bounding boxes after load. Repeat with delayed
loading and forced failure at phone portrait, short landscape and desktop.

## Non-goals

- Redesigning Flags Play or its answer grid.
- Cropping or editing source flag artwork.
- Changing scoring, evidence, mastery or question ordering.
- Broad layout changes to Locations, Outlines or Neighbours.

