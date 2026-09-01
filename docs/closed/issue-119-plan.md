# Issue #119 — Spatial Atlas full-candidate plan of record

**Status:** OWNER-AUTHORISED FULL IMPLEMENTATION ON THE EXPLORATION LINE — **EXECUTED**.  
**Issue:** #119 — continuous spatial Atlas shell with interactive 3D Earth navigation  
**Base exploration branch:** `explore/spatial-atlas-moonshot`  
**Production `main`:** remains untouched until a later explicit migration decision.  
**Authority:** this file supersedes the earlier H1-first stop-gate sequencing **for exploration-branch implementation only**.

## Delivery status (2026-08-29)

The plan below is the execution authority and is preserved as written. It has now
been carried out on the candidate branch. The architecture actually built is
recorded in three decision records rather than in this plan:

- [`F1 — spatial interaction contract`](issue-119-spatial-interaction-contract.md);
- [`F2 — renderer/scene/camera architecture`](issue-119-renderer-decision.md);
- [`F3 — spherical geography and LOD contract`](issue-119-spherical-geography-contract.md);
- [`architecture map`](issue-119-principal-packet.md) — the short entry point.

Two corrections to this plan's own text, made by implementation evidence:

- **§2 item 8** points at `experiments/spatial-atlas/README.md`. That prototype is
  **retired**. Its capabilities live in `src/spatial/` under test; keeping a
  second globe implementation beside the real one is the duplication §4 forbids.
- **§6's cost direction** is met: measured spatial entry is **178.8 kB gzip**
  (renderer 125.7, world geography 53.0) against the ≤ 250 kB target, down from
  the prototype's 405 kB. Core `app.js` moved 100.4 → 102.0 kB gzip.

§12's physical-device list is unchanged and unclaimed.

---

## 0. Owner decision and purpose

The earlier programme intentionally stopped before expensive implementation unless a physical-phone H1 comparison materially passed. The owner has now explicitly chosen a different exploration strategy:

> Build the Spatial Atlas far enough that it can be judged as a complete, production-grade alternative Atlas experience rather than as a cheap falsification probe.

Therefore the implementation agent is authorised to:

- make the previously reserved F1/F2/F3 decisions;
- design the complete spatial interaction model;
- choose the renderer/scene/camera architecture from evidence;
- define the spherical geography/LOD contract;
- integrate all four learning domains;
- replace the conventional presentation **on the exploration-derived working branch only**;
- harden the candidate as far as automation and non-physical-device evidence permit.

The agent must **not** merge this work to `main`, claim that the product direction has been accepted, or fabricate physical-device evidence. The final product judgement still belongs to the owner on real hardware.

The old 2D H1 probe, verdict sheet and renderer spikes remain useful historical evidence. They are no longer execution blockers.

---

## 1. Definition of done

The goal is a **complete parallel Atlas v2 candidate**, not another disposable demo.

A successful candidate provides, on the exploration line:

`Mode → World → Continent → Region → Learn/Play → Results → spatial return`

for **Flags, Locations, Outlines and Neighbours**, across all six supported continents, while preserving the durable Atlas product engine underneath.

The candidate is complete only when:

1. the spatial shell is the default presentation on the candidate branch;
2. one persistent geographic scene interprets typed route state rather than owning a parallel navigation state machine;
3. all continent and region navigation works through both geography and equivalent real DOM controls;
4. all four domains run real production learning mechanics, not stubs;
5. Back/Forward, deep links and active-round fallback remain correct;
6. canonical Natural Earth/ISO3 geography remains the single source of truth;
7. progress, evidence, scoring, Mastery, achievements, storage and Firebase contracts are unchanged unless a separate explicit migration decision is documented;
8. reduced motion, keyboard/focus behaviour and renderer fallback are first-class paths;
9. the spatial stack is lazy/controlled enough to remain credible as a mobile PWA;
10. `npm test` and the spatial-specific acceptance suite are green against the exact built artifact;
11. unresolved physical-phone claims are recorded as unresolved rather than inferred.

---

## 2. Required reading — keep it small

Before production-code changes, read:

