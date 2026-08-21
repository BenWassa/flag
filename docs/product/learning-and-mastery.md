# Atlas Learning Evidence and Mastery

## Purpose

Atlas separates **live learning evidence** from **earned mastery/completion**.

This distinction keeps the backend rich enough to support better learning science later without making the learner-facing achievement system noisy or brittle.

## Country-level live evidence

Country is the atomic evidence unit inside each learning domain.

Country records may track or derive:

- whether scored retrieval evidence exists;
- current confidence/learning state;
- clean first-try outcomes;
- assisted/corrective outcomes;
- Play/assessment outcomes;
- response speed;
- confusion history;
- due/review state;
- lapse/contradictory evidence;
- retention history.

The exact scheduler may evolve.

Stable internal values such as `unseen`, `learning`, and `mastered` may remain for migration/backwards compatibility even if learner-facing terminology changes.

## Country is not a prestige tier

Do not tell the learner they have “mastered Ghana” merely because one domain's internal record is strong.

One country is too small a body of knowledge to carry Atlas's prestige language.

Country evidence is operational: it helps Atlas decide what to show, what to review and whether a larger regional competency has been demonstrated.

## Region × domain mastery

Learner-facing **Mastery** means the learner has demonstrated one complete domain across a region.

Examples:

- West Africa — Flags mastered;
- West Africa — Outlines mastered;
- West Africa — Locations mastered;
- West Africa — Neighbours mastered.

The exact evidence threshold for earning a regional mastery should be derived from the domain's country evidence, not duplicated in UI code.

## Earned state vs live state

Once earned, region/domain mastery remains earned in the current product model.

The live scheduler may later decide that individual countries need review or have lapsed without silently revoking the earned achievement.

This gives Atlas two useful truths at once:

- **historical achievement:** the learner has previously demonstrated the complete competency;
- **current learning evidence:** some parts may now deserve review.

A future product decision may introduce explicit revalidation/decay for earned achievements, but v1 does not.

## Learn evidence

Learn is domain-appropriate familiarisation/corrective practice.

Passive exposure does not create scored evidence.

Where Learn includes retrieval, assisted/corrective and clean first-try outcomes can contribute differently.

Do not force every domain to generate identical evidence events.

## Play evidence

Play is clean scored retrieval/assessment.

Play may produce stronger evidence than ordinary corrective Learn and may calibrate already-known material more quickly.

Avoid hard-coding one global `three correct rounds` rule into learner-facing copy. The backend should support weighted/quality-aware evidence so thresholds can change later without another product redesign.

## Domain-specific outcome examples

### Flags

- clean first-try recognition;
- incorrect recognition.

### Locations

- first-try location;
- correct after misses;
- reveal;
- Play incorrect.

### Outlines

- clean first-try silhouette recognition;
- incorrect recognition.

### Neighbours

- clean complete neighbour set;
- complete with wrong guesses;
- exhausted/revealed set.

These should map into shared evidence concepts while preserving domain-specific meaning.

## Aggregation

The achievement hierarchy is:

1. country evidence — live, non-prestige;
2. region × domain — Mastery;
3. all required region domains — complete region;
4. all required regions/domains — complete continent / crest;
5. complete world — Crown.

Unsupported curriculum must never count as automatically complete.

Africa is currently the first continent capable of reaching the full four-domain model once the achievement implementation ships.

## Persistence

- preserve existing learner data;
- keep domain-specific ledgers independent;
- migrate stored shapes deterministically when needed;
- preserve stable storage namespaces unless a migration has clear product value;
- keep earned achievement records separate enough that future scheduler changes cannot accidentally delete them.

## User-facing presentation

Avoid exposing the scheduler as `1/3`, `2/3`, or similar punch-card progress in routine interfaces.

Before regional mastery, show only the information that helps the learner decide what to practise.

After mastery, the purple competency mark communicates the earned state.

Keep region country counts because they describe scope size, not achievement progress.

## Related issues

- #29 — refine the live evidence model and Learn/Play weighting;
- #34 — implement persistent earned mastery/completion;
- #35 — expose cross-domain competency on the region card;
- #30 — Flags-specific Learn surface.
