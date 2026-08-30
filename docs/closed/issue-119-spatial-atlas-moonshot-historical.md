# Issue #119 — Continuous Spatial Atlas Moonshot

**Status:** product/technical exploration; no production commitment and no renderer selected.  
**Issue:** #119 — continuous spatial Atlas shell with interactive 3D Earth navigation  
**Branch:** `explore/spatial-atlas-moonshot`  
**Execution plan:** [`issue-119-plan.md`](issue-119-plan.md)

This file is the durable **scope**: product thesis, preservation boundaries, experience requirements and allowed outcomes. Sequencing, dependency gates and ownership live in `issue-119-plan.md`.

## 1. Purpose

Atlas currently uses a coherent mode-first hierarchy:

`Home → learning domain → continent launcher → region/continent activity`

Issue #119 explores whether that hierarchy should *feel* like movement through one geographic instrument rather than a sequence of page replacements.

The underlying application remains route-driven. The learner may instead experience a persistent spatial presentation:

`Mode → World → Continent → Region → Activity → Region/Results`

The goal is **spatial continuity**, not 3D spectacle.

A spinning globe that is slower, harder to understand, less accessible, more fragile or more repetitive than the current launcher is a failed outcome.

## 2. Current production truth

At the current pre-#27 checkpoint:

- React owns production presentation;
- Vite owns production builds;
- domain/data/routing/state remain layered TypeScript;
- typed hash URLs own durable domain/scope/activity state;
- active round internals remain ephemeral session state;
- browser Back/Forward is native and first-class;
- ISO3 is canonical country identity;
- pinned Natural Earth 1:10m is the sole production topology source;
- Africa, South America, Europe, Asia and North America ship across the geography-dependent domains;
- #27 is completing Oceania;
- #137 will harden shared/Asia map interaction after #27;
- #138 will surface/accept the genuinely reachable World Crown after world curriculum completion.

Final comparison evidence for #119 must be recaptured after #27/#137/#138 merge. Do not preserve pre-world-complete payload counts or unsupported-continent examples as final truth.

## 3. Product thesis

Atlas’s existing design thesis remains:

> **Geography is the content; the interface is the instrument.**

The spatial direction asks whether the navigation itself can become geographic:

- hierarchy is understood through position/scale as well as labels;
- Back feels like reversing a journey;
- scope controls remain obvious without requiring a separate selection screen;
- results can return geography to prominence;
- repeated navigation remains fast enough for daily practice.

Spatial continuity must reduce conceptual chrome rather than move the same dashboard into a map/globe.

## 4. H1 before H2

Issue #119 deliberately separates:

- **H1 — continuity:** continuous spatial navigation beats discrete launcher replacement;
- **H2 — sphere:** a 3D Earth adds enough value above successful continuity to justify its cost.

H1 is tested first with existing production 2D geography. If H1 fails, stop the moonshot without renderer work.

This also absorbs the useful design space from closed #104: geography-first continent/region selection is now evidence for H1 rather than an independently scheduled launcher redesign. #104’s rejected colour-only/region-colour ideas do not return by implication.

## 5. Desired experience

### Domain selection

Atlas remains mode-first. Flags, Locations, Outlines and Neighbours stay peer product domains.

A future spatial layer may already be visually present or may lazy-load after the domain decision, but **first meaningful interaction must not wait for a heavy renderer**.

### World

After domain selection, geography becomes the primary scope-selection object.

A future 3D version may allow restrained rotation and pinch/dolly, but the target visual language is quiet Atlas cartography, not satellite imagery, terrain, starfields or a generic embedded mapping product.

### Continent

Selecting Africa should make the hierarchy feel continuous. Africa becomes the dominant geographic scope while whole-continent and region actions remain explicit.

The continent action stays stronger than region actions. Do not introduce arbitrary region identity colours.

### Region

Selecting West Africa should continue the same spatial hierarchy rather than presenting another unrelated page. Labels and real DOM controls must make the state understandable even without observing motion.

### Activity

The spatial shell is not permission to make every learning mechanic 3D.

- Flags: the flag remains the dominant recognition object.
- Locations: the map remains the dominant learning object until F1 explicitly decides its relationship to a persistent globe.
- Outlines: the silhouette remains dominant.
- Neighbours: target geography and neighbour context remain dominant.