1. live GitHub Issue #119;
2. `DESIGN.md`;
3. `.impeccable/design.json`;
4. `docs/ROUTING.md`;
5. `docs/COUNTRY_NAMING.md`;
6. `docs/MAP_GEOMETRY_SOURCES.md` and `docs/CARTOGRAPHY_PROVENANCE.json`;
7. this plan;
8. `experiments/spatial-atlas/README.md` — current working prototype and measured gaps;
9. `docs/closed/issue-119-invariant-harness.md`;
10. `docs/closed/issue-119-renderer-comparison.md` and `docs/closed/issue-119-geometry-lod-experiment.md` only as evidence, not as binding decisions.

Do **not** burn context reading archived #119 handoffs unless a historical fact is contested.

The current prototype already proves persistent scene mounting, route-driven camera state, all six continents/regions, real DOM scope controls, native Back, reduced-motion snapping, WebGL fallback and a real Flags round. Extend it; do not restart from a blank globe.

---

## 3. Working topology

Start from the current head of:

`explore/spatial-atlas-moonshot`

Create a dedicated implementation branch:

`moonshot/full-spatial-atlas`

The branch may absorb ordinary non-conflicting `main` fixes when useful, but **do not wait for unrelated conventional Atlas backlog**. Before any eventual production migration, a separate reconciliation against then-current `main` is mandatory.

Keep commits coherent and reviewable. A large programme may use child branches/PRs into `moonshot/full-spatial-atlas`, but do not fragment architecture into duplicate systems merely to create smaller PRs.

---

## 4. Locked preservation boundaries

The spatial candidate changes presentation continuity, not Atlas semantics.

Preserve:

- React 19 + Vite application ownership;
- typed hash routes as durable navigation authority;
- native browser Back/Forward;
- direct cold/deep-link initialisation at the stable target state;
- ephemeral active-round/session state;
- canonical ISO3 identity;
- the single pinned Natural Earth 1:10m source and documented geopolitical policy;
- existing region membership and curriculum truth;
- learning evidence and scoring rules;
- Mastery and achievement qualification/persistence semantics;
- storage namespaces/migrations and Firebase behaviour;
- British English learner-facing copy;
- Atlas semantic colours and non-colour state cues;
- real DOM controls, keyboard access, visible focus and reduced motion;
- offline/PWA guarantees;
- geography as the dominant content object.

Do not create:

- a second router/history stack;
- a second geography/topology source;
- handwritten country geometry or neighbour tables;
- renderer-owned curriculum taxonomy;
- decorative satellite/terrain/space aesthetics;
- a 3D-only accessibility path;
- unrelated scoring/storage/gamification redesign.

The existing conventional shell should remain available in source as the renderer-failure/fallback path until an explicit production migration removes it.

---

## 5. Design contract — F1 is now authorised

Before broad implementation, write a concise living decision record at:

`docs/closed/issue-119-spatial-interaction-contract.md`

Then implement it. Do not turn this into a documentation-only sprint.

The contract must decide:

### Hierarchy and progressive disclosure

- mode-first entry;
- world selection state;
- continent focus and whole-continent Learn/Play;
- geographically associated region controls;
- region focus and activity entry;
- activity/result return to geography;
- cold deep-link behaviour without replaying cinematic ancestry.

### Gesture ownership

- one-finger drag rotates spatial geography when the spatial stage owns the gesture;
- tap selects;
- pinch/dolly zooms;
- OS/browser edge Back remains available;
- activity-specific map gestures take precedence while Locations owns the learning surface;
- interruption always yields to the learner's hand and route truth.

### Motion

Define one coherent camera grammar for:

- forward hierarchy travel;
- Back/Forward reversal;
- interrupted travel;
- same-level selection;
- activity entry/exit;
- reduced motion.

Motion must communicate hierarchy, not perform spectacle.

### Locations-vs-globe decision

Resolve this explicitly. Locations is the one domain where the learning object is already a map.

Choose and document one coherent model, for example:

- spatial shell yields to the established 2D Locations answer surface during the question, then restores the globe context; or
- the selected renderer becomes the Locations answer surface only if it can preserve every current selectability, zoom, tiny-country, accessibility and answer-feedback invariant.

Do not ship two competing maps on screen merely to preserve visual continuity.

Use the Impeccable-style sequence where useful: critique → clarify → simplify → distil → adapt → harden → polish.

---

## 6. Renderer / scene architecture — F2 is now authorised

Write the decision record at:

