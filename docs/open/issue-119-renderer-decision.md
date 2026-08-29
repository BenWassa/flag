# Issue #119 — F2: Renderer, scene and camera architecture

**Status:** DECIDED AND IMPLEMENTED on the full-candidate branch.
**Decision:** **plain Three.js behind a narrow imperative handle, hosted by one React component, loaded lazily.**

This supersedes the PARKED/AMBER state of `issue-119-renderer-comparison.md`.
That document's own recorded defects — a comparison in which one candidate
rendered no geography at all, and a set of MapLibre FAIL rows traced to a
headless SwiftShader artefact rather than to MapLibre — mean it could not settle
this on its evidence, and it is not cited for any of the conclusions below.
What follows is measured on this branch.

---

## 1. What Atlas actually asks a renderer to do

State the task before choosing the tool:

- draw about 200 flat-shaded polygon meshes and one sphere;
- build them **once** from generated data, then never rebuild them on navigation;
- change a material reference on some of them when a scope changes;
- move a camera along a single eased path;
- swap in a higher-detail set of meshes for one continent, and dispose it again;
- resolve a screen point to a latitude and longitude;
- render **only when something changed**;
- survive context loss;
- fail into a completely conventional Atlas when WebGL is unavailable.

There is no per-frame application state, no scene graph that reacts to props, no
physics, no lighting model, no animation system and no asset pipeline. That
description is what decides the answer.

## 2. Why not React Three Fiber

R3F's value is reconciling a **changing** scene graph against React state. Atlas's
scene graph does not change: it is constructed once from a generated asset and
then mutated by reference. Paying a reconciler for a tree that never reconciles
buys nothing and costs three things:

1. **Delivered bytes.** The renderer chunk measured here is 125.7 kB gzip and is
   almost entirely `WebGLRenderer` and its shader chunks — the practical floor
   for any Three-based approach. R3F plus the `CameraControls` binding the
   original proposal named would add to that floor, not replace it.
2. **A failure mode Atlas has.** R3F issue #3863 reports StrictMode development
   Canvas context loss. Atlas renders under `StrictMode`. The pre-work correctly
   flagged reproducing this as a mandatory gate; not depending on it removes the
   gate rather than passing it.
3. **Control we would write anyway.** Render-on-demand under R3F means
   `frameloop="demand"` plus manual `invalidate()` calls — the same discipline
   implemented here directly, with the addition of a scheduler in between.

None of this makes R3F a bad library. It makes it the wrong shape for a scene
that is built once.

## 3. Why not MapLibre GL

MapLibre's globe projection is genuinely good, and if Atlas were a map
application it would be the answer. Atlas is not:

- it has **no tile server, no style and no glyph pipeline**, and the offline PWA
  guarantee means it would have to ship and cache all three;
- it would introduce a **second cartography system** beside the pinned Natural
  Earth pipeline — the preservation boundary this issue states most firmly;
- country identity would arrive through feature properties in a style rather than
  from `src/data/countries.ts`, putting ISO3 identity inside the renderer;
- its delivered cost is larger than the whole Three-based stack measured here,
  before any Atlas code.

The earlier spike's MapLibre failures are set aside as environment-confounded, as
the plan review found. This decision does not need them: the reasons above are
architectural, and they would hold if every one of those rows had passed.

## 4. Why not Cesium, deck.gl, or three-globe

Cesium is planetary GIS infrastructure — terrain, imagery, time dynamics — for a
product that draws flat vector land on a plain sphere. deck.gl's GlobeView is
experimental. `three-globe` is a prototype accelerator whose value is exactly the
tessellation and picking this branch now owns and tests.

## 5. The architecture

```text
SpatialShell.tsx        layout; collapses to a plain block when the stage yields
└── SpatialStage.tsx    React host: mounts, lazily imports, pushes SpatialState
    └── stage-controller.ts   imperative owner — camera, LOD, picking, gestures
        ├── globe-scene.ts    Three.js: meshes, materials, render-on-demand
        ├── camera-director.ts  retargetable travel, reduced motion
        ├── gestures.ts       pointer ownership, edge-gutter reserve
        └── geo.ts            spherical maths and geographic picking (no Three)
```

The dependency direction is one-way and enforced by a verifier: the renderer
imports no curriculum table, and nothing in `src/spatial` writes navigation
state.

**React's job is mounting and the accessible DOM around the stage.** It does not
own the scene graph, the camera or the frame loop. `SpatialStage` pushes a
`SpatialState` and nothing else. That is also what keeps this decision
reversible: swapping the renderer means replacing `globe-scene.ts` behind the
`GlobeHandle` interface, which is eleven methods.

### Lifecycle

Created once per shell mount; disposed on unmount, including geometries,
materials, the point sprite and the renderer itself. The lazy import can resolve
after an unmount, so the boot path checks and destroys a controller created for a
detached host rather than leaking a GL context. StrictMode's double effect
invocation therefore costs one create/dispose pair, not a half-torn-down context.

### Render on demand

