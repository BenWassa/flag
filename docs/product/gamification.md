# Atlas Gamification

## Core principle

Gamification rewards **meaningful learning**, not every interaction.

The interface may feel tactile and playful, but prestige signals must remain scarce. The rarer the achievement, the more distinctive its visual treatment may become.

## Colour hierarchy

- Atlas Blue — ordinary navigation and action;
- Green / Red — transient answer feedback;
- Purple — durable region × domain mastery;
- Gold — completeness / prestige;
- Continent crest — major continent achievement;
- Crown — world completion only.

## Achievement hierarchy

### Country

Do not present an individual country as “mastered”.

Country-level records remain the underlying live learning evidence used by the scheduler.

### Region × domain

The first meaningful mastery unit is one domain learned across a complete region:

- Flags;
- Locations;
- Outlines;
- Neighbours.

In region lists, use four compact domain icons. Incomplete icons remain neutral; mastered competencies turn purple.

In a dedicated/expanded region context, a mastered competency may use a fuller icon-on-shield treatment.

Avoid shield-within-shield designs and excessive heraldry.

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

The exact animation/art direction is deferred to the visual-system work in #32.

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
- #35 — region-detail screen where cross-domain competency becomes visible;
- #32 — final visual language and milestone treatment.
