# Issue #108: Require complete-region Play coverage for Mastery

**Status:** Complete — shipped on `main` in `046bd93`
**GitHub:** [#108](https://github.com/BenWassa/flag/issues/108)

## Outcome

Region Play now covers the complete supported region in all four domains.
Achievement qualification records each domain's eligible target set at launch
and requires the completed result to cover that set exactly. A short sampled
round can neither advance nor reset the complete-region streak.

Previously earned Mastery remains earned, preserving Atlas's monotonic
achievement contract.

## Verification and closeout

`scripts/verify-achievements.mjs` drives real `AppStore` rounds and verifies
that a perfect ten-question West Africa sample does not advance the streak,
two perfect full-region rounds earn Mastery, and an ineligible sample does not
destroy earned streak progress.

Shipped through PR #121. Node 22 CI and the GitHub Pages deployment passed for
the merged commit. No physical-device claim is required for this domain-rule
change.
