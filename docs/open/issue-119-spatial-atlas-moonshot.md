# Issue #119 — Continuous Spatial Atlas Moonshot

**Status:** moonshot product + technical exploration  
**Issue:** #119 — Continuous spatial Atlas shell with interactive 3D Earth navigation  
**Exploration branch:** `explore/spatial-atlas-moonshot`  
**Production status:** current v1 launcher remains authoritative until a prototype explicitly passes the gates below

## 1. Purpose

This document scopes a possible future Atlas presentation architecture in which the application no longer *feels* like a sequence of discrete screens.

The underlying product remains route-driven and stateful. The learner instead experiences one persistent spatial instrument:

```text
MODE
  ↓
EARTH
  ↓
CONTINENT
  ↓
REGION
  ↓
ACTIVITY
  ↓
REGION / RESULTS
```

The central idea is simple:

> Keep the existing Atlas product engine, typed routing, learning logic, progress, achievements and canonical geography. Replace obvious page replacement with a persistent spatial world that interprets route changes as camera, geography and interface-state changes.

This is intentionally a **moonshot**. It should be explored because the interaction model is unusually coherent with a geography-learning product, not because 3D itself is a goal.

A technically impressive spinning globe that slows the app, harms accessibility or adds navigation friction is a failed outcome.

## 2. Current production baseline

At the time this scope was created, current `main` already has several architectural properties that make the experiment plausible without a wholesale rewrite:

- React owns production presentation;
- Vite owns browser builds;
- domain, data, routing and state remain framework-independent TypeScript;
- country identity is canonical ISO3;
- Natural Earth 1:10m is the canonical production cartography source;
- map projection/runtime boundaries are already separated from React;
- durable URLs own domain/scope/activity identity;
- active quiz ordering, guesses, timers and other round internals remain ephemeral session state;
- browser Back/Forward remains native rather than using an application-owned parallel history stack.

The production information architecture remains mode-first:

```text
Home
→ domain continent index
→ supported continent launcher
→ Play continent / region
```

The launcher currently uses one-tap rows. Whole-continent and region rows start Play directly. Learn remains subordinate. That production model remains the fallback and comparison baseline during this exploration.

## 3. Relationship to Issue #104

Issue #104 records a deferred exploration of replacing the **continent launcher** with a map-first selection surface.

Issue #119 is larger and should not simply inflate #104 indefinitely.

#104 asks approximately:

> Should a supported continent launcher use geography instead of a row list?

#119 asks:

> Should the entire Atlas presentation layer behave like a continuous spatial world from domain selection through continent/region navigation and into activities/results?

If #119 proves successful, the implementation space in #104 would likely become one child phase of the broader spatial shell. Until then, #104 remains independently deferred and the current row launcher remains production truth.

## 4. Product thesis

Atlas's current design thesis is already:

> Geography is the content; the interface is the instrument.

The spatial-shell direction takes that literally.

The learner should navigate Atlas by moving through geography rather than repeatedly leaving geography to choose the next geography from an unrelated screen.

The intended effect is not cinematic spectacle. It is **spatial continuity**:

- the learner always knows where they are;
- continent and region hierarchy becomes visually self-explanatory;
- Back naturally reverses the geographic journey;
- progress and achievement can remain attached to real places;
- mode changes and activity transitions feel like changing how Atlas is being used, not loading another application screen.

## 5. Desired experience

### 5.1 Launch / domain selection

Atlas remains **mode-first**.

The four peer domains remain the first durable product decision:

- Flags;
- Locations;
- Outlines;
- Neighbours.

The important change is presentational.

The Earth may already be visible as a quiet spatial backdrop/substrate while the four domain controls are shown. Choosing a domain should make those controls recede and let geography take over rather than visibly replacing the entire page.

No domain decision should require the 3D engine to block first meaningful interaction. The spatial engine may be lazy-loaded/preloaded around the initial choice if that materially improves startup performance.

### 5.2 World state

After the learner chooses a domain, the Earth becomes the main geography-selection object.

Required qualities:

