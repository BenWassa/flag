# Issue #119 — Principal-model handoff

> **Superseded by [`../closed/issue-119-plan.md`](../closed/issue-119-plan.md).**
>
> Its entry gate is superseded: the renderer comparison it marked GREEN has been downgraded to AMBER, and two repair tasks now precede the principal session. See [`../closed/issue-119-renderer-comparison.md`](../closed/issue-119-renderer-comparison.md).


**Audience:** Claude Opus / GPT Sol high-effort principal session  
**Current status:** **GREEN FOR PRINCIPAL EVIDENCE REVIEW — support runtime evidence is reconciled; no renderer has been selected**
**Exploration branch:** `explore/spatial-atlas-moonshot`  
**Current production base reconciled into branch:** `main` SHA `d8f52ec`

## 1. Principal mission

When the entry gate below is green, act as the **principal product/interaction architect** for Atlas Issue #119.

The mission is not "add a globe".

The mission is to determine whether Atlas can become a continuous spatial geography-learning interface in which durable route changes are perceived as movement through one persistent world rather than replacement of discrete screens — and, if so, to define the architecture and build the Africa vertical slice to a quality level worth continuing.

## 2. Do not spend frontier context rediscovering these facts

### Product / architecture truth

- Atlas is React 19 + Vite on current `main`.
- Country identity is ISO3.
- Durable route state already expresses domain → continent/region → activity semantics.
- Browser hash history remains authoritative; Back/Forward must remain native.
- Active quiz internals remain ephemeral session state.
- `AtlasApp` is the central presentation/orchestration seam; current product views are selected centrally from store state.
- Current learning/scoring/mastery/storage semantics are preservation boundaries.
- Learner-facing copy uses British English.

### Geography truth

- Canonical production cartography is pinned Natural Earth 1:10m.
- The generator reconciles canonical Atlas identities/policy **before projection**, so a spherical output can branch from the same source rather than introducing another dataset.
- Existing `MapRegionAsset` SVG paths are projected outputs and are not the correct spherical source.
- North America and Oceania are still unsupported production curriculum/geography shells; do not pretend complete runtime map assets already exist for them.

### Gesture truth

- Atlas already owns a left-edge Back gesture contract.
- The current navigation gesture starts only within a 28 CSS px gutter and explicitly yields to map viewports / controls.
- The spatial renderer must therefore not indiscriminately claim full-width horizontal touch input from the left edge.

### Production payload baseline

Measured from the exact deployed GitHub Pages artifact for current `main`:

- core `app.js`: 325,284 raw / **97,992 gzip bytes**;
- Atlas/theme/styles/map/neighbour/outline CSS combined are roughly **24 KB gzip**;
- Africa lazy geography: **241,683 gzip bytes**;
- South America: **241,443 gzip bytes**;
- Europe: **432,021 gzip bytes**;
- Asia: **493,043 gzip bytes**;
- Firebase lazy chunk: **135,796 gzip bytes**.

Do not compare a new renderer's lazy chunk to an invented zero-cost baseline.

### Geometry feasibility truth

The support experiment using exact deployed country paths shows a lightweight display LOD is plausible.

For the four currently shipped continents' country geometry:

- current projected country paths: ~840 KB gzip as compact path JSON;
- RDP ≤1 current canvas unit: ~82 KB gzip;
- RDP ≤2 units: ~53 KB gzip;
- those tolerances correspond to roughly 0.47 / 0.93 CSS px at a 390 px-wide 835-unit continent frame.

This is a payload envelope, **not** the final spherical simplification algorithm.

Uniform simplification damages microstates disproportionately. A hierarchical LOD with precision-sensitive exceptions and/or separate picking representation is likely required.

Do not spend principal time proving that geometry can be reduced; decide the correct representation and transition thresholds.

## 3. Candidate renderer facts already researched

### R3F / Three candidate

Current observed compatible stack:

- `@react-three/fiber` 9.7.0;
- Three r185 / 0.185.x;
- `@react-three/drei` 10.7.5;
- `camera-controls` 3.1.2.

R3F 9.7.0 declares React >=19 <19.3 compatibility. R3F supports on-demand rendering. Drei exposes CameraControls.

**Live risk:** https://github.com/pmndrs/react-three-fiber/issues/3863 is open and reports a development-only StrictMode Canvas remount/deferred-dispose context-loss failure. Atlas currently uses React `StrictMode`. Treat the support reproduction result as authoritative once populated; do not casually remove application-wide StrictMode just to make the candidate work.

### MapLibre candidate

Current observed stable:

- MapLibre GL JS 6.6.0 (2026-08-24).

Facts:

- v6 is ESM-only and documents Vite usage;
- globe projection is first-class;
- GeoJSON layers, picking, camera control and custom WebGL/Three layers are supported;
- recent 6.5/6.6 releases include globe-specific drag/zoom/tile-selection fixes.

Do not assume either that "map-native is automatically better" or that "custom Three gives better game feel". Use the common spike evidence.

## 4. ENTRY GATE

Before starting F1/F2 principal work, all boxes should be true.

### Complete support work

