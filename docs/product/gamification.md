# Atlas Gamification

## Core principle

Gamification rewards **meaningful learning**, not every interaction.

The interface may feel tactile and playful, but prestige signals must remain scarce. The rarer the achievement, the more distinctive its visual treatment may become.

## Colour hierarchy

- Atlas Blue — ordinary progress and navigation;
- Green / Red — transient answer feedback;
- Purple — durable region × domain mastery;
- Gold — completeness / prestige;
- Continent crest — major continent achievement;
- Crown — world completion only.

Ordinary progress (the bar on continent/region rows) is a single Atlas Blue fill against a neutral track. It never segments into a second colour for partially-seen material, never prints a raw evidence taxonomy (strong/learning/unseen counts), and never borrows purple or gold. A country's share of that fill counts the moment it has been answered correctly once — the scheduler may keep asking for more evidence underneath for its own review purposes, but the visible bar answers "how much of this have I cleared", not "how many countries currently satisfy the scheduler's strong-evidence threshold".

## Achievement hierarchy

### Country

Do not present an individual country as “mastered”. A country's only visible state is whether it has contributed to the region's blue "cleared" progress (see above) — there is no per-country purple, gold, or numeric evidence badge.

Country-level records remain the underlying live learning evidence used by the scheduler.

### Region × domain

The first meaningful mastery unit is one domain learned across a complete region:

- Flags;
- Locations;
- Outlines;
- Neighbours.

Mastery is earned by **two consecutive 100%-correct full-region Play rounds** in that domain, not by accumulating per-country scheduler evidence. A single perfect round earns a one-off "Perfect round" result-screen ceremony (restrained gold accent, not the permanent purple mark); it takes a second perfect round in a row to earn the durable region × domain mastery mark. A non-perfect round in between resets that domain's streak.

Today this ships as a small purple mark beside the region's name on its existing region row, scoped to whichever single domain that launcher is already showing (there is no cross-domain region card yet — see #35/Progress). A unified region card showing all four compact domain icons side by side, or a fuller icon-on-shield treatment in an expanded context, remains open future work; avoid shield-within-shield designs and excessive heraldry when it is built.

### Region complete

A region is complete when all required supported domain competencies are mastered.

Keep useful scope information such as `17 countries`.

Do not replace it with `100%` or `17/17`.

Use a restrained gold accent or border only. Do not add a region emblem, medal or crown.

### Continent complete

Completing every required region/domain within a continent earns a prominent **continent crest** based on the continent silhouette.

Continents do not need completion quantities.

The crest should use restrained purple/gold treatment and remain materially rarer than region completion styling.

### World complete

World completion is the ultimate achievement.

Reserve the **Crown** for this state alone: one Crown, one highest status.

Do not add a higher achievement tier above it.

## Persistence

Earned mastery/completion is acquired and not lost in the current product model.

This does **not** require live country learning evidence to become immutable. The scheduler may later re-evaluate confidence, due status or lapses independently.

Future rules for achievement revalidation/decay are a separate product decision.

## Scarcity rules

- Purple can become reasonably common as the learner masters more regional competencies.
- Gold must remain substantially scarcer.
- Continent crests are rare.
- The Crown is singular and ultimate.

Do not reuse prestige symbols decoratively.

## Interaction intensity

### Ordinary interaction

Responsive and tactile, without reward ceremony.

### Correct / wrong

Clear, crisp and immediate. Green/red feedback should resolve the task without feeling like an achievement unlock.

### Mastery / completion

A stronger transition is appropriate when a regional mastery or higher-order completion is first earned.

The exact achievement animation/art direction is deferred to #34. Issue #32 supplies the implemented base interaction and motion language.

## What Atlas does not use

Do not add by default:

- XP;
- coins;
- lives as a retention mechanic;
- arbitrary activity streak rewards;
- generic achievement spam;
- loot/reward economies;
- fantasy rank ladders;
- crowns on ordinary learning objects;
- confetti for routine correct answers.

If a future mechanic is proposed, it must support learning or meaningful retention rather than simply increase engagement metrics.

## Product rationale

The system separates **qualification/competence** from **prestige**:

- mastering a region/domain says the learner can demonstrate a coherent body of knowledge;
- completing all domains in a region says that geographic scope is comprehensive;
- a continent crest recognises unusually broad completion;
- the Crown recognises complete world coverage.

This prevents small achievements from borrowing the visual language of the rarest achievements.

## Related work

- #29 — live country learning evidence and Learn/Play mechanics;
- #34 — persistence and implementation of mastery/completion hierarchy;
- #35 — region card where cross-domain competency becomes visible (no separate region-detail screen);
- #32 — implemented Tactile Atlas base visual language;
- #34 — earned mastery persistence and milestone artwork/treatment.
