# Issue #119 — Renderer comparison gate

**Status:** runtime evidence reconciled; **GREEN for the protected principal evidence review**. This is not a renderer selection, production go-ahead, or a finding that either candidate has passed an integrated Atlas prototype.
**Owner:** support tier until the table is complete; final selection belongs to Opus/Sol

This file exists to prevent two failure modes:

1. the principal model spending expensive context reconstructing objective package/runtime facts; or
2. a support model quietly turning preliminary preference into architecture.

## Reconciliation basis

The two reports use the exact common semantic sequence required by
[`issue-119-renderer-spike-prep.md`](issue-119-renderer-spike-prep.md):

```text
World → Africa → West Africa → Back Africa → Back World
```

They also use the prescribed interruption case:

```text
World → Africa (moving) → request West Africa → immediately Back
```

The R3F source report was recorded at
`origin/spike/119-r3f-atlas-runtime` commit `e481633`; the MapLibre source
report was recorded at local evidence commit `f57c276`. Both reports are
copied unchanged into this branch. Their lifecycle, sequence, idle, camera,
gutter, DOM-action, bundle and context measurements are comparable at the
semantic level. They are **not** equally visually validated: R3F rendered in
its headless run, whereas the MapLibre local source/style remained blank in
headless SwiftShader in both dev and production preview. Node/browser runner
versions also differ, so no result below treats that MapLibre failure as a
cross-environment product conclusion.

Every mandatory row is now a fact, **PASS**, **FAIL**, or **UNCLEAR**. The
remaining `UNCLEAR` values are evidence gaps for the principal to weigh, not
silent passes.

## Current neutral evidence

| Dimension | R3F / Three | MapLibre GL JS | Current evidence state |
| --- | --- | --- | --- |
| React compatibility | R3F 9.7.0 declares React >=19 <19.3 | renderer is framework-agnostic; React integration is ordinary lifecycle wrapping | researched |
| Atlas React 19.2.8 fit | installs/tests/builds in the measured candidate stack | installs/typechecks/builds in the isolated spike | runtime reconciled |
| Current stable version | R3F 9.7.0; Three r185 | MapLibre 6.6.0 | researched 2026-08-26 |
| Camera control model | fully custom 3D scene; CameraControls 3.1.2 candidate | map-native centre/zoom/bearing/pitch/roll/fly/ease camera | researched |
| Globe projection | Atlas would own sphere/geography representation | built-in globe projection | researched |
| Local canonical GeoJSON | custom conversion/mesh pipeline required | native GeoJSON source/layer path exists | researched |
| Custom visual/game scene freedom | very high | map engine defines core projection/render interaction; custom layers available | researched |
| On-demand rendering | measured zero frames in a 1.2 s stable production window | measured zero render events in a 1.2 s idle window; blank-source limitation remains | runtime reconciled |
| StrictMode risk | **open R3F #3863 reports dev context loss**; it did not reproduce in the measured stack | MapLibre dev StrictMode created two instances then cleaned one; visual source failure is separate | runtime reconciled |
| Globe maturity signal | general Three/R3F mature; Atlas globe is custom engineering | globe actively developed; 6.5/6.6 contain globe interaction fixes | researched |
| Offline/local style path | no external requests in the minimal local scene | no external requests; literal local style and GeoJSON, though source rendering failed | runtime reconciled |
| DOM overlay coexistence | standard React DOM alongside Canvas | standard DOM controls/markers around map canvas | researched, UX pending |
| Left-edge Back coexistence | synthetic pointer reached Canvas at x=5; system edge ownership remains unproven | 28 px DOM gutter intercepted the automated pointer; physical edge swipe remains untested | runtime reconciled |
| Lazy bundle gzip | 243,166 B JS before globe geography assets | 248,535 B JS; CSS adds 10,456 B gzip | runtime reconciled |
| Persistent renderer across route-like state | one Canvas remained mounted | production one map instance; no new instance through sequence | runtime reconciled |
| Camera interruption quality | final route/camera settled, with callback-semantics caveat | internal target converged, but blank source prevents visual validation | runtime reconciled |
| WebGL failure/recovery hooks | forced loss/restore events and resumed render observed | forced loss/restoration plus local status fallback observed | runtime reconciled |

