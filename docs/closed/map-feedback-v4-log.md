# Map feedback v4 worklog

**Branch:** `agent/map-feedback-v4`  
**Started:** 2026-08-19 09:57 EDT (America/Toronto)  
**Scope:** on-device answer feedback, country border seams, country naming, resolved-country click behavior, small-country touch callouts, and geometry-fidelity backlog.

This log extends `MAP_UX_REFINEMENT_LOG.md` and `MAP_GAMEPLAY_REFINEMENT_LOG.md`. Entries use **observation → assessment → change → verification → evaluation**.

## 2026-08-19

### 09:57 — Production feedback received

Observed from real mobile play:

- some country SVG borders show slight overlap/seam artifacts;
- tapping a country does not feel responsive: the map largely remains white/outlined with no sufficiently visible fill, animation, or acknowledgment;
- the Africa SVG is acceptable as an MVP but its geographic fidelity is not yet trusted as a final source;
- the project should explicitly track a later high-accuracy geometry upgrade.

### 10:00 — Existing answer-state hierarchy audited

**Finding**

The renderer did create Learn answer classes, but the visual hierarchy was too weak:

- unanswered countries were already very light;
- first-try persistent fill was white;
- the transient green state lasted only until automatic advance;
- focus restoration could visually compete with the result state;
- Test intentionally suppressed correctness and therefore offered almost no visible map acknowledgment beyond focus/outline.

**Assessment**

This is a real interaction-design defect rather than merely a color preference. A touch UI needs immediate acknowledgment of physical input before the learner has to infer state from changing text or the next prompt.

### 10:02 — Feedback visual hierarchy rebuilt

Implemented three distinct layers:

1. **Physical press** — neutral action-blue press state while the finger/pointer is down.
2. **Immediate answer response**
   - Learn first-try correct → strong green fill/border animation;
   - Learn wrong → strong red transient fill/border;
   - Test → neutral blue `recorded` animation that never discloses correctness.
3. **Persistent Learn round evidence**
   - first try → off-white;
   - one miss → amber;
   - two misses → orange;
   - reveal → red.

Unanswered active countries are now visibly gray enough that a completed off-white country reads as a state change.

### 10:04 — Border rendering mitigation

**Finding**

The current pilot geometry is coarse and consists of independently rendered country polygons. Shared edges are therefore susceptible to simplification mismatches; heavier strokes amplify them.

**Change**

- reduced base country/context stroke widths;
- used rounded line joins/caps and low miter limits;
- enabled `shape-rendering: geometricPrecision`;
- kept context strokes lighter than active geography;
- used `paint-order` so fills reduce the apparent width of doubled shared edges.

**Evaluation**

This reduces visible seam/double-outline artifacts, but deliberately does **not** claim to repair source topology. The source-data upgrade is separately documented in `MAP_GEOMETRY_SOURCES.md`.

### 10:06 — Additional gameplay requirements received

New requirements added without stopping the pass:

- audit country names against a durable authoritative source;
- display **The Gambia**, not `Gambia`;
- green feedback is valid **only for a first-try correct answer**;
- if the learner already missed once/twice and then gets it right, go directly to amber/orange rather than flashing green first;
- countries already resolved earlier in the round should no longer be clickable;
- tiny/narrow countries should get explicit cartographic touch callouts: a leader line from the real geography to a nearby visible touch target, rather than requiring extreme zoom or relying only on invisible hit circles;
- Cabo Verde should keep its real island dot/locator and receive a nearby callout touch target.

### 10:08 — Country naming authority established

**Research**

Primary naming reference selected:

- UNGEGN World Geographical Names / UNTERM for English short/formal country names;
- UN Statistics Division M49 for ISO-alpha3 linkage, regional grouping, recent changes, and its UNTERM-based day-to-day country-name table;
- national government sources as secondary confirmation when normal English article/endonym display treatment matters.

**The Gambia**

UNGEGN records the English short name as `Gambia (the)` and the formal name as `the Republic of the Gambia`, sourced from `UN terms`. The official Government of The Gambia also consistently uses `The Gambia` in normal English prose.

