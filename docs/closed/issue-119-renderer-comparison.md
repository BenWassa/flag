# Issue #119 — Renderer comparison evidence

**Status:** HISTORICAL SUPPORT EVIDENCE; AVAILABLE TO THE AUTHORISED F2 DECISION.  
**Decision authority:** the full-candidate implementation agent under [`issue-119-plan.md`](issue-119-plan.md).

The old renderer gate was deliberately parked behind H1. That sequencing is superseded. The owner has authorised F2 on `moonshot/full-spatial-atlas`; this evidence may be repaired, extended and used now when the implementation agent has a decision-relevant gap.

This report still **does not select a renderer by itself**. Its key historical warning remains valid: the R3F and MapLibre spikes were not apples-to-apples.

## What the historical comparison established

- The R3F spike exercised React/Three lifecycle, camera and a minimal pickable mesh, but did **not** include real Atlas country geography.
- The MapLibre spike attempted real local GeoJSON, style/layer loading and feature picking.
- MapLibre's blank local source under headless SwiftShader was environment-confounded and was never sufficient evidence of a product-level MapLibre failure.
- Historical bundle figures (~243 kB gzip for the R3F/Three minimal renderer versus ~249 kB gzip JS plus CSS for MapLibre) are not product-cost parity: the R3F figure excluded Atlas geography/tessellation/picking/LOD support that the MapLibre task already exercised.
- The R3F StrictMode observation was narrow and should not be promoted into a broad compatibility guarantee.

## How F2 should use it now

Use these findings as constraints, not a scoreboard. Re-run only the focused measurements needed to choose the production candidate architecture, then record the actual F2 decision in `docs/closed/issue-119-renderer-decision.md` as required by the plan.

Raw source reports remain available:

- [`issue-119-r3f-spike-results.md`](issue-119-r3f-spike-results.md)
- [`issue-119-maplibre-spike-results.md`](issue-119-maplibre-spike-results.md)

The exact pre-authorisation comparison is preserved at [`../closed/issue-119-renderer-comparison-historical.md`](../closed/issue-119-renderer-comparison-historical.md).
