# Issue #119 — Stage 0 / Stage 1 continuity harness

This directory contains **support-tier evidence tooling**, not the moonshot renderer and not a production navigation replacement.

> **Historical on this branch.** The Stage 0 harness measures route and action
> counts against whatever the checkout builds. On the full Spatial Atlas
> candidate that is the *spatial* shell, not the conventional baseline it was
> written to characterise, so its numbers here describe the candidate rather than
> the thing the candidate should be compared against. Capture a conventional
> baseline from `main` if that comparison is wanted; the candidate's own
> verification lives in `scripts/verify-spatial-atlas.mjs` and
> `tests/browser/spatial-atlas.spec.ts`.

## Dependency gate

Do not call any captured Stage 0 evidence **final** and do not build the final Stage 1 continuity probe until current `main` contains the completed production work from #27, #137 and #138.

The harness can be exercised earlier as a smoke test, but transitional output must be discarded and re-captured against the exact final baseline.

## Stage 0 browser evidence

After building the exact production artifact:

```bash
npm run build
npm run test:spatial-baseline
npm run measure:spatial-artifact
```

The Playwright run records:

- deterministic Home → Flags → Africa → West Africa Play route actions;
- route timestamps/action count;
- Back and Forward behaviour;
- stable deep-link behaviour;
- active-round cold-load fallback;
- focus behaviour;
- reduced-motion behaviour;
- navigation/resource timing;
- screenshots, trace and video through Playwright output.

`measure:spatial-artifact` records raw/gzip sizes for the exact `dist/` files instead of copying historical bundle figures into planning prose.

## Human evidence is separate

The browser harness is **not** physical-device evidence and cannot decide H1.

Ben runs the fixed comparison script in `docs/closed/issue-119-plan.md` on a physical phone, production first and the Stage 1 probe second. In particular, repetition and one-handed use are human product evidence and are not simulated here.

## Stage 1 boundary

The final Stage 1 probe, when the dependency gate is clear, may use only existing production 2D `MapRegionAsset` geography, existing fit/focus metadata, the typed router, real DOM controls, browser history and current design tokens.

It must not add Three.js, R3F, MapLibre, spherical geometry, a second router/state machine, or learning/progress changes.
