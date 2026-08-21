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

Do not change canonical geometry/topology, adjacency, projection or geopolitical policy. Coordinate presentation with #32 while preserving the existing map pipeline.
