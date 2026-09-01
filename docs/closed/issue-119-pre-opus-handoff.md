# Issue #119 — Pre-Opus / Frontier Handoff

> **Superseded by [`../closed/issue-119-plan.md`](../closed/issue-119-plan.md).**
>
> This was the long-form frontier handoff. Its durable facts are condensed into the principal entry packet in §8 of the plan of record. Retained for tracing a specific repository fact only; it should not be read linearly.


**Status:** support-stage preparation for the spatial Atlas moonshot  
**Issue:** #119  
**Exploration branch:** `explore/spatial-atlas-moonshot`  
**Purpose:** complete as much evidence gathering, repository archaeology and execution setup as possible before spending a principal frontier-model session

## 1. Handoff principle

The frontier model should not spend premium context discovering where routing lives, how Atlas map generation works, what gestures already exist, which product rules are locked, or which renderer libraries are currently viable.

Support work should reduce the frontier session to the few decisions where architecture, product judgement and interaction taste matter materially.

Model allocation therefore follows **decision leverage**, not code volume.

A task should be reserved for Opus/Sol-ultra only when it does one or more of the following:

- establishes a reusable architecture that downstream work will copy;
- makes a product interaction decision that will materially change Atlas;
- combines multiple systems where local optimisation could damage global coherence;
- decides whether the moonshot deserves to continue;
- integrates the first complete vertical slice where visual quality and engineering quality must be judged together;
- resolves a failure that invalidates an existing architectural assumption.

Everything else should either gather evidence for those decisions or implement a decision already made.

## 2. Current truth snapshot

### Current `main`

As of 2026-08-26 during this preparation pass:

- current `main` is `046bd935d9be08f4ab561b8f060c66da5b3cecad`;
- the latest main integration includes the Flags stable-stage fix, Europe/Asia framing and clipping work, map hit-precedence hardening, complete-region Mastery qualification, and additional React production-screen verification;
- the latest GitHub Pages deployment for that commit completed successfully.

### Exploration branch

`explore/spatial-atlas-moonshot` currently contains the Issue #119 planning documents and is **one main commit behind** the current source-of-truth commit above.

Do not begin the frontier implementation session until the branch has been synchronised with then-current `main` and the diff has been checked for semantic conflicts with this plan.

The branch should remain exploration-only until the Africa vertical slice passes the explicit product and technical gates.

## 3. Current application stack

Current `package.json` establishes:

- React `19.2.8`;
- React DOM `19.2.8`;
- Vite `8.2.2`;
- TypeScript `5.8.3`;
- Vitest `4.1.11`;
- Playwright `1.62.1`;
- `d3-geo` `3.1.1`;
- TopoJSON client/server/simplify;
- Firebase `12.x`;
- Node `>=22.12.0`.

No production Three.js, React Three Fiber, MapLibre or equivalent 3D globe dependency is currently installed.

The primary verification gate remains `npm test`.

## 4. Repository integration map

The following is the minimum file map a principal model should receive before changing code.

### Routing

#### `src/routing/routes.ts`

Owns the semantic durable route model.

Important facts:

- `AppRoute` is either Home, Profile or a typed learning route;
- learning routes encode domain, optional geographic scope and optional activity;
- `stableRoute(...)` removes activity but preserves scope;
- `normalizeAvailableRoute(...)` keeps unsupported geography honest by returning to the domain index;
- `parentRoute(...)` defines conceptual Back ancestry;
- region routes serialise through their canonical parent continent;
- the URL is already semantic rather than presentation-component-specific.

This means a spatial scene can consume a route and derive a destination without changing route grammar merely to animate navigation.

#### `src/routing/router.ts`

Owns the hash-history adapter.

Important facts:

- native `history.pushState` / `replaceState` remain authoritative;
- browser `popstate` and `hashchange` are observed;
- there is no parallel application-owned navigation stack;
- `router.back()` delegates to browser history.

The spatial shell must interpret this history, not replace it.

### React orchestration

