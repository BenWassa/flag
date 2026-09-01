# Issue #119 / #122 — R3F runtime spike results

**Status:** COMPLETE — SUPPORT EVIDENCE ONLY  
**Authority:** no renderer-selection authority  
**Branch:** `spike/119-r3f-atlas-runtime`  
**Measured workflow:** GitHub Actions run `33020959334`  
**Measured SHA:** `fc6b83fcbe1f51a645739e39fb0f98703b6d0b41`

## Environment

- Current production `main` used by the spike baseline: `046bd935d9be08f4ab561b8f060c66da5b3cecad`
- Node: `v22.23.2`
- React / React DOM: `19.2.8`
- Vite: `8.2.2`
- `three`: `0.185.0`
- `@react-three/fiber`: `9.7.0`
- `@react-three/drei`: `10.7.5`
- `camera-controls`: `3.1.2`
- Browser evidence: headless Chromium installed by Playwright on GitHub Actions, 390 × 844 mobile/touch context
- Physical-device evidence: **NONE**

The candidate packages were installed ephemerally with `--no-save --package-lock=false`; Atlas production manifests were not changed.

## Commands / gates

The workflow performed:

```text
npm install
npm install --no-save --package-lock=false \
  three@0.185.0 \
  @react-three/fiber@9.7.0 \
  @react-three/drei@10.7.5 \
  camera-controls@3.1.2
npx playwright install --with-deps chromium
npm test
npx tsc -p experiments/spatial-r3f/tsconfig.json
npx vite build --config experiments/spatial-r3f/vite.config.ts
# development + production-preview browser measurement harness
```

Results:

- Atlas `npm test`: **PASS**
- experiment typecheck: **PASS**
- experiment production build: **PASS**
- development renderer initialisation: **PASS**
- production-preview renderer initialisation: **PASS**
- browser console errors before intentional context loss: **NONE**
- external network requests from the experiment: **NONE**

## Common semantic sequence

```text
World
→ Africa
→ West Africa
→ Back Africa
→ Back World
```

Result: **PASS for the measured route/camera adapter behaviour.**

The experiment ended at `world`, and the R3F Canvas creation count remained `1 → 1`. Ordinary durable navigation therefore did not require a Canvas remount in this implementation.

This proves only the technical persistence mechanism, not the final Atlas spatial architecture or visual quality.

## Interruption sequence

```text
World → Africa (moving)
→ request West Africa
→ immediately Back
```

Result: **PASS with an important completion-semantics caveat.**

The final durable destination was `africa`, and the measured camera settled at approximately:

```text
x 0.44994
y 0.18000
z 2.85005
```

which matches the spike's Africa target.

However, multiple earlier `CameraControls.setLookAt(..., true)` promises resolved together when the final transition settled. Therefore **camera-transition completion callbacks must not be treated as application navigation truth or assumed to imply that an individual superseded move completed normally**. Atlas routes/history should remain authoritative, as already required by #119.

## Evidence table

| Property | Result | Evidence |
| --- | --- | --- |
| Install + Atlas test compatibility | **PASS** | candidate packages installed; full `npm test` passed |
| Experiment typecheck | **PASS** | `tsc` exit 0 |
| Experiment production build | **PASS** | Vite exit 0 |
| Dev renderer initialises | **PASS** | Canvas visible; no console error |
| Production preview initialises | **PASS** | Canvas visible; no console error |
| Existing React StrictMode survives tested stack | **PASS in this exact candidate stack** | no context-loss event during the 1.4 s dev observation window |
| R3F open issue #3863 reproduced | **NO in this exact stack** | `contextLost = 0` under React 19.2.8 / R3F 9.7.0 / Three 0.185.0 |
| Canvas mount count across common sequence | **PASS** | `1 → 1` |
| `frameloop="demand"` becomes idle | **PASS** | `0` renders during a 1.2 s stable production window |
| DOM action | **PASS** | DOM Africa control resolved to `africa` |
| 3D pick uses same action | **PASS** | centre mesh pick resolved to `africa` |
| Mid-flight retarget / Back | **PASS** | final route + camera resolved to Africa |
| One-finger interaction | **PASS in synthetic browser evidence** | synthetic touch-pointer drag changed the camera |
| Pinch/dolly | **PASS in synthetic browser evidence** | synthetic two-pointer gesture changed the camera |
| Left 28 px system-Back gutter preserved | **UNCLEAR / integration work required** | synthetic pointer at `x=5` reached the Canvas; headless browser cannot prove Android/iOS system Back ownership |
| Lazy renderer JS raw | **929,418 B** | `Scene-dEPs0aYT.js` |
| Lazy renderer JS gzip | **243,166 B** | `Scene-dEPs0aYT.js` |
| Tiny experiment entry JS gzip | **60,979 B** | includes React experiment entry; not counted as renderer delta |
| `webglcontextlost` instrumentation | **PASS** | forced loss produced event count `1` |
| explicit context restore hook | **PASS** | restore produced `contextRestored = 1` and rendering resumed |
| production fallback UI | **NOT IMPLEMENTED IN SPIKE** | #119 still requires an app-level fallback strategy |
| Physical mobile gesture quality | **NOT TESTED** | requires real-device validation later |

