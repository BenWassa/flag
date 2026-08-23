# Atlas Learning Evidence and Mastery

## Purpose

Atlas separates **live country-level learning evidence** from **earned mastery/completion**.

This distinction keeps the learning engine rich enough to support later scheduler refinement without turning every country into a prestige achievement.

Issue #29 owns live evidence. Issue #34 owns persistent earned mastery.

## Country-level live evidence

Country is the atomic evidence unit inside each learning domain.

Every domain retains its native counters and outcome history, while a narrow shared evidence summary normalises the parts that cross domain boundaries:

- passive exposure;
- assisted/corrective retrieval;
- clean Learn retrieval;
- clean Play assessment;
- later review retrieval;
- legacy scored retrieval whose historical Learn/Play mode is unknowable;
- contradictory evidence;
- retention success;
- timestamps for the latest evidence/scored evidence/strong-evidence state.

The shared summary is deliberately not a replacement for domain-native records. Locations still know about misses and reveals; Neighbours still know about complete sets and wrong guesses; Flags/Outlines still retain recognition/confusion history.

## Compatibility scheduler state

The current scheduler keeps the stable internal status values:

- `unseen`
- `learning`
- `mastered`

`mastered` is an internal compatibility value meaning the current evidence qualifies as strong. Learner-facing country UI calls this **Strong evidence**.

The compatibility strength-credit rule is currently:

- clean Learn retrieval: `+1` credit per session;
- clean Play assessment before any lapse: `+2` credits per session;
- initial strong-evidence threshold: `3` credits;
- after contradictory evidence has lapsed a strong record: recovery threshold `2` credits;
- post-lapse clean Play contributes only `+1`, so one assessment cannot erase contradictory evidence;
- repeated answers in the same session cannot farm additional strength credit.

These values are intentionally hidden behind `src/domain/evidence.ts`. They are scheduler implementation details, not product copy.

## Shared evidence events

`src/domain/evidence.ts` defines the normalised event vocabulary:

- `passive-exposure`
- `assisted-retrieval`
- `clean-retrieval`
- `contradictory`

with activities:

- `learn`
- `play`
- `review`

The event reducer updates the shared evidence summary and the compatibility strength state. Domain engines update their richer native counters around that reducer.

### Passive exposure

Passive browse/reveal is retained as exposure history but creates no scored retrieval evidence and no strength credit.

A country may therefore have passive exposure while remaining internally `unseen`, because `unseen` now means **no scored evidence yet**, not literally never displayed.

This is the contract Issue #30 can use for the future Flags browse/reveal gallery.

### Assisted retrieval

Assisted/corrective retrieval creates learning evidence and moves an `unseen` record into `learning`, but it does not create clean strength credit.

### Clean retrieval

Clean retrieval is the qualifying evidence path. Learn and Play can weight it differently; Play is diagnostic assessment and can calibrate already-known material faster where there is no contradictory history.

### Contradictory evidence

A wrong scored retrieval is retained rather than overwritten by later success.

It:

- increments contradiction/native confusion history;
- resets current strength credit;
- moves a strong record back to `learning`;
- increments lapse count when the contradiction occurs against a currently strong record.

Historical strong evidence remains in the stored evidence history even though the current selector no longer qualifies the country until recovery.

### Review / retention

A later clean retrieval against an already-strong record is retained separately as review/retention evidence. Flags/Outlines also continue to maintain their current review scheduling timestamps.

## Domain mappings

The four domains intentionally map native outcomes differently.

| Domain | Native outcome | Shared evidence |
| --- | --- | --- |
| Flags | future browse/reveal | passive exposure |
| Flags | clean recognition | clean retrieval |
| Flags | incorrect recognition | contradictory |
| Locations | first try | clean retrieval |
| Locations | correct after one/two misses | assisted retrieval |
| Locations | reveal after misses | passive exposure, with the preceding misses retained as contradictory evidence |
| Locations | Play incorrect | contradictory |
| Outlines | clean first-try recognition | clean retrieval |
| Outlines | incorrect recognition | contradictory |
| Neighbours | clean complete neighbour set | clean retrieval |
| Neighbours | complete set after wrong guesses | assisted retrieval, with wrong guesses retained as contradictory evidence |
| Neighbours | exhausted/revealed set | passive exposure, with wrong guesses retained as contradictory evidence |

