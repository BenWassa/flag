# Issue #115: Frame Western Europe around mainland geography

**Status:** Complete — shipped on `main` in `046bd93`
**GitHub:** [#115](https://github.com/BenWassa/flag/issues/115)

## Outcome

The Netherlands' Caribbean parts are excluded from Europe and Western Europe
fit/focus calculations while remaining canonical country geometry. Western
Europe geography is 4.50 times larger linearly in the measured opening frame;
whole Europe improves 1.59 times, with no other European region becoming
smaller.

## Verification and closeout

Europe generation assertions protect the exclusion and framing bounds. The
shared cartography and Europe verifiers passed under Node 22, as did merged CI
and the GitHub Pages deployment. Shipped through PR #121.
