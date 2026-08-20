# Map feedback v4 — release closeout

**Date:** 2026-08-19  
**Release branch:** `agent/map-feedback-v4`  
**Merged:** 2026-08-19 10:25 EDT  
**PR:** #7 — `Fix map feedback, small-country callouts, and naming`  
**Merge commit:** `6f347e69a4e5a097c61b765c82f653684688e606`

This file is the release closeout supplement to [`map-feedback-v4-log.md`](map-feedback-v4-log.md). The main log contains the timestamped observation → assessment → change → verification → evaluation trail; this file records the final gate and merge after that log's merge recommendation.

## Final release gate

The final PR head was `70676452188be94a5ef5078e5170de8a639bf52e`.

GitHub Actions CI #39 (`32263832725`) completed successfully against that exact head.

Final CI artifact:

- name: `flag-atlas-dist`;
- artifact ID: `9369335458`;
- size: 54,750 bytes;
- digest: `sha256:792961c98643f5fbe434852c0de5b351e2c46b43ab20d4e65c0fa24e59ed1472`.

The final artifact was inspected after CI. It contains:

- primary country label `The Gambia`;
- explicit callout metadata for `CPV`, `GMB`, `GNB`, `SLE`, and `TGO`;
- `map-country--current-correct` first-try feedback;
- `map-country--recorded` neutral Test acknowledgment;
- `map-country__callout-hit` touch surfaces;
- PWA cache version `flag-atlas-v6`.

## Final behavior contract shipped

- first-try correct: strong green immediate feedback, then off-white stored round result;
- correct after one miss: amber immediately — no green flash;
- correct after two misses: orange immediately — no green flash;
- third miss/reveal: red;
- wrong guesses: visible transient red feedback;
- Test taps: visible neutral blue acknowledgment without correctness leakage;
- resolved countries: no longer clickable or keyboard-selectable for the rest of the round;
- small-country callouts: Cabo Verde, The Gambia, Guinea-Bissau, Sierra Leone, and Togo;
- Benin: clipped neutral-space assistance retained;
- regional context: full faded Africa remains pannable around active West Africa.

## Geometry disposition

The current Africa geometry remains intentionally classified as **MVP-grade**.

The compiled polygon-intersection audit confirmed that some apparent border seams are actual low-resolution polygon overlap, not merely stroke rendering. This release reduces visual seam amplification and avoids precision-tap dependence for the most constrained countries, but does not manually redraw political boundaries.

The required production-fidelity upgrade is tracked in [`../architecture/cartography.md`](../architecture/cartography.md) and issue #1. Broad geographic expansion should not proceed as if the current coarse topology were final.

## Naming disposition

Country-name maintenance is now governed by [`../product/country-naming.md`](../product/country-naming.md):

- UNGEGN / UNTERM primary naming reference;
- UN Statistics Division M49 for ISO linkage, region structure, current-name table, and recent changes;
- national government source as secondary confirmation when normal English display treatment requires it;
- ISO3 remains the stable application country ID.

## Tracking

Issue #1 remains open as the umbrella map-learning tracker. Its contract was updated after PR #7 to include the shipped feedback behavior, callout rules, naming policy, and high-fidelity geometry requirement.
