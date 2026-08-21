# Issue #29 — Country learning evidence and Learn/Play mechanics

GitHub: https://github.com/BenWassa/flag/issues/29

PR: #53 (`issue-29-learning-evidence`)

## Goal

Refine the live country-level evidence model while keeping it separate from learner-facing regional mastery.

## Implemented model

A narrow shared evidence contract now lives in `src/domain/evidence.ts`.

Normalised activities:

- `learn`
- `play`
- `review`

Normalised outcomes:

- `passive-exposure`
- `assisted-retrieval`
- `clean-retrieval`
- `contradictory`

Each domain keeps its native progress counters and maps resolved outcomes into this shared contract rather than being flattened into one generic attempt model.

## Weighting

The current compatibility scheduler keeps `unseen` / `learning` / `mastered` internally.

- clean Learn: one strength credit per session;
- clean Play before a lapse: two credits;
- initial strong threshold: three credits;
- post-lapse recovery threshold: two credits;
- post-lapse Play: one credit, so one assessment cannot erase contradictory evidence;
- passive exposure: retained, no scored evidence/credit;
- assisted retrieval: retained as learning evidence, no clean strength credit.

Learner-facing UI calls the qualifying country state **Strong evidence**, not Mastered, and no longer presents scheduler `x/y` punch cards.

## Domain mapping

- Flags / Outlines: clean recognition → clean; wrong recognition → contradictory.
- Locations: first try → clean; completion after misses → assisted; reveal → passive; misses remain contradictory.
- Neighbours: clean complete set → clean; completion after wrong guesses → assisted; exhausted/revealed set → passive; wrong guesses remain contradictory.

Clean Flags/Outlines Learn answers now turn the correct answer into the continue control, keeping focus/thumb in the task surface rather than requiring a detached Next button. Flags browse/reveal itself remains #30.

## Persistence

All four country-ledger payloads are schema `version: 2` while the existing storage-key namespaces remain unchanged.

Loaders accept v1/v2 payloads and migrate v1 deterministically. Existing strong records continue to qualify. Legacy scored retrieval is preserved separately when the historical Learn/Play mode cannot be reconstructed honestly.

## Issue #34 contract

`qualifiesForRegionMastery(record)` is the UI-independent integration seam.

#34 must call this selector rather than inspect `status`, `masteryStreak`, storage fields, or today's internal `mastered` value.

## Verification

`npm test` now includes `npm run check` before the production build and full verifier chain.

`scripts/verify-learning-evidence.mjs` adds deterministic coverage for passive/assisted/clean/Play/review/lapse evidence, domain-specific mapping, migration, domain independence, qualification and learner-facing copy.

Final PR readiness still requires current-main sync, green CI and exact production-artifact inspection.
