# Issue #119 — Renderer spike preparation

> **Archived. The spikes it specifies are complete (#122, #123).**
>
> Results are in [`../open/issue-119-r3f-spike-results.md`](../open/issue-119-r3f-spike-results.md) and [`../open/issue-119-maplibre-spike-results.md`](../open/issue-119-maplibre-spike-results.md); reconciliation in [`../open/issue-119-renderer-comparison.md`](../open/issue-119-renderer-comparison.md). Note that the comparison gate has since been downgraded to AMBER and both spikes require a repair run.


**Status:** support-tier research complete; package-dependent runtime executions remain  
**Purpose:** remove library archaeology and define disposable evidence-gathering spikes before Opus/Sol owns architecture

## Rule

These spikes are **not implementation phases** and must not select the production renderer.

Their job is to answer objective questions so the principal model chooses between evidenced options rather than spending context on installation, API discovery or basic compatibility testing.

Do not merge either spike into production. Prefer short-lived child branches from `explore/spatial-atlas-moonshot` or disposable local worktrees.

## Current Atlas baseline

At `main` SHA `046bd935d9be08f4ab561b8f060c66da5b3cecad`:

- React `19.2.8`;
- React DOM `19.2.8`;
- Vite `8.2.2`;
- TypeScript `5.8.3`;
- app root is wrapped in React `StrictMode`;
- no Three/R3F/MapLibre dependency exists;
- core deployed `app.js`: 325,284 raw / 97,992 gzip bytes;
- existing spatial/map interactions already reserve the left 28 CSS px for native/Atlas Back gesture ownership;
- route truth is semantic and independent of the renderer.

## Candidate A — Three.js + React Three Fiber

### Current researched versions

As of 2026-08-26:

- `@react-three/fiber` stable: **9.7.0**;
- R3F 9.7.0 declares React `>=19 <19.3` and Three `>=0.156` peer support;
- `three` latest stable release observed: **r185 / 0.185.x**;
- `@react-three/drei` current researched release: **10.7.5**, declaring R3F 9 / React 19 peers;
- `camera-controls` current stable observed: **3.1.2**.

Primary sources:

- https://github.com/pmndrs/react-three-fiber/releases/tag/v9.7.0
- https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/package.json
- https://github.com/pmndrs/drei/blob/v10.7.5/package.json
- https://github.com/yomotsu/camera-controls/releases/tag/v3.1.2
- https://github.com/mrdoob/three.js/releases/tag/r185

### Important live risk: StrictMode Canvas context loss

Open R3F issue #3863 (created 2026-08-13) reports a reproducible development-only failure where React StrictMode's mount/cleanup/remount sequence combines with R3F's deferred root disposal and force-loses the live WebGL context about 500 ms later.

Source:

- https://github.com/pmndrs/react-three-fiber/issues/3863

The reporter states the disposal path is unchanged in 9.7.0. Atlas currently wraps `AtlasApp` in `StrictMode`, so this is a **mandatory reproduction**, not an abstract concern.

Do not silently solve it by deleting StrictMode from the whole application. The spike must record the behaviour first; the principal architecture decides whether to isolate the Canvas boundary, patch/pin R3F, use an imperative root, or choose another renderer.

### Relevant R3F capabilities already established

R3F supports `frameloop="demand"`, allowing the scene to render when invalidated rather than continuously when idle. This is directly relevant to the persistent-but-mostly-static Atlas globe.

Drei exposes `CameraControls` backed by `camera-controls`, whose API supports controlled camera moves and touch interaction.

The spike must validate those properties in Atlas rather than merely trusting documentation.

## Candidate B — MapLibre GL JS globe

### Current researched version

As of 2026-08-26:

- `maplibre-gl` latest stable observed: **6.6.0**, released 2026-08-24;
- v6 is ESM-only and documents Vite integration;
- globe projection is a first-class supported projection;
- GeoJSON sources/layers, programmatic camera control, markers/controls and custom WebGL/Three layers are supported on the globe.

Primary sources:

- https://github.com/maplibre/maplibre-gl-js/releases/tag/v6.6.0
- https://maplibre.org/maplibre-gl-js/docs/
- https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-vector-map/
- https://maplibre.org/maplibre-gl-js/docs/examples/add-a-simple-custom-layer-on-a-globe/
- https://maplibre.org/maplibre-gl-js/docs/examples/add-a-3d-model-to-globe-using-threejs/

Recent releases are actively correcting globe-specific interaction/camera behaviour. v6.5.0 fixed dragging from empty space around the globe and minimum-zoom globe behaviour; v6.6.0 fixed globe tile-selection distance logic and pinch-fling label behaviour. Treat that as evidence of active globe development and also as a reason to verify the exact version rather than assuming mature map behaviour carries over unchanged.

## Spike A — R3F evidence run

### Disposable branch

Suggested:

`spike/119-r3f-atlas-runtime`

### Allowed changes

Only what is required for the disposable spike:

- add pinned candidate dependencies;
- add one isolated spatial-spike component/route or standalone entry;
- add measurement/test instrumentation;
- do not change scoring, storage, achievements, route schema, production map assets or normal launcher behaviour.

### Minimal scene

Do not build the Atlas globe yet.

Render only:

- one sphere;
- a few simple markers/patches representing World / Africa / West Africa destinations;
- one ordinary DOM control layer;
- `CameraControls`;
- an explicit render counter / context-loss listener.

This keeps the spike about runtime architecture rather than visual quality.

### Required measurements

1. **Compatibility**
   - `npm test` before dependency changes;
   - typecheck/build after dependency install;
   - exact React/Vite/Three/R3F/Drei/camera-controls versions recorded.

2. **StrictMode reproduction**
   - run development build under Atlas's existing root `StrictMode`;
   - observe for at least several seconds;
   - record whether `webglcontextlost` fires / scene blanks;
   - repeat production preview build;
   - do not claim a workaround unless tested.

3. **Persistent scene lifecycle**
   - prove route-like state changes can occur while a single Canvas stays mounted;
   - instrument Canvas mount/unmount count;
   - verify repeated World ↔ Africa ↔ West Africa transitions do not recreate the renderer.

4. **Demand rendering**
   - configure an on-demand frame loop;
   - prove render count stops increasing while idle;
   - prove drag/camera transitions invalidate as needed.

5. **Camera interruption**
   - start World → Africa;
   - interrupt with a West Africa target or Back target;
   - record whether motion can redirect from its current state without an obsolete queued journey.

6. **Touch ownership**
   - one-finger rotate;
   - pinch dolly;
   - do not claim the left 28 px Back gutter;
   - verify DOM buttons remain independently tappable.

7. **Bundle**
   - production Vite build;
   - record new lazy chunk(s) raw + gzip;
   - distinguish Three/R3F/runtime cost from geometry cost;
   - the experiment must lazy-load the renderer so initial domain choice need not pay it.

8. **Failure behaviour**
   - intentionally fail/deny WebGL initialisation if practical;
   - establish what error boundary/fallback signal is available;
   - no production fallback design decision yet.

### Required report

Create:

`docs/open/issue-119-r3f-spike-results.md`

Use PASS / FAIL / UNCLEAR per measurement, exact commands, exact package versions, raw/gzip output and observed console/browser behaviour.

No recommendation beyond factual constraints. A support model may say "R3F cannot satisfy X under tested conditions"; it must not say "therefore Atlas should choose MapLibre" unless the principal gate has been explicitly delegated.

## Spike B — MapLibre evidence run

### Disposable branch

Suggested:

`spike/119-maplibre-atlas-runtime`

### Minimal scene

Do not use remote demo tiles or an API-key provider as the evidence path.

Create an offline/local style with:

- globe projection;
- a plain quiet background/sea;
- local GeoJSON with only enough polygons to represent a few test areas;
- Atlas-like flat fills/strokes;
- ordinary DOM controls above/outside the canvas.

The purpose is to test Atlas ownership, not MapLibre's demo map.

### Required measurements

Mirror the R3F report where applicable:

1. dependency/build compatibility;
2. map instance mount/unmount count across route-like states;
3. World → Africa → West Africa programmatic camera transition;
4. interruption/reversal mid-camera move;
5. one-finger globe rotation and pinch;
6. left-edge Back gutter compatibility;
7. GeoJSON feature picking and DOM-action parity;
8. label/DOM geographic anchoring feasibility;
9. idle rendering / repaint behaviour;
10. production lazy chunk raw + gzip;
11. no-network/offline operation using only local style/data;
12. WebGL context/failure signal and destroy/recreate behaviour.

### Additional MapLibre-specific observations

Record, do not editorialise:

- how much default map behaviour must be disabled to achieve Atlas's quiet interaction grammar;
- whether zoom/latitude compensation makes semantic continent framing harder;
- whether the projection's automatic globe→Mercator transition at higher zoom becomes relevant to region focus;
- how naturally Atlas can control atmosphere/sky/background without importing a map-product aesthetic;
- whether custom layers would be required for likely achievement treatments.

### Required report

Create:

`docs/open/issue-119-maplibre-spike-results.md`

Again: evidence, not final architecture selection.

## Common test sequence

Both candidate spikes should use the same semantic sequence:

```text
World
→ Africa
→ West Africa
→ Back to Africa
→ Back to World
```

and the same interruption case:

```text
World → Africa (in motion)
→ immediately request West Africa
→ immediately Back
```

This is important: comparing two libraries with different demos produces worthless evidence.

## Common evidence table

Each report should end with:

| Property | Result | Evidence |
| --- | --- | --- |
| React/Vite compatibility | PASS/FAIL | ... |
| Existing StrictMode | PASS/FAIL/N/A | ... |
| Persistent renderer | PASS/FAIL | ... |
| Idle rendering | PASS/FAIL/UNCLEAR | ... |
| Interruptible camera | PASS/FAIL | ... |
| One-finger rotate | PASS/FAIL | ... |
| Pinch | PASS/FAIL | ... |
| Left-edge Back coexistence | PASS/FAIL | ... |
| DOM control coexistence | PASS/FAIL | ... |
| Local/offline geography | PASS/FAIL | ... |
| Lazy renderer gzip | bytes | ... |
| Context-loss/failure recovery hooks | PASS/FAIL/UNCLEAR | ... |
| Material blockers | factual list | ... |

## Frontier entry condition

After both reports exist, the support layer should reconcile them with:

- `issue-119-geometry-lod-experiment.md`;
- exact production bundle baseline;
- routing/gesture/accessibility invariants;
- prototype verification plan.

Then and only then should F1/F2 ask Opus/Sol to choose the rendering architecture and interaction grammar.
