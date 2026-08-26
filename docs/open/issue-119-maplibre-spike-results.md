# Issue #119 / #123 — MapLibre globe runtime spike results

**Status:** PENDING EXECUTION  
**Authority:** support-tier evidence only; no renderer-selection authority  
**Branch:** `spike/119-maplibre-atlas-runtime`

## Environment

- Base exploration SHA: `90d74008db116239d4bd0fbf242670de5f5304f7`
- Current `main` at run time: PENDING
- Node: PENDING
- React / React DOM: PENDING
- Vite: PENDING
- `maplibre-gl`: PENDING
- Browser(s): PENDING
- Physical device evidence: NONE unless explicitly recorded below

## Commands

```text
PENDING
```

## Local/offline test style

- Remote style/provider dependency: **must be NONE**
- Local GeoJSON fixture: PENDING
- Globe projection: PENDING

## Common semantic sequence

```text
World
→ Africa
→ West Africa
→ Back Africa
→ Back World
```

Result: **PENDING**

## Interruption sequence

```text
World → Africa (moving)
→ request West Africa
→ immediately Back
```

Result: **PENDING**

## Evidence table

| Property | Result | Evidence |
| --- | --- | --- |
| Install + typecheck | PENDING | |
| Existing `npm test` after spike changes | PENDING | |
| Dev renderer initialises | PENDING | |
| Production preview initialises | PENDING | |
| Map instance mount count across common sequence | PENDING | |
| Renderer/context identity stays persistent | PENDING | |
| Idle/repaint behaviour acceptable | PENDING | Include observed repaint/render evidence |
| World → Africa camera transition | PENDING | |
| Africa → West Africa transition | PENDING | |
| Mid-flight retarget | PENDING | |
| Back mid-flight | PENDING | |
| One-finger globe rotation | PENDING | |
| Pinch | PENDING | |
| Left 28 px Back gutter not stolen | PENDING | |
| Ordinary DOM control coexistence | PENDING | |
| GeoJSON pick → same application action as DOM | PENDING | |
| DOM/geographic anchoring feasibility | PENDING | |
| Fully local/offline globe | PENDING | No demo tiles/provider |
| Lazy renderer JS raw bytes | PENDING | Exclude geography fixture |
| Lazy renderer JS gzip bytes | PENDING | Exclude geography fixture |
| Lazy renderer CSS raw/gzip | PENDING | |
| Context/error instrumentation | PENDING | |
| Intentional renderer failure/fallback signal | PENDING | |
| Material runtime blocker | PENDING | factual only |

## Default-map behaviour that had to be disabled/changed

PENDING

## Latitude/zoom compensation observations

PENDING

## Globe → Mercator transition observations

PENDING

Record whether the projection transition becomes relevant before the intended region-focus state. Do not redesign around it in this support task.

## Custom-layer requirements observed

PENDING

## Bundle output

```text
PENDING
```

## Idle/repaint evidence

PENDING

## Gesture evidence

PENDING

## Camera interruption evidence

PENDING

## Failure/context evidence

PENDING

## Objective blockers / unknowns

- PENDING

## Support conclusion

Do **not** recommend or reject MapLibre as Atlas's production renderer here unless a tested preservation constraint is objectively impossible. State only what the experiment established.

PENDING