- one-finger rotation/drag;
- restrained inertia;
- pinch/dolly scale changes;
- quiet country/continent geometry;
- clear silhouette at phone size;
- no satellite imagery;
- no terrain;
- no starfield or decorative space scene;
- no photorealistic Google Earth aesthetic;
- no gratuitous visual effects competing with the learning purpose.

The target visual language is Atlas cartography wrapped onto a sphere, not an external mapping product embedded inside Atlas.

### 5.3 Continent selection

Selecting a continent should result in a camera transition, not an obvious page replacement.

Example:

```text
WORLD
  ↓ tap Africa
AFRICA
```

Africa rotates/centres into view and the camera moves closer.

At continent focus, progressive disclosure reveals the scope hierarchy.

For Africa:

- **Africa** is the principal whole-continent Play action;
- North Africa;
- West Africa;
- Central Africa;
- East Africa;
- Southern Africa;

The continent name should be the strongest control. Region controls are secondary.

Region controls should be associated with the relevant geography without requiring arbitrary region branding colours.

### 5.4 Region selection

Selecting West Africa should continue the spatial movement:

```text
AFRICA
  ↓ tap West Africa
WEST AFRICA
```

The selected region moves towards the visual centre and other geography becomes subordinate.

The learner should never need to interpret whether a "new screen" loaded. Their mental model should simply be that they moved closer to the selected place.

### 5.5 Activity transition

The globe is a persistent **spatial substrate**, not a mandate to make every quiz 3D.

Domain-native learning objects remain authoritative:

- **Flags:** flag remains the dominant recognition object;
- **Locations:** map remains the dominant geography object; deeper globe integration is a later separate decision;
- **Outlines:** silhouette remains the dominant recognition object;
- **Neighbours:** target geography and land-neighbour context remain dominant.

Starting Play may therefore transition from the spatial shell into an activity layer while preserving enough geographic context that the learner still perceives continuity.

The implementation should prefer composition such as:

```text
persistent spatial scene
+
activity interface layer
```

over remounting an entirely separate visual application.

### 5.6 Results / return

Results are one of the strongest potential wins.

A round can finish, activity UI can recede and the selected geography can regain prominence. Progress/achievement changes can then appear attached to the place just practised.

Example:

```text
last West Africa flag answer
→ activity UI resolves
→ West Africa geography returns to prominence
→ round result / progress / Mastery state appears
→ Repeat / Review / Africa controls become available
```

This avoids turning Results into a disconnected reward dashboard.

### 5.7 Achievement ceremonies

Do not add routine spectacle.

The spatial shell does, however, provide a natural stage for genuinely scarce achievements:

- complete region: region-level spatial emphasis;
- complete continent: pull back enough to recognise the whole continent and reveal its earned trophy/crest;
- future World Crown: world-level camera state.

This maps cleanly onto the existing achievement hierarchy:

```text
country evidence
→ region × domain Mastery
→ complete region
→ complete continent
→ World Crown
```

The hierarchy should remain scarce and subordinate to learning until earned.

## 6. Core architectural principle

**Replace presentation continuity, not application semantics.**

Do not rewrite learning/scoring/persistence architecture merely to make navigation spatial.

The existing typed route model remains authoritative.

The scene consumes route state and derives a desired spatial presentation.

Illustrative route interpretation:

```text
/#/
→ camera: world
→ UI: mode picker

/#/flags
→ camera: world
→ domain: flags
→ UI: continent selection

/#/flags/africa
→ camera: Africa
→ domain: flags
→ UI: continent + region controls

/#/flags/africa/west-africa
→ camera: West Africa
→ domain: flags
→ UI: scope controls

/#/flags/africa/west-africa/test
→ camera: West Africa/activity composition
→ domain: flags
→ UI: active flag round
```

The animation is not durable state.

The URL is not an animation event log.

## 7. Proposed presentation architecture

Illustrative shape:

