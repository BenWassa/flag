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

A visible tiny-country scope marker is a presentation of that same practical-touch contract, not a second targeting system. Marker identity and anchor come from the current `GeographyIndex` after the mounted detail LOD has been merged with world geography. A marker is drawn only while that exact country is currently eligible for practical assistance, and marker inventory is recalculated whenever camera scale or the mounted LOD changes. Consequently a visible marker cannot remain after its assisted target has retired on zoom, nor keep a world-LOD anchor while picking has moved to a detail-LOD anchor.

Precedence preserves truthful ownership:

1. a tiny country owns its own land;
2. eligible overlapping envelopes compete deterministically;
3. assistance reaching toward a neighbour is bounded so an aimable neighbour retains practical ownership;
4. otherwise the containing polygon wins normally.

`scripts/verify-spatial-touch.mjs`, `scripts/verify-spatial-marker-parity.mjs` and spatial geo/marker tests hold this contract. Exact-production browser coverage additionally exercises visible marker centres, practical-envelope edges, zoom/rotation and gesture ownership.

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
- #200 — visible tiny-country markers and practical touch targets share current-LOD identity/anchor and camera-scale eligibility.

See [`../history.md`](../history.md) for the broader project lineage.
