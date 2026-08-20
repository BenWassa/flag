# Issue #22: North America cartography and gameplay expansion

**Status:** Needs scoping (not implementation-ready)
**Proposed GitHub title:** Add North America support for Locations, Outlines, and Neighbours
**Primary intent:** Expand the current Africa-first implementation so North America can be learned and played with the same product quality bar.

## Scoping note for the assignee

This issue intentionally starts broad. The assignee should run a dedicated scoping pass before implementation and refine this into a concrete execution plan with phased deliverables.

## Why this issue exists

Africa is now the production baseline for map cartography, outlines, and neighbour gameplay. North America should follow the same architecture and quality standards rather than introducing one-off systems.

## Initial scope boundaries

- Add canonical North America geometry generation via the existing map pipeline.
- Add region definitions and focus metadata for learning scopes.
- Add Locations support (map gameplay) for North America scopes.
- Add Outlines support for North America scopes.
- Add Neighbours support from topology-derived land adjacency.
- Extend routing and domain surfaces so North America appears where expected.
- Extend verification scripts and regression coverage for the new continent data.

## Nearby-area scoping questions (must be resolved early)

- How should Greenland be handled in scope definitions and region grouping?
- Should Bermuda and Saint Pierre and Miquelon appear as playable countries, context only, or out of scope for now?
- How should Caribbean islands be split between North America and Central America issue boundaries?
- What should be the policy for tiny-island locator versus full polygon behaviour in Locations and Outlines?

## Required scoping deliverables

1. Final country list and ISO3 mapping decisions for North America.
2. Region taxonomy proposal (including edge-case island groupings).
3. Disputed/ambiguous territory policy notes with explicit inclusion/exclusion decisions.
4. Performance budget estimate for generated assets and lazy-loading impact.
5. Verification plan updates (map, neighbour-map, outlines, routing, integration).
6. Breakdown into implementation steps that can be reviewed incrementally.

## Out of scope until scoping is complete

- Any global redesign of routing, progress models, or map interaction architecture.
- Any changes that weaken established Africa behaviour or verification gates.

## Definition of done (to be refined by assignee)

- North America is available as a first-class continent in relevant domains.
- Region play, neighbour gameplay, and outlines are functional and verified.
- Adjacent-area policy decisions are documented and tested.
- CI verification remains green across existing and new checks.