```text
AtlasApp
│
├── SpatialAtlas                    persistent
│   ├── GlobeScene
│   ├── GeographyLayer
│   ├── CameraDirector
│   ├── InteractionLayer
│   ├── SelectionState
│   └── SpatialLabelAnchors
│
└── InterfaceLayer                  ordinary React/DOM
    ├── ModeSelection
    ├── ScopeControls
    ├── ActivityUI
    ├── ResultsUI
    ├── ProfileUI
    └── RendererFallback
```

Possible responsibility split:

### `SpatialAtlas`

Owns only visual/spatial interpretation:

- renderer lifecycle;
- camera;
- globe rotation;
- geography meshes;
- selection/highlight state;
- pointer picking;
- motion orchestration;
- render-loop policy;
- graphics capability/failure handling.

It must not own scoring, achievement qualification, storage semantics or route truth.

### `CameraDirector`

Takes semantic destinations, not ad-hoc imperative animation commands spread through screens.

Example conceptual API:

```ts
type SpatialDestination =
  | { kind: 'world' }
  | { kind: 'continent'; continentId: ContinentId }
  | { kind: 'region'; regionId: string }
  | { kind: 'activity'; scope: StudyScope; domain: LearningDomain };
```

The director decides how to move from current camera state to destination, including interruption and reduced-motion behaviour.

### `InterfaceLayer`

Keeps real HTML semantics:

- buttons;
- headings;
- progress labels;
- focus;
- live announcements;
- quiz answers;
- forms/inputs;
- unavailable states.

3D picking and DOM activation should call the same application action.

## 8. Technology candidates

Technology selection is deliberately provisional until the Africa spike.

### 8.1 Preferred prototype: Three.js + React Three Fiber

Candidate stack:

- `three`;
- `@react-three/fiber`;
- `@react-three/drei`;
- `CameraControls` via Drei / `camera-controls`;
- `motion` for DOM/UI choreography;
- optional `three-globe` for early spherical GeoJSON rendering.

Why this is the leading candidate:

- maximal control of camera choreography;
- straightforward React ownership of scene lifecycle;
- persistent scene can coexist with ordinary DOM React;
- custom stylised globe rather than a map-provider aesthetic;
- flexible selection/material/achievement treatment;
- on-demand rendering can keep idle GPU work low;
- existing React/Vite architecture can remain intact.

Risks to validate:

- actual Android/iOS WebGL stability;
- StrictMode renderer lifecycle/context-loss behaviour during development;
- bundle cost;
- touch gesture conflicts;
- polygon performance at world and continent detail;
- context recovery;
- WebGL fallback path.

Do not commit the production architecture to R3F before the spike proves those conditions.

### 8.2 Strong alternative: MapLibre GL JS globe

MapLibre is a serious alternative because it begins with geographic coordinates and map-native camera/projection behaviour.

Potential advantages:

- geospatial model is native rather than adapted onto a general 3D engine;
- country polygons and camera movement fit the problem well;
- globe projection already belongs to the map engine;
- may reduce custom geographic rendering code.

Potential disadvantages:

- Atlas may have less control over the final scene/interaction grammar;
- harder to make the entire experience feel like a bespoke spatial game instrument rather than a map application;
- integration with custom transitions/achievement choreography may be less direct.

The spike should compare it if R3F introduces structural problems or if map-native behaviour clearly feels superior.

### 8.3 Prototype accelerator: `three-globe`

`three-globe` may be valuable for the first Africa/world experiment because it can accept polygon data and produce a globe quickly while Atlas retains surrounding scene/camera ownership.

Do not assume the abstraction should become the permanent production renderer. If it becomes constraining, replace it behind a local adapter after the experiment.

### 8.4 Not preferred by default

#### CesiumJS

Excellent planetary GIS engine, but substantially heavier and more feature-rich than Atlas requires. Atlas does not need terrain, 3D Tiles, earth-observation workflows or high-precision global simulation merely to render 195 stylised country polygons.

#### deck.gl GlobeView

Avoid taking an experimental globe-view dependency unless later evidence shows a distinct advantage.

#### Independent custom globe geography source

Not acceptable. The experiment must extend existing Atlas cartography rather than invent another dataset/policy pipeline.

## 9. Canonical spherical geography

### 9.1 Existing runtime limitation

