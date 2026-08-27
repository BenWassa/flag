# Earned Achievements Architecture

**Status:** current Atlas v1.0 achievement architecture

## Boundary

Earned achievements are a persistence layer **above** live country learning evidence.

Country ledgers may strengthen, lapse or become due. Earned region/domain Mastery and higher completion state are separate, monotonic product achievements under the current model.

The current achievement qualification path is based on **region-scoped Play perfect-run streaks**, not aggregation of country scheduler status.

## Persisted state

`EarnedAchievementState` persists:

- `regionDomainMasteries`;
- `completeRegions`;
- `completeContinents`;
- `worldCrown`.

`PerfectRunStreakState` separately persists the in-progress perfect-run count for each region × domain.

Stable namespaces:

- `flag-atlas:earned-achievements:v1`;
- `flag-atlas:region-domain-perfect-run-streaks:v1`.

Persistence sanitises known region/domain keys and known continent IDs. Unknown schema versions start empty rather than fabricating achievements from unrelated country records.

## Region × domain qualification

The canonical engine constant is currently two perfect runs.

For a completed **region-scoped Play** result:

- perfect → increment the region/domain streak;
- non-perfect → reset the unearned streak to zero;
- streak ≥ 2 → that region × domain qualifies;
- once the achievement is already earned, later evidence/round results do not revoke it.

Learn, Review, continent Play and World Play do not feed this streak.

### Known v1 qualification-integrity bug

The achievement recorder currently trusts region scope and a perfect result; it does not verify that the result's target set equals the complete supported region target set.

That matters because current launch behaviour differs by domain:

- Locations region Play is full-scope;
- Flags region Play defaults to 10 questions;
- Outlines region Play defaults to 10 questions;
- Neighbours region Play defaults to 10 targets.

Issue **#108** closed the former sampled-round defect. Flags, Outlines,
Locations and Neighbours now require two perfect complete-region Play results,
with exact supported-target coverage verified before the streak advances.

Do not hide this defect in architecture documentation or work around it in UI presentation.

## Country evidence is not the achievement seam

`src/domain/evidence.ts` still exports `qualifiesForRegionMastery(record)`, a historical compatibility name for the per-country strong-evidence selector. The current `src/domain/achievements.ts` award path does **not** consume that selector.

New achievement integration must use the canonical perfect-run/achievement state rather than reintroducing direct country-status aggregation.

## Complete region

A region is eligible for complete-region achievement only if `scopeHasCompleteDomainCoverage(...)` is true: every one of the four learning domains has real, non-empty supported curriculum for that learner-facing region.

The region is complete when all four corresponding region × domain Mastery achievements are earned.

The requirement is the fixed product set:

- Flags;
- Locations;
- Outlines;
- Neighbours.

It is not “all domains that happen to be supported”. Missing curriculum blocks completion.

## Complete continent

A continent is eligible only if it has at least one learner-facing region and **every required learner-facing region** has complete four-domain curriculum.

The continent becomes complete when every required learner-facing region is complete.

Asia uses the learner-facing scope set from `src/data/learning-scopes.ts`; the compatibility `west-asia` taxonomy scope remains available for migration/canonical purposes but is not a new learner-facing completion requirement where the newer Middle East/Caucasus learning scopes supersede it.

Current complete four-domain geography exists for Africa, South America, Europe and Asia. North America and Oceania do not yet satisfy the curriculum gate.

## World completion

World completion requires:

1. all six continents to have complete curriculum; and
2. all six continent-completion achievements to be earned.

The `worldCrown` state therefore cannot currently be earned because North America and Oceania are incomplete in Locations/Outlines/Neighbours.

There is no learner-facing React World Crown renderer in v1. The state and read model exist; presentation remains reserved for genuine future world completion.

## Awarding properties

`awardEligibleAchievements(...)` is designed to be:

- monotonic — earned bits are retained;
- idempotent — re-evaluation does not duplicate awards;
- support-aware — empty/unsupported curriculum cannot fabricate completion;
- hierarchy-aware — higher tiers consume persisted lower-tier achievements rather than UI state.

`NewlyEarnedAchievement[]` is returned by the award pass, but current application callers do not surface a dedicated milestone event queue/ceremony. That is optional future product work, not a missing persistence rule.

## React presentation integration

Production presentation is React-owned.

Current learner-facing achievement surfaces are:

- region launcher rows: purple Mastery mark/label;
- complete region rows: restrained gold completion treatment;
- domain continent indexes: completed continent row uses the dedicated continent trophy/crest artwork in place of the normal silhouette.

There is no dedicated Progress screen, no separate region badge/crown, no full-screen continent trophy ceremony and no World Crown surface in current v1 production.

Legacy `src/ui/views/*` renderer modules are verifier compatibility fixtures after the React/Vite migration; they are not production achievement surfaces.

## Trophy assets

`src/react/assets/continent-trophies/` contains dedicated artwork for Africa, Asia, Europe, North America, Oceania and South America. `ContinentTrophy` resolves those assets, and completed `ContinentRow` presentation renders the trophy on the domain continent index.

Asset existence and learner-facing rendering are therefore both shipped for completed continents. This should not be confused with a separate ceremony/splash, which does not ship.

## Reset semantics

Storage infrastructure exposes explicit helpers to remove earned-achievement and perfect-run-streak namespaces. These establish the semantics required by a hypothetical full learner reset.

The current React product does **not** expose a learner-facing full reset action. The old Progress-screen reset surface was retired with that screen.

If a future reset is added, it must coordinate all four learning ledgers plus earned achievements and in-progress perfect-run streaks so the product cannot enter contradictory mixed-reset state.

## Verification ownership

Achievement verification should cover:

- two-perfect streak threshold;
- reset after a non-perfect qualifying region Play;
- non-revocation after award;
- fixed four-domain region completion;
- continent aggregation across learner-facing regions;
- current Africa/South America/Europe/Asia curriculum eligibility;
- North America/Oceania/world incompleteness;
- persistence sanitisation and idempotency;
- #108 full-target-set qualification, shipped in `046bd93`.

Country evidence weighting/migration remains owned by the learning-evidence tests. The achievement suite must not silently couple itself back to raw country scheduler fields.
