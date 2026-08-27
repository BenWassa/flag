# Learning Evidence and Mastery

**Status:** Atlas v1.0 learning/achievement contract

Atlas deliberately separates **live country learning evidence** from **persistent learner-facing achievement**.

That separation is the most important rule in this document:

> Country records decide what is known, weak, contradictory or due. Region × domain achievements decide what has been earned.

Do not use country scheduler state as a prestige label.

## Shared evidence vocabulary

The cross-domain evidence layer normalises four activity/outcome concepts while preserving each domain's native counters and task mechanics.

Activities:

- `learn`;
- `play` (stable internal `test` mode maps here);
- `review`.

Outcomes:

- `passive-exposure`;
- `assisted-retrieval`;
- `clean-retrieval`;
- `contradictory`.

The four domain ledgers remain independent.

## Current compatibility strength model

Internal records retain `unseen`, `learning` and `mastered` compatibility state. Learner-facing product language should treat this as learning evidence; the presentation concept is **Strong evidence**, not an individual-country Mastered achievement.

Current weighting in `src/domain/evidence.ts`:

- initial strong-evidence goal: 3 credits;
- clean Learn/Review retrieval: 1 credit;
- clean Play retrieval before any lapse: 2 credits;
- at most one strength-credit event per country per session;
- passive exposure: 0 strength credit;
- assisted retrieval: 0 clean strength credit;
- contradictory evidence resets the strength streak;
- if previously strong, contradictory evidence increments lapse count and returns the record to Learning;
- after a lapse, recovery goal is 2 credits and Play contributes only 1 credit so one assessment cannot erase contradictory evidence;
- a clean retrieval while already strong records retention evidence without creating another prestige object.

This algorithm is replaceable. Do not expose its raw `x/y` mechanics as a durable product promise.

## Domain evidence mapping

### Flags

Play/review recognition answers map clean correctness to clean retrieval and wrong recognition to contradictory evidence.

**Flags Learn gallery browsing/reveal creates no evidence at all.** The React study surface only changes ephemeral reveal state; it does not call the progress reducer.

### Locations

- first-try correct → clean retrieval;
- completion after misses → assisted retrieval;
- reveal after the retry budget → passive exposure for the resolved target;
- wrong selections remain contradictory evidence in the domain-native history.

### Outlines

- clean recognition → clean retrieval;
- wrong recognition → contradictory evidence.

Learn provides immediate feedback; Play remains scored retrieval.

### Neighbours

- complete neighbour set with no wrong guesses → clean retrieval;
- completed set after wrong guesses → assisted retrieval;
- exhausted/revealed resolution → passive exposure;
- wrong guesses remain contradictory evidence.

A verified empty land-neighbour set is a legitimate learnable answer where the target is supported.

## Ordinary progress

The ordinary launcher/Home progress strip uses successful retrieval, not strong/mastered scheduler status. `hasSuccessfulRetrieval(...)` returns true after any clean Learn, Play, Review or migrated legacy scored retrieval.

This keeps routine progress understandable without turning every country into a prestige unit.

## Due for review

Due-state is live evidence, not an achievement state. Flags and Outlines currently have the scheduler fields used by the due selector. Locations and Neighbours do not currently expose equivalent `nextReviewAt` scheduling semantics.

An earned region achievement may remain earned while one of its countries later becomes due or lapses. That is intentional under the current product model.

## Learner-facing region × domain Mastery

Country evidence does **not** currently qualify region × domain Mastery.

The v1 earned-achievement path is driven by persisted region-scoped Play perfect-run streaks in `src/domain/achievements.ts`, not by aggregating `status === 'mastered'` records or by `qualifiesForRegionMastery(record)`.

`qualifiesForRegionMastery(record)` remains in `src/domain/evidence.ts` as a compatibility-named country-strength selector, but it is **not the current earned-achievement qualification seam**. New achievement code must not infer current Mastery semantics from that historical function name.

### Current implementation rule

For an unearned region × domain:

1. complete a Play result whose scope kind is `region`;
2. if the result has no misses, increment that region/domain perfect-run streak;
3. if it has a miss, reset that streak to zero;
4. on two consecutive perfect region-scoped Play results, persist the Mastery achievement;
5. once earned, later evidence or round results do not revoke it.

Learn, Review, continent Play and World Play do not feed this streak.

### Complete-region coverage integrity (#108)

The product requirement is that the two qualifying results cover the **entire current supported region target set**, and issue **#108** made that true.

- Ordinary region Play covers the complete region in every domain. Locations already built its session from the full scope; Flags, Outlines and Neighbours now launch at full coverage instead of 10 targets.
- "Complete supported target set" is each domain's own answer, captured from the launch: countries in scope for Flags, the loaded asset's countries for Locations, countries in scope with generated geometry for Outlines, and eligible adjacency targets for Neighbours. Neighbours defers targets whose adjacency is incomplete, so measuring against the curriculum instead would have made its Mastery unreachable.
- The achievement recorder checks region scope, perfect outcome **and** set-equal coverage of that captured set. A round launched at a smaller size is measured against the whole region and does not qualify.
- A round that is not full-region evidence cannot reset a streak either, so practising a short sample never destroys progress the learner earned.

Mastery already awarded under the looser rule stays awarded: earned mastery is persistent under the current model, and #108 changes what qualifies from now on rather than re-auditing history.

## Perfect round versus Mastery

These are intentionally different concepts.

**Perfect round**:

- one Play result;
- no misses under the domain's native scoring rule;
- shown transiently on Results;
- not persisted as prestige;
- can occur at non-region scopes.

**Region × domain Mastery**:

- persistent achievement;
- region scope only;
- current engine requires two consecutive perfect region-scoped Play results;
- requires two consecutive perfect complete-region results;
- exposed as explicit Mastered wording on compact region rows without requiring a repeated purple star; dedicated Mastery presentation continues to reserve purple.

Never use the phrases interchangeably.

## Higher-tier completion

A complete region requires all four domain Masteries and genuine four-domain curriculum. A complete continent requires all required learner-facing regions to have complete curriculum and be complete. World completion requires all six continents to have complete curriculum and be complete.

Unsupported/empty curriculum never satisfies a requirement by absence.

See `../architecture/earned-achievements.md` for persistence and aggregation details.

## Persistence and migration

The four learning ledgers retain their independent stable LocalStorage namespaces and current versioned payloads. Evidence migrations preserve known historical information without inventing whether a legacy retrieval was Learn or Play when that cannot be reconstructed.

Earned achievements and region-perfect-run streaks persist separately from country evidence.

Current product semantics are monotonic for earned achievement: learning evidence can change; historical earned Mastery/completion does not automatically disappear.

## Reset boundary

Infrastructure exposes reset helpers for the separate storage namespaces, but the current React UI exposes no learner-facing coordinated full reset.

A future reset feature must treat learning ledgers, earned achievements and perfect-run streaks deliberately; silently clearing only one layer would create contradictory product state.

No reset feature is specified or implemented by this document.