#### `src/react/AtlasApp.tsx`

This is the critical integration seam.

Current architecture:

- creates one `AppStore`;
- creates one hash router;
- normalises routes;
- maps durable route state into existing application views;
- owns the central action set;
- restores focus after route/question transitions;
- mounts current production screens through one central `screen(...)` switch;
- registers global lifecycle, keyboard and navigation-gesture behaviour.

The current visual discontinuity is structurally visible here: `screen(...)` returns one complete React screen for each store view.

A future spatial shell can potentially be inserted above or around this boundary while preserving the existing state/store/domain machinery.

Do not let a support model independently rewrite this orchestration before the frontier architecture decision.

### Entry point / StrictMode

#### `src/main.tsx`

Current application mounts `AtlasApp` under React `StrictMode` and `AppErrorBoundary`.

This matters for R3F evaluation because an open August 2026 React Three Fiber issue reports development-time WebGL context loss caused by deferred Canvas disposal after StrictMode's effect remount cycle.

The principal renderer decision must explicitly resolve this rather than discovering it accidentally after implementation.

### Navigation gestures

#### `src/navigation-gestures.ts`

Atlas already owns a left-edge swipe-Back gesture.

Current behaviour:

- gesture may begin only inside a 28 px left-edge gutter;
- interactive controls and `[data-map-viewport]` are excluded;
- horizontally scrollable elements are excluded;
- horizontal intent is claimed only after directional evidence;
- gesture triggers semantic parent navigation.

Implication for the moonshot:

- globe rotation must not consume the system/product Back gutter;
- the existing exclusion model is a useful precedent;
- one-finger spatial rotation should begin outside the reserved edge region or otherwise explicitly cooperate with Back navigation.

### Existing 2D map interaction

#### `src/map-viewport.ts`

Current Locations maps already implement a substantial gesture runtime:

- one-pointer drag pans;
- two-pointer pinch zooms and translates around the gesture midpoint;
- mouse wheel zooms around the pointer;
- modified wheel preserves browser/page zoom accessibility;
- view state is remembered per session;
- dragged taps are suppressed;
- hit areas remain approximately 44 CSS px where possible;
- region/continent fit functions are semantic commands.

The spatial prototype should not casually introduce a contradictory gesture grammar.

The current implementation also demonstrates that Atlas already treats map interaction as an imperative/framework-independent boundary mounted by React.

### Canonical geography generator

#### `scripts/generate-map-assets.mjs`

Current public generation entry point.

Runs:

1. canonical map generation;
2. runtime optimisation;
3. neighbour-fixture generation.

#### `scripts/generate-maps.mjs`

Thin entry point into configured generation.

#### `scripts/map-generation-core.mjs`

This is the critical geography seam.

Important facts confirmed during support reconnaissance:

- reads the pinned Natural Earth manifest;
- fetches source bytes and verifies SHA-256;
- reconciles source features to canonical Atlas ISO3 identity;
- handles current geopolitical/source policy before projection;
- derives global adjacency from canonical source topology;
- contains the upstream geographic geometry before projecting it into current 2D continent canvases;
- imports `d3-geo`, TopoJSON topology/mesh/neighbour and simplification tools;
- currently uses projection-specific processing after source normalisation.

Therefore a globe pipeline does **not** need a second geography source.

The correct experiment is to branch after canonical source normalisation and before finished 2D projection, producing additional spherical/runtime artefacts from the same source truth.

### Current map runtime model

#### `src/domain/map-models.ts`

Current `MapRegionAsset` stores projected SVG paths plus context, coastline/water, viewport focus and inset metadata.

These finished projected paths are not appropriate source geometry for a sphere.

Do not bend or reproject the final SVG path strings.

### Scope definitions

#### `src/data/map-scopes.ts`

Already owns learner-facing continent/region membership and domain map scope identity.

Do not invent a second region taxonomy in the globe renderer.

The renderer should consume existing scope identity and country memberships.

## 5. Renderer evidence already gathered

