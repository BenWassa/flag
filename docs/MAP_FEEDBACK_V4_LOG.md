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

The current pilot geometry is coarse and consists of independently rendered country polygons. Shared edges are therefore susceptible to tiny simplification mismatches; heavy strokes amplify them.

**Change**

- reduced base country/context stroke widths;
- used rounded line joins/caps and low miter limits;
- enabled `shape-rendering: geometricPrecision`;
- kept context strokes lighter than active geography;
- used `paint-order` so fills reduce the apparent width of doubled shared edges.

**Evaluation**

This should reduce visible seam/double-outline artifacts, but it deliberately does **not** claim to repair source topology. The source-data upgrade is separately documented in `MAP_GEOMETRY_SOURCES.md`.

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
- documented the ongoing source policy in `docs/COUNTRY_NAMING.md`.

### 10:10 — Outcome-color logic corrected

**Finding**

The v3 renderer classified any resolved correct current target as `map-country--current-correct`, so a correct answer after one/two prior misses could flash green before settling to amber/orange.

**Change**

The green transient state is now emitted **only when `resolution === 'first-try'`**.

- first try → green immediate confirmation → off-white persistent state;
- one prior miss → immediately amber;
- two prior misses → immediately orange;
- third miss/reveal → red.

Automated verification now explicitly rejects a green class after a one-miss correction.

### 10:11 — Resolved countries made inert

**Finding**

Every active-country `<g>` previously retained `data-action="map-answer"` throughout the round, even after that country had already been resolved on an earlier prompt.

**Change**

- map answer actions/tab stops are rendered only when that country's target state is unresolved;
- resolved countries keep their score fill but lose pointer cursor/action semantics;
- current-target invisible assistance is also removed immediately once that target resolves;
- regression test verifies a resolved country disappears from the interactive ID set after advancing.

### 10:12 — Small-country callout system implemented

Added explicit `MapCountryCallout` metadata and rendering:

- leader line starts at/near the true country geometry;
- visible circular target sits in nearby neutral/ocean space;
- an approximately 44px effective invisible hit ring surrounds that visible target;
- callout participates in focus, press, answer, persistent score, reduced-motion, and forced-color states;
- the original real polygon/locator remains visible and clickable while unresolved;
- resolved callout hit rings become inert along with the country.

Pilot callouts added for:

- **The Gambia** — target in the Atlantic west of the country;
- **Togo** — target south of the coast in the Gulf of Guinea;
- **Cabo Verde** — island locator remains visible; nearby external target is connected by a leader line.

For these three countries, the visible callout replaces the earlier invisible enlarged `hitAssist` metadata. Other narrow countries such as Benin can still use clipped neutral-space hit assistance.

### 10:13 — Geometry upgrade path documented

Created `docs/MAP_GEOMETRY_SOURCES.md`.

Current decision:

- keep the existing coarse Africa SVG as MVP-grade for now;
- do not hand-edit dozens of border coordinates to chase small seams;
- production upgrade should use one consistent high-detail topology pipeline.

Near-term candidate is **Natural Earth 1:10m Admin-0 Countries** with its companion boundary data. Longer-term, evaluate **UN Maps** authoritative boundary products if their licensing/download/build characteristics fit the PWA.

The future pipeline must derive active fills, faded context, and shared borders from the same source/release so the same international boundary is not independently simplified twice.

## Verification still required before merge

- TypeScript build after the new callout model;
- full existing flag verification;
- map regression suite, including:
  - The Gambia naming;
  - green only on first try;
  - one-miss correct goes directly amber;
  - resolved country no longer interactive;
  - Test has neutral recorded feedback without correctness leakage;
  - GMB/TGO/CPV callouts exist and replace invisible hit assists;
  - remaining clipped narrow-country assistance still works;
  - PWA cache version bumps so mobile clients do not remain on stale feedback CSS;
- inspect the exact CI-built artifact before merge;
- update this log with any failures and fixes rather than silently changing expectations.