There is exactly **one** `requestAnimationFrame` call in the scene, guarded by
`renderPending`, `disposed` and `active`. Nothing spins while the globe is idle;
a browser test asserts the frame count is flat after the stage settles. When the
stage yields, `setActive(false)` stops rendering entirely and returns the frame
budget to the activity.

### Adaptive DPR

The ceiling starts at 2 — a 3× phone panel triples fragment cost for no
legibility gain on flat-shaded vector geography — and **drops to 1** after eight
sustained frames over 32 ms. Sustained cost is reduced, not merely capped.

### Picking

Ray-cast against the **ocean sphere**, once, to get a latitude and longitude;
then resolve identity on the CPU from source rings via `GeographyIndex`. This is
the "display geometry versus picking geometry" separation the brief asks for, and
it earns its keep three times: identity cannot drift with a tessellation change,
locator-only countries become selectable, and the expensive half is a pure
function testable in plain Node. Hit precedence follows Issue #117 — real
geography wins a contested tap; a locator only claims a point no polygon covers.

### LOD

The world asset is always mounted. A continent's detail layer is built above it
at a fractionally larger radius and **hides** the base meshes for its countries
rather than replacing them, so disposal is a removal, not a rebuild. The radius
offset is not cosmetic: two independently simplified coastlines of New Guinea
genuinely overlap, and coplanar land would z-fight.

Borders and locators are merged buffers, so a covered country cannot be hidden
the way its mesh can. Entering a continent therefore rebuilds the base layer's
lines without that continent's countries — once per entry, over a few tens of
thousands of vertices. Without it the coarse world outline keeps drawing beside
the finer one that replaced it (a visible double stroke) and a world locator dot
can sit on top of real detail geometry.

### Tessellation

Bending a flat triangle onto the sphere means splitting its long edges and
re-projecting the new vertices. The split decision is made **per edge, from the
edge alone**, not per triangle. Deciding per triangle leaves T-junctions: a
triangle split because its own longest edge was too long, while its neighbour
across a shorter shared edge stayed whole, bows onto the sphere on one side and
stays a chord on the other, so a hairline of ocean shows through the middle of a
country. Those seams were visible straight across Mali, Niger, Algeria and
Nigeria before the rule changed. Per-edge decisions mean two triangles sharing an
edge always agree and compute a bit-identical midpoint, which removes the cracks
rather than hiding them.

Land materials are `DoubleSide` rather than back-face culled: Natural Earth does
not guarantee consistent ring winding across features, and culling would silently
delete whichever countries came out reversed.

### Context loss, resize, orientation

`webglcontextlost` is prevented and flagged; `webglcontextrestored` re-sizes and
re-renders. A `ResizeObserver` on the stage handles resize and orientation and
re-derives the camera destination without restarting travel.

### Renderer failure

`createStageController` throwing — no WebGL, no context, a failed chunk — calls
`onUnavailable`, and `AtlasApp` renders the conventional Atlas with no shell at
all. This is not a degraded mode: it is the production application, because the
shell wraps the existing screens rather than replacing them. A browser test
blocks WebGL context creation and drives a full navigation through the result.

## 6. Measured cost

Built artifact, gzip:

| Chunk | Gzip | When |
| --- | ---: | --- |
| `app.js` (core shell) | **102.0 kB** | always |
| `stage-controller` (Three + scene + controller) | **125.7 kB** | first spatial route |
| `world` geography | **53.0 kB** | first spatial route |
| **Spatial entry total** | **178.8 kB** | — |
| continent detail (each) | 13.6–68.8 kB | on entering that continent |

Against the plan's directional target of ≤ 250 kB gzip for renderer plus initial
world-selection geography: **178.8 kB, inside budget**, and asserted by
`verify-spatial-atlas.mjs` so it cannot drift.

Two comparisons matter. The prototype this branch started from measured
135.6 kB of JS plus 269.5 kB of world geometry — **405 kB** for the same entry
point. And `app.js` moved from roughly 100.4 kB to 102.0 kB: the entire spatial
stack is behind a dynamic import, and the verifier asserts `WebGLRenderer` does
not appear in the initial shell.

The renderer chunk is inspected and contains no WebGPU or TSL code; what remains
is `WebGLRenderer` core. That is the floor, and it is the reason no wrapper was
adopted: **the renderer is the cost, and a framework on top of it is addition,
not substitution.**

## 7. PWA policy

The renderer and world geography are precached with the shell, because on this
candidate they *are* the shell. Continent detail stays lazy and runtime-cached,
exactly as the projected 2D continent assets already do. Both halves are asserted
against the generated service worker.

## 8. What would change this decision

- a Locations round moving onto the sphere, which would introduce per-frame
  interactive state and make a reconciler worth its bytes;
- labels, callouts or leader lines on the globe, which are a scene graph that
  changes;
- a measured need for terrain or imagery, which Atlas's design explicitly excludes.

None is in scope. If one arrives, `GlobeHandle` is the seam to replace.