Current `MapRegionAsset` country geometry stores already-projected SVG path strings in continent-local canvas coordinates.

Those paths are excellent for current 2D map rendering but are not the correct source for a sphere.

Do not attempt to distort those finished projection paths around a globe.

### 9.2 Correct source

Extend the existing Natural Earth generation pipeline upstream from projection, using the same pinned Natural Earth 1:10m geographic source, policy and ISO3 reconciliation.

Conceptual pipeline:

```text
pinned Natural Earth source
          │
          ├── current 2D projected map assets
          │
          └── new spherical assets
               ├── world LOD
               ├── continent LOD
               └── optional region/activity LOD
```

### 9.3 LOD strategy

Do not ship/render full 1:10m complexity everywhere at all times.

Likely tiers:

#### World LOD

Aggressively simplified geometry.

Purpose:

- continent/country recognition;
- world rotation;
- continent picking;
- low startup/render cost.

#### Continent LOD

Moderate detail loaded when a continent becomes relevant.

Purpose:

- readable boundaries;
- region interaction;
- camera approach.

#### Region/activity detail

Only load higher detail where the experience materially requires it.

The learner should perceive one Earth even if the renderer swaps geometry levels underneath the camera transition.

### 9.4 Region membership

Reuse existing learner-facing scope definitions. Do not derive a parallel region taxonomy inside the renderer.

The renderer needs data such as:

- ISO3 country → polygon(s);
- ISO3 → canonical continent;
- learner-facing region → ordered/member ISO3 IDs;
- geographic bounds/centroid or camera-fit metadata;
- support availability by domain.

Region boundaries may be represented as grouped country geometry rather than a handwritten polygon.

## 10. Camera model

The camera is central to whether this feels coherent or gimmicky.

### 10.1 Principles

- movement should explain hierarchy;
- motion should be short enough to preserve pace;
- transitions must be interruptible;
- repeated navigation must not replay unnecessary cinematic travel;
- direct deep links initialise close to the final destination;
- Back should normally feel like a spatial inverse of forward navigation;
- reduced-motion users get short/snap transitions without losing hierarchy.

### 10.2 Camera destinations

Prefer semantic camera targets generated from canonical bounds rather than dozens of handwritten angles.

The generator may produce:

- geographic centroid;
- fit radius/bounds;
- safe camera distance;
- optional north-up/tilt guidance.

Small authored overrides may be acceptable where a generated view is demonstrably poor, but they should remain presentation metadata and not become a second geography source.

### 10.3 Deep links

A cold load at:

`/#/flags/africa/west-africa`

should initialise at West Africa rather than beginning at a tiny world globe and replaying World → Africa → West Africa.

A short establishing transition is acceptable where appropriate.

### 10.4 Interrupted motion

If a learner taps Back or another scope midway through a camera transition:

- cancel/redirect the existing transition;
- continue from the actual current camera state;
- never queue a long sequence of obsolete camera journeys.

## 11. Region controls and picking

### 11.1 Real DOM remains primary semantic interface

Every continent/region selection state must expose ordinary HTML controls.

For Africa, for example:

```text
Africa                    whole-continent Play
North Africa              region action
West Africa               region action
Central Africa            region action
East Africa               region action
Southern Africa           region action
```

Visual placement can associate these controls with geography, but their semantics remain standard and testable.

### 11.2 Geography picking

Tapping the actual 3D polygon/group is an additional pointer input.

Both paths converge on the same application action:

```text
3D West Africa pick
              ┐
              ├──> navigate/select West Africa
DOM button    ┘
```

Do not implement separate business logic for map and button activation.

### 11.3 Tiny geography

World-level picking does not need every microstate to function as a 44px precise country quiz target. The shell selects larger geographic scopes.

Where country-level picking is later used, Atlas's existing small-country/callout/inset work remains relevant and must not be casually discarded.

## 12. Progress, Mastery and colour

### 12.1 Preserve semantic colours

Unless a separate design decision changes the system:

- Atlas Blue: ordinary action/selection/progress;
- green: correct feedback;
- red: wrong feedback;
- purple: durable region × domain Mastery;
- gold: scarce completion/prestige.

