# Issue #27: Oceania cartography and gameplay expansion

**Status:** Needs scoping (not implementation-ready)
**Proposed GitHub title:** Add Oceania support for Locations, Outlines, and Neighbours
**Primary intent:** Add Oceania with robust handling of Australia and island-heavy geography while preserving existing architecture.

## Scoping note for the assignee

This issue is intentionally scoping-heavy. The assignee should produce a concrete scoping brief first, then execute in phases.

## Why this issue exists

Oceania has unique geometry and adjacency constraints, and Australia can be awkward in region partitioning. A dedicated issue prevents these concerns from being diluted in a larger multi-continent ticket.

## Initial scope boundaries

- Generate Oceania geometry in the existing map pipeline.
- Define continent/region scopes and initial focus metadata.
- Add Locations support for Oceania scopes.
- Add Outlines support for Oceania scopes.
- Add Neighbours support where land adjacency exists, with clear rules where it does not.
- Integrate routing/view updates and extend verification.

## Nearby-area scoping questions (must be resolved early)

- How should Australia be represented as a region model (single region versus subdivisions)?
- What is the policy for New Zealand and nearby island groups?
- How are Melanesia, Micronesia, and Polynesia grouped for learning scopes?
- What neighbour-game behaviour applies where countries are primarily non-contiguous islands?
- Which tiny islands require locator/callout handling for usability?

## Required scoping deliverables

1. Final Oceania inclusion list and island-group boundaries.
2. Region taxonomy proposal with rationale for Australia handling.
3. Neighbour-game policy for limited/no land-border contexts.
4. Locator/callout and label-legibility strategy for small islands.
5. Verification/performance updates and expected asset size impact.
6. Incremental implementation plan with explicit risk controls.

## Out of scope until scoping is complete

- Introducing ad hoc gameplay exceptions without documented policy.
- Global mechanics changes not required for continent onboarding.

## Definition of done (to be refined by assignee)

- Oceania is available with coherent region structure and route integration.
- Locations and Outlines are fully playable for accepted scope.
- Neighbour behaviour is clearly defined and test-covered for island contexts.
- CI gates remain green and documented.
