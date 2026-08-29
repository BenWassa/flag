# Issue #119 — Geometry / LOD feasibility evidence

**Status:** HISTORICAL SUPPORT EVIDENCE; AVAILABLE TO THE AUTHORISED F3 DECISION.  
**Decision authority:** the full-candidate implementation agent under [`issue-119-plan.md`](issue-119-plan.md).

The original four-continent experiment asked whether canonical Atlas geometry could be simplified enough to make a lightweight world/continent representation plausible. It answered that narrow feasibility question, but it did not define the final spherical data model, picking contract or runtime LOD policy.

The old instruction to park this work until H1 passed is superseded. F3 is now owner-authorised on `moonshot/full-spatial-atlas`.

## Durable evidence

- Canonical source remains the pinned Natural Earth 1:10m pipeline with Atlas ISO3 reconciliation and geopolitical policy.
- The experiment operated on already-projected 2D paths, so it is **not** a production spherical-topology recipe.
- Historical simplification measurements showed a useful payload envelope but also showed that microstates/small islands cannot be treated as ordinary simplification casualties.
- Final F3 work must cover all six continents, display versus picking geometry, locators/assist policy, multipart countries, antimeridian handling, deterministic generation, provenance and real runtime LOD switching.

The reproducible historical estimator remains `scripts/experiments/spatial-lod-envelope.mjs`. The exact pre-authorisation report is preserved at [`../closed/issue-119-geometry-lod-experiment-historical.md`](../closed/issue-119-geometry-lod-experiment-historical.md).

Current F3 requirements are authoritative in [`issue-119-plan.md`](issue-119-plan.md) and [`issue-119-principal-packet.md`](issue-119-principal-packet.md).
