# Issue #24: South America cartography and gameplay expansion

**Status:** Needs scoping (not implementation-ready)
**Proposed GitHub title:** Add South America support for Locations, Outlines, and Neighbours
**Primary intent:** Extend the Africa-first cartography/gameplay architecture to South America with explicit policy decisions for nearby territories.

## Scoping note for the assignee

This issue requires an initial scoping phase. The assignee should confirm geography boundaries, edge-case handling, and rollout order before implementation.

## Why this issue exists

South America can likely be delivered as a focused continent unit, but nearby-island and territorial edge cases need explicit treatment so behaviour remains consistent across domains.

## Initial scope boundaries

- Generate South America continent assets via the existing map source pipeline.
- Define continent/region scopes and initial focus metadata.
- Add Locations gameplay support for South America scopes.
- Add Outlines support for South America scopes.
- Add Neighbours support with topology-derived land adjacency.
- Integrate routes/views and update verification scripts accordingly.

## Nearby-area scoping questions (must be resolved early)

- How should the Guianas be grouped in region design?
- What is the policy for the Falkland Islands/Islas Malvinas and nearby South Atlantic territories?
- How should Trinidad and Tobago and other near-coastal islands be treated for scope and gameplay?
- Do any countries require locator/callout metadata for map usability?

## Required scoping deliverables

1. Canonical country and territory inclusion list for South America.
2. Region taxonomy with rationale for any non-obvious grouping.
3. Territory/dispute decision notes tied to existing cartography policy.
4. Readability and mobile interaction risk assessment.
5. Verification plan additions across map, outlines, neighbours, and routing checks.
6. Stepwise implementation plan with review checkpoints.

## Out of scope until scoping is complete

- Changes to core route architecture or storage contracts.
- Merging separate continent expansions into one monolithic implementation PR.

## Definition of done (to be refined by assignee)

- South America appears as a supported continent where expected.
- Locations, Outlines, and Neighbours function correctly for the accepted scope.
- Nearby-territory decisions are documented and tested.
- Verification and CI remain stable.
