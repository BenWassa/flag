# Issue #23: Central America cartography and gameplay expansion

**Status:** Needs scoping (not implementation-ready)
**Proposed GitHub title:** Add Central America support for Locations, Outlines, and Neighbours
**Primary intent:** Ship Central America as a distinct learning scope with clear boundaries from North America and South America workstreams.

## Scoping note for the assignee

This issue should begin with boundary and taxonomy scoping. The assignee should tighten scope before code changes and document the final implementation plan.

## Why this issue exists

The Americas are intentionally split into multiple workstreams to keep scope manageable. Central America has dense coastlines, smaller countries, and nearby-island complexity that warrants a dedicated issue.

## Initial scope boundaries

- Add Central America geometry and scope metadata through existing generation pipelines.
- Add Central America Locations gameplay support.
- Add Central America Outlines support.
- Add Central America Neighbours support with validated land-border adjacency.
- Ensure region routes, labels, and selection flows are integrated consistently.
- Add verification coverage for geometry, gameplay, and route behaviour.

## Nearby-area scoping questions (must be resolved early)

- Exact northern and southern limits: does this issue include Mexico and/or Panama adjacency specifics?
- How should Belize-related and Caribbean coastal/island edge cases be treated?
- Which Caribbean countries, if any, belong in this issue versus North America or a future Caribbean-specific split?
- Are there tiny-country locator/callout needs comparable to existing Africa exceptions?

## Required scoping deliverables

1. Final Central America country/territory inclusion list.
2. Region model and naming proposal aligned with product language conventions.
3. Nearby-island and Caribbean boundary decision table.
4. Risk list for map readability, labels, and touch targets on small geometries.
5. Verification additions and expected CI coverage.
6. Implementation sequencing plan that avoids regressions in existing continents.

## Out of scope until scoping is complete

- Repartitioning all Americas globally in one pass.
- Introducing new gameplay mechanics or alternate scoring systems.

## Definition of done (to be refined by assignee)

- Central America is playable and learnable as an explicit scope.
- Neighbour and outline behaviour works with accepted inclusion boundaries.
- Nearby-area policy is documented and reflected in tests.
- CI remains green with updated verification scripts.
