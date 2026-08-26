# Issue #119 — Renderer comparison gate

**Status:** research evidence populated; runtime rows intentionally pending  
**Owner:** support tier until the table is complete; final selection belongs to Opus/Sol

This file exists to prevent two failure modes:

1. the principal model spending expensive context reconstructing objective package/runtime facts; or
2. a support model quietly turning preliminary preference into architecture.

## Current neutral evidence

| Dimension | R3F / Three | MapLibre GL JS | Current evidence state |
| --- | --- | --- | --- |
| React compatibility | R3F 9.7.0 declares React >=19 <19.3 | renderer is framework-agnostic; React integration is ordinary lifecycle wrapping | researched |
| Atlas React 19.2.8 fit | nominally compatible | nominally compatible | researched, runtime pending |
| Current stable version | R3F 9.7.0; Three r185 | MapLibre 6.6.0 | researched 2026-08-26 |
| Camera control model | fully custom 3D scene; CameraControls 3.1.2 candidate | map-native centre/zoom/bearing/pitch/roll/fly/ease camera | researched |
| Globe projection | Atlas would own sphere/geography representation | built-in globe projection | researched |
| Local canonical GeoJSON | custom conversion/mesh pipeline required | native GeoJSON source/layer path exists | researched |
| Custom visual/game scene freedom | very high | map engine defines core projection/render interaction; custom layers available | researched |
| On-demand rendering | R3F documents `frameloop="demand"` | map engine owns repaint lifecycle; exact idle behaviour must be measured | R3F researched, MapLibre runtime pending |
| StrictMode risk | **open R3F #3863 reports dev context loss** | no equivalent Atlas-specific issue identified in research | mandatory runtime check |
| Globe maturity signal | general Three/R3F mature; Atlas globe is custom engineering | globe actively developed; 6.5/6.6 contain globe interaction fixes | researched |
| Offline/local style path | naturally local assets | supported in principle; must prove no remote-style/tile dependency | runtime pending |
| DOM overlay coexistence | standard React DOM alongside Canvas | standard DOM controls/markers around map canvas | researched, UX pending |
| Left-edge Back coexistence | input bindings fully controllable in principle | handlers configurable in principle | runtime pending |
| Lazy bundle gzip | unknown until Atlas Vite spike | unknown until Atlas Vite spike | **required** |
| Persistent renderer across route-like state | architecturally plausible | architecturally plausible | **required** |
| Camera interruption quality | plausible via CameraControls/custom orchestration | plausible via map camera API | **required** |
| WebGL failure/recovery hooks | Three/R3F hooks + browser context events; exact Atlas path unproven | MapLibre error/context lifecycle unproven in Atlas | **required** |

## Mandatory comparable runtime rows

Populate from the two disposable spikes defined in `issue-119-renderer-spike-prep.md`.

| Property | R3F result | MapLibre result | Notes/evidence |
| --- | --- | --- | --- |
| Install + `npm test` compatibility | PENDING | PENDING | |
| Development renderer initialises | PENDING | PENDING | |
| Production preview initialises | PENDING | PENDING | |
| Existing StrictMode survives | PENDING | N/A / PENDING | |
| One renderer instance persists through semantic state changes | PENDING | PENDING | |
| Idle renderer stops/reduces work acceptably | PENDING | PENDING | |
| World → Africa camera move | PENDING | PENDING | |
| Africa → West Africa camera move | PENDING | PENDING | |
| Mid-flight retarget | PENDING | PENDING | |
| Back mid-flight | PENDING | PENDING | |
| One-finger rotate | PENDING | PENDING | |
| Pinch | PENDING | PENDING | |
| Left 28 px Back gutter not stolen | PENDING | PENDING | |
| DOM button remains ordinary accessible action | PENDING | PENDING | |
| Feature/geography picking → same action | PENDING | PENDING | |
| Fully local/offline geography/style | PENDING | PENDING | |
| Lazy renderer JS raw bytes | PENDING | PENDING | |
| Lazy renderer JS gzip bytes | PENDING | PENDING | |
| Context-loss/failure signal test | PENDING | PENDING | |
| Material runtime blocker | PENDING | PENDING | |

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
