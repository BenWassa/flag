# Issue #25: Europe cartography and gameplay expansion

**Status:** Needs scoping (not implementation-ready)
**Proposed GitHub title:** Add Europe support for Locations, Outlines, and Neighbours
**Primary intent:** Add Europe as a full continent learning surface while preserving routing, cartography, and gameplay architecture consistency.

## Scoping note for the assignee

This issue is intentionally scoping-first. The assignee should define final boundaries, region taxonomy, and edge-case policy before implementation begins.

## Why this issue exists

Europe introduces dense boundaries and many small-country interaction challenges. A dedicated issue allows careful scoping and verification rather than overloading a broader expansion ticket.

## Initial scope boundaries

- Add Europe geometry generation and continent asset output.
- Add Europe region definitions and focus metadata.
- Add Europe Locations gameplay support.
- Add Europe Outlines support.
- Add Europe Neighbours support and adjacency validation.
- Integrate routes, domain views, and verification updates.

## Nearby-area scoping questions (must be resolved early)

- How are transcontinental countries handled (for example Türkiye, Russia, and Caucasus-related boundaries)?
- What is the inclusion policy for Iceland, Cyprus, Malta, and microstates?
- Which nearby territories are playable, context-only, or excluded?
- Are additional locator/callout rules needed because of dense small-country clusters?

## Required scoping deliverables

1. Final Europe country inclusion table with edge-case decisions.
2. Region taxonomy proposal suitable for dense geography.
3. Policy decisions for transcontinental and microstate treatment.
4. Label/readability strategy for small and tightly packed countries.
5. Verification updates and performance-budget expectations.
6. Implementation phases with explicit regression safeguards.

## Out of scope until scoping is complete

- Rewriting the map renderer or introducing a separate Europe-only rendering system.
- Broad IA redesign unrelated to this continent expansion.

## Definition of done (to be refined by assignee)

- Europe is available as a first-class continent with coherent regions.
- Locations, Outlines, and Neighbours are playable with clear accessibility behaviour.
- Edge-case territorial decisions are documented and verified.
- Existing test and CI quality gates remain green.