Technology selection remains a principal-model decision. Support work should present evidence, not silently lock the answer.

### React Three Fiber / Three.js

Verified current ecosystem facts:

- R3F documentation states `@react-three/fiber@9` pairs with React 19;
- the renderer exposes the underlying Three.js feature set rather than a restricted subset;
- R3F supports `frameloop="demand"` so an idle scene need not continuously render;
- manual invalidation is available for imperative camera updates;
- Drei controls integrate with invalidation;
- R3F performance guidance explicitly warns against unnecessary mount/unmount churn and repeatedly creating geometry/materials.

This is structurally attractive for the desired persistent-scene architecture.

#### Current risk: StrictMode context loss

An open R3F issue filed 2026-08-13 reports that under React 19 StrictMode, a mounted Canvas can lose its WebGL context after the development effect-remount cycle because deferred disposal destroys the live reused root.

The report reproduces on R3F 9.6.1 and states the relevant disposal path remains in 9.7.0.

This appears development-only in the reported mechanism, but it is an explicit prototype gate because Atlas currently mounts the whole app under `StrictMode`.

The frontier session must decide whether to:

- isolate the spatial renderer outside the problematic StrictMode boundary;
- pin/patch a verified version;
- use an imperative Three.js adapter;
- or prefer another renderer architecture.

Support work must not paper over this by simply disabling StrictMode globally without architectural review.

### Drei / CameraControls

Current Drei documentation exposes `CameraControls` as a wrapper around `camera-controls` and supports explicit touch mappings including:

- one-touch rotate;
- two-touch dolly/truck;
- transition lifecycle callbacks.

This matches the proposed mobile gesture model closely enough to justify a real prototype comparison.

### MapLibre GL JS

Current MapLibre GL JS documentation is on v6.x and demonstrates:

- ESM/Vite-compatible consumption;
- globe projection;
- vector rendering on the globe;
- camera centre/zoom semantics;
- globe-specific projection data;
- custom WebGL layers on the globe;
- Three.js content layered onto globe projection.

MapLibre therefore remains a credible alternative rather than a fallback of last resort.

The key question is not feature availability; it is whether the map-native camera/scene model gives Atlas enough control to achieve the bespoke continuous-game interaction grammar.

## 6. Work that should be completed before the frontier session

### S0 — Reconcile branch with current main

**Owner:** support model / human repo operator  
**Frontier needed:** no

Before handoff:

- check current `main` SHA;
- read commits landed since this document;
- sync the exploration branch;
- semantically reconcile any changes touching routing, maps, gestures, React shell or PWA;
- verify the exploration branch contains only intentional planning/research/prototype work.

### S1 — Repository truth dossier

**Owner:** support model  
**Frontier needed:** no

Finish a compact current-state map covering:

- routing;
- state/store;
- React screen composition;
- activity launch/return paths;
- focus restoration;
- gesture ownership;
- PWA/service-worker lifecycle;
- map-generation source pipeline;
- lazy map asset loading;
- current test layers;
- production fallback/error boundaries.

The principal session should read this dossier instead of scanning the whole repository from scratch.

### S2 — Candidate renderer research matrix

**Owner:** support model  
**Frontier needed:** no

For R3F/Three and MapLibre at minimum, record:

- exact candidate package versions at handoff time;
- React/Vite compatibility;
- bundle implications;
- touch gesture model;
- camera transition API;
- on-demand/idle rendering capability;
- polygon picking model;
- DOM overlay integration;
- context-loss/recovery support;
- offline/PWA constraints;
- licence;
- known current issues relevant to Atlas;
- minimal proof-of-concept implementation cost.

Do not declare the winner in the support report.

### S3 — Canonical spherical-geometry feasibility dossier

**Owner:** support model  
**Frontier needed:** no for evidence; yes for final contract

Without committing production architecture, investigate and record:

