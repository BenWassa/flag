# Earned achievement architecture

## Purpose

Atlas keeps **live country evidence** and **earned achievement state** separate.

- Country evidence belongs to each learning domain and may strengthen, lapse or be revalidated.
- Earned achievements begin at region × domain and are historical milestones. Once earned, they remain earned until the learner explicitly resets progress.

Issue #29 owns the final definition of whether a country's current evidence qualifies toward mastery. This architecture does not duplicate that rule.

## Qualification seam

`src/domain/achievements.ts` depends only on:

```ts
type CountryEvidenceQualification = (
  domain: LearningDomain,
  countryId: string,
) => boolean;
```

The temporary pre-#29 implementation lives in `src/state/achievement-evidence-adapter.ts`. It adapts the four current ledgers to that predicate and is the only #34 code that understands the legacy country status representation.

After #29 merges, rebase #34 and replace this adapter with #29's canonical evidence selector. Do not change achievement thresholds or create a second evidence model.

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

## Awarding model

`awardEligibleAchievements()` is pure, monotonic and idempotent.

1. For each canonical region × domain, ask the qualification predicate about every country in the canonical supported scope.
2. Add a previously unearned mastery when every required country qualifies.
3. Add complete-region prestige only when the region has genuine four-domain curriculum coverage and all four region-domain masteries have been earned.
4. Add continent completion only when every canonical region in that continent has complete four-domain curriculum and is complete.
5. Add the World Crown only when every continent has complete curriculum and has been completed.

Existing earned bits are never re-evaluated against later live evidence, so a country lapse cannot revoke historical regional mastery.

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

`AppStore` owns the in-memory earned state. It:

- loads and sanitises achievement storage after loading the four independent evidence ledgers;
- performs a backfill award pass for existing learners;
- re-runs the award pass after an evidence-changing answer in any domain;
- persists only when new milestones are earned;
- exposes the earned state plus pure region, continent and world read models (`getRegionAchievementReadModel`, `getContinentAchievementReadModel`, `getWorldAchievementReadModel` in `src/domain/achievements.ts`) for future UI consumption; no current screen renders them, since the Progress screen that did has been retired.

The four domain ledgers remain independent and retain their existing storage namespaces.

## Reset semantics

There is no learner-facing reset action. **Reset all progress** lived only on the Progress screen; when that screen was retired with no replacement UI, its store path (`AppStore.resetProgress()` and the sibling per-domain reset methods) and the infrastructure `reset*ProgressStorage()` functions were removed as dead code. `resetAchievementStorage()` remains as a tested infrastructure primitive (clears `flag-atlas:earned-achievements:v1`), but nothing in the shipped app currently calls it.

If Atlas later introduces a domain-only reset, it must not silently reuse this global reset path without a product decision about earned milestones.

## Presentation contract

Achievement logic does not contain colours, SVG paths or artwork decisions. The domain exposes:

- `getRegionAchievementReadModel()`;
- `getContinentAchievementReadModel()`;
- `getWorldAchievementReadModel()`.

These provide the stable state needed for the locked semantics in `DESIGN.md`: purple region-domain Mastery, restrained gold complete-region treatment, continent crest state using the existing generated continent silhouette infrastructure, and the Crown for genuine world completion only.

Issue #42 can consume these selectors after #34 is rebased onto post-#29 `main`; #34 does not modify the active #42 branch.
