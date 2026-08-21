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

See `docs/product/gamification.md`, `docs/product/learning-and-mastery.md`, and `docs/architecture/earned-achievements.md`.

## Implementation status

Draft implementation is on `issue-34-earned-mastery` and remains intentionally merge-blocked on Issue #29.

Implemented:

- pure monotonic/idempotent region-domain, region, continent and world award selectors;
- canonical scope-country aggregation through the existing support/geography system;
- a versioned independent `flag-atlas:earned-achievements:v1` persistence layer;
- application-store backfill plus re-awarding after evidence-changing answers in all four domains;
- explicit full-reset semantics for earned achievements;
- region, continent and world read models for later presentation/#42 consumption;
- deterministic verifier coverage for support guards, non-revocation, persistence, migration, reset, idempotency and four-ledger independence.

## Issue #29 integration seam

`src/state/achievement-evidence-adapter.ts` is temporary compatibility code for pre-#29 `main`. It is the only achievement path allowed to understand the current ledger status representation.

Final integration order is mandatory:

1. merge #29;
2. rebase this branch onto then-current `main`;
3. replace the temporary adapter with #29's canonical country-evidence qualification selector;
4. resolve semantics deliberately rather than preserving legacy thresholds by accident;
5. rerun `npm run check` and `npm test` under Node 22;
6. inspect the exact production artifact and confirm CI green;
7. only then mark the PR ready and merge #34.

## Current curriculum limits

A supported individual region × domain can earn Mastery. Higher tiers require genuine four-domain coverage rather than merely “all domains that happen to exist”.

Therefore:

- Africa can currently earn complete-region and continent completion states;
- non-Africa regions may earn Flags Mastery but cannot become complete regions today;
- non-Africa continents cannot earn crest state today;
- the World Crown cannot currently be earned.

## Visual closeout

The implementation exposes presentation-safe read models but does not invent new crest/Crown artwork. Final visible treatment must continue to follow `DESIGN.md`: purple Mastery, restrained gold complete-region treatment, generated continent silhouettes for crest presentation, and Crown only for genuine world completion.

Exact verification evidence is recorded in the draft PR and will be refreshed after the required post-#29 rebase.