A partial correct Neighbours guess is still retained in the native live session. Shared country-level qualification is decided when the set resolves, because set completeness is the meaningful domain outcome.

## Learn and Play

### Learn

Learn is familiarisation and corrective practice.

It can include passive exposure, assisted retrieval and clean retrieval. Passive exposure alone does not create scored evidence.

For Flags and Outlines, a clean correct answer now keeps the learner's focus/thumb in the answer surface: the correct answer becomes the continue control instead of requiring a detached Next button. Wrong answers retain explicit corrective feedback before continuing.

Flags' eventual browse/reveal gallery remains Issue #30 and is not implemented by #29.

### Play

Play is scored retrieval and assessment.

A clean Play result is stronger evidence than an ordinary clean Learn result before any lapse, allowing already-known material to calibrate faster. Contradictory evidence remains authoritative enough that one later clean Play result cannot immediately erase a lapse.

Stable internal route/activity identifiers may continue to use `test`; learner-facing language is **Play**.

## Country is not a prestige tier

Do not tell the learner they have “mastered Ghana” merely because one domain's current evidence is strong.

Country evidence is operational. Routine country UI should use concepts such as:

- Unseen
- Learning
- Strong evidence
- Due for review

Do not expose scheduler punch cards such as `1/3`, `2/3` or the post-lapse `0/2` threshold in routine UI.

## Critical contract for earned regional Mastery

Issue #34 must not inspect raw storage fields or hard-code today's `record.mastered`/`status` representation.

The evidence layer exposes:

```ts
qualifiesForRegionMastery(record)
hasSuccessfulRetrieval(record)
```

`qualifiesForRegionMastery` answers a UI-independent question about one country's accumulated evidence:

> Does this country's current evidence qualify as strong (the compatibility scheduler's multi-exposure threshold)?

It continues to drive per-country scheduling/review (`due-for-review`) and the `strong` bucket of `countryEvidenceState`. It is **not** the region × domain mastery gate (see below).

`hasSuccessfulRetrieval` answers a cheaper, presentation-only question:

> Has this country ever been retrieved correctly at least once?

This is what the ordinary progress bar shows as **cleared** (a single blue fill, no brown/segmented "learning" state, no visible strong/learning/unseen counts). One correct answer is enough to count as cleared; the country's richer evidence state keeps accumulating underneath for scheduling purposes only.

## Region × domain mastery

Learner-facing **Mastery** means the learner has demonstrated one complete domain across an entire region.

Examples:

- West Africa — Flags mastered;
- West Africa — Outlines mastered;
- West Africa — Locations mastered;
- West Africa — Neighbours mastered.

**Mastery is not gated on per-country evidence.** It is earned by **two consecutive 100%-correct full-region Play rounds** in that domain — a single perfect round is not enough, and any non-perfect full-region Play round resets that region × domain's streak to zero. This is deliberately a session-level signal rather than an aggregation of `qualifiesForRegionMastery` across every country in the region: a learner can get one perfect Play round largely through luck/short-term recall, but two in a row is a meaningfully stronger claim, and it gives the achievement a legible, game-like trigger ("West Africa — 17/17. Perfect.") rather than a hidden accumulation of scheduler credit.

`src/domain/achievements.ts` implements this as:

```ts
recordRegionDomainPlayResult(streakState, regionId, domain, wasPerfect)
createRegionDomainPerfectRunQualification(streakState)
```

