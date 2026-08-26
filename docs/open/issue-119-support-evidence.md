# Issue #119 — Support Evidence Dossier

**Status:** pre-frontier evidence, not an architecture decision  
**Issue:** #119  
**Updated:** 2026-08-26  
**Purpose:** give the principal frontier session measured repository and ecosystem facts so it can spend context on design/architecture rather than reconnaissance

## 1. Interpretation rule

This file intentionally distinguishes **evidence** from **decision**.

Support work may conclude that a candidate is technically viable, identify risks and measure current production. It must not convert those findings into the permanent renderer/camera/product architecture. That judgement remains reserved for F1–F3 in the LLM execution plan.

## 2. Exact current production artifact baseline

The latest deployed GitHub Pages artifact inspected for this dossier corresponds to current main commit:

`046bd935d9be08f4ab561b8f060c66da5b3cecad`

The GitHub Pages workflow completed successfully and produced a downloadable production artifact. The figures below are from the **actual deployed artifact**, not source estimates.

### 2.1 Initial production shell

The production `index.html` loads/module-preloads:

- `assets/index-*.js`;
- `app.js`;
- `map-viewport.js`;
- `neighbor-map-runtime.js`;
- `styles.css`;
- `map.css`;
- `map-cartography.css`;
- `outline.css`;
- `neighbors.css`;
- `atlas-theme.css`.

Measured gzip sizes from that exact artifact:

| Asset | Gzip bytes |
| --- | ---: |
| `app.js` | 98,100 |
| `neighbor-map-runtime.js` | 13,634 |
| `map-viewport.js` | 2,227 |
| `styles.css` | 7,022 |
| `map.css` | 3,246 |
| `map-cartography.css` | 2,724 |
| `outline.css` | 497 |
| `neighbors.css` | 3,066 |
| `atlas-theme.css` | 7,506 |
| Vite index shim | 452 |
| **Total** | **138,474 bytes gzip** |

This is an approximate transfer baseline for the explicitly initial shell files, not a network-waterfall claim. HTTP compression, cache state and Firebase/auth behaviour must be measured separately in a browser.

### 2.2 Firebase

The production artifact contains a lazy Firebase chunk:

- raw: ~464 KB;
- gzip: ~136 KB.

`app.js` dynamically imports this chunk. It is not counted in the explicit initial-shell total above.

### 2.3 Existing lazy continent geography

Current production Vite geography chunks measured from the exact artifact:

| Geography chunk | Raw | Gzip |
| --- | ---: | ---: |
| Africa | ~916 KB | ~243 KB |
| South America | ~883 KB | ~241 KB |
| Europe | ~1.51 MB | ~433 KB |
| Asia | ~2.02 MB | ~493 KB |

These numbers are particularly important for Issue #119.

A world/continent spatial renderer must not be judged against an imaginary zero-cost geography baseline. Atlas already lazily ships substantial high-detail projected cartography for geography-dependent activities.

Conversely, the existence of those chunks is **not** permission to add a second similarly large world dataset to startup. World-level spherical geometry should use an intentionally simplified LOD and continue to lazy-load detail.

## 3. Current Atlas dependency baseline

Current production dependencies do **not** include a 3D renderer or map-globe library.

Relevant existing platform versions:

- React 19.2.8;
- React DOM 19.2.8;
- Vite 8.2.2;
- TypeScript 5.8.3;
- Playwright 1.62.1;
- d3-geo 3.1.1;
- TopoJSON client/server/simplify;
- Node >=22.12.0.

Any globe stack should therefore be introduced as a deliberate lazy boundary rather than accidentally becoming part of first interaction.

## 4. Three.js / React Three Fiber evidence

### 4.1 Current versions observed

As of this research pass:

- Three.js latest GitHub release observed: **r185**, published 2026-07-01;
- React Three Fiber latest stable GitHub release observed: **v9.7.0**, published 2026-07-31;
- Drei latest stable release observed: **v10.7.5**;
- `camera-controls` latest release observed: **v3.1.2**.

Exact versions must be refreshed at handoff time before installation.

### 4.2 React 19 compatibility

R3F's official documentation states:

