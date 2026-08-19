# Africa map expansion worklog

**Started:** 2026-08-19 10:36 EDT (America/Toronto)  
**Scope:** continent-context contrast, small-country target cleanup, and expansion from West Africa to all African regions.

This log uses **observation → assessment → change → verification → evaluation** and continues the map UX audit trail.

## 2026-08-19

### 10:36 — Production feedback and expansion decision

Observed from mobile play:

- faded out-of-region Africa context is still too low-contrast and requires visual strain;
- island nations should use a **single dot locator/touch target**, without a redundant leader-line callout;
- West Africa only needs mainland leader-line callouts for **The Gambia** and **Togo**;
- Guinea-Bissau and Sierra Leone are sufficiently usable without callouts;
- the current MVP map is now good enough to extend the interaction system across the rest of Africa.

Expansion goal:

- preserve the current MVP geometry standard for this rollout rather than blocking on the later high-fidelity topology project;
- add North, Central, East, and Southern Africa plus an all-Africa scope;
- retain one shared full-Africa canvas so regional geography stays spatially contextual;
- keep current UN-first country naming policy and ISO3 application IDs.

### 10:38 — Source/projection reconstruction

The current West Africa paths were compared against the bundled Natural Earth low-resolution fixture used by the original pilot. The existing projection can be reproduced exactly as:

- source simplification: approximately **0.2 degrees**, topology-preserving;
- projected `x = 257 + 9.5 × longitude`;
- projected `y = 371 − 9.5 × latitude`;
- coordinates rounded to one decimal place.

This reproduces the current Ghana pilot path point-for-point and allows the rest of Africa to use the same visual geometry rather than mixing map projections.

Natural Earth 5.1.1 remains the documented cartographic source family; this expansion intentionally stays at the existing MVP fidelity. The dedicated higher-fidelity Natural Earth 1:10m / topology-aware upgrade remains a separate backlog item.
