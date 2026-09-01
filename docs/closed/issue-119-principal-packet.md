# Issue #119 — Spatial Atlas candidate: architecture map

**Status:** IMPLEMENTED on the full-candidate branch. This file replaced the
pre-implementation entry packet; F1, F2 and F3 are no longer open questions.
**Authority:** `issue-119-plan.md` remains the execution plan of record.
**Production `main`:** unchanged, and not to be merged into without a later
explicit owner decision.

This is the short map. It describes what the candidate *is*, not what it was
meant to become. Read it before touching the spatial code; read the three
decision records when you need the reasoning.

---

## The candidate in one paragraph

A persistent Three.js Earth sits behind the existing Atlas screens and
**interprets** the typed route as a place to stand. It never decides where the
application is. Every screen, action, round, score, ledger and achievement is
production Atlas, untouched: the spatial shell wraps the existing React screens
rather than replacing them, which is also why turning the renderer off yields the
conventional application rather than a degraded one.

## Decision records

| | Decision | Record |
| --- | --- | --- |
| F1 | Route → spatial presentation; five stage modes; the globe yields entirely to map-native activities | [`issue-119-spatial-interaction-contract.md`](issue-119-spatial-interaction-contract.md) |
| F2 | Plain Three.js behind a narrow handle, lazily imported, render-on-demand | [`issue-119-renderer-decision.md`](issue-119-renderer-decision.md) |
| F3 | Two LOD levels, seven generated assets, delta-varint encoding, the declared 2D framing policy reused | [`issue-119-spherical-geography-contract.md`](issue-119-spherical-geography-contract.md) |

## Where the code is

```text
src/spatial/
  spatial-state.ts      PURE route + view + achievements -> SpatialState. The whole
                        navigation contract. Holds no state; writes no history.
  geo.ts                Spherical maths and geographic picking. No Three, no DOM.
  globe-asset.ts        Decoder for the generated assets. Mirrors the generator.
  scope-geography.ts    Curriculum scope -> country ids -> framing boxes.
  camera-director.ts    Retargetable travel, reduced motion. No Three.
  gestures.ts           Pointer ownership and the platform edge-gutter reserve.
  stage-controller.ts   Imperative owner: camera, LOD mounting, picking, gestures.
  renderer/globe-scene.ts   Three.js. The only file that imports a renderer.
  SpatialStage.tsx      React host. Lazy-imports the stack; pushes SpatialState.
  SpatialScopeBar.tsx   The DOM twin of the globe's region selection.
  SpatialShell.tsx      Layout; collapses to a plain block when the stage yields.

src/data/globe/         Generated. world + six continents + provenance.
scripts/generate-globe-assets.mjs   Generator (npm run globe:generate).
scripts/lib/globe-encoding.mjs      Encoder; mirror of globe-asset.ts.
src/styles/spatial.css  Stage layout. Existing tokens only.
```

The integration point in the application is nine lines in
`src/react/AtlasApp.tsx`: derive `spatialState`, wrap `content` in
`SpatialShell`, and route a geography tap through `resolveTapTarget` into the
same `navigateStable` the DOM buttons call.

## The rules that hold this together

1. **The route is the application.** `spatial-state.ts` is pure and verified not
   to contain `pushState`, `replaceState` or any write to `location`.
2. **The renderer owns no taxonomy.** Verified: `globe-scene.ts` imports no
   curriculum table. ISO3 identity comes from `src/data/countries.ts`.
3. **One geography source.** The generator extends the pinned Natural Earth
   pipeline and reuses the declared 2D framing policy.
4. **Every spatial action has a DOM control.** Verified exhaustively over
   195 countries × 4 domains × 6 continents.
5. **No answer leakage.** A live question carries no scope highlighting, no
   picking and no description.
6. **Nothing renders while idle.** One guarded `requestAnimationFrame` in the
   whole scene; a browser test asserts a flat frame count at rest.

## Verification

- `npm test` — the full existing gate, including `scripts/verify-spatial-atlas.mjs`.
- `npm run test:spatial` — `tests/browser/spatial-atlas.spec.ts` across desktop
  Chromium and Pixel 7, plus a five-viewport layout matrix.
- Headless Chromium runs on SwiftShader. That is engineering evidence. It is
  **not** physical-device evidence and must never be described as such.

## What is still open

Owner judgement on real hardware: GPU frame pacing, thermals, battery,
Android/iOS edge-gesture coexistence, installed-PWA behaviour, and whether the
interaction is actually better than the conventional launcher on a phone held in
one hand. See `issue-119-plan.md` §12 for the standing list.