Starting an activity may therefore layer domain-native UI over/recede the spatial substrate. The activity engine, scoring and evidence semantics are unchanged.

### Results / return

A strong spatial outcome could let activity UI recede and return the practised geography to prominence before practical repeat/review actions appear.

Do not turn results into a reward dashboard. Achievement presentation remains scarce and follows existing earned-state semantics, including the World Crown surface owned by #138.

## 6. Core architecture boundary

**Replace presentation continuity, not application semantics.**

A spatial layer may consume the current typed route and derive a visual destination. It must not own a second route/history stack.

Illustrative semantic destinations only:

```ts
type SpatialDestination =
  | { kind: 'world' }
  | { kind: 'continent'; continentId: string }
  | { kind: 'region'; regionId: string }
  | { kind: 'activity'; domain: LearningDomain; scope: StudyScope };
```

The precise F1/F2 API is **not** decided by this scope.

Rules:

- route state is durable;
- camera/motion progress is not durable state;
- deep links initialise at their stable target;
- Back/Forward changes route ancestry, then presentation follows;
- interrupted motion must converge on the newest route state.

## 7. Geography contract

Current `MapRegionAsset` paths are already-projected 2D runtime outputs. They are suitable for the H1 continuity probe and unsuitable as the direct source for a sphere.

If H1 later passes and F3 authorises spherical assets, they must extend the **existing** Natural Earth pipeline upstream from projection:

`pinned Natural Earth → Atlas ISO3/policy reconciliation → existing 2D outputs + authorised spherical outputs`

No second dataset, handwritten country geometry, handwritten region polygon or handwritten neighbour table is allowed.

A future renderer reuses existing learner region membership. It does not invent a second geographic taxonomy.

The final spherical encoding, LOD tiers and visual-vs-picking geometry relationship are reserved for F3.

## 8. Renderer candidates — neutral until F2

The existing evidence studies two serious candidates:

### Three.js / React Three Fiber

Potential strengths:

- high control over camera, scene and bespoke interaction grammar;
- natural React composition with ordinary DOM overlays;
- flexible stylised rendering.

Unresolved costs/risks include Atlas-authored spherical geometry/tessellation/picking/labels/LOD machinery, delivered bundle cost, WebGL lifecycle stability and mobile gesture behaviour.

### MapLibre GL JS globe

Potential strengths:

- geographic coordinates/projection and feature picking are native concepts;
- camera and GeoJSON source/layer machinery are built in;
- may reduce Atlas-authored geospatial renderer code.

Unresolved costs/risks include custom scene freedom, integration grammar and whether historical headless blank-source failures reproduce under headed/hardware-backed conditions.

**Neither candidate is preferred or selected here.** The current comparison remains AMBER until H1 passes and support repairs it apples-to-apples. F2 chooses/rejects architecture.

## 9. Real DOM and picking

A spatial experience cannot become a canvas-only application.

At every durable scope state:

- ordinary HTML controls expose the same meaningful actions;
- keyboard users can reach them without rotating a globe;
- visible focus is preserved;
- screen readers receive scope context that does not depend on motion;
- geographic picking and DOM activation converge on the same application action.

3D/2D picking is an additional pointer surface, not a separate business-logic path.

## 10. Colour, progress and achievement

Preserve semantic roles:

- Atlas Blue — ordinary action/selection/progress;
- green — correct feedback;
- red — wrong feedback;
- purple — durable region × domain Mastery;
- gold — scarce completion/prestige.

Do not assign continent/region identity palettes. Do not encode progress only as fill/saturation/colour. Geography may gain restrained selection/Mastery/completion emphasis only when another textual/semantic cue communicates the state.

World Crown presentation remains a genuine earned state, not decorative locked chrome.

## 11. Motion and camera principles

If spatial motion survives H1/F1:

- movement explains hierarchy rather than performs spectacle;
- transitions remain short enough for repeated use;
- input can interrupt/retarget motion;
- obsolete journeys are cancelled rather than queued;
- deep links begin near their final destination;
- Back normally reads as spatial inverse without requiring an exact animation replay;
- repeated traversal may shorten/avoid unnecessary choreography;
- reduced motion preserves hierarchy with immediate/short repositioning.

