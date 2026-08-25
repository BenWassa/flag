# Issue #104: Map-first continent launcher

**Status:** DEFERRED PRODUCT EXPLORATION — captured, not scheduled  
**GitHub:** [#104](https://github.com/BenWassa/flag/issues/104)

## Current production baseline

Atlas v1 uses a settled one-tap row launcher after the learner chooses a domain and supported continent:

- whole-continent row starts Play for the continent;
- each region row starts Play for that region;
- each row keeps its own ordinary blue progress strip;
- region rows can show purple Mastery and restrained gold completion;
- one subordinate `Learn {Continent}` action sits below the list;
- the old launcher map, separate primary Play button and select-region-then-Play state are retired.

React/Vite production ownership is settled. This issue is **not** blocked on, coupled to or part of the #89 migration. Any future #104 implementation would be a deliberate product redesign against the stable v1 launcher.

## Deferred idea

Explore replacing the row list with an immersive continent map as the primary scope-selection surface, potentially using canonical country geometry grouped into learner-facing regions.

Earlier sketches considered:

- full-bleed continent geography;
- tappable region shapes;
- calm region tinting;
- progress encoded into map fill/saturation/density;
- stronger use of geography itself as the achievement/progress object.

Those are exploration inputs, not accepted requirements.

## Why it remains deferred

### 1. It conflicts with the locked semantic-colour system

Current product policy explicitly rejects a continent/region/hemisphere identity palette. Geography identity comes from shape, name, hierarchy and context.

Tinting each region by identity would reverse that rule. That reversal might be defensible, but only through an explicit product/design decision with a clear accessibility rationale.

### 2. Colour-only geography-encoded progress is insufficient

Atlas requires state to have a non-colour cue. Saturation/fill density alone cannot communicate precise progress or distinguish it safely from action/selection semantics.

Atlas Blue already means ordinary action/selection and ordinary progress; purple means durable Mastery; gold means scarce completion. A map-first design must preserve those semantic roles or explicitly replace them through a reviewed system-level decision.

### 3. A real interactive launcher map is a new product component

The retired launcher decoration was not the canonical gameplay map. A production map-first launcher must use the existing generated Natural Earth topology/`MapRegionAsset` infrastructure rather than inventing positioned labels, handwritten region geometry or another topology source.

### 4. The current row launcher is coherent and shipped

The one-tap launcher removed the earlier two-method/two-step scope-selection problem and now carries progress, Mastery and completion without a separate selection state.

Replacing it should therefore solve a demonstrated product problem or create a materially better geography-learning experience — not happen merely because a map can be built.

## Preservation boundaries

Any future implementation must preserve unless a separate product decision explicitly changes them:

- Natural Earth 1:10m as the sole production topology source;
- canonical ISO3 country identity;
- typed durable routing and native Back/Forward behaviour;
- activity-refresh fallback;
- Atlas Blue = ordinary action/progress;
- green/red = correctness;
- purple = durable region × domain Mastery;
- gold = scarce completion/prestige;
- no colour-only state;
- honest unsupported continent shells;
- existing learning evidence, scoring, storage and achievement qualification semantics;
- mobile-first usability and no horizontal primary-selection dependency.

## Questions that must be answered before scheduling

- What user problem does a map-first launcher solve better than the current one-tap rows?
- Is region identity tinting still required? If so, is reversing the no-region-colour rule justified?
- What non-colour progress cue accompanies any geographic fill treatment?
- How are purple Mastery and gold completion represented without confusing geographic fill with selection?
- Where does whole-continent Play live?
- Where does Learn live?
- How do unavailable North America/Oceania states remain honest without looking like zero progress?
- What is the keyboard/focus model for region selection?
- How does the composition work at narrow portrait and short-landscape sizes?

## Scheduling rule

Keep #104 open as **DEFERRED PRODUCT EXPLORATION**. Do not implement it opportunistically during unrelated navigation, cartography, React, colour or achievement work.

Before scheduling, convert the exploration into a focused product/design decision with an explicit problem statement, accessibility model and preservation/acceptance criteria.
