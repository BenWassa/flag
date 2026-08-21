# Issue #29 — Country learning evidence and Learn/Play mechanics

GitHub: https://github.com/BenWassa/flag/issues/29

## Goal

Refine the live country-level evidence model while keeping it separate from learner-facing regional mastery.

## Locked direction

- country records remain rich scheduler evidence;
- passive study does not create scored evidence;
- Play is clean scored retrieval and may carry stronger diagnostic weight than ordinary Learn;
- routine UI should not expose `x/3` mastery punch-card mechanics;
- country evidence may lapse/revalidate later;
- earned region/domain mastery is persistent and owned by #34.

## Product boundary

Stable internal values such as `unseen`, `learning`, and `mastered` may remain for compatibility, but individual countries should not be presented as prestigious “mastered” achievements.

See `docs/product/learning-and-mastery.md`.