Do not assign each region an arbitrary brand colour.

Do not encode progress only through map fill/saturation.

### 12.2 Spatial augmentation

Possible restrained model:

- neutral geography: base land treatment;
- hover/focus/selection: Atlas Blue edge/emphasis;
- Mastered: purple boundary/glow/edge plus textual/non-colour cue;
- complete: sparse gold edge/material accent plus textual/non-colour cue.

Exact progress remains available through controls/labels rather than requiring a learner to estimate percentage from a fill.

### 12.3 Geography remains content

Avoid turning the globe into a dashboard surface covered in metrics, badges and progress arcs.

The spatial shell should reduce chrome, not move the same chrome into 3D.

## 13. Unsupported geography

The globe should remain geographically honest even when curriculum support is incomplete.

Example for Locations:

- North America still exists visually;
- it may be selectable for orientation;
- the resulting control state clearly communicates unavailable / Coming soon;
- no Play-ready affordance;
- no fake 0% progress presentation;
- no achievement eligibility.

Existing domain/scope availability functions remain authoritative.

## 14. Mobile gestures

Gesture ownership must be designed before broad implementation.

### 14.1 Proposed shell gestures

- one-finger drag: rotate Earth;
- tap: activate selected continent/region;
- pinch: dolly/zoom;
- optional restrained inertial release;
- no free-flight camera.

### 14.2 OS/browser Back

Atlas must not capture edge gestures in a way that breaks platform navigation.

Particularly verify:

- Android predictive/system Back gestures;
- iOS Safari/PWA edge Back;
- browser history Back/Forward.

Reserve edge behaviour where necessary.

### 14.3 Activity interaction conflicts

The shell and active learning mechanic must not both believe they own the same gesture.

Example:

- world/continent shell: drag rotates globe;
- active Locations map: drag pans learning map according to that mechanic;
- active Flags: horizontal drag should not unexpectedly rotate the hidden globe beneath answer controls.

Define active gesture owner by product state.

## 15. Accessibility model

A spatial experience is not allowed to become a 3D-only experience.

Required:

- real DOM controls for every durable scope action;
- keyboard operation;
- visible focus;
- logical heading/landmark hierarchy;
- screen-reader accessible scope labels;
- no country-answer leakage during geography quizzes;
- no colour-only state;
- reduced-motion mode;
- stable focus restoration after route transitions;
- live announcements where spatial movement changes meaningful context;
- honest renderer failure state.

### 15.1 Reduced motion

Reduced-motion mode should preserve the spatial hierarchy while removing long travel.

Possible treatment:

```text
World
→ short fade/reposition
Africa
→ short fade/reposition
West Africa
```

The user still understands scope nesting without a large simulated camera flight.

### 15.2 Keyboard model

Keyboard users should not be expected to rotate the Earth to discover controls.

At each spatial state, the relevant semantic controls are directly focusable.

Arrow-key spatial navigation may be explored later, but is not required for the first prototype.

## 16. Performance architecture

The experiment succeeds only if it feels immediate on a phone.

### 16.1 Persistent renderer

Avoid mounting/unmounting the WebGL canvas on every route.

A single persistent scene is both the conceptual design and the performance strategy.

### 16.2 Render on demand

When:

- camera is still;
- globe is not rotating;
- no transition/animation is running;
- no material state is changing;

prefer an idle/on-demand render policy rather than permanent 60 FPS GPU use.

### 16.3 DPR

Constrain/adapt device pixel ratio. Native high-DPI phone resolution is unnecessary for a quiet vector globe if it materially increases GPU cost.

### 16.4 Geometry/material reuse

Do not reconstruct hundreds of geometries/materials on every scope change.

Reuse scene resources and update emphasis/visibility where possible.

### 16.5 Lazy loading

The current application has no 3D runtime dependency. Preserve fast startup.

Potential sequence:

```text
render initial Atlas shell/domain controls
→ dynamically import spatial engine
→ initialise world scene
```

The exact threshold should be performance-tested rather than assumed.

