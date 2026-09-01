# Issue #119 — Continuous Spatial Atlas moonshot scope

**Status:** HISTORICAL PRODUCT/SCOPE RECORD; EXECUTION SEQUENCING SUPERSEDED.  
**Current execution authority:** [`issue-119-plan.md`](issue-119-plan.md) and [`issue-119-principal-packet.md`](issue-119-principal-packet.md).

This was the original durable scope for the moonshot: make Atlas navigation feel like movement through one geographic instrument while keeping typed routes, canonical geography, learning semantics, accessibility and PWA behaviour authoritative underneath.

Its durable product thesis still applies:

- spatial continuity, not 3D spectacle;
- geography remains the dominant content object;
- typed URLs and native Back/Forward remain authoritative;
- real DOM controls remain equivalent to spatial selection;
- one pinned Natural Earth/ISO3 pipeline remains the geography source;
- scoring, Mastery, storage and Firebase semantics are preserved;
- reduced motion and renderer fallback are first-class;
- physical-device acceptance cannot be inferred from browser emulation.

The old **H1-before-H2 stop sequence does not apply anymore**. On 2026-08-28 the owner authorised the exploration line to proceed through F1/F2/F3 and build the complete parallel candidate on `moonshot/full-spatial-atlas`, while continuing to protect `main` from any production migration.

The exact pre-authorisation scope, including the old H1-first sequencing, is preserved at [`../closed/issue-119-spatial-atlas-moonshot-historical.md`](../closed/issue-119-spatial-atlas-moonshot-historical.md).

For implementation, do not read that archived record as current instruction. Start with the [plan](issue-119-plan.md) and the [architecture map](issue-119-principal-packet.md). The isolated `experiments/spatial-atlas` prototype has been retired; the implemented candidate lives in `src/spatial/`.
