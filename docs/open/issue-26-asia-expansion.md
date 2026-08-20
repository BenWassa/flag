# Issue #26: Asia cartography and gameplay expansion

**Status:** Needs scoping (not implementation-ready)
**Proposed GitHub title:** Add Asia support for Locations, Outlines, and Neighbours
**Primary intent:** Add Asia as a full continent implementation while maintaining established quality bars for map gameplay, outlines, and neighbour logic.

## Scoping note for the assignee

This issue should start with a structured scoping phase. The assignee should narrow boundaries, define regions, and document policy decisions before implementation.

## Why this issue exists

Asia has high country count, broad geographic diversity, and multiple transcontinental/disputed edge cases. A dedicated issue keeps complexity manageable and reviewable.

## Initial scope boundaries

- Generate Asia continent assets in the existing pipeline.
- Add region definitions and focus metadata for Asia.
- Add Locations gameplay support for Asia scopes.
- Add Outlines support for Asia scopes.
- Add Neighbours support using topology-derived adjacency.
- Integrate routes/views and extend automated verification.

## Nearby-area scoping questions (must be resolved early)

- How should transcontinental boundaries with Europe be represented in scope definitions?
- What is the policy for Middle East/Caucasus boundary treatment in this project?
- How should island-heavy areas (Japan, Indonesia, Philippines, etc.) be handled for locator/callout usability?
- Which nearby territories are included as playable versus context only?

## Required scoping deliverables

1. Canonical Asia inclusion list with explicit boundary decisions.
2. Region taxonomy proposal and naming approach.
3. Dispute/transcontinental policy notes aligned with existing cartography decisions.
4. Small-island and dense-label usability strategy.
5. Verification and performance plan updates.
6. Sequenced implementation plan with rollback-safe checkpoints.

## Out of scope until scoping is complete

- Introducing a second map engine or new topology system.
- Bundling all remaining continent work into one implementation branch.

## Definition of done (to be refined by assignee)

- Asia is integrated as a playable continent across relevant domains.
- Region, neighbour, and outline behaviour aligns with accepted scope decisions.
- Boundary and territory policy decisions are documented and test-covered.
- CI remains green and within agreed performance budgets.