### 16.6 No unnecessary 3D cost

Prototype exclusions:

- no terrain mesh;
- no high-resolution raster world texture;
- no expensive real-time shadows;
- no volumetric clouds;
- no post-processing stack unless a specific measured need emerges;
- no decorative particles.

## 17. WebGL resilience and fallback

The 3D renderer must not become a single point of failure for the PWA.

Detect/handle:

- WebGL initialisation failure;
- context loss;
- repeated context loss;
- graphics capability below supported threshold;
- renderer exception.

Fallback options:

1. current production launcher/navigation;
2. simplified 2D spatial launcher generated from the same canonical geography.

The first prototype may use the current launcher as the fallback because it already exists and is known to work.

## 18. PWA/offline implications

The spatial engine changes the asset profile substantially.

Requirements:

- shell remains installable/offline according to existing policy;
- essential spatial assets have an explicit caching policy;
- lazy continent detail may use runtime caching after first visit if consistent with the established service-worker approach;
- no CDN-only critical runtime dependency without an offline strategy;
- service-worker updates must not strand incompatible cached geometry/runtime versions;
- generated spherical assets need deterministic versioning/provenance.

Do not expand the initial precache blindly with all high-detail global assets.

## 19. Prototype branch policy

The first spike lives on:

`explore/spatial-atlas-moonshot`

This is an **exploration branch**, not a long-lived production migration branch.

Allowed during the spike:

- candidate 3D dependencies;
- prototype-only scene code;
- generated experimental spherical assets;
- prototype styling/components;
- benchmark/verification utilities;
- architecture notes/results.

Do not merge the spike merely because it works.

If the experiment passes, production implementation should be decomposed into focused branches/PRs with reviewed architecture boundaries.

## 20. Africa vertical-slice prototype

### 20.1 Why Africa

Africa remains the best proving ground because:

- Atlas's geography foundation began there;
- region taxonomy is established;
- continent shape is distinctive;
- five learner-facing regions provide meaningful scope hierarchy;
- existing navigation/progress behaviour provides a direct baseline.

### 20.2 Required traversal

Prove:

```text
Mode selection
→ World
→ Africa
→ West Africa
→ Back to Africa
→ Back to World
```

This is the minimum valuable experiment.

### 20.3 Prototype requirements

The spike should include:

- persistent globe scene;
- generated canonical world/Africa geometry;
- drag rotation;
- pinch/dolly;
- Africa picking;
- West Africa picking;
- Africa whole-continent DOM control;
- Africa region DOM controls;
- camera transition World → Africa;
- camera transition Africa → West Africa;
- reverse navigation;
- interrupted transition handling;
- route synchronisation or an isolated adapter faithful to the current route model;
- reduced-motion treatment;
- mobile portrait composition;
- unsupported-geography visual treatment concept;
- renderer failure fallback;
- measured bundle/runtime characteristics.

### 20.4 Prototype success criterion

The experiment passes only if it is **materially better** than the current launcher in the target experience.

It should feel:

- faster or at least equally immediate in practice;
- more geographically coherent;
- less like changing pages;
- easy to understand without instructions;
- comfortable to manipulate one-handed on a phone;
- restrained enough to remain Atlas rather than becoming a generic 3D demo.

### 20.5 Prototype failure conditions

Treat any of these as grounds to stop, redesign or choose a lower-ambition alternative:

- continent/region selection is slower or less clear than rows;
- globe interaction frequently conflicts with OS gestures;
- input/picking is unreliable on phone hardware;
- persistent renderer materially harms battery/thermal behaviour;
- bundle/startup cost damages first interaction;
- accessibility fallback feels like a completely separate inferior product;
- camera travel becomes repetitive after normal repeated use;
- the geography becomes decorative rather than instructional;
- renderer instability makes the PWA unreliable.

## 21. Prototype measurements

Record actual evidence rather than qualitative claims only.

Suggested capture:

### Build

- added JS gzip/brotli size;
- geometry payload sizes by LOD;
- initial vs lazy chunk split;
- service-worker/precache delta.

### Runtime

