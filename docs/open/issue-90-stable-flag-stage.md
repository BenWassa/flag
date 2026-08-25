# Issue #90: Keep the Flags question layout stable between flags

**Status:** Scoped  
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

- [ ] Wide, standard and near-square flags leave the answer group at the same
      vertical position within the same viewport.
- [ ] The stage remains stable before load, after load and on image failure.
- [ ] Every flag remains fully visible at its intrinsic aspect ratio.
- [ ] Phone portrait, short landscape and desktop retain reachable,
      non-overlapping answer controls.
- [ ] Keyboard use, focus order, accessible names and live feedback are unchanged.
- [ ] Reduced-motion behaviour has no incidental layout animation.
- [ ] A focused automated assertion protects the stage-sizing contract.
- [ ] The production build is browser-checked with representative aspect ratios.
- [ ] `npm run check` and `npm test` pass under Node 22.

## Verification matrix

Use at least one wide flag, one common 3:2 flag and one near-square flag. Record
the flag-stage and first-answer bounding boxes after load. Repeat with delayed
loading and forced failure at phone portrait, short landscape and desktop.

## Non-goals

- Redesigning Flags Play or its answer grid.
- Cropping or editing source flag artwork.
- Changing scoring, evidence, mastery or question ordering.
- Broad layout changes to Locations, Outlines or Neighbours.

