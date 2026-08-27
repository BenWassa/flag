# Issue #119 / #123 — MapLibre globe runtime spike results

**Status:** EVIDENCE EXECUTED — support-tier only; includes a material headless-runtime blocker
**Authority:** no renderer-selection authority
**Evidence branch:** local-only `issue-123-maplibre-evidence`, based on `origin/spike/119-maplibre-atlas-runtime` and reconciled with `main` `d8f52ec`
**Physical device evidence:** none

## Environment and commands

- Node `v24.11.1`; React/React DOM `19.2.8`; Vite `8.2.2`; MapLibre GL JS `6.6.0`; `@types/geojson` `7946.0.16`.
- Browser: Playwright Chromium, 390 × 844 mobile viewport, `hasTouch: true`, headless SwiftShader WebGL.
- `npm test` — **PASS**: 4 unit files / 29 tests, production build and all existing verifier scripts passed.
- `npx tsc -p experiments/spatial-maplibre/tsconfig.json` — **PASS**.
- `npx vite build --config experiments/spatial-maplibre/vite.config.ts` — **PASS**.
- `node experiments/spatial-maplibre/run-spike.mjs` — executed dev server and production preview locally at `127.0.0.1`; generated disposable, ignored evidence under `spike-evidence-maplibre/`.

The isolated entry uses inline local GeoJSON, a literal local style, flat fills/strokes and no tile/style/provider URL. It does not change Atlas production routing, maps, scoring, storage or architecture.

## Critical observation

Both dev and production preview created a WebGL canvas, fired a `style.load` callback and accepted Globe projection/camera commands. In this headless SwiftShader run, however, `map.loaded()` and `map.isStyleLoaded()` stayed `false`, the local source reported unloaded with no source cache, local features could not be queried, and screenshots showed the quiet canvas background but no globe/polygons/anchor.

The earlier harness timed out because it waited on `map.loaded()`. It now waits for the first render and records that API state rather than treating a timeout as a successful initialisation. The renderer was not claimed visually usable on the basis of an empty canvas.

## Evidence table

| Property | Result | Evidence |
| --- | --- | --- |
| Install + typecheck | PASS | Pinned dependencies installed; isolated TypeScript check passed. |
| Existing `npm test` after spike changes | PASS | 29 unit tests plus build/verifier chain passed. |
| Dev renderer initialises | FAIL | Canvas/render loop exists, but local source/style remains unloaded and visual output is blank. |
| Production preview initialises | FAIL | Same blank/unloaded local source state in `vite preview`. |
| Map instance mount count across common sequence | PASS | Dev StrictMode: 2 creates / 1 cleanup on initial mount, unchanged through sequence; production: 1 / 0, unchanged. |
| Renderer/context identity stays persistent | PASS | No new map instance across World → Africa → West Africa → Back Africa → Back World. |
| Idle/repaint behaviour acceptable | PASS (limited) | 0 render events across an observed 1.2 s idle window after initial settling; visual fidelity is separately failed. |
| World → Africa camera transition | PASS (internal) | End camera `{lng:20, lat:0, zoom:2.2}`. |
| Africa → West Africa transition | PASS (internal) | End camera `{lng:-3, lat:10, zoom:3.6}`. |
| Mid-flight retarget | PASS (internal) | Route-like destination converged on Africa after World → Africa → West Africa → Back. |
| Back mid-flight | PASS (internal) | Final destination remained Africa; no later command returned to West Africa. |
| One-finger globe rotation | UNCLEAR | Synthetic touch pointer events did not change camera; no physical-device result is claimed. |
| Pinch | UNCLEAR | Synthetic two-pointer sequence did not change camera; no physical-device result is claimed. |
| Left 28 px Back gutter not stolen | PASS (automated) | Actual pointer in the 28 px DOM gutter produced 1 gutter event and no canvas pointer event. Physical edge-swipe remains untested. |
| Ordinary DOM control coexistence | PASS | DOM Africa control updated the same route-like destination to `africa`. |
| GeoJSON pick → same application action as DOM | FAIL | `queryRenderedFeatures` at the projected Africa point returned no feature; canvas click left destination at `world`. |
| DOM/geographic anchoring feasibility | FAIL in this run | A `Marker` was created at West Africa but is not visibly usable while the local map source/style fails to load. |
| Fully local/offline globe | PASS (dependency path) | No external requests in dev or production; fixture/style are local literals. It does **not** override the visual loading failure above. |
| Lazy renderer JS raw bytes | PASS (measurement) | `958,244` bytes, excluding the tiny DOM entry and fixture. |
| Lazy renderer JS gzip bytes | PASS (measurement) | `248,535` bytes. |
| Lazy renderer CSS raw/gzip | PASS (measurement) | `82,869` / `10,456` bytes. |
| Context/error instrumentation | PASS | Counters capture render, style-load, errors, context loss/restoration, map lifecycle and camera commands. |
| Intentional renderer failure/fallback signal | PASS | `WEBGL_lose_context` was available; one loss event showed the local status fallback; restoration event followed. |
| Material runtime blocker | YES | Empty/unloaded local Globe source in both headless dev and production preview, with no emitted MapLibre error. |

## Required MapLibre-specific observations

- Disabled default double-click zoom, box zoom, keyboard controls, drag rotation and touch rotation; retained pan/zoom for the intended manipulation experiment. A 28 px overlay reserves the Back gutter.
- Globe projection stayed `{ type: 'globe' }` through the semantic sequence. The experiment did not reach a valid rendered region focus, so latitude/zoom framing quality and Globe → Mercator transition quality remain **UNCLEAR**.
- The local `Marker` exercise establishes the API seam for DOM anchoring only; it is not evidence of a usable anchored presentation while the rendering blocker is present.
- Context restoration occurred after forced loss (`contextLost: 1`, `contextRestored: 1`) and did not recreate the map. The spike leaves the fallback status visible after restore; recovery UX is intentionally not designed here.

## Bundle output

```text
Scene lazy JS: 958,244 raw / 248,535 gzip bytes
DOM entry JS:   194,878 raw / 61,048 gzip bytes
MapLibre CSS:    82,869 raw / 10,456 gzip bytes
```

Vite warned that the lazy renderer chunk exceeds 500 kB after minification. This is a measurement, not a production bundle decision.

## Objective blockers / unknowns

- Reproduce the local GeoJSON/style loading failure in a headed desktop browser and physical Android/iOS hardware before treating it as a MapLibre product constraint rather than a SwiftShader/headless limitation.
- Do not claim touch rotation, pinch, native/browser Back, reduced motion, accessibility focus/announcements, actual visual framing, or mobile PWA behaviour from this run.
- Canonical Natural Earth globe geometry, LOD, real region picking and production fallback architecture were deliberately out of scope.

## Support conclusion

This run establishes exact package compatibility, lazy-bundle cost, local-no-network dependency behaviour, persistent map lifecycle, internal camera interruption convergence, gutter interception and context-event instrumentation. It also establishes a reproducible **headless/SwiftShader local-style rendering failure** for the current minimal MapLibre globe path.

It does not recommend or reject MapLibre for Atlas. A renderer decision remains reserved for the neutral #124 comparison/principal-model gate after the failure is reproduced or cleared in a suitable headed/physical environment.