- R3F 8 pairs with React 18;
- R3F 9 pairs with React 19.

Drei v10.7.5's package metadata declares peer dependencies on:

- `@react-three/fiber ^9.0.0`;
- `react ^19`;
- `react-dom ^19`;
- `three >=0.159`.

This makes the stable R3F/Drei line structurally compatible with Atlas's current React major.

### 4.3 Persistent/on-demand rendering

R3F documentation supports:

`<Canvas frameloop="demand">`

with explicit `invalidate()` for imperative updates. Drei controls integrate with invalidation.

This is relevant because Issue #119's desired architecture is a persistent scene that may be visually static for long periods. Idle continuous 60/120 Hz rendering should not be accepted merely because the renderer defaults to it.

### 4.4 Scene churn guidance

R3F performance guidance warns that constructing/mounting geometry and materials is expensive and recommends reuse.

This aligns with the desired persistent-scene thesis:

- one renderer lifecycle;
- reused country geometry/materials;
- state/highlight changes rather than scene replacement;
- lazy LOD replacement only where beneficial.

### 4.5 Camera controls

Current Drei `CameraControls` documentation exposes the underlying `camera-controls` library and explicit touch mapping, including:

- one-touch rotate;
- two-touch dolly/truck;
- transition events;
- custom implementation subclasses.

`camera-controls` v3 also provides programmatic camera movement APIs suitable for testing semantic camera destinations.

This is evidence of capability, not a decision that Atlas should expose the library's default motion grammar unchanged.

### 4.6 Critical current risk: StrictMode / Canvas context loss

Open R3F Issue #3863 was filed 2026-08-13.

Reported environment:

- React 19;
- R3F 9.6.1, with the relevant path reportedly unchanged in 9.7.0;
- Three.js;
- Vite/Chromium reproduction.

Reported mechanism:

1. React development StrictMode mounts and cleans up the Canvas effect;
2. R3F schedules deferred disposal;
3. the immediate remount reuses the same root/store/context;
4. the deferred cleanup later calls `forceContextLoss()` on the live context;
5. the Canvas becomes permanently blank in that development reproduction.

Atlas currently mounts the entire app inside `<StrictMode>` in `src/main.tsx`.

This issue is therefore directly relevant.

The prototype must deliberately test it before R3F is selected.

Support-stage rule: **do not “solve” this by globally removing StrictMode as an undocumented convenience.**

Possible principal-model options include isolating the Canvas lifecycle, pinning/patching a verified version, choosing imperative Three ownership, or preferring another stack.

## 5. MapLibre GL JS evidence

### 5.1 Current release

Latest MapLibre GL JS GitHub release observed during this pass: **v6.6.0**, published 2026-08-24.

Refresh before handoff.

### 5.2 Globe capability

Current official documentation/examples demonstrate:

- globe projection;
- vector data on the globe;
- camera centre/zoom semantics;
- globe-specific projection handling;
- custom WebGL layers on the globe;
- Three.js content on a MapLibre globe.

Therefore MapLibre is a real architecture candidate, not merely a backup if R3F fails.

### 5.3 Current globe maintenance signal

MapLibre v6.5.0 and v6.6.0 both include globe-specific bug fixes, including interaction/zoom/tile-selection behaviour.

That is a positive sign that globe projection is actively maintained, but also evidence that the globe path continues to evolve rapidly. The prototype should pin and validate a specific release rather than assuming all 6.x behaviour is interchangeable.

### 5.4 Architectural trade-off to leave unresolved

MapLibre begins from a map-native geospatial model, which may reduce custom geographic rendering/camera code.

R3F/Three begins from a general scene model, which may provide stronger control over bespoke game-like camera choreography and visual treatment.

That trade-off is exactly the sort of cross-system product/architecture decision reserved for F2.

## 6. Canonical spherical-geometry evidence

### 6.1 Correct insertion point exists

`scripts/map-generation-core.mjs` already:

1. reads the pinned Natural Earth manifest;
2. fetches and hash-verifies source files;
3. reconciles source features to Atlas canonical ISO3 identity;
4. applies current geopolitical/source handling;
5. derives global adjacency;
6. only later projects geometry for current 2D outputs.