`docs/closed/issue-119-renderer-decision.md`

Evaluate the current plain-Three prototype and the existing R3F/MapLibre evidence against the actual Atlas task. Re-run focused spikes if a decision-relevant fact is still ambiguous, then choose.

The decision must cover:

- persistent scene lifecycle;
- camera abstraction/director;
- render-on-demand / idle behaviour;
- adaptive/constrained DPR;
- picking and DOM parity;
- lazy-loading boundary;
- resize/orientation behaviour;
- context loss and renderer failure recovery;
- reduced-motion integration;
- integration with React lifecycle/StrictMode;
- testability in Playwright;
- delivered JS/CSS/support-code cost.

Do not preserve plain Three, R3F or MapLibre merely because a spike already exists. Choose the architecture that best satisfies Atlas.

### Cost direction

The current prototype is approximately:

- 135.63 kB gzip prototype JS;
- 269.5 kB gzip world geometry;
- 127.0 kB gzip Africa geometry;
- versus roughly 100.42 kB gzip for the current production core.

That is a warning, not an automatic rejection.

Aggressively reduce the **lazy spatial-entry payload**. Target a combined renderer + initial world-selection geography envelope of **≤250 kB gzip** where technically reasonable. If the best architecture cannot meet that target, document the measured reason rather than hiding the cost.

Idle geography must not require a permanent animation loop when nothing is moving.

---

## 7. Spherical geography / LOD architecture — F3 is now authorised

Write the contract at:

`docs/closed/issue-119-spherical-geography-contract.md`

Extend the existing canonical generator. Do not create a parallel cartography pipeline.

The final contract must cover:

- world selection LOD;
- continent LOD;
- region/activity detail where justified;
- display geometry versus picking geometry;
- microstate/small-island survival;
- locator/assist policy when simplification removes visible polygons;
- multipart countries;
- antimeridian splitting/unwrapping;
- mainland framing versus distant territories;
- deterministic generation and provenance;
- payload verification;
- runtime LOD switching and disposal/reuse.

Audit all six continents, explicitly including:

- European microstates;
- Caribbean islands;
- Pacific small islands;
- Kiribati/date-line cases;
- Russia and other antimeridian-adjacent geometry;
- multipart/overseas-territory framing.

The runtime must actually switch LODs; generated-but-unused detail does not satisfy this phase.

---

## 8. Production candidate shell

Evolve the prototype into application architecture rather than maintaining it as an isolated toy.

Introduce a coherent production-quality spatial module, approximately:

```text
SpatialAtlas
├── scene / renderer host
├── geography layer
├── camera director
├── picking layer
├── spatial labels / DOM controls
└── route → spatial-state adapter
```

The adapter must be a pure interpretation of authoritative application route/state. The scene must not invent durable navigation state.

On `moonshot/full-spatial-atlas`, make the spatial shell the default presentation for normal learning routes once it is stable enough. Preserve the conventional presentation as a fallback rather than running two independent application shells.

---

## 9. Complete all four learning domains

### Flags

Replace the prototype's isolated in-memory round with the real application lifecycle while preserving normal persistence, scoring and result semantics. Keep the flag as the dominant recognition object; the globe is context, not competition.

### Locations

Implement the F1 decision. Preserve all current interaction invariants, including zoom/pan, tiny-country assistance, pointer ownership, answer feedback, previously answered-country selectability and no answer leakage.

### Outlines

Keep the country silhouette dominant. Integrate real Learn/Play, answer feedback, progress and Results while allowing the spatial context to persist/re-enter without shrinking the outline into decorative content.

### Neighbours

Integrate the real target/adjacency mechanic, input/suggestion semantics, keyboard path and map/geographic context. Preserve canonical topology-derived land adjacency and zero-neighbour truth.

For every domain prove:

- continent and region scope;
- Learn and Play where the production domain supports both;
- mid-round Back behaviour;
- refresh/deep-link fallback;
- Results;
- progress persistence;
- Mastery/achievement effects exactly matching current semantics.

---

## 10. Results, Mastery and prestige

Results should feel like the same spatial session resolving, not an unrelated reward page.

Integrate:

- score/result summary;
- return/retry/next actions;
- region × domain Mastery;
- complete-region/continent state;
- World Crown where applicable;
- restrained purple/gold spatial augmentation with explicit non-colour cues.