Exact camera grammar is F1/F2 territory.

## 12. Mobile gesture ownership

Any future spatial layer must deliberately coexist with:

- browser/OS edge Back;
- DOM controls and scrolling;
- pinch/drag on Locations maps;
- Neighbours input/software keyboard;
- activity-specific pointer interaction.

A background globe must not steal gestures from active learning mechanics.

#71 owns current physical-device mobile/PWA validation. A new spatial gesture layer would require new physical validation rather than inheriting #71’s eventual production pass.

## 13. Accessibility

Required regardless of renderer:

- real DOM actions for durable scope selection;
- keyboard operation and visible focus;
- logical heading/landmark structure;
- stable focus after route changes;
- no colour-only state;
- reduced-motion equivalent;
- answer-safe accessible metadata;
- useful failure/fallback state;
- no requirement to observe camera travel to understand hierarchy.

If an accessible parallel interface becomes so dominant that spatial presentation is decorative, that is a legitimate reason to narrow/reject the moonshot.

## 14. Performance and PWA requirements

The spatial idea succeeds only if Atlas remains immediate on a phone.

Any authorised spatial runtime must:

- stay off the initial critical path unless measurement justifies otherwise;
- load lazily/preload deliberately;
- avoid permanent idle render work where the selected renderer permits;
- reuse geometry/material/resources according to the approved lifecycle;
- constrain unnecessary high-DPI/GPU cost;
- avoid decorative terrain/textures/post-processing;
- preserve service-worker/offline/update behaviour;
- version/cache new generated assets consistently with the existing PWA.

Measure exact artifact deltas; do not rely on historical bundle figures.

## 15. Failure and fallback

A renderer may not become a single point of failure.

Future architecture must handle:

- initial capability failure;
- renderer initialisation exception;
- context loss/repeated context loss;
- bounded recovery;
- fallback to a usable 2D/current navigation path.

Infinite retry loops and blank geography are failures.

## 16. Stage 1 H1 slice

Before any renderer, prove the experience thesis using production 2D geography:

`Mode/domain → World/continent selection → Africa → West Africa → Play-ready/activity → Back to Africa → Back to world/domain`

The probe must use current router/history/DOM controls/design tokens, be interruptible, support reduced motion and be judgeable on a phone.

Ben decides H1 through the fixed physical-device script in `issue-119-plan.md`.

If continuity is neutral or worse, stop #119.

## 17. What only a principal may decide

Support must not decide:

### F1 — spatial interaction contract

Including the Locations-vs-globe decision, progressive disclosure, gesture ownership, interruption and reduced-motion grammar.

### F2 — renderer / scene / camera architecture

Including renderer choice/rejection, lifecycle, camera abstraction, picking/DOM integration, lazy boundary and failure strategy.

### F3 — spherical geography / LOD contract

Including output representation, simplification/LOD boundaries, visual/picking mesh relationship, antimeridian/multipart policy and asset lifecycle.

Do not build the Africa 3D vertical slice until F1–F3 authorise it.

## 18. Allowed outcomes

A successful exploration may conclude:

- **A — broad 3D spatial shell:** H1 and H2 both justify the architecture;
- **B — narrowed 3D:** only selected navigation/ceremony surfaces justify it;
- **C — continuous 2D shell:** H1 wins but the sphere does not earn its cost;
- **D — local geography-first enhancement:** only a smaller launcher/result treatment is worth keeping;
- **E — retain current launcher:** continuity itself does not materially win.

Outcome E is not project failure. It is successful falsification before a costly migration.

## 19. Hard stop conditions

Stop/narrow rather than scaling if:

- navigation is slower or less clear than current rows after real refinement;
- repetition makes camera travel annoying;
- OS Back and manipulation cannot coexist cleanly;
- accessibility requires a separate dominant interface;
- route truth is duplicated into an animation state machine;
- canonical geography needs a second source;
- renderer/payload/runtime cost materially harms the mobile PWA;
- renderer failure cannot degrade safely;
- geography becomes decoration instead of instructional context;
- unrelated scoring/storage/Mastery changes are needed to justify the experience.

The current production launcher remains authoritative until a future production migration is separately designed, reviewed and accepted.
