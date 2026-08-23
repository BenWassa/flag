# Earned achievement architecture

## Purpose

Atlas keeps **live country evidence** and **earned achievement state** separate.

- Country evidence belongs to each learning domain and may strengthen, lapse or be revalidated.
- Earned achievements begin at region × domain and are historical milestones. Once earned, they remain earned until the learner explicitly resets progress.

Region × domain mastery is **not** gated on per-country evidence at all (see "Qualification seam" below) — country evidence stays entirely a scheduling/review concern, plus the presentation-only "cleared" (blue progress bar) signal.

## Qualification seam

`src/domain/achievements.ts` depends only on:

```ts
type RegionDomainPerfectRunQualification = (
  regionId: string,
  domain: LearningDomain,
) => boolean;
```

This is backed by a session-level **perfect-run streak**, not per-country evidence:

```ts
interface PerfectRunStreakState {
  version: 1;
  streaks: Partial<Record<RegionDomainMasteryKey, number>>;
}

recordRegionDomainPlayResult(streakState, regionId, domain, wasPerfect): PerfectRunStreakState
createRegionDomainPerfectRunQualification(streakState): RegionDomainPerfectRunQualification
```

`recordRegionDomainPlayResult` increments a region × domain's streak on a 100%-correct full-region Play round and resets it to zero on anything else; `PERFECT_RUN_STREAK_GOAL` (currently `2`) is the streak a region × domain must reach before `createRegionDomainPerfectRunQualification`'s predicate returns true. `AppStore` calls `recordRegionDomainPlayResult` from its four session-finish points (`advance`, `advanceMap`, `advanceOutline`, `advanceNeighbor` in `src/state/store.ts`) whenever `session.scope.kind === 'region'` and `session.mode === 'test'` — Learn rounds and continent/world/custom-scope Play rounds never touch the streak.

This deliberately replaced an earlier, pre-#56-removal design where the same predicate shape asked whether every country in a region individually qualified via `qualifiesForRegionMastery` (issue #29's scheduler threshold). `src/state/achievement-evidence-adapter.ts`, which adapted the four ledgers to that per-country predicate, has been deleted — it has no remaining purpose now that qualification is session-level. Per-country evidence (`qualifiesForRegionMastery`) is unaffected by this change and keeps doing exactly what #29 specified: scheduling, review and lapse tracking, plus feeding the separate `hasSuccessfulRetrieval()` "cleared" signal used by the ordinary progress bar.

## Persistent state

Earned state uses the independent key:

`flag-atlas:earned-achievements:v1`

Schema v1 persists only the milestone bits needed for the non-revocation contract:

- earned region × domain mastery keys;
- complete-region states;
- complete-continent states;
- World Crown state.

Country records, attempts, streaks, scheduler metadata and presentation data are not copied into achievement storage.

`migrateAchievementState()` is the versioned load boundary. Missing, malformed or unknown-version state defaults deterministically to an empty v1 state. Valid v1 identifiers are sanitised and deduplicated.

In-progress perfect-run streaks are a **separate** persisted concern, under their own independent key:

`flag-atlas:region-domain-perfect-run-streaks:v1`

`migratePerfectRunStreakState()` follows the same versioned-defaults-safely pattern, additionally clamping any stored streak count to a sane non-negative integer range so corrupted storage cannot fabricate an already-earned mastery on the next award pass. Once a region × domain is earned, its streak entry no longer has any effect (the earned bit in `EarnedAchievementState` is what's checked going forward, per the monotonic/idempotent award pass below).

## Awarding model

`awardEligibleAchievements()` is pure, monotonic and idempotent.

1. For each canonical region × domain, ask the perfect-run-streak qualification predicate whether that region × domain has reached the streak goal.
2. Add a previously unearned mastery when it qualifies.
3. Add complete-region prestige only when the region has genuine four-domain curriculum coverage and all four region-domain masteries have been earned.
4. Add continent completion only when every canonical region in that continent has complete four-domain curriculum and is complete.
5. Add the World Crown only when every continent has complete curriculum and has been completed.

Existing earned bits are never re-evaluated against a later streak state, so losing a streak (or the countries within it later lapsing under the scheduler) cannot revoke historical regional mastery.

## Unsupported curriculum guard

Scope membership and support come from the existing geography/support system:

- `scopeSupportsDomain()`;
- `supportedDomainsForScope()`;
- `countryIdsForSupportedScope()`;
- `scopeHasCompleteDomainCoverage()`.

There is no achievement-specific geography taxonomy.

A domain can earn region mastery when that region/domain curriculum is supported. Higher completion tiers make a stronger claim: **all four learning domains must genuinely exist for the scope**. Therefore a Flags-only region outside Africa can earn Flags mastery but cannot become a complete region.

Africa is currently the only continent that can satisfy the complete four-domain guard. Other continents cannot earn continent completion today, and `worldHasCompleteCurriculum()` is false, so the World Crown is currently unobtainable.

Neighbours continues to use its canonical supported target set, including the existing coverage exclusions for targets whose full adjacency cannot yet be represented.

## Application integration

`AppStore` owns the in-memory earned state and the in-memory streak state. It:

- loads and sanitises both achievement storage and streak storage after loading the four independent evidence ledgers;
- performs a backfill award pass for existing learners;
- records a full-region Play round's outcome against its streak, then re-runs the award pass, from each of the four session-finish points;
- persists the streak state whenever a full-region Play round finishes, and persists achievement state only when new milestones are earned;
- exposes the earned state plus pure region, continent and world read models (`getRegionAchievementReadModel`, `getContinentAchievementReadModel`, `getWorldAchievementReadModel` in `src/domain/achievements.ts`).

These read models now have a first UI surface: `src/ui/views/scope.ts`, `map-home.ts`, `outline-home.ts` and `neighbor-home.ts` thread the achievement state into their region rows (a purple mark via `isRegionDomainMasteryEarned` for that launcher's domain, a gold outline via `isRegionComplete`), and `src/ui/views/domain.ts` threads it into continent rows (a gold outline via `getContinentAchievementReadModel(...).crestEarned`). This is deliberately attached to the existing region/continent list rows rather than a revived dedicated Progress screen — no such screen exists. Exact continent-crest and world-Crown artwork remains open under #34's original art scope.

The four domain ledgers remain independent and retain their existing storage namespaces.

## Reset semantics

There is no learner-facing reset action. **Reset all progress** lived only on the Progress screen; when that screen was retired with no replacement UI, its store path (`AppStore.resetProgress()` and the sibling per-domain reset methods) and the infrastructure `reset*ProgressStorage()` functions were removed as dead code. `resetAchievementStorage()` and the sibling `resetPerfectRunStreakStorage()` remain as tested infrastructure primitives (clearing `flag-atlas:earned-achievements:v1` and `flag-atlas:region-domain-perfect-run-streaks:v1` respectively), but nothing in the shipped app currently calls either.

If Atlas later introduces a domain-only reset, it must not silently reuse this global reset path without a product decision about earned milestones.

## Presentation contract

Achievement logic does not contain colours, SVG paths or artwork decisions. The domain exposes:

- `getRegionAchievementReadModel()`;
- `getContinentAchievementReadModel()`;
- `getWorldAchievementReadModel()`.

These provide the stable state needed for the locked semantics in `DESIGN.md`: purple region-domain Mastery, restrained gold complete-region treatment, continent crest state using the existing generated continent silhouette infrastructure, and the Crown for genuine world completion only. The region/continent row surface described above consumes exactly these read models; it does not duplicate the underlying eligibility logic.