`recordRegionDomainPlayResult` is called once per finished full-region-scope Play round (never for Learn, and never for a continent/world/custom-scope round) from `src/state/store.ts`'s four session-finish points. The resulting `PerfectRunStreakState` is persisted independently of `EarnedAchievementState` under `flag-atlas:region-domain-perfect-run-streaks:v1` (`src/infrastructure/achievement-storage.ts`), following the same versioned-migration pattern as earned achievements. `awardEligibleAchievements` (below) keeps its existing region-domain → complete-region → continent-crest → world-crown cascade; only the region × domain leaf's qualification source changed.

Per-country evidence (`qualifiesForRegionMastery`) is still collected and still useful — it drives scheduling, review, lapses, and the ordinary "cleared" progress display — it simply no longer gates this achievement.

## Earned state vs live state

Once earned, region/domain mastery remains earned in the current product model.

The live scheduler may later decide that individual countries need review or have lapsed without silently revoking the earned achievement.

This gives Atlas two truths at once:

- **historical achievement:** the learner has previously demonstrated the complete competency;
- **current learning evidence:** some parts may now deserve review.

A future product decision may introduce explicit revalidation/decay for earned achievements, but the current achievement model does not.

## Aggregation

The achievement hierarchy is:

1. country evidence — live, non-prestige;
2. region × domain — Mastery;
3. all required region domains — complete region;
4. all required regions/domains — complete continent / crest;
5. complete world — Crown.

Unsupported curriculum must never count as automatically complete.

Africa is currently the first continent capable of reaching the full four-domain model. Region × domain mastery and region completion now have a first learner-facing surface (a purple mark on the mastered region row, a restrained gold outline on a complete region row) attached to the existing region/continent launcher rows; exact continent-crest and world-Crown artwork remains open under #34.

## Persistence and migration

Region × domain mastery's perfect-run streaks are a separate persisted concern from earned achievements, versioned and migrated the same way under `flag-atlas:region-domain-perfect-run-streaks:v1` (`src/infrastructure/achievement-storage.ts`). See "Region × domain mastery" above.

Issue #29 changes all four persisted country ledgers to payload schema `version: 2` while deliberately retaining the existing storage-key namespaces:

- `flag-atlas:progress:v1`
- `flag-atlas:outline-progress:v1`
- `flag-atlas:location-progress:v1`
- `flag-atlas:neighbor-progress:v1`

The `:v1` suffix is therefore a stable namespace identifier, not the payload schema version.

Loaders accept old payload `version: 1` and new payload `version: 2`; every successful load returns the v2 in-memory shape and the next save persists v2.

Migration rules are deterministic and conservative:

- existing `mastered` records remain strong/qualifying;
- existing lapse, confusion, correct/incorrect, reveal and completion counts are preserved;
- old clean scored retrievals are stored as `legacyScoredRetrievals` when their historical Learn/Play mode cannot be known;
- migration does not fabricate old Play evidence;
- domain ledgers and attempt namespaces remain independent.

## Verification

`scripts/verify-learning-evidence.mjs` covers:

- passive exposure creates no scored evidence;
- assisted retrieval differs from clean retrieval;
- clean Play is stronger before lapse;
- already-known material can calibrate faster through clean assessment;
- lapse/contradictory evidence is retained;
- one post-lapse Play cannot erase a lapse;
- review/retention evidence is retained;
- Locations and Neighbours preserve their native outcome semantics;
- v1 records migrate without loss or invented Learn/Play history;
- domain ledgers remain independent;
- `qualifiesForRegionMastery` is deterministic;
- routine UI does not expose country Mastered language or scheduler x/y punch cards;
- clean Flags Learn keeps continuation in the answer surface.

`npm test` runs `npm run check`, the production build and the complete verification suite on Node 22 CI.

## Related issues

- #29 — live evidence model and Learn/Play weighting;
- #34 — persistent earned mastery/completion;
- #35 — cross-domain competency on the region card;
- #30 — Flags-specific Learn gallery;
- #42 — separate Progress redesign; #29 changes only the semantic copy required by this evidence contract.
