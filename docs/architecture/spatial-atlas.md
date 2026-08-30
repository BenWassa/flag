# Spatial Atlas architecture

The Spatial Atlas is Atlas's **production navigation presentation** since Issue
#166. A persistent Three.js Earth interprets the typed route and a compact
command surface beneath it is the navigation interface. It replaced the Issue
#119 preview composition, which mounted the globe as a fixed band above an
unchanged conventional Atlas page.

Renderer selection, the generated spherical assets, the route adapter and the
activity boundary were all settled in #119 and are not reopened here. This
document records what the production architecture is and which contracts hold.

## Composition

```text
AtlasApp                authoritative router, AppStore and AtlasActions
  └── deriveSpatialState(route, view, achievements)   pure, no state of its own
        └── SpatialShell
              ├── SpatialStage      React host for the persistent globe
              │     └── stage-controller  scene, camera, gestures, picking
              └── SpatialCommand    the navigation interface, or
                  SpatialShell__panel  the activity/results screen
```

`deriveSpatialState` is a pure function. It owns no state, so there is no second
navigation state machine and interrupted camera travel can never desynchronise
the application — the route was never waiting on the camera. Its `navigation`
field decides whether the spatial surface *is* the screen (`domains`,
`continents`, `scope`) or whether an activity owns the panel (`null`).

Geography taps and DOM controls dispatch the **same** `AtlasActions`
(`openScope`, `playScope`, `learnScope`), so they cannot diverge semantically.

## Preservation boundaries

The spatial layer is presentation only. It does not change, and must not change:

- canonical ISO3 country identity, or the Natural Earth 1:10m source and
  provenance the generated spherical assets are derived from;
- typed hash routes, the URL schema `/{domain}/{continent}/{region}`, browser
  Back/Forward, or cold deep links;
- scoring, evidence, Mastery or achievement qualification;
- storage namespaces or Firebase data contracts;
- the ephemeral active-round state model;
- supported/unavailable geography truth;
- PWA and offline guarantees.

## Renderer failure

A device that cannot start WebGL gets the conventional `Launcher`. It is
retained for exactly this purpose and must not be deleted. Both presentations
are built from `scopeModelFor`, so the fallback cannot offer different scopes,
counts or labels than the spatial surface. Forced-colours mode hides the canvas
(a WebGL surface cannot follow a forced palette) and leaves the command surface,
which is real DOM, exactly where it is.

## The activity boundary

Not every quiz belongs on a globe. A persistent Earth behind "where is Ghana?"
is a second map competing with the answer surface, and behind an outline
question it is a shape the learner could match.

| Domain activity | Stage mode | Why |
| --- | --- | --- |
| Locations Play/Learn | `yielded` | the activity's own map is the answer surface |
| Outlines Play/Learn | `yielded` | the silhouette is the recognition object |
| Neighbours Play/Learn | `yielded` | the neighbour map owns the screen |
| Flags Learn, Profile | `yielded` | scrolling surfaces that need the viewport |
| Flags Play | `context` | the flag cannot be read off the globe |
| Results, all domains | `results` | the scope just played is re-framed |

In `context` mode the globe carries **no** scope highlighting and takes no
pointer events: an in-scope highlight during a live question is a hint.

## Touch and picking

Picking geometry is not display geometry. The renderer draws tessellated,
subdivided triangles; identity is resolved in `geo.ts` against the source rings
in lat/lon, so picking cannot drift with a tessellation change.

**Visible marker and touch target are separate concepts.** A country too small
to aim at carries an invisible *interaction envelope* derived from the canonical
geometry already in the asset. Nothing is drawn for it, it depends only on
geometry and the camera — never on the current question — and it retires itself
as the learner zooms in.

Precedence, refined by #166 from the rule #117 settled for the projected maps:

1. a speck owns its own land outright;
2. otherwise every speck whose envelope covers the point competes, and the
   nearest anchor wins, ties broken by smaller span then by ISO3, so
   overlapping open-water envelopes resolve deterministically;
3. an envelope reaching onto another country's land is bounded by that
   country's own room — twice area over perimeter, not its bounding box — so no
   country can be covered over;
4. with no such candidate, the containing polygon wins unchanged.

A country a learner can actually aim at is therefore never displaced.
`scripts/verify-spatial-touch.mjs` proves this against every production frame;
`src/spatial/geo.test.ts` states the contract on synthetic geography.

## Pointer ownership

The stage follows the contract #22 established for the projected 2D map, for the
same reason: a tap on a small target must not be retargeted by the gesture
layer.

- no pointer capture on an initial single `pointerdown`; capture only once
  movement crosses the drag threshold, and immediately for a multi-pointer
  pinch;
- the globe does not move below the threshold, so a resting finger cannot rotate
  the geography out from under itself;
- crossing the threshold is sticky: a drag never later resolves as a tap;
- a tap reports the **pointerdown** position, where the learner aimed, not the
  release position a finger roll has moved.

`touch-action: none` is scoped to the stage element, never the document, and a
drag starting in the platform edge gutter is left entirely to the browser so
system back gestures keep working.

## Payload

The whole spatial stack sits behind a dynamic import. `stage-controller` and the
world LOD are precached with the app shell; continent detail stays lazy and
runtime-cached, exactly as the projected 2D continent assets already do.
`scripts/verify-spatial-atlas.mjs` holds the measured budgets.

## History

- #119 — exploration, renderer selection, the accepted candidate and the
  deployed `/spatial/` preview.
- #166 — production cutover: the command surface, the removal of the
  conventional launcher from under the globe, the tiny-country touch fix, and
  the retirement of the preview path.
