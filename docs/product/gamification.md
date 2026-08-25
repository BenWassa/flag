# Atlas Gamification

**Status:** current v1 product contract

Atlas uses **scarce recognition**, not an activity economy. The system should reward demonstrated geographic competence without turning practice into XP farming, currency collection or badge spam.

## Hierarchy

`live country evidence → region × domain Mastery → complete region → complete continent → World Crown`

Country evidence is operational learning state. Prestige begins at the region × domain level.

## Ordinary progress

Routine progress is intentionally quiet. The shared blue progress strip represents targets with successful retrieval evidence; it is not a Mastery meter and does not expose scheduler punch-card counts.

The dedicated Progress screen is retired. Current progress appears inside Home, domain indexes, continent launchers and Results rather than in a separate achievement dashboard.

## Perfect round

A **Perfect round** is one Play result with no misses under that domain's native scoring rules.

It receives transient gold acknowledgement on Results. It does **not** create a persistent achievement and is not equivalent to Mastery.

## Region × domain Mastery

Mastery is the first persistent learner-facing prestige state. It is attached to one learner-facing region and one learning domain.

Current v1.0 implementation behaviour:

- only region-scoped Play results feed the Mastery streak;
- a perfect region-scoped Play increments the streak;
- a non-perfect region-scoped Play resets an unearned streak;
- two consecutive perfect region-scoped Play results award Mastery;
- once earned, Mastery is not revoked by later performance;
- Learn, Review, continent Play and World Play do not award region Mastery.

### Known qualification defect

The intended product rule is two consecutive perfect **complete-region** Play results. Current implementation does not yet verify complete-region target coverage before recording the streak.

Locations region Play is full-scope. Flags, Outlines and Neighbours currently default ordinary region Play to 10 targets, so regions with more than 10 eligible targets can earn Mastery from two perfect sampled rounds.

Issue **#108** owns restoring qualification integrity. Until it ships, v1 documentation must distinguish the actual region-scoped implementation from the stricter locked product intent.

## Complete region

A region becomes complete only when it has genuine non-empty curriculum in all four domains and all four region × domain Masteries have been earned.

Presentation is deliberately restrained:

- keep the region name and useful count;
- keep ordinary progress information;
- keep earned domain Mastery visibly purple;
- add gold completion treatment;
- do not add a separate region medal, crest, shield or Crown.

Unsupported curriculum never counts as automatically complete.

## Complete continent

A continent becomes complete only when every learner-facing region required by that continent has complete four-domain curriculum and every required region is complete.

Completed continent state is persistent. In production the completed continent row on a domain continent index replaces the ordinary geography silhouette with the shipped continent trophy/crest art and receives the completion row treatment.

The six trophy assets exist and are learner-facing when the corresponding completion state is earned. There is no separate full-screen continent ceremony in v1.

## World Crown

World completion is the highest prestige tier. There is no tier above the Crown.

The domain model and persistence layer support `worldCrown`, but it cannot currently be earned because North America and Oceania do not yet have complete four-domain curriculum. There is no v1 React learner-facing Crown surface or ceremony.

Do not show routine locked Crowns or decorative Crown repetition before the genuine state exists.

## Persistence

Earned Mastery/completion is monotonic under the current product model. Country evidence can later lapse or become due without revoking a historical earned achievement.

In-progress perfect-run streaks persist separately from earned achievements. A qualifying non-perfect region Play can reset an unearned streak; an earned achievement stays earned.

The current React product has no learner-facing full progress/achievement reset control. Storage reset helpers exist at infrastructure/test level only.

## What Atlas deliberately does not use

Do not introduce by default:

- XP;
- coins or currencies;
- lives;
- reward stores;
- arbitrary daily streak rewards;
- fantasy rank ladders;
- leaderboards;
- routine confetti;
- crowns on ordinary progress objects;
- country-level Mastered prestige;
- percentage completion as the prestige object after a region/continent is complete.

## Achievement presentation rules

- ordinary action/progress: Atlas Blue;
- correct/wrong: green/red;
- persistent region × domain Mastery: purple plus a non-colour cue;
- complete region: restrained gold treatment;
- complete continent: gold/purple trophy/crest state on continent index rows;
- World Crown: reserved singular highest-tier state, currently not rendered.

Prestige should become more visually distinctive as rarity increases, not more numerically dense.

## Deferred work

A milestone event queue or richer ceremony may be explored in a focused future issue, but it is not required to explain the current hierarchy and is not committed by this document.

A new Progress screen is not currently planned by the v1 product contract.