**Change**

- primary `GMB` display changed to **The Gambia**;
- `Gambia` retained as an alias;
- added regression checks for rename-sensitive names already present in the catalog: Cabo Verde, Côte d'Ivoire, Eswatini, Czechia, North Macedonia, Timor-Leste, and Türkiye;
- documented the ongoing source policy in `docs/product/country-naming.md`.

### 10:10 — Outcome-color logic corrected

**Finding**

The v3 renderer classified any resolved correct current target as `map-country--current-correct`, so a correct answer after one/two prior misses could flash green before settling to amber/orange.

**Change**

The green transient state is now emitted **only when `resolution === 'first-try'`**.

- first try → green immediate confirmation → off-white persistent state;
- one prior miss → immediately amber;
- two prior misses → immediately orange;
- third miss/reveal → red.

Automated verification explicitly rejects a green class after a one-miss correction.

### 10:11 — Resolved countries made inert

**Finding**

Every active-country `<g>` previously retained `data-action="map-answer"` throughout the round, even after that country had already been resolved on an earlier prompt.

**Change**

- map answer actions/tab stops are rendered only when that country's target state is unresolved;
- resolved countries keep their score fill but lose pointer cursor/action semantics;
- current-target invisible assistance is removed immediately once that target resolves;
- regression verification confirms a resolved country disappears from the interactive ID set after advancing.

### 10:12 — Small-country callout system implemented

Added explicit `MapCountryCallout` metadata and rendering:

- leader line starts at/near the true country geometry;
- visible circular target sits in nearby neutral/ocean space;
- an approximately 44px effective invisible hit ring surrounds that visible target;
- callout participates in focus, press, answer, persistent score, reduced-motion, and forced-color states;
- the original real polygon/locator remains visible and clickable while unresolved;
- resolved callout hit rings become inert along with the country.

Initial callouts were added for **The Gambia, Togo, and Cabo Verde**. During red-team review this was expanded to the full set of pilot countries whose phone-scale geometry is genuinely compact enough to benefit without overcrowding the map:

- **Cabo Verde** — real island locator retained; callout in nearby Atlantic space;
- **The Gambia** — Atlantic callout west of the Senegal-enclosed strip;
- **Guinea-Bissau** — Atlantic callout south-west of the mainland shape;
- **Sierra Leone** — coastal callout south-west of the compact polygon;
- **Togo** — Gulf of Guinea callout south of the narrow state.

The five callout hit areas were checked for overlap with active country polygons and with one another. **Benin deliberately keeps clipped neutral-space hit assistance** rather than adding another Gulf callout: its full polygon remains legible and this avoids unnecessary callout clutter.

### 10:13 — Geometry upgrade path documented

Created `docs/architecture/cartography.md`.

Current decision:

- keep the existing coarse Africa SVG as MVP-grade for now;
- do not hand-edit dozens of border coordinates to chase seams;
- production upgrade should use one consistent high-detail topology pipeline.

Near-term candidate is **Natural Earth 1:10m Admin-0 Countries** with companion boundary data. Longer-term, evaluate **UN Maps** authoritative boundary products if their licensing/download/build characteristics fit the PWA.

The future pipeline must derive active fills, faded context, and shared borders from the same source/release so the same international boundary is not independently simplified twice.

### 10:16 — First full v4 CI passed

**Run:** GitHub Actions CI #32 (`32262986907`).  
**Result:** success.

The complete build + existing flag verification + expanded map verification passed with:

- new callout model;
- The Gambia naming;
- first-try-only green logic;
- resolved-country inertness;
- neutral Test acknowledgment;
- cache-version bump.

### 10:17 — Test-mode red-team found an answer-cue edge case

**Scenario**

In Test mode, suppose question A is answered incorrectly by tapping country B, and country B happens to be the **next prompt**. The neutral blue `recorded` feedback for the previous tap could survive the 180ms automatic advance and briefly highlight B while B had become the current answer.

**Assessment**