Do not add an achievement economy or celebratory layer beyond current Atlas semantics.

---

## 11. Accessibility and fallback

The globe is never the sole interface.

Required:

- equivalent real DOM controls for spatially selectable scopes;
- correct accessible hierarchy/names/state;
- complete keyboard navigation;
- visible focus;
- focus restoration after durable transitions;
- sensible announcements for route/scope changes;
- reduced-motion camera grammar;
- no answer leakage from accessibility metadata;
- high-contrast/forced-colour compatibility where applicable;
- renderer failure falls back to a fully usable conventional/2D route experience.

Treat the canvas itself as a pointer/visual surface, not as a substitute for semantic HTML.

---

## 12. Mobile/PWA/performance hardening

Do as much as can be honestly automated now.

Implement and verify:

- lazy spatial stack loading;
- render-on-demand at idle;
- adaptive DPR;
- resize/orientation recovery;
- renderer context-loss recovery;
- world/continent/region LOD switching;
- geometry/material reuse and disposal;
- no runaway RAF/listener lifecycle;
- offline revisit consistent with current cache policy;
- cold deep links;
- installed-PWA-safe routing assumptions;
- edge-gutter gesture non-capture;
- short landscape and narrow portrait layout.

Record as **PENDING PHYSICAL DEVICE** rather than passing:

- real GPU frame pacing;
- thermals/battery;
- Android/iOS edge-gesture coexistence;
- actual pinch/drag feel;
- installed-PWA device behaviour.

Never claim those without hardware evidence.

---

## 13. Verification programme

Primary gate remains:

`npm test`

Add spatial-specific automated coverage rather than weakening existing tests.

At minimum cover:

- route ↔ camera/scope interpretation;
- Back/Forward;
- deep-link initialisation;
- interrupted camera travel;
- reduced motion;
- DOM/geography action parity;
- all six continent framing;
- every region reachable;
- all four domains real Learn/Play flow;
- Results return;
- no duplicate navigation stack;
- no storage/scoring semantic drift;
- LOD switching;
- microstates and antimeridian cases;
- renderer failure/fallback;
- idle render behaviour;
- accessibility/focus basics;
- exact lazy payload measurement;
- deterministic spherical asset generation;
- PWA/offline regression.

Run the browser matrix against the exact built artifact at minimum at:

- 320×568;
- 390×844 / Pixel-class portrait;
- tablet portrait;
- 844×390 short landscape;
- desktop.

Do not describe browser emulation as physical-device testing.

---

## 14. Delivery sequence

Use this sequence unless evidence forces a documented change:

1. reconcile current exploration head and create `moonshot/full-spatial-atlas`;
2. write F1 interaction contract and begin shell refinement;
3. decide F2 renderer architecture;
4. decide F3 spherical/LOD contract;
5. implement canonical generated assets + runtime LOD;
6. integrate production-quality persistent SpatialAtlas shell;
7. finish world/continent/region navigation and DOM parity;
8. integrate Flags end to end;
9. integrate Locations end to end;
10. integrate Outlines end to end;
11. integrate Neighbours end to end;
12. integrate Results/Mastery/Crown presentation;
13. harden accessibility/fallback;
14. harden mobile/PWA/performance;
15. run complete automated acceptance and inspect the exact artifact;
16. document remaining physical-device-only questions;
17. open a **candidate review PR targeting `explore/spatial-atlas-moonshot`**, not `main`.

Do not stop merely because the earlier H1 gate has not been physically judged. Stop only for a genuine architectural impossibility, a preservation-boundary conflict that cannot be resolved cleanly, or a safety/data-integrity risk.

---

## 15. Final handoff

The completed candidate handoff must state plainly:

- chosen F1/F2/F3 decisions and why;
- exact branch/head;
- what changed architecturally;
- all four domain integration status;
- exact bundle/geometry costs;
- complete automated verification evidence;
- exact browser evidence actually run;
- physical-device evidence still missing;
- known defects/limitations;
- whether the conventional fallback remains intact;
- what would still be required before a production merge.

A complete candidate is allowed to be rejected after owner testing. The purpose of this programme is to make that judgement against the best credible Spatial Atlas implementation rather than against an intentionally cheap probe.