- exact post-normalisation point where geographic coordinates remain available;
- current source coordinate/feature counts;
- current continent ownership/context policy that must survive;
- antimeridian cases, especially Russia and Pacific geography;
- MultiPolygon/island cases;
- potential topology simplification strategies for World LOD;
- data needed for continent and region camera fitting;
- whether bounds/centroids can be generated deterministically;
- likely JSON/TopoJSON/runtime-mesh trade-offs;
- test cases needed to prove ISO3 and geopolitical parity.

A support spike may generate temporary measurements, but should not commit a permanent spherical asset schema before the frontier F3 decision.

### S4 — Gesture conflict matrix

**Owner:** support model  
**Frontier needed:** no

Prepare cases for:

- left-edge Back vs globe rotation;
- tap vs drag threshold;
- one-touch rotate;
- two-touch pinch;
- interrupted pinch to one-finger continuation;
- system/browser zoom accessibility;
- activity maps mounted above the globe;
- scrollable DOM overlays;
- buttons placed over the globe;
- Android browser Back;
- iOS edge navigation;
- installed PWA behaviour.

The frontier model should choose the final ownership grammar using this evidence.

### S5 — Performance baseline and measurement harness specification

**Owner:** support model  
**Frontier needed:** no

Before comparing a globe prototype, define what will be measured against current production:

- initial JS/CSS payload;
- lazy chunk sizes;
- time to first interactive domain selection;
- time from domain selection to usable world interaction;
- steady idle CPU/GPU behaviour;
- active frame rate/frame time during drag;
- memory after repeated World ↔ Africa ↔ West Africa cycles;
- WebGL context-loss events;
- renderer recovery;
- route transition latency;
- direct deep-link initialisation;
- offline repeat-load behaviour.

Do not invent a performance win without measurement.

Physical-device evidence must remain labelled separately from emulator/browser evidence.

### S6 — Test-plan scaffolding

**Owner:** support model  
**Frontier needed:** no

Prepare expected browser/component coverage for the Africa vertical slice:

- route-to-spatial-destination mapping;
- world DOM continent controls;
- Africa DOM region controls;
- West Africa route transition;
- native Back ancestry;
- deep-link initial state;
- reduced-motion path;
- renderer failure/fallback;
- no duplicate route stack;
- unavailable-domain geography handling;
- keyboard activation of the same actions used by 3D picking.

The tests should assert product semantics rather than exact camera floating-point positions unless a camera invariant genuinely needs that precision.

### S7 — Fallback contract evidence

**Owner:** support model  
**Frontier needed:** no for requirements; yes for final architecture

Document expected behaviour when:

- WebGL is unavailable;
- renderer initialisation throws;
- context is lost;
- device capability is inadequate;
- reduced motion is requested.

Current production launcher remains the benchmark/fallback candidate unless the frontier architecture chooses a smaller dedicated spatial fallback.

### S8 — Frontier input packet

**Owner:** support model  
**Frontier needed:** no

Immediately before the first principal session, prepare one compact input packet containing:

1. mission;
2. current main SHA and branch status;
3. settled product invariants;
4. exact files to read first;
5. renderer evidence matrix;
6. geography evidence dossier;
7. gesture conflict matrix;
8. baseline/performance plan;
9. unresolved decisions reserved for the principal;
10. allowed prototype modification scope;
11. explicit stop conditions;
12. required deliverables.

Avoid dumping raw exploratory notes into the frontier context when a concise conclusion/evidence table can replace them.

## 7. Work that should remain reserved for Opus / Sol-ultra

The following are the protected frontier tasks.

### F1 — Final spatial product/interaction contract

Decide:

- what the user perceives at Home/domain/world/continent/region/activity/results;
- how much geography remains visible during each activity;
- whole-continent vs region control hierarchy;
- motion grammar;
- reduced-motion equivalent;
- whether this is truly better than the current launcher rather than merely more impressive.

### F2 — Renderer + persistent-scene architecture

Decide:

