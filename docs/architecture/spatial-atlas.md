# Spatial Atlas architecture

**Status:** production navigation architecture since Issue #166

Spatial Atlas is Atlas's accepted default navigation presentation. A persistent Three.js Earth interprets the authoritative typed route and a compact real-DOM command surface is the navigation interface. It is not a preview and it does not sit above a conventional launcher page.

Renderer selection, generated spherical assets, the route adapter and activity boundary were established by #119; #166 completed the production cutover.

## Composition

```text
AtlasApp                         authoritative router, AppStore, AtlasActions
  └── deriveSpatialState(...)    pure; no navigation state of its own
        └── SpatialShell
              ├── SpatialStage       persistent Earth / camera / gestures / picking
              └── SpatialCommand     navigation interface, or
                  activity/results panel when the globe yields
```

Geography taps and DOM controls dispatch the same `AtlasActions` (`openScope`, `playScope`, `learnScope`). The route is never waiting on a camera animation, so interrupted travel cannot desynchronise application state.

## Product navigation contract

- choose a domain at Home/world level;
- select a continent on the Earth or equivalent DOM control;
- at continent focus, Play the continent or select a region;
- at region focus, Play/Learn that region;
- geography selection never starts a round implicitly;
- Back/Forward follows route ancestry while camera motion visually interprets it;
- cold deep links initialise directly at the requested scope.

The old one-tap launcher-row presentation is not the normal product surface.

## Progressive disclosure (#197)

Geographic detail is a function of the current decision level, published by `deriveSpatialState` as `boundaries` (`continent` | `region` | `country`), `labels` and `labelLevel`. The renderer owns none of it.

### Shells are derived, not authored

`src/spatial/disclosure.ts` builds a **boundary topology** once per loaded asset: every segment, with the country or countries carrying it. Because all seven assets come from one pinned Natural Earth topology, two neighbours carry their common boundary vertex for vertex, so a segment held by two countries of the same group is an interior border by construction. Dropping those leaves exactly the group's outline.

Consequences that matter:

- there is no second geography source, no baked shell asset, no handwritten geometry and no mask;
- re-grouping is a linear scan with two lookups per segment, so a navigation never rebuilds geometry from rings;
- an identity grouping is ordinary country borders, so the three levels are one mechanism rather than three code paths;
- `scripts/verify-spatial-disclosure.mjs` proves the cancellation against the canonical land-adjacency tables rather than assuming it.

The scene is handed a `BoundaryPlan` — a grouping, an emphasised set and whether locators belong to this level — and knows nothing about continents or regions.

### Names on the Earth

Selectable scopes are named by real DOM buttons in `src/spatial/scope-labels.ts`, positioned over the canvas from a geographic anchor and dispatching the same `AtlasActions` a geography tap does. Nothing is drawn as text in the scene.

An anchor is the most interior point of a scope's own geometry **inside that scope's own camera framing** — the same framing policy the camera uses, so Europe is named in Europe rather than in Siberia. A scope with no interior at that scale is an archipelago and is named across its frame's centre, as an atlas does.

Placement rules, in order: behind the planet, off the frame, or unable to sit without colliding, a name stands down — still focusable, still selectable, and reached by keyboard it turns the camera to itself rather than changing the route.

### Why the command surface keeps its own list

The projected controls are accessible in their own right; the command surface's chips are not an accessibility duplicate of them. They render before the lazy spatial stack has loaded, survive renderer failure and forced colours, carry the per-scope progress figure a name on the geography must not clutter it with, and are the server-renderable surface the IA checks assert route parity against.

## Preservation boundaries

The spatial layer must not change:

- canonical ISO3 identity or Natural Earth 1:10m source/provenance;
- typed hash route schema/history;
- scoring, learning evidence, Mastery or achievement qualification;
- storage/Firebase contracts;
- ephemeral active-round semantics;
- availability truth;
- PWA/offline guarantees;
- British English product language.

## Renderer failure and non-visual equivalence

A device that cannot start WebGL gets the conventional `Launcher`. It is retained for exactly this purpose and is built from the same `scopeModelFor` model, so fallback and Spatial cannot legitimately offer different scopes/counts/actions.

Forced-colours mode can hide the canvas while leaving real DOM navigation usable. A 3D-only selection state is out of scope.

## Activity boundary

| Activity | Stage mode | Reason |
| --- | --- | --- |
| Locations Play/Learn | yielded | projected map is the answer surface |
| Outlines Play/Learn | yielded | silhouette is the recognition object |
| Neighbours Play/Learn | yielded | neighbour map/set interaction owns the screen |
| Flags Learn, Profile | yielded | full/scrolling surfaces need the viewport |
| Flags Play | context | flag cannot be read from an inert unhighlighted Earth |
| Results | results | reframe geography just practised |

In live `context` mode the globe carries no answer-leaking scope highlight and takes no competing pointer input.

## Touch and picking

Picking geometry is not display geometry. Identity is resolved against canonical source rings/anchors rather than tessellated display triangles.

Tiny geography can receive an invisible interaction envelope derived from canonical geometry and camera scale. Nothing larger is drawn merely to satisfy touch targeting; the envelope is stable, answer-independent and retires as the learner zooms in.

Precedence preserves truthful ownership:

1. a tiny country owns its own land;
2. eligible overlapping envelopes compete deterministically;
3. assistance reaching toward a neighbour is bounded so an aimable neighbour retains practical ownership;
4. otherwise the containing polygon wins normally.

`scripts/verify-spatial-touch.mjs` and spatial geo tests hold this contract.

## Pointer ownership

- no single-pointer capture on initial `pointerdown`;
- capture/rotation begins only after the drag threshold;
- multi-pointer pinch captures immediately as required;
- crossing the drag threshold is sticky and cannot later resolve as a tap;
- a tap resolves from the **pointerdown** position, preventing finger jitter from moving a tiny target away before pick;
- `touch-action: none` is scoped to the stage;
- the platform edge gutter remains available to browser/OS Back gestures.

## Motion and accessibility

Camera motion should preserve spatial orientation, be interruptible and respect `prefers-reduced-motion`. Focus/announcements belong to the real DOM control hierarchy rather than the WebGL canvas. State cannot rely on colour alone.

## Payload and PWA

The spatial stack is lazy-loaded. Core bootstrap/world assets follow the accepted shell cache budget while continent detail remains lazy/runtime-cached. Adaptive rendering and idle restraint protect mobile performance. WebGL/context failure is recoverable to the conventional fallback.

## History

- #104 — historical map-first launcher exploration: [`../closed/issue-104-map-first-launcher.md`](../closed/issue-104-map-first-launcher.md).
- #119 — Spatial exploration, renderer decision, spherical geography, interaction contracts and accepted candidate. Key records include [`../closed/issue-119-spatial-atlas-moonshot.md`](../closed/issue-119-spatial-atlas-moonshot.md), [`../closed/issue-119-spatial-interaction-contract.md`](../closed/issue-119-spatial-interaction-contract.md), [`../closed/issue-119-spherical-geography-contract.md`](../closed/issue-119-spherical-geography-contract.md) and [`../closed/issue-119-renderer-decision.md`](../closed/issue-119-renderer-decision.md).
- #166 — production cutover and tiny-geography picking hardening: [`../closed/issue-166-spatial-production-cutover.md`](../closed/issue-166-spatial-production-cutover.md).
- #197 — progressive continent → region → country disclosure and names written on the Earth.

See [`../history.md`](../history.md) for the broader project lineage.
