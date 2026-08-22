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

Implementation is prepared on `issue-34-earned-mastery` and now includes the Issue #29 evidence integration. It remains merge-blocked until #29 itself passes final CI/artifact closeout and merges to `main`.

Implemented:

- pure monotonic/idempotent region-domain, region, continent and world award selectors;
- canonical scope-country aggregation through the existing support/geography system;
- a versioned independent `flag-atlas:earned-achievements:v1` persistence layer;
- application-store backfill plus re-awarding after evidence-changing answers in all four domains;
- explicit full-reset semantics for earned achievements;
- region, continent and world read models for later presentation/#60 consumption;
- deterministic verifier coverage for support guards, non-revocation, persistence, migration, reset, idempotency and four-ledger independence;
- direct delegation to Issue #29's canonical `qualifiesForRegionMastery()` selector.

## Issue #29 integration seam

`src/state/achievement-evidence-adapter.ts` only selects the appropriate domain record. It delegates qualification to `src/domain/evidence.ts` via `qualifiesForRegionMastery()` and does not encode scheduler status or threshold rules itself.

The prepared branch already contains the repaired Issue #29 head as an ancestor. Final closeout order remains mandatory:

1. run final #29 verification and merge #29;
2. fetch/sync #34 with then-current `main` if anything changed after the prepared integration;
3. confirm the achievement adapter still delegates to `qualifiesForRegionMastery()` and contains no raw `status === 'mastered'` rule;
4. run `npm run check` and full `npm test` under Node 22;
5. inspect the exact production artifact;
6. confirm final CI is green;
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

Final verification evidence must be recorded after #29 has merged and the final #34 branch head has been tested.