This means Issue #119 can extend the existing pipeline **before projection**.

A new globe source is unnecessary and would violate current cartography architecture.

### 6.2 Existing final 2D assets are not source geometry

`MapRegionAsset` contains projected path strings, viewport focus and current 2D-specific interaction metadata.

Do not use those final path strings as globe geometry.

The sphere should use canonical longitude/latitude geometry retained upstream in generation.

### 6.3 Existing scope membership is reusable

`src/data/map-scopes.ts` already owns continent and learner-facing region membership by ISO3.

The globe renderer should consume that identity rather than defining spatial regions independently.

### 6.4 Existing raw generated map sizes show why LOD matters

Current generated TypeScript source files are approximately:

- Africa: 0.92 MB;
- South America: 0.88 MB;
- Europe: 1.51 MB;
- Asia: 2.03 MB.

Those current assets serve detailed gameplay requirements including coastline/border/context/inset behaviour. A world navigation LOD should be dramatically simpler.

### 6.5 Special geometry cases the spherical feasibility pass must explicitly test

At minimum:

- Russia / antimeridian behaviour;
- Pacific island MultiPolygons;
- France and overseas geometry;
- Netherlands overseas geometry;
- cross-continental Middle East membership;
- Egypt as cross-scope geography;
- small islands;
- Western Sahara / current context policy;
- Somalia/Somaliland normalisation policy;
- country shapes used by Outlines must remain whole and canonical.

The globe must not accidentally turn presentational fit policy into a new geopolitical ownership policy.

## 7. Existing route/scene compatibility evidence

The current route model is already close to a semantic spatial state model:

```text
/#/
/#/flags
/#/flags/africa
/#/flags/africa/west-africa
/#/flags/africa/west-africa/test
```

`parentRoute(...)` already provides conceptual ancestry.

This strongly supports the hypothesis that a future spatial scene can be an **interpreter of route state** rather than a replacement state machine.

This is not yet a decision about the exact `SpatialDestination` type or CameraDirector API.

## 8. Existing gesture compatibility evidence

Atlas already protects a 28 px left-edge navigation gutter and explicitly excludes current map viewports from page-level swipe-Back ownership.

Existing map runtime already has:

- pointer drag;
- pinch zoom;
- drag-click suppression;
- wheel zoom with Ctrl/meta accessibility escape;
- per-session viewport memory.

The moonshot therefore needs a **coexistence design**, not a new gesture philosophy created from zero.

## 9. Benchmark requirements derived from the baseline

The Africa prototype should report at minimum:

### Payload

- new initial-shell gzip delta;
- lazy 3D engine gzip size;
- world LOD gzip size;
- Africa LOD gzip size;
- duplication versus existing continent geometry;
- cacheability/offline policy.

### Runtime

- time until current domain controls are usable;
- time from domain selection to interactive Earth;
- frame time during continuous globe drag;
- idle render behaviour;
- memory after repeated World ↔ Africa ↔ West Africa navigation;
- renderer/context failure behaviour;
- interrupted transition behaviour.

### Product interaction

- tap-to-selection reliability;
- drag-vs-tap false activations;
- Back gesture coexistence;
- DOM keyboard parity;
- deep-link initialisation;
- reduced-motion path.

### Evidence labelling

Keep separate:

- desktop browser/emulator evidence;
- mobile viewport browser evidence;
- physical Android device evidence;
- physical iPhone/iOS evidence;
- installed PWA evidence.

Never collapse browser emulation into claimed physical-device validation.

## 10. Evidence still missing before F1/F2

Support-stage work remains for:

- exact renderer bundle-size experiment inside Atlas/Vite;
- minimal R3F StrictMode reproduction in Atlas's actual Vite environment;
- equivalent minimal MapLibre globe integration build;
- canonical world-LOD source count/simplification measurements;
- formal gesture conflict matrix;
- formal fallback requirements;
- exact automated test scaffold;
- current-main branch reconciliation immediately before handoff.

These are intentionally evidence tasks.

The frontier model is not needed to perform them; it is needed to **interpret the evidence and make the high-leverage choices**.