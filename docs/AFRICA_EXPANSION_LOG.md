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

### 10:43 — Shared 54-country Africa geometry created

**Change**

- Added a shared Africa geometry catalog covering all 54 application countries.
- Mainland countries use projected MVP polygons consistent with the existing West Africa pilot.
- Somalia's application geometry represents the app's single `SOM` curriculum item rather than exposing a separate Somaliland scoring target.
- Western Sahara remains visible only as non-scoring contextual geography because it is not one of the app's 195 country IDs.
- The Africa viewBox was widened to `0 0 835 723` so Mauritius and Seychelles remain on the shared canvas.

**Island treatment**

Five countries use explicit point locators at this MVP scale:

- Cabo Verde;
- São Tomé and Príncipe;
- Comoros;
- Mauritius;
- Seychelles.

Each island country has one visible dot. The renderer adds a larger invisible touch circle around that same dot while the country is selectable. There is no leader line and no second visible target.

### 10:47 — Africa scope model expanded

Added six selectable map scopes:

- Africa — 54 countries;
- North Africa — 6;
- West Africa — 16;
- Central Africa — 9;
- East Africa — 18;
- Southern Africa — 5.

The five regional scopes partition the 54-country Africa catalog exactly.

Regional assets now separate:

- `countries` — active/scored countries;
- `contextCountries` — the other African catalog countries, rendered but non-scoring;
- `contextPaths` — extra non-catalog contextual geography.

This is more robust than the pilot's anonymous context-path array because islands and future metadata can remain structured while faded.

### 10:50 — Small-country rule corrected before expansion

The previous v4 callout set was intentionally reduced.

**Current West Africa rule:**

- **The Gambia** — mainland callout;
- **Togo** — mainland callout;
- **Cabo Verde** — single island dot, no callout;
- Guinea-Bissau — true polygon only;
- Sierra Leone — true polygon only;
- Benin — true polygon only.

No additional mainland callouts were added pre-emptively in the new African regions. Those should be driven by actual phone play rather than adding cartographic clutter from desktop geometry measurements alone.

### 10:52 — Context contrast increased

**Finding**

The previous context styling used `opacity: .28`, forcing both country fill and border toward the background. This preserved hierarchy by making the context difficult to see, which is the wrong tradeoff for a spatial-learning surface.

**Change**

- removed blanket low opacity in normal rendering;
- use a subordinate context fill and `var(--line-strong)` border at full opacity;
- increased context stroke from `.58` to `.75`;
- added the same context styling for island locator dots;
- active-region countries still remain more salient through their separate fill/border treatment.

The hierarchy now comes from **tone and state**, not from making surrounding Africa nearly disappear.

### 10:55 — Navigation and persistence generalized

- Home now exposes **Africa · 54 countries · 5 regions** instead of `West Africa · Pilot`.
- Africa location home provides Learn/Test plus a five-region drill list.
- Regional location homes provide their own progress, Learn/Test actions, and country ledger.
- A map round loads the asset for its actual current scope rather than reusing whichever map asset happened to be cached in application state.
- Results, mistake review, repeat, Escape/back behavior, document titles, and history routing retain the active map scope.
- Location progress remains on the existing separate `location-progress:v1` ledger; new African country records are defaulted in without deleting existing West Africa progress.
- PWA cache version bumped to `flag-atlas-v7` to replace stale map CSS/code after deployment.

### 10:58 — Expansion regression contract written

Automated verification now covers:

- exact 54-country Africa coverage and no duplicate IDs;
- exact five-region partition;
- active + context country coverage for every region;
- shared viewBox and per-scope initial focus;
- Western Sahara as non-scoring context;
- five island dot locators with enlarged invisible touch surfaces;
- exact mainland callout set of `GMB` and `TGO`;
- no extra GNB/SLE/BEN callout/assist machinery;
- context-island rendering;
- strengthened context CSS and removal of `.28` opacity;
- existing feedback semantics and Test integrity;
- resolved-country inertness;
- scoped map home/results routing;
- an all-Africa round spanning all five regions;
- PWA cache v7.

### 11:00 — First expansion CI failed; assertion flaw isolated

**Run:** GitHub Actions CI #44 (`32267406133`).  
**Build:** passed.  
**Existing 195-country flag verification:** passed.  
**Failure:** map expansion assertion `Cabo Verde does not render a redundant callout line.`

**Root cause**

The test searched the entire West Africa SVG for any `map-country__callout-line`. A Cabo Verde round correctly still displays The Gambia and Togo's approved contextual callout lines, so the test conflated **another country's callout** with **Cabo Verde having a callout**.

The product model was correct; the assertion scope was wrong.

**Correction**

- island callout assertions now inspect Cabo Verde's own SVG country group;
- the same correction was applied to the dedicated v4 edge regression;
- the tests still require GMB/TGO callouts to remain visible in the same regional map.

**Evaluation**

This preserves the desired cartographic behavior: approved mainland callouts are persistent map landmarks, while an island nation's own representation remains a single dot target.

## Next gate

Rerun the complete CI suite on the corrected branch, inspect the exact production artifact, then red-team regional navigation, context contrast contracts, scope persistence, island targets, and all-Africa coverage before merge.