- [x] Issue #119 product moonshot scope exists.
- [x] LLM execution plan protects frontier decisions.
- [x] Branch is reconciled with current `main`.
- [x] Routing / `AtlasApp` integration seams documented.
- [x] Existing gesture ownership documented.
- [x] Exact deployed bundle baseline measured.
- [x] Canonical geography branching point identified.
- [x] Low-detail geometry payload feasibility measured.
- [x] Small-country/precision exception risk identified.
- [x] Common prototype verification plan defined.
- [x] Candidate library versions / live ecosystem risks researched.
- [x] **R3F disposable runtime spike executed and `issue-119-r3f-spike-results.md` populated** — source report `e481633`.
- [x] **MapLibre disposable runtime spike executed and `issue-119-maplibre-spike-results.md` populated** — source report `f57c276`; its headless SwiftShader blank-source blocker is recorded, not waived.
- [x] Support layer reconciles those two reports into a short neutral comparison with every mandatory row PASS, FAIL or UNCLEAR.
- [x] Rechecked `main` for drift and semantically reconciled `d8f52ec` into the exploration evidence branch before this handoff.

The support entry gate is **GREEN**: the principal should read the completed
comparison rather than recreate package/runtime measurements. This does not
preselect a renderer or waive its recorded failures/unknowns.

## 5. Read order for the principal session

Read in this order:

1. live GitHub Issue #119;
2. `CLAUDE.md`;
3. `DESIGN.md`;
4. `.impeccable/design.json`;
5. `docs/closed/issue-119-spatial-atlas-moonshot.md`;
6. `docs/closed/issue-119-llm-execution-plan.md`;
7. **this file**;
8. `docs/closed/issue-119-r3f-spike-results.md`;
9. `docs/closed/issue-119-maplibre-spike-results.md`;
10. `docs/closed/issue-119-geometry-lod-experiment.md`;
11. `docs/closed/issue-119-prototype-verification-plan.md`;
12. only then inspect implementation files required to challenge/complete the architecture.

The larger `issue-119-pre-opus-handoff.md` and `issue-119-support-evidence.md` are reference material if a fact needs tracing; they should not need to be reread linearly unless the principal finds contradictions.

## 6. Frontier-owned decisions

The support layer has intentionally **not** decided these.

### F1 — final product / interaction contract

Own:

- what "continuous spatial" actually means in interaction terms;
- free globe exploration vs guided camera behaviour;
- hierarchy and progressive disclosure at World / continent / region;
- relationship between geography and accessible DOM controls;
- activity entry/exit continuity;
- reduced-motion interpretation;
- what is spatially persistent during Flags / Locations / Outlines / Neighbours;
- when motion clarifies hierarchy versus becomes friction/spectacle.

### F2 — renderer / scene / camera architecture

Own:

- R3F/Three vs MapLibre or a justified alternative;
- renderer lifetime and React boundary;
- `SpatialAtlas` ownership model;
- semantic `CameraDirector` contract;
- route → spatial-destination derivation;
- interruption/cancellation model;
- DOM/3D picking/action convergence;
- renderer failure/fallback architecture;
- lazy loading and render-loop policy;
- high-level spherical asset representation / LOD contract.

### F4 — integrated Africa vertical slice

After F1/F2 are written down, build/prove:

```text
Mode
→ World
→ Africa
→ West Africa
→ Back to Africa
→ Back to World
```

A working spinning globe is not an acceptance criterion.

The result must feel materially better and more geographically coherent than the current one-tap launcher on a phone-sized experience while preserving route/history/accessibility/PWA truth.

## 7. Decisions the principal should NOT casually reopen

Unless evidence shows the current contract itself blocks the moonshot:

- ISO3 identity;
- Natural Earth canonical source/provenance;
- geopolitical policy;
- storage namespaces;
- learning/evidence/scoring semantics;
- earned Mastery semantics;
- Firebase behaviour;
- stable route compatibility;
- browser Back/Forward ownership;
- British English;
- semantic colour roles;
- existing domain-native quiz mechanics.

Escalate a true conflict explicitly rather than smuggling an unrelated migration into the prototype.

## 8. First principal output before broad implementation

Before building a large prototype, commit a concise architecture decision recording:

1. chosen renderer and why the support evidence favours it;
2. rejected renderer and what evidence outweighed its advantages;
3. persistent scene lifecycle;
4. route → spatial destination model;
5. camera interruption/reduced-motion model;
6. DOM accessibility/picking model;
7. globe asset/LOD model;
8. mobile gesture ownership;
9. fallback/error strategy;
10. the smallest Africa vertical slice that can falsify the product hypothesis.

Then implement against that decision.

## 9. Suggested principal-session prompt

Use the following as the session opener once the entry gate is green:

> You are the principal product/interaction architect for Atlas Issue #119. This is a protected frontier-model task. The support work is complete; do not spend context redoing mechanical repository archaeology or package comparison unless evidence is contradictory. Read the specified files in `docs/closed/issue-119-principal-handoff.md` in order, then independently challenge the moonshot. Own F1 and F2: decide the spatial interaction contract, renderer, persistent scene architecture, semantic camera system, DOM/3D composition, gesture ownership, spherical LOD contract and failure strategy. Preserve Atlas's documented routing, learning, persistence, cartography and accessibility invariants. Record the architecture decision before broad implementation, then build the Africa World → Africa → West Africa vertical slice deeply enough to test whether the product hypothesis deserves to continue. Do not accept a technically functioning spinning globe as success; the prototype must be materially better than the current launcher on a phone-sized experience.

## 10. Principal stop conditions

Stop and report rather than scaling the pattern if:

- renderer/runtime cost makes a persistent mobile PWA materially worse;
- native Back and globe manipulation cannot coexist cleanly;
- accessibility requires a parallel interface so dominant that the globe becomes decorative overhead;
- route truth starts being duplicated into an animation state machine;
- canonical geography requires an unsafe second source/policy system;
- the best Africa interaction remains slower/more confusing than the v1 launcher after serious refinement;
- the architecture needs unrelated changes to scoring/storage/mastery to justify itself.

A moonshot being rejected by strong evidence is a successful exploration outcome.