## StrictMode finding

R3F issue #3863 remains an open upstream issue and describes a development StrictMode deferred-disposal failure. The mandatory Atlas reproduction attempt **did not reproduce it** with the candidate stack used here:

```text
React 19.2.8
@react-three/fiber 9.7.0
Three 0.185.0
Vite 8.2.2
Chromium / GitHub Actions
```

The Canvas initialised under an application `StrictMode` root and remained live beyond the issue's reported ~500 ms deferred-disposal window; after 1.4 s the measured context-loss count was `0`.

This is evidence for the exact tested stack, not a claim that the upstream issue is invalid or that every future Canvas lifecycle is safe. A production architecture that intentionally avoids ordinary Canvas remounts remains preferable for continuity and resource stability independent of this result.

## Bundle output

```text
Scene-dEPs0aYT.js  929,418 raw / 243,166 gzip
index-JYuRfUym.js  194,672 raw /  60,979 gzip
```

Vite emitted its normal >500 kB minified-chunk warning for the lazy renderer chunk. The measured **renderer-side lazy payload is ~243 KB gzip before Atlas globe geography assets**.

No geography dataset was included in this renderer measurement.

## Idle/render-loop evidence

A stable production-preview scene using `frameloop="demand"` rendered **0 frames over a 1.2 s idle observation window** after initial settling.

During navigation/interaction the render count increased as expected. Demand rendering therefore demonstrated the intended idle behaviour in this minimal scene.

## Gesture evidence

Synthetic browser pointer input demonstrated that CameraControls can respond to:

- one-finger/touch-like drag;
- two-pointer pinch/dolly.

This is automation evidence only. It does **not** establish tactile quality, OS gesture arbitration or real-phone behaviour.

The synthetic `x=5` pointer reached the Canvas. Atlas must therefore explicitly preserve its left-edge navigation contract at integration time and validate it on real Android/iOS hardware; the renderer does not provide that policy automatically.

## Failure/context evidence

The experiment registered `webglcontextlost` and `webglcontextrestored` listeners on the renderer canvas. An intentional loss incremented `contextLost` from `0` to `1`; explicit restore incremented `contextRestored` from `0` to `1`, and the final screenshot/render state recovered.

This proves usable browser/renderer signals and an explicit restore path. It does not replace #119's requirement for an application-level conventional fallback when recovery is unavailable or inappropriate.

## Objective blockers / unknowns

No objective R3F blocker was established by this support spike.

Remaining unknowns intentionally reserved for later stages include:

- real-device gesture/system-Back coexistence;
- performance with canonical country meshes and Atlas visual treatment rather than one sphere;
- final CameraDirector semantics for superseded transitions;
- production fallback UX;
- whether the renderer's flexibility is worth its payload/complexity relative to the matched MapLibre evidence.

## Support conclusion

The tested R3F/Three stack is technically viable enough to remain a candidate for the protected #119 principal comparison. It passed Atlas's current test suite, typechecked/built under Vite, remained persistent, idled at zero frames with demand rendering, accepted DOM and 3D actions, supported interruptible camera movement, and exposed context loss/restore signals.

This report **does not select R3F**. Renderer selection belongs to the protected Opus/Sol F1/F2 session after #123 and #124 are complete.

