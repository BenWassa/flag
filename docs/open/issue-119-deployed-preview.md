# Issue #119 — deployed Spatial Atlas preview

**Status:** implementation contract for deployed physical-device evaluation

## Decision

The full Spatial Atlas candidate is deployed as a sibling static app at `./spatial/`, not as the default production shell and not as a new typed learning route.

Classic Atlas remains the deployment root. Its router, progress/storage namespaces, service worker and learning semantics stay authoritative. The Spatial candidate keeps its own existing hash routes beneath the sibling deployment path, so `./spatial/#/flags/africa` represents the same durable learning state as `./#/flags/africa` with a different presentation artifact.

## Why a sibling artifact

This is the narrowest production-risk path for real-device testing:

- classic production source does not import Three.js or the spatial renderer;
- the candidate can retain its exact renderer/geography/map-viewport behaviour without changing classic Atlas;
- both presentations are same-origin, so local progress and account persistence remain shared without migration;
- each PWA has its own service-worker scope and cache namespace;
- the candidate build is pinned by commit, making the deployed experiment reproducible rather than branch-head dependent.

## Source pin

`config/spatial-preview.json` is authoritative. Deployment workflows must checkout that exact commit, build it independently, and copy only its final `dist/` beneath the root artifact's configured preview path.

Changing the preview therefore requires an explicit source-pin update and a new normal production PR/CI/deployment cycle.

## User entry / exit

- Classic Home exposes one restrained `Try Spatial Atlas` Preview entry.
- The preview exposes a persistent `Classic Atlas` escape.
- Returning to classic preserves the current hash route when practical.
- Neither direction writes a presentation choice to storage; reopening normal Atlas remains classic by default.

## Service-worker boundary

Cache Storage is origin-wide even when service-worker scopes differ. The preview therefore uses `flag-atlas-spatial-preview-v*`; classic Atlas continues the normal `flag-atlas-v*` convention. A preview build using a classic cache prefix is a release blocker.

The classic root service worker is generated before `dist/spatial/` is assembled, so the root precache deliberately does not absorb the experimental renderer/geography payload. The preview owns its own precache inside its narrower scope.

## Acceptance

Before merge:

- normal `npm run check` and full `npm test` pass on the main integration branch;
- the pinned preview source builds exactly;
- the combined `dist/` contains both roots and records `spatial/preview-source.json`;
- Chromium desktop and Pixel emulation prove classic → preview → classic navigation, route-preserving exit and same-origin storage continuity;
- classic root does not render a spatial shell;
- preview cache/manifest identity is isolated;
- exact combined artifact is uploaded from CI.

After merge, Pages and Firebase must both deploy the combined artifact and live-origin acceptance must include the preview. Physical-device judgement remains the actual #119 product gate; this deployment mechanism does not itself accept the moonshot direction.
