# Issue #119 — Principal entry packet

**Status:** support-owned packet; **not ready for principal review** while the dependency and H1 gates below are unresolved.  
**Authority:** `issue-119-plan.md` is the execution plan; this file is only the compact handoff.  
**Reserved decisions:** F1 spatial interaction contract · F2 renderer/scene/camera architecture · F3 spherical geography/LOD contract.

## 1. Current state / decision brief

Issue #119 asks whether Atlas should replace the *perception* of discrete launcher screens with a continuous geographic presentation while preserving the existing product engine.

The first question is deliberately cheaper than the globe question:

> **H1 — Does continuous spatial navigation feel materially better than replacing launcher screens?**

H1 is tested with existing production 2D geography. No renderer or spherical architecture is needed to answer it.

### Dependency gate

Do not treat Stage 0 or Stage 1 evidence as final until current `main` includes the completed production work from:

- #27 — Oceania four-domain expansion;
- #137 — Asia Locations/cartography hardening;
- #138 — learner-facing World Crown acceptance.

At the support checkpoint created on 27 August 2026, #22 North America is merged/deployed, while #27, #137 and #138 are not all merged. The exploration branch is therefore parked in preparation mode.

### Product truth that is already settled

- React 19 + Vite own production presentation/building.
- Typed hash routes own durable navigation state; native Back/Forward remains authoritative.
- Active round internals remain ephemeral session state.
- Canonical country identity is ISO3.
- Natural Earth 1:10m is the sole production geography source for Locations, Outlines and Neighbours.
- Existing learning evidence, scoring, Mastery, achievement persistence and storage contracts are preservation boundaries.
- Real DOM controls, keyboard access, reduced motion and non-colour state cues remain mandatory.
- The spatial stack, if any, must be lazy and must have a usable renderer-failure fallback.

## 2. Stage 0 production baseline

**Status: PENDING FINAL DEPENDENCY GATE.**

Automated evidence should be produced by the Stage 0 harness against the exact then-current production artifact and attached to the relevant verification run. Capture:

- route/action counts for the comparison traversal;
- typed-route transitions, Back/Forward and cold/deep-link behaviour;
- focus restoration and reduced-motion branches;
- initial/core and lazy asset sizes (raw + gzip);
- navigation/resource timing available from the browser;
- PWA/offline regression evidence;
- screenshots/video suitable for side-by-side review.

Do not substitute automated mobile emulation for physical-device judgement.

### Human comparison script

Ben runs the fixed script in `issue-119-plan.md` on a physical phone, production first and Stage 1 second. Record faster/same/slower, clearer/same/less clear, would-use-daily yes/no, and the single worst moment. Repetition matters more than first-impression choreography.

## 3. Stage 1 — H1 result

**Status: PENDING. DO NOT BUILD FINAL PROBE ON TRANSITIONAL MAIN.**

Required slice:

`Mode/domain → World/continent selection → Africa → West Africa → Play-ready/activity → Back to Africa → Back to world/domain`

Constraints:

- existing production `MapRegionAsset` 2D geography only;
- existing fit/focus metadata and typed router;
- real DOM controls and existing browser history;
- current Atlas design tokens;
- interruptible motion plus a reduced-motion equivalent;
- no Three.js/R3F/MapLibre;
- no second navigation state machine;
- no progress/scoring/Mastery changes.

### H1 verdict

| Verdict | Consequence |
| --- | --- |
| Materially better | Continue to support-tier renderer/LOD evidence repair, then principal F1–F3. |
| Neutral or worse | Record the negative result and stop #119. Do not spend renderer effort rescuing H1. |
| Not yet judged | Park at a clean device-judgeable checkpoint. |

## 4. Renderer evidence

**Status: PARKED UNTIL H1 PASSES. Existing evidence is AMBER.**

Current evidence cannot choose the renderer. Before any F2 decision, support must make the candidates attempt comparable Atlas tasks:

- MapLibre: headed/hardware-backed rerun where practical, current Node/base, real local Atlas geography, and explicit separation of renderer failures from SwiftShader/headless artefacts;
- R3F: real canonical Africa country geography and real country picking, with delivered cost including geography and Atlas-authored support code.

Compare renderer JS, CSS, geography, Atlas support code, lazy cost/startup impact, idle/render behaviour, picking, camera interaction and failure/recovery. Do not mark the evidence GREEN until it is genuinely apples-to-apples.

## 5. Six-continent geometry / LOD envelope

**Status: PARKED UNTIL H1 PASSES.**

The historical four-continent projected-path experiment proves only that a lightweight selection LOD is plausible. Refresh against the final six-continent curriculum and include:

- Africa;
- South America;
- Europe, including microstates;
- Asia;
- North America, including Caribbean small islands;
- Oceania, including Pacific small islands and Kiribati/antimeridian cases.

Record coordinates, component counts, raw/gzip, microstate survivability, antimeridian integrity, picking feasibility and provenance. This evidence informs F3 but must not define the final spherical/LOD contract.

## 6. Hard invariants / kill criteria

Any future spatial architecture must preserve:

- URL authority, native Back/Forward and direct deep links;
- ephemeral active quiz state;
- one router/history stack only;
- one canonical Natural Earth source and ISO3 identity;
- equivalent real DOM controls, keyboard access and visible focus;
- reduced motion and OS-edge gesture compatibility;
- lazy spatial loading and recoverable renderer failure/fallback;
- current PWA/offline guarantees;
- unchanged evidence/scoring/storage semantics;
- no answer leakage;
- British English and the current semantic colour system.

Kill or narrow the moonshot if spatial navigation is slower/less clear after real refinement, repeated camera travel becomes friction, accessibility requires a separate dominant interface, route truth starts duplicating into animation state, the renderer materially worsens the mobile PWA, canonical geography needs a second source, or unrelated learning/storage changes are required to justify the design.

## 7. Unresolved principal decisions

The support tier must stop before deciding:

### F1 — Spatial interaction contract

Includes gesture ownership, route-to-spatial presentation semantics, progressive disclosure, reduced-motion behaviour, and the **Locations-vs-globe** relationship.

### F2 — Renderer / scene / camera architecture

Select or reject candidates only after H1 passes and the renderer comparison is genuinely comparable.

### F3 — Spherical geography / LOD contract

Define the generated spherical representation, LOD boundaries, picking/display relationship and asset lifecycle from the six-continent evidence.

**Do not begin the Africa 3D vertical slice until F1–F3 have authorised an architecture.**