- time from domain activation to usable globe;
- frame rate during drag/transition on representative mobile hardware;
- idle renderer activity;
- memory use trend over repeated navigation if measurable;
- context loss/recovery behaviour;
- resize/orientation behaviour.

### UX

- number of taps from domain choice to West Africa Play-ready state;
- ability to select each Africa region at narrow portrait size;
- Back/Forward correctness;
- motion interruption correctness;
- reduced-motion correctness;
- one-handed usability observations from real device testing when actually performed.

Do not claim physical-device performance without actual physical-device testing.

## 22. Suggested implementation workstreams after a successful spike

### Phase 0 — Product/spatial specification

Lock:

- spatial state hierarchy;
- camera grammar;
- gesture ownership;
- scope-control hierarchy;
- accessibility model;
- progress/Mastery semantics;
- unavailable geography treatment;
- reduced-motion policy.

### Phase 1 — Canonical spherical asset pipeline

Deliver:

- generator extension;
- deterministic outputs;
- world/continent LOD;
- ISO3 reconciliation;
- region grouping;
- bounds/centres metadata;
- provenance documentation;
- payload/performance verifier.

### Phase 2 — Africa isolated prototype

Deliver the vertical slice described above.

No production navigation replacement.

### Phase 3 — Persistent `SpatialAtlas` shell

Only after prototype approval.

Introduce a production-quality persistent renderer boundary and route → spatial-destination adapter.

### Phase 4 — Domain/world selection integration

Transition current post-mode continent selection to the world globe while preserving route/state semantics and honest unsupported continents.

### Phase 5 — Continent/region selection integration

Implement supported continent focus and region selection.

This is the phase most likely to subsume #104's design space.

### Phase 6 — Activity transition integration

Integrate existing activity UIs without rewriting their domain logic.

### Phase 7 — Results integration

Return geography to prominence after rounds and attach practical result actions to the selected scope.

### Phase 8 — Achievement transitions

Add only restrained earned milestone spatial treatments.

### Phase 9 — Locations engine decision

Separately assess whether the Locations 2D runtime should:

- remain an optimised 2D learning surface;
- reuse parts of the spherical renderer;
- or gain a dedicated globe mode.

Do not bundle this decision into the navigation shell by default.

### Phase 10 — hardening

Full:

- accessibility;
- PWA/offline;
- low-end graphics;
- real-device mobile;
- orientation/safe area;
- Back/Forward/deep links;
- renderer/context recovery;
- production artifact inspection;
- complete repository gate.

## 23. Existing Atlas systems to preserve

Unless a separate issue explicitly changes them:

### Routing

- typed route grammar;
- stable route compatibility;
- native browser history;
- activity-refresh fallback behaviour;
- ephemeral active-round internals.

### Geography

- ISO3 canonical identity;
- Natural Earth source/provenance;
- existing geopolitical/boundary policy;
- generated topology/adjacency ownership;
- no handwritten country geometry;
- no handwritten neighbour tables.

### Learning

- independent domain ledgers;
- existing evidence semantics;
- scoring rules;
- retry/reveal behaviour;
- current Mastery qualification semantics;
- achievement persistence.

### Product language

Learner-facing British English remains authoritative.

### Design

- geography remains dominant;
- cool near-white / graphite base;
- restrained colour;
- modest depth;
- progressive disclosure;
- minimal gamification;
- no ornamental 3D spectacle.

## 24. Likely repository touchpoints

Prototype investigation should expect work around:

```text
src/react/
  AtlasApp.tsx
  components/
  screens/

src/routing/
  routes.ts
  router.ts

src/data/
  continents.ts
  learning-scopes.ts
  map-scopes.ts

src/domain/
  models.ts
  map-models.ts

scripts/
  generate-map-assets.mjs
  map-sources/

src/infrastructure/
  generated/static asset loading boundaries

src/sw.ts
vite configuration / production build verification
```

Do not assume all of these need production modification for the spike. Prefer an isolated prototype surface where practical.

## 25. Testing strategy

### Unit/domain

No new learning-domain semantics should be required for the prototype.

Add focused tests for any pure:

