# Issue #20 — Map colour palette and water-feature contrast

GitHub: https://github.com/BenWassa/flag/issues/20

## Goal

Improve shared production cartography contrast so land, water, context geography and learning states remain legible on phone-scale maps.

## Atlas product-reset note

Consume the global semantic colour system from `docs/product/colour-system.md`:

- blue = ordinary action/selection;
- green = correct;
- red = wrong;
- purple = earned regional/domain mastery;
- gold = scarce prestige.

Cartography still needs its own functional land/water/context tokens, but it must not create a competing continent/region theme system.

## Scope guard

Do not change canonical geometry/topology, adjacency, projection or geopolitical policy. Consume the implemented Tactile Atlas tokens and `DESIGN.md` while preserving the existing map pipeline.

## Acceptance criteria

- [x] One functional `--map-*` token family controls ocean, inland water, rivers, context land, active land, boundaries and label halos.
- [x] Locations, the Locations launcher and Neighbours consume that family rather than deriving cartography from generic surface tokens independently.
- [x] Ocean, lakes, rivers, context geography and active geography remain distinct at phone scale without a continent or region theme.
- [x] Atlas Blue focus/selection, green correct feedback and red wrong/reveal feedback remain stronger than neutral cartography.
- [x] Forced-colours mode preserves water, context, boundary and learning-state structure.
- [x] Geometry, topology, projection, adjacency and geopolitical policy are unchanged.
- [x] Focused automated coverage guards token ownership, all three consuming surfaces, semantic-state precedence and forced-colours handling.

## Implementation evidence

- `atlas-theme.css` owns the neutral functional palette. The new tokens are deliberately separate from the locked action, correct, wrong, mastery and prestige roles.
- `styles.css`, `map.css`, `map-cartography.css` and `neighbors.css` consume the same map tokens across the launcher, Locations and Neighbours.
- Active/answer selectors still occur after the neutral base rules and retain their existing semantic fills, strokes, widths, animation and non-colour cues.
- `scripts/verify-map-contrast.mjs` asserts the shared contract, semantic precedence, forced-colours coverage and absence of map-token literals in the consumer sheets.

## Verification

- `npm run check`: passed on 2026-08-21.
- `npm test`: passed on 2026-08-21, including the new focused map-contrast verifier and the complete existing cartography, Locations, Neighbours, responsive, accessibility, routing and PWA suite.
- Manual phone-scale and Windows High Contrast inspection remains a closeout gate; automated CSS-contract evidence is not represented as a manual run.
