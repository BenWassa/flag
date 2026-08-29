# Issue #119 — Spatial Atlas implementation starting point

**Current role:** proven prototype and reference implementation for the owner-authorised full Spatial Atlas candidate programme.

The authoritative execution plan is:

`docs/open/issue-119-plan.md`

The compact implementation-agent packet is:

`docs/open/issue-119-principal-packet.md`

The earlier H1-first stop gate is historical evidence, not a blocker on the exploration/full-candidate line. Production `main` is still protected: the full candidate may replace presentation on its own working branch, but must not merge to `main` without a later explicit owner decision.

## What already works

The existing prototype is a persistent 3D Earth that interprets the real typed routes as camera positions:

```text
Mode → World → Continent → Region → Play → Results → back out
```

It already provides:

- all four modes exposed in navigation;
- all six continents and every region reachable;
- one persistent scene rather than route-by-route remounting;
- canonical generated geography from the same pinned Natural Earth source and ISO3 policy as production;
- continent/region raycast picking;
- equivalent real DOM scope buttons;
- interruptible camera travel;
- typed route synchronisation;
- native browser Back;
- reduced-motion snapping;
- narrow/mobile layout verified in browser emulation;
- WebGL failure fallback;
- a real Flags round built from the production quiz generator;
- Results over the same mounted geographic context;
- no prototype write into production progress storage.

Do not rebuild these capabilities from scratch. Use them as evidence and implementation material while evolving the branch into production-quality architecture.

## Run the current prototype

```bash
npm run probe:globe
```

- Spatial prototype: `http://<machine-ip>:5199/experiments/spatial-atlas/index.html#/`
- Historical 2D continuity probe: `http://<machine-ip>:5199/experiments/spatial-continuity/probe/index.html#/`
- Conventional Atlas from the same checkout: `http://<machine-ip>:5199/`

Regenerate/measure experimental geometry:

```bash
node scripts/experiments/generate-globe-geometry.mjs
npm run check:experiments
npm run measure:globe
```

## Current measured cost

Latest prototype measurement:

| Piece | Gzip |
| --- | ---: |
| Prototype JS | **135.63 kB** |
| Reused Atlas modules inside that JS | 8.32 kB |
| Three.js + prototype code, approximate remainder | **~127 kB** |
| `globe-world.json` | **269.5 kB** |
| `globe-africa.json` | **127.0 kB** |
| CSS | 0.77 kB |

For comparison, conventional production Atlas core `app.js` was measured at roughly **100.42 kB gzip** at this checkpoint.

The full-candidate programme treats the current spatial-entry cost as something to improve, not as an accepted budget. See `issue-119-plan.md` for the directional ≤250 kB gzip renderer + initial world-selection geography target.

## Current technical choices are not final architecture

The prototype uses **plain Three.js** because it allowed the exploration to prove persistence, picking, camera behaviour and render-loop control without prematurely selecting R3F or MapLibre.

That choice is now only a starting point. The full implementation agent owns F2 and must choose the final renderer/scene/camera architecture after reading the existing comparison evidence and running focused new measurements where a decision-relevant fact remains ambiguous.

Likewise, the current generated lat/lon geometry proves the canonical pipeline can feed a sphere, but it is not yet the final F3 LOD/picking contract.

## Known gaps the full candidate must close

### Domain integration

- Flags has a real prototype round but is not yet wired through the complete production persistence/application lifecycle.
- Locations reaches scopes but its real learning surface is not integrated with the spatial shell.
- Outlines reaches scopes but real Learn/Play is not integrated.
- Neighbours reaches scopes but real adjacency/input gameplay is not integrated.

### Geography / LOD

- world and Africa detail assets exist, but runtime LOD switching is not implemented;
- antimeridian rings are not fully split/handled;
- microstate locator behaviour is prototype-grade rather than a final display/picking contract;
- mainland framing is useful but needs a documented global policy for multipart/overseas cases.

### Product architecture

- F1 interaction grammar still needs a final design contract;
- F2 renderer/scene/camera architecture still needs a decision;
- F3 spherical geography/LOD architecture still needs a decision;
- the prototype remains isolated rather than the default application presentation on the full-candidate branch.

### Accessibility / mobile / PWA

- real DOM controls exist, but full focus restoration/announcements/keyboard semantics are not complete;
- renderer fallback exists but must become a production-quality conventional/2D route fallback;
- physical-device GPU performance, thermals, battery and gesture coexistence are **not proven**;
- idle rendering, adaptive DPR, context recovery, orientation and offline/PWA behaviour need full-candidate hardening.

## Data-safety note

The current prototype deliberately avoids `AppStore.answer()` because that would write real progress while the experiment is served beside conventional Atlas. The full-candidate programme must integrate the real application lifecycle carefully and preserve existing progress/scoring/storage semantics. Do not casually create a second persistence model merely to keep the prototype isolated.

## Verification truth

Browser emulation and headless Chromium are useful engineering evidence but are **not physical-device evidence**. The full-candidate agent should automate and harden everything it can, then leave real GPU/thermal/gesture/PWA hardware claims explicitly pending for owner testing.

The job now is to turn this proven prototype into the strongest credible complete Spatial Atlas candidate, not to prove that the prototype itself should ship.
