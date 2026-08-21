# Issue #34 — Earned mastery, continent crests and world Crown

GitHub: https://github.com/BenWassa/flag/issues/34

## Goal

Implement a persistent earned-achievement layer above the live country-learning evidence model.

## Hierarchy

- country: live evidence only;
- region × domain: Mastery, shown in purple;
- complete region: restrained gold accent/border;
- complete continent: continent-silhouette crest with restrained purple/gold;
- complete world: Crown only.

## Critical boundary

Live country evidence may strengthen, lapse or be reviewed later. Earned mastery/completion is persistent in the current product model and must not be silently revoked by scheduler changes.

Unsupported domain coverage must never count as automatically complete. Africa is the first full proving ground; world Crown remains intentionally unobtainable until global coverage exists.

See `docs/product/gamification.md` and `docs/product/learning-and-mastery.md`.