Even though blue meant only “recorded,” its persistence across question boundaries could leak useful answer information. This violates the Test contract.

**Change**

- recorded feedback remains visible immediately after the tap;
- after advance, it is suppressed if the previously selected country is now the new current target;
- added `scripts/verify-map-v4-edge.mjs` reproducing this exact sequence and fails if `map-country--recorded` remains on the new answer.

### 10:18 — Final CI and production artifact passed

**Run:** GitHub Actions CI #35 (`32263174807`).  
**Result:** success.

Artifact:

- name: `flag-atlas-dist`;
- artifact ID: `9369079112`;
- size: 54,520 bytes;
- digest: `sha256:10c15121f5b8a274701b1840afe95054517979f212a1930fb63fa7add3ddc8c0`.

The exact compiled artifact was inspected and confirmed to contain:

- `The Gambia` in the country catalog;
- callout metadata/rendering;
- strong Learn answer states;
- neutral Test recorded state plus next-target leak suppression;
- resolved-country action removal;
- PWA cache `flag-atlas-v6`.

### 10:22 — Compiled polygon intersections measured

The exact compiled active West Africa paths were parsed as polygons and checked pairwise rather than relying on visual impression alone.

**Finding**

The overlap is partly a real source-geometry problem, not just CSS strokes. Sixteen active-country pairs have measurable positive-area intersections after the pilot geometry's coarse projection/coordinate rounding. The most material relative intersections occur around small/narrow states, including:

- Ghana / Togo: intersection ≈ **6.6% of Togo's rendered polygon area**;
- Guinea-Bissau / Senegal: intersection ≈ **8.5% of Guinea-Bissau's rendered polygon area**;
- Benin / Burkina Faso: ≈ **1.2% of Benin**;
- Mauritania / Senegal and Guinea / Senegal: roughly **1% of the smaller polygon**.

Other intersections are smaller fractions.

**Interpretation**

This confirms that heavier outlines were amplifying an actual low-resolution topology defect. CSS can make the seams less distracting, but cannot make these independently simplified polygons share the exact same border.

**MVP decision**

- keep the rendering mitigation;
- use explicit callouts for the most phone-constrained states so the learner does not need to adjudicate an inaccurate microscopic border;
- keep Benin's clipped assist;
- do **not** manually redraw individual political boundaries in this UI patch;
- treat the high-fidelity topology pipeline in `MAP_GEOMETRY_SOURCES.md` as a required pre-expansion quality upgrade rather than optional polish.

### 10:23 — Callout set red-teamed for clutter and collision

The first three callouts were expanded to five after comparing rendered bounding boxes and available ocean space. Their approximately 44px effective hit circles were checked against active polygons and each other.

Final callout set: **CPV, GMB, GNB, SLE, TGO**.  
Benin retains clipped assistance.

A dedicated edge regression now asserts this callout set and confirms that the callout countries no longer retain competing invisible enlarged hit-assist metadata.

## Final evaluation

- **Tap responsiveness:** materially strengthened. Press, first-try success, wrong guess, Test-recorded, and persistent Learn score are distinct states.
- **Green semantics:** green is first-try-only. Correct after prior misses goes directly to amber/orange.
- **Test integrity:** neutral acknowledgment is visible but cannot carry forward to cue the next answer.
- **Resolved countries:** inert after being solved; no repeated accidental clicks.
- **Small countries:** visible cartographic callouts make touch affordance explicit instead of silently falsifying the polygon size.
- **Country naming:** The Gambia corrected; a durable UN-first naming policy and rename regression set now exist.
- **Borders:** visual seam amplification reduced; quantitative analysis confirms the remaining issue belongs to source topology.
- **Geometry fidelity:** current Africa asset is explicitly MVP-grade. A production-quality source/topology upgrade is documented and required before broad map expansion.
- **Offline release:** service-worker cache bumped so stale mobile map CSS does not mask the new feedback system.

## Merge recommendation

**Ready to merge once the latest head CI is green.** The remaining geometry limitation is known, measured, and deliberately separated into a source-data upgrade rather than hidden behind manual SVG edits.
