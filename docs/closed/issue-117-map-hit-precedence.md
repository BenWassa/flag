# Issue #117: Prevent assisted map marks stealing neighbouring taps

**Status:** Complete — shipped on `main` in `046bd93`
**GitHub:** [#117](https://github.com/BenWassa/flag/issues/117)

## Outcome

Assisted hit discs now render beneath every real country polygon, so actual
geography wins contested taps. Visible locator and callout marks no longer
receive pointer events. Where assisted discs overlap over open water, the
smaller target has explicit precedence rather than accidental array order.

## Verification and closeout

`tests/browser/map-hit-precedence.spec.ts` verifies neighbour polygon
precedence and preservation of the 44 px assisted target where uncontested.
The focused production-preview browser evidence, Node 22 test gate, merged CI
and GitHub Pages deployment passed. Shipped through PR #121. Physical-device
validation remains #71's scope.