- R3F/Three vs MapLibre vs another justified option;
- renderer lifecycle and StrictMode strategy;
- persistent scene ownership;
- semantic scene destination model;
- camera director architecture;
- DOM/3D overlay boundary;
- picking integration;
- renderer failure/recovery model.

### F3 — Permanent spherical geography/LOD contract

Using support measurements, decide:

- runtime asset representation;
- LOD boundaries;
- camera-fit metadata contract;
- antimeridian treatment;
- how generated globe assets coexist with current 2D production assets without creating a parallel geography system.

Implementation of the chosen contract can then be delegated.

### F4 — First integrated Africa vertical slice

This is the principal build session that proves:

```text
Mode
→ World
→ Africa
→ West Africa
→ Back to Africa
→ Back to World
```

It should integrate the chosen architecture rather than merely render a spinning globe.

### F5 — Interaction/design refinement

A principal model should review and tune:

- camera movement;
- spatial hierarchy;
- label/control placement;
- visual density;
- progressive disclosure;
- tactile response;
- whether the experience still feels quiet and information-first.

### F6 — Independent go/no-go review

Prefer a fresh frontier context.

Decide whether the experiment is:

- materially better and worthy of production migration;
- promising but should remain a narrower map-first launcher;
- technically interesting but product-negative;
- or failed.

### F7 — Production migration architecture

Only after F6 passes.

Decide how the approved prototype becomes production without turning the exploration branch into one giant irreversible rewrite.

## 8. Frontier entry gate

Do not start F1/F2 merely because the issue exists.

The preferred entry state is:

- [ ] branch synchronised to current `main`;
- [x] current routing seam identified;
- [x] current React screen-composition seam identified;
- [x] existing gesture ownership identified;
- [x] canonical pre-projection map generator seam identified;
- [x] current React 19 / Vite stack confirmed;
- [x] current R3F React-19 compatibility confirmed;
- [x] current R3F StrictMode context-loss risk recorded;
- [x] current MapLibre globe capability confirmed;
- [ ] complete renderer evidence matrix recorded;
- [ ] spherical-geometry feasibility measurements recorded;
- [ ] performance baseline/harness recorded;
- [ ] gesture conflict matrix recorded;
- [ ] fallback requirements recorded;
- [ ] exact test plan recorded;
- [ ] compact frontier input packet finalised;

The unchecked items are support work, not reasons to spend Opus/Sol yet.

## 9. Practical frontier-session prompt shape

The final prompt should be short because the repository documents carry the detail.

Conceptually:

> You are the principal architect and interaction designer for Atlas Issue #119. Read the issue, the moonshot scope, LLM execution plan and pre-frontier handoff first, then the exact repository files listed there. Support work has already established current repository truth, renderer evidence, geography constraints, gesture conflicts and benchmark requirements. Your job is not repository archaeology. Own F1/F2: decide the spatial product contract and renderer/persistent-scene/camera architecture. Preserve every listed product, routing, geography, learning and persistence invariant. Record architectural decisions before broad implementation. Do not collapse the work into a spinning-globe demo. The Africa vertical slice is the proving ground.

The actual handoff should add the current main SHA and links to the completed support dossiers.

## 10. Support-stage stop line

Before the principal session, support work may:

- inspect/reconcile repository truth;
- write documentation;
- research dependencies;
- prepare benchmark/test harnesses;
- run isolated throwaway measurements/spikes;
- add non-architectural verification scaffolding where safe;
- identify failures and unknowns.

Support work should **stop and escalate** rather than independently decide when it reaches:

- final renderer selection;
- permanent scene ownership;
- permanent camera-director API;
- permanent globe asset schema;
- interaction hierarchy that changes Atlas product semantics;
- broad rewrite of `AtlasApp`;
- production replacement of current launchers;
- an architectural workaround for the R3F StrictMode issue;
- any change to routing, learning, scoring, achievement, persistence or canonical geography semantics.

That boundary is deliberate. The purpose of preparation is to make the frontier model spend almost all of its intelligence on the decisions that determine the quality of the moonshot.