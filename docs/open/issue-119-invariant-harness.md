# Issue #119 — Spatial invariant acceptance harness

**Status:** support-owned reusable acceptance map.  
**Purpose:** make future spatial implementations prove existing Atlas contracts rather than weakening them to fit a renderer.

This document maps each hard invariant to existing production coverage and identifies only the genuinely new coverage a spatial implementation must add. Prefer extending these established tests/verifiers over building parallel test systems.

## Acceptance matrix

| Invariant | Existing production evidence to preserve | Spatial-specific evidence still required |
| --- | --- | --- |
| URLs remain durable navigation authority | `tests/browser/production-matrix.spec.ts`; routing verifiers | route → spatial destination mapping without animation state in URL |
| Native Back/Forward remains authoritative | `tests/browser/production-matrix.spec.ts`; typed routing | Back/Forward during/after spatial motion converges on route state |
| Cold/deep links initialise directly | production matrix deep-link/refresh coverage | direct spatial initialisation at target without replaying ancestor cinematics |
| Active quiz state remains ephemeral | production matrix active-round cold-load fallback | background spatial layer must not persist/reconstruct quiz internals |
| No second router/state stack | architecture/routing contract; code review | assert spatial destination is derived from route/store state, never a second history |
| One Natural Earth source | cartography/generator verifiers | spherical assets, if authorised, derive from the same pinned source/reconciliation |
| ISO3 identity preserved | continent/cartography verifiers | every selectable/pickable spatial country resolves to canonical ISO3 |
| Equivalent real DOM controls | current React controls/browser accessibility coverage | every spatial continent/region pick has an ordinary DOM action with identical application dispatch |
| Keyboard access / visible focus | production matrix and domain browser tests | predictable focus on durable spatial transitions; hidden transitioning controls not focusable |
| Reduced motion | production matrix reduced-motion branch | spatial travel replaced by immediate/short equivalent; hierarchy remains understandable |
| OS-edge gestures remain available | #71 physical-device validation owns this evidence | spatial gesture ownership must be physically retested; emulation is supporting evidence only |
| Renderer failure has fallback | current lazy-map load failure/recovery coverage | initialisation throw, context loss and bounded fallback/recovery for the selected renderer |
| Spatial stack remains lazy | Vite build/artifact inspection | renderer/world asset absent from initial critical path; exact lazy cost recorded |
| PWA/offline behaviour preserved | `tests/browser/pwa-runtime.spec.ts`; deployment acceptance | cached/revisit policy for new spatial runtime/assets after architecture is chosen |
| Evidence/scoring/storage unchanged | learning/evidence/achievement/storage verifiers | no new spatial code path writes or qualifies progress independently |
| No answer leakage | Flags/map/outline/neighbour answer-safety coverage | spatial DOM/accessibility/picking metadata must not reveal active quiz answers |
| Unsupported state remains honest | production domain-index/browser coverage | unavailable geography cannot look Play-ready or like zero progress |
| Semantic colour system preserved | design/brand/contrast verifiers | spatial selection/progress cannot introduce colour-only region identity/progress |

## Stage 0 / Stage 1 harness responsibilities

Before any renderer is involved, the 2D continuity probe should exercise the invariants that are independent of renderer choice:

1. durable route sequence and action count;
2. Back/Forward ancestry;
3. cold direct entry to continent/region stable routes;
4. active-round refresh fallback;
5. focus after forward/back navigation;
6. reduced-motion behaviour;
7. real DOM control parity with geography selection;
8. interruptible motion whose final state always follows the router;
9. no second navigation stack;
10. exact production/prototype asset and browser-timing measurements.

The physical-phone H1 verdict is separate from this technical harness.

## Future renderer acceptance additions

Only after H1 passes and F1–F3 authorise an architecture, add reusable tests for:

- renderer initialisation failure → current 2D/navigation fallback;
- context loss → bounded recover or fallback;
- spatial scene remains mounted only according to the approved lifecycle;
- idle renderer work meets the approved policy;
- picking and DOM actions dispatch the same route/application action;
- selected renderer does not steal gestures from an active Locations map or DOM overlays;
- left-edge/system Back ownership on real supported mobile platforms;
- spatial chunks remain lazy and service-worker caching follows the approved PWA policy;
- spherical generated assets remain deterministic and provenance-verifiable.

Do not assert exact camera floating-point coordinates unless F2 deliberately makes those coordinates part of a durable contract. Test semantic destinations and observable behaviour instead.

## Evidence classes

Use explicit labels so browser emulation is never mistaken for device proof:

- unit/component;
- invariant verifier;
- Playwright desktop;
- Playwright mobile viewport;
- production artifact measurement;
- Android physical;
- iPhone/iOS physical;
- installed PWA physical;
- manual product judgement.

#71 remains the authority for the current physical mobile/PWA baseline. #119 may reuse that evidence where the same production build/scenario is relevant, but any new spatial gesture layer must be physically revalidated rather than inheriting a pass by implication.
