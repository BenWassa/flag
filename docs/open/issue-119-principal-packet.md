# Issue #119 — Full Spatial Atlas implementation packet

**Status:** READY FOR PRINCIPAL/FULL-IMPLEMENTATION AGENT.  
**Authority:** `issue-119-plan.md` is the execution plan.  
**Working base:** `explore/spatial-atlas-moonshot`.  
**Create:** `moonshot/full-spatial-atlas`.  
**Production `main`:** do not merge or replace without a later explicit owner decision.

## Mission

Take the existing Spatial Atlas prototype and build it into the strongest credible **complete parallel Atlas candidate**.

Do not stop at the old H1 gate. The owner has explicitly authorised the exploration branch to proceed through the previously reserved F1/F2/F3 decisions and full implementation so the final judgement can be made against a mature candidate rather than a cheap probe.

The target experience is:

`Mode → World → Continent → Region → Learn/Play → Results → spatial return`

across **Flags, Locations, Outlines and Neighbours**, all six continents, with the existing Atlas product engine preserved underneath.

## Read first

Keep the initial context set small:

1. live Issue #119;
2. `DESIGN.md`;
3. `.impeccable/design.json`;
4. `docs/open/issue-119-plan.md`;
5. `experiments/spatial-atlas/README.md`;
6. `docs/open/issue-119-invariant-harness.md`;
7. `docs/ROUTING.md`;
8. `docs/MAP_GEOMETRY_SOURCES.md` + `docs/CARTOGRAPHY_PROVENANCE.json`;
9. `docs/COUNTRY_NAMING.md`.

Use `issue-119-renderer-comparison.md` and `issue-119-geometry-lod-experiment.md` only when making F2/F3 decisions. Ignore archived #119 handoffs unless a historical fact is disputed.

## Existing starting point — do not rebuild it

The current branch already contains a working persistent Three.js Earth with:

- typed-route-driven camera state;
- all six continents and every region reachable;
- mode-first navigation;
- continent/region picking;
- equivalent real DOM scope controls;
- interruptible camera travel;
- native Back;
- reduced-motion snapping;
- WebGL failure fallback;
- one real Flags round and Results;
- generated Natural Earth spherical geometry from the canonical pinned source.

Measured current cost is roughly 135.63 kB gzip JS + 269.5 kB gzip world geometry. Mobile hardware performance is not proven.

Current known gaps include:

- Locations, Outlines and Neighbours real activity integration;
- runtime LOD switching;
- complete antimeridian handling;
- final renderer choice;
- production-grade accessibility/focus semantics;
- mobile/PWA/performance hardening.

Extend this work. Do not restart from a blank renderer or introduce a second geography source.

## Decisions you own

You are authorised to decide and document:

### F1 — Spatial interaction contract

Write `docs/open/issue-119-spatial-interaction-contract.md` and implement it. Resolve hierarchy, progressive disclosure, gestures, interruption/reversal, reduced motion, activity transitions and especially Locations-vs-globe.

### F2 — Renderer / scene / camera architecture

Write `docs/open/issue-119-renderer-decision.md`. Use existing evidence plus focused new measurements where necessary, then choose. Plain Three, R3F and MapLibre are candidates, not commitments.

### F3 — Spherical geography / LOD contract

Write `docs/open/issue-119-spherical-geography-contract.md`. Define generated world/continent/region LOD, display/picking geometry, microstates, antimeridian/multipart handling, runtime switching and disposal while preserving the single canonical Natural Earth pipeline.

Do not leave these decisions permanently parked. Make them at the point where evidence is sufficient and continue implementation.

## Non-negotiable invariants

Preserve:

- URL authority and typed hash routing;
- native Back/Forward and direct deep links;
- ephemeral active-round state;
- one router/history stack;
- ISO3 identity;
- one pinned Natural Earth source;
- current curriculum/region membership;
- scoring/evidence/Mastery/achievement semantics;
- storage/Firebase contracts;
- British English;
- real DOM controls, keyboard access, visible focus and reduced motion;
- PWA/offline behaviour;
- Atlas semantic colour roles;
- geography as the dominant visual object.

No handwritten country geometry, duplicate neighbour tables, satellite/terrain aesthetic, 3D-only accessibility path, or unrelated gamification redesign.

## Implementation priority

1. create `moonshot/full-spatial-atlas` from the current exploration head;
2. F1 design contract;
3. F2 renderer decision;
4. F3 spherical/LOD contract;
5. canonical generated asset + runtime LOD implementation;
6. production-quality persistent shell and route integration;
7. world/continent/region navigation + DOM parity;
8. Flags real application lifecycle;
9. Locations end to end;
10. Outlines end to end;
11. Neighbours end to end;
12. Results/Mastery/Crown spatial presentation;
13. accessibility/fallback hardening;
14. performance/PWA/mobile-layout hardening;
15. complete automated acceptance and exact-artifact inspection;
16. candidate PR back to `explore/spatial-atlas-moonshot` — **never `main` in this task**.

## Performance direction

The current prototype payload is too expensive to accept passively. Aggressively reduce the lazy spatial-entry cost; `issue-119-plan.md` sets a directional target of ≤250 kB gzip for renderer + initial world-selection geography where technically reasonable.

Require render-on-demand at idle, constrained/adaptive DPR, real runtime LOD switching, recoverable context failure and explicit payload measurements.

Do not invent physical-device numbers. Real GPU frame pacing, thermals, battery and OS edge-gesture coexistence remain pending until hardware testing occurs.

## Verification

`npm test` remains the primary gate. Add spatial tests rather than weakening existing invariants.

The final candidate must have automated evidence for routing/history, deep links, interrupted/reduced-motion camera behaviour, geography/DOM action parity, all continents/regions, all four real domain flows, Results, persistence semantics, LOD/microstates/antimeridian cases, renderer fallback, idle rendering, accessibility basics, deterministic generation, exact payload cost and PWA/offline regression.

Inspect the exact built artifact at narrow portrait, Pixel-class portrait, tablet portrait, short landscape and desktop. Do not call browser emulation physical-device testing.

## Final handoff standard

Report:

- branch/head;
- F1/F2/F3 decisions;
- architecture implemented;
- four-domain completion matrix;
- exact payload/geometry costs;
- automated and browser verification actually run;
- unresolved physical-device-only evidence;
- known defects/limitations;
- fallback status;
- what remains before any production migration.

The objective is not to prove the moonshot should ship. The objective is to produce the best credible full candidate so that decision is worth making.