- route → spatial destination mapping;
- region aggregation;
- camera metadata generation;
- availability presentation model.

### Component

Test DOM controls independently of WebGL where possible.

The learner must be able to activate a continent/region through standard React controls even if renderer details are mocked.

### Browser

Automate where practical:

- route transitions;
- Back/Forward;
- reduced-motion class/state;
- renderer fallback;
- resize/portrait/landscape;
- pointer selection adapter.

Do not mistake browser automation for physical-device validation.

### Production artifact

Before any production integration merge:

- run `npm test` under Node 22;
- inspect exact generated production bundle;
- inspect lazy chunks;
- inspect service-worker asset treatment;
- confirm CI green;
- verify current main sync.

## 26. Risks

### Risk: 3D novelty dominates the product

Mitigation: quiet materials, no terrain/space decoration, strict geography-first design review.

### Risk: camera movement becomes repetitive

Mitigation: short transitions, interruption, route-aware direct initialisation, reduced journey length for repeated nearby navigation.

### Risk: bundle/startup regression

Mitigation: lazy runtime, LOD geometry, bundle budget gate, retain domain selection before full engine readiness if needed.

### Risk: mobile thermal/battery cost

Mitigation: on-demand rendering, constrained DPR, no expensive lighting/postprocessing, idle instrumentation.

### Risk: accessibility becomes second-class

Mitigation: standard DOM controls are part of the primary architecture, not an afterthought.

### Risk: WebGL context instability

Mitigation: persistent renderer, context handling, fallback launcher, real-device stress tests.

### Risk: duplicate geography system

Mitigation: spherical outputs generated from the existing canonical Natural Earth pipeline only.

### Risk: route and camera become coupled incorrectly

Mitigation: URL remains state truth; camera consumes semantic destination and remains presentation-only.

### Risk: Locations gets prematurely rewritten

Mitigation: explicitly defer Locations engine replacement until after shell navigation proves value.

## 27. Decision gates

### Gate A — architecture feasibility

Can Atlas render a persistent interactive Earth cleanly inside the existing React/Vite/PWA architecture without destabilising the shell?

### Gate B — canonical geography

Can the existing map generator provide spherical LOD assets without introducing another geography source or policy layer?

### Gate C — mobile interaction

Does World → Africa → West Africa feel precise and natural at phone scale?

### Gate D — continuity

Does route navigation genuinely feel spatially continuous rather than like a slow animation inserted between screens?

### Gate E — accessibility

Can DOM-first semantic controls and reduced motion remain first-class without undermining the spatial concept?

### Gate F — performance

Is startup, manipulation, idle behaviour and memory acceptable on target mobile hardware?

### Gate G — product value

After actual use, is this materially better than the current one-tap launcher rather than merely more impressive?

Only after all seven gates pass should Atlas plan a production migration epic/child PR sequence.

## 28. Alternative outcomes

The exploration does not need to end in all-or-nothing adoption.

Possible outcomes:

### Outcome A — Full persistent spatial shell

The moonshot works and becomes the long-term presentation model.

### Outcome B — Globe only for continent selection

World-level globe works beautifully, but region/activity continuity adds too much complexity. Keep the globe at one IA level.

### Outcome C — 2D spatial shell

The continuity concept is excellent but WebGL cost is not. Reproduce the hierarchy with animated canonical 2D geography.

### Outcome D — #104-style continent launcher only

The broader shell is unnecessary, but map-first region selection is still a net win.

### Outcome E — Retain current launcher

The current one-tap rows remain faster/clearer. Archive the spike with evidence and do not force the moonshot into production.

A disciplined exploration regards Outcome E as a valid success if it prevents an expensive weak redesign.

## 29. Immediate next action

Use `explore/spatial-atlas-moonshot` to build the smallest credible Africa vertical slice.

Do **not** start by converting current production navigation wholesale.

The first useful artefact should answer one question:

> On an actual mobile-sized Atlas experience, does domain → world → Africa → West Africa → Back feel so natural and coherent that it justifies a new presentation architecture?

Everything after that depends on the answer.
