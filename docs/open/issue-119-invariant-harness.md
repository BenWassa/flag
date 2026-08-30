# Issue #119 — Spatial invariant acceptance harness

**Status:** CURRENT reusable acceptance map — **satisfied** by the implemented candidate.
**Purpose:** make the Spatial Atlas candidate prove existing Atlas contracts rather than weakening them to fit a renderer.

Where this matrix asked for spatial-specific evidence, the evidence now exists in
two places and nowhere else: `scripts/verify-spatial-atlas.mjs` (in the `npm test`
gate) and `tests/browser/spatial-atlas.spec.ts` (`npm run test:spatial`). No
existing test or verifier was weakened, removed or relaxed to accommodate the
spatial architecture; the conventional suite runs unchanged against the same
build.

This document maps hard invariants to existing production coverage and identifies the spatial-specific evidence that must be added. Prefer extending established tests/verifiers over building parallel test systems.

## Acceptance matrix

| Invariant | Existing production evidence to preserve | Spatial-specific evidence required |
| --- | --- | --- |
| URLs remain durable navigation authority | `tests/browser/production-matrix.spec.ts`; routing verifiers | route → spatial destination mapping without animation state in URL |
| Native Back/Forward remains authoritative | production matrix; typed routing | Back/Forward during/after spatial motion converges on route state |
| Cold/deep links initialise directly | production deep-link/refresh coverage | direct spatial initialisation at target without replaying ancestor cinematics |
| Active quiz state remains ephemeral | active-round cold-load fallback | background spatial layer must not persist/reconstruct quiz internals |
| No second router/state stack | architecture/routing contract; code review | spatial destination derived from route/store state, never a second history |
| One Natural Earth source | cartography/generator verifiers | spherical assets derive from the same pinned source/reconciliation |
| ISO3 identity preserved | continent/cartography verifiers | every selectable/pickable spatial country resolves to canonical ISO3 |
| Equivalent real DOM controls | current React/browser accessibility coverage | every spatial continent/region pick has an ordinary DOM action with identical dispatch |
| Keyboard access / visible focus | production matrix and domain browser tests | predictable focus after spatial transitions; hidden transitioning controls not focusable |
| Reduced motion | production matrix reduced-motion branch | spatial travel replaced by immediate/short equivalent; hierarchy remains understandable |
| OS-edge gestures remain available | #71 physical-device evidence | spatial gesture ownership must be physically retested; emulation is supporting evidence only |
| Renderer failure has fallback | current lazy-map recovery coverage | initialisation throw/context loss → bounded recovery or usable conventional/2D fallback |
| Spatial stack remains lazy | Vite build/artifact inspection | renderer/world asset absent from initial critical path; exact lazy cost recorded |
| PWA/offline behaviour preserved | `tests/browser/pwa-runtime.spec.ts`; deployment acceptance | cache/revisit policy for spatial runtime/assets |
| Evidence/scoring/storage unchanged | learning/evidence/achievement/storage verifiers | no independent spatial write/qualification path |
| No answer leakage | existing domain answer-safety coverage | spatial DOM/accessibility/picking metadata must not reveal active answers |
| Unsupported state remains honest | production domain-index/browser coverage | unavailable geography cannot look Play-ready or like zero progress |
| Semantic colour system preserved | design/brand/contrast verifiers | no colour-only region identity/progress semantics |

## Existing historical probe evidence

The Stage 0 baseline and Stage 1 2D continuity probe remain useful evidence for route/action count, Back/Forward, direct entry, focus, reduced motion, DOM/geography parity and interruptible motion. They are **not execution gates** and do not need to be repeated merely because full implementation is now authorised.

The old physical-phone H1 verdict is likewise not a prerequisite for implementation. Real-device acceptance is still required before a production migration decision, but it is deferred until the mature candidate is ready.

## Full-candidate additions — where each one landed

| Required evidence | Where it lives |
| --- | --- |
| renderer initialisation failure → conventional fallback | browser: WebGL context creation blocked, full navigation driven through the result |
| context loss → bounded recovery | browser: `WEBGL_lose_context` lose/restore |
| persistent-scene lifecycle | browser: one canvas across a world → continent → region traversal; verifier: dispose path |
| render-on-demand / idle-work policy | verifier: exactly one guarded `requestAnimationFrame` in the scene; browser: flat frame count at rest |
| picking and DOM dispatching the same action | verifier: 195 countries × 4 domains × 6 continents; browser: tap versus its DOM control |
| gesture ownership | verifier: 28 px edge gutter, `touch-action` scoped to the stage; browser: drag does not navigate |
| lazy chunks and service-worker caching | verifier: chunk sizes, `WebGLRenderer` absent from `app.js`, precache membership |
| deterministic spherical assets and provenance | verifier: per-country encoding round trip, pinned digest, framing-policy cross-check |
| real runtime LOD switching | browser: continent chunk requested on entry; verifier: detail asset coverage |
| microstates, multipart, antimeridian | verifier: locator completeness, hit precedence, Chukotka on both sides of the date line, Fiji, circular framing |
| six continents, every region reachable | browser: all four domains × all six continents; verifier: every learner-facing region frames |
| four domains' real Learn/Play flows | browser: a complete Flags round to Results, Learn in all four domains, the three map-native domains yielding |
| Results return, unchanged achievement semantics | verifier: results mode, per region × domain mastery, no cross-domain leak, no world-level tint |
| exact built-artifact payload measurement | verifier: asserted against the ≤ 250 kB gzip budget |
| focus, announcements, reduced motion | browser: canvas `aria-hidden`, keyboard reaches controls, reduced motion arrives without animating |

Do not assert exact camera floating-point coordinates unless F2 deliberately makes them part of a durable contract. Test semantic destinations and observable behaviour instead.

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

#71 remains the authority for the current conventional physical mobile/PWA baseline. Any new spatial gesture layer must be physically revalidated before a production migration decision rather than inheriting that pass by implication.