## Mandatory comparable runtime rows

Populate from the two disposable spikes defined in `issue-119-renderer-spike-prep.md`.

| Property | R3F result | MapLibre result | Notes/evidence |
| --- | --- | --- | --- |
| Install + `npm test` compatibility | **PASS** — candidate install + Atlas `npm test` passed | **PASS** — `npm test` passed (29 tests/build/verifiers) | [R3F: Commands / gates](issue-119-r3f-spike-results.md#commands--gates), [MapLibre: Environment and commands](issue-119-maplibre-spike-results.md#environment-and-commands) |
| Development renderer initialises | **PASS** — Canvas visible; no console error | **FAIL** — canvas/render loop, but local source/style unloaded and blank | [R3F: Commands / gates](issue-119-r3f-spike-results.md#commands--gates), [MapLibre: Critical observation](issue-119-maplibre-spike-results.md#critical-observation) |
| Production preview initialises | **PASS** — Canvas visible; no console error | **FAIL** — same blank/unloaded source state in preview | [R3F: Commands / gates](issue-119-r3f-spike-results.md#commands--gates), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Existing StrictMode survives | **PASS (measured stack)** — no context loss in a 1.4 s dev observation; upstream risk remains | **PASS (lifecycle only)** — dev StrictMode made 2 maps / 1 cleanup; blank-source failure is separately recorded | [R3F: StrictMode finding](issue-119-r3f-spike-results.md#strictmode-finding), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| One renderer instance persists through semantic state changes | **PASS** — Canvas creation count remained 1 → 1 | **PASS** — production 1 / 0; no new map through sequence (dev initial StrictMode lifecycle above) | [R3F: Common semantic sequence](issue-119-r3f-spike-results.md#common-semantic-sequence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Idle renderer stops/reduces work acceptably | **PASS** — 0 frames over a stable 1.2 s preview window | **PASS (limited)** — 0 render events over 1.2 s; visual fidelity failed separately | [R3F: Idle/render-loop evidence](issue-119-r3f-spike-results.md#idlerender-loop-evidence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| World → Africa camera move | **PASS** — route/camera adapter sequence completed | **PASS (internal)** — ended `{lng:20, lat:0, zoom:2.2}` | [R3F: Common semantic sequence](issue-119-r3f-spike-results.md#common-semantic-sequence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Africa → West Africa camera move | **PASS** — route/camera adapter sequence completed | **PASS (internal)** — ended `{lng:-3, lat:10, zoom:3.6}` | [R3F: Common semantic sequence](issue-119-r3f-spike-results.md#common-semantic-sequence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Mid-flight retarget | **PASS** — final durable destination/camera settled at Africa; individual superseded completion promises co-resolved | **PASS (internal)** — route-like destination converged at Africa | [R3F: Interruption sequence](issue-119-r3f-spike-results.md#interruption-sequence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Back mid-flight | **PASS** — final route/camera remained Africa | **PASS (internal)** — no later return to West Africa | [R3F: Interruption sequence](issue-119-r3f-spike-results.md#interruption-sequence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| One-finger rotate | **PASS (synthetic only)** — touch-like drag changed camera | **UNCLEAR** — synthetic pointer did not change camera; no device evidence | [R3F: Gesture evidence](issue-119-r3f-spike-results.md#gesture-evidence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Pinch | **PASS (synthetic only)** — two-pointer gesture changed camera | **UNCLEAR** — synthetic two-pointer gesture did not change camera; no device evidence | [R3F: Gesture evidence](issue-119-r3f-spike-results.md#gesture-evidence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Left 28 px Back gutter not stolen | **UNCLEAR** — synthetic x=5 pointer reached Canvas; OS Back ownership needs integration/device proof | **PASS (automated only)** — gutter event fired and canvas did not receive that pointer | [R3F: Gesture evidence](issue-119-r3f-spike-results.md#gesture-evidence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| DOM button remains ordinary accessible action | **PASS** — DOM Africa control resolved to `africa` | **PASS** — DOM Africa control set route-like destination to `africa` | [R3F: Evidence table](issue-119-r3f-spike-results.md#evidence-table), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Feature/geography picking → same action | **PASS (minimal mesh)** — centre mesh pick resolved to `africa` | **FAIL** — `queryRenderedFeatures` returned none and click stayed at `world` | [R3F: Evidence table](issue-119-r3f-spike-results.md#evidence-table), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Fully local/offline geography/style | **PASS (minimal scene)** — no external requests; no geography dataset included | **PASS (dependency path)** — literal local style/GeoJSON and no external requests; this does not cure blank rendering | [R3F: Commands / gates](issue-119-r3f-spike-results.md#commands--gates), [MapLibre: Environment and commands](issue-119-maplibre-spike-results.md#environment-and-commands) |
| Lazy renderer JS raw bytes | **PASS (measurement)** — 929,418 B | **PASS (measurement)** — 958,244 B | [R3F: Bundle output](issue-119-r3f-spike-results.md#bundle-output), [MapLibre: Bundle output](issue-119-maplibre-spike-results.md#bundle-output) |
| Lazy renderer JS gzip bytes | **PASS (measurement)** — 243,166 B | **PASS (measurement)** — 248,535 B | [R3F: Bundle output](issue-119-r3f-spike-results.md#bundle-output), [MapLibre: Bundle output](issue-119-maplibre-spike-results.md#bundle-output) |
| Context-loss/failure signal test | **PASS** — forced loss/restore counts 1 / 1; rendering resumed | **PASS** — loss/restoration observed and local status fallback shown | [R3F: Failure/context evidence](issue-119-r3f-spike-results.md#failurecontext-evidence), [MapLibre: Evidence table](issue-119-maplibre-spike-results.md#evidence-table) |
| Material runtime blocker | **PASS** — none objectively established in this support spike | **FAIL** — local Globe source/style remained blank/unloaded in headless SwiftShader, with no MapLibre error | [R3F: Objective blockers / unknowns](issue-119-r3f-spike-results.md#objective-blockers--unknowns), [MapLibre: Critical observation](issue-119-maplibre-spike-results.md#critical-observation) |

## Gate statement

**GREEN for the protected principal evidence review.** Both support spikes are
recorded, their common sequences are verified, and every mandatory comparison
row is resolved as a fact, PASS, FAIL or UNCLEAR. The GREEN state does not
erase the MapLibre headless-runtime blocker, untested physical gestures, the
R3F left-edge ownership gap, or the lack of an integrated Atlas fallback. It
only means the evidence packet is complete enough for the principal session to
make the explicitly reserved renderer and architecture decisions.

## Support reconciliation rule

When the runtime reports exist, support may state facts such as:

- candidate A adds 2.3× candidate B's gzip;
- candidate B cannot keep globe projection during the required region zoom;
- candidate A fails existing StrictMode without an architectural workaround;
- candidate B captures a gesture that could not be disabled under tested conditions;
- both satisfy the required interaction sequence.

Support must **not** convert those facts into the final product decision unless one candidate has an objective disqualifier defined by the preservation constraints.

## Frontier question after completion

The principal model should receive the completed table and answer:

> Given Atlas's product thesis, interaction ambition, mobile/PWA constraints, canonical geography architecture and measured runtime trade-offs, which renderer provides the best foundation for a persistent spatial Atlas — and what scene/camera/DOM architecture should be built around it?

That is the high-leverage decision being protected.
