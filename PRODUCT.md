# Atlas Product

<!-- impeccable:product-schema 1 -->

## Product identity

**Atlas** is a mobile-first geography-learning PWA built around four learning domains:

- **Flags**
- **Locations**
- **Outlines**
- **Neighbours**

The product should feel fast, direct and progressively disclosed. Geography remains the main content; the interface exists to make learning and assessment frictionless.

The repository and some stable internal identifiers still use legacy `flag` / `flag-atlas` names. Those are compatibility details, not learner-facing brand guidance.

## Product purpose

Atlas helps learners build reliable geographic knowledge at region, continent and world scale.

The core loop is:

**choose geography → choose Learn or Play → practise/retrieve → update live learning evidence → earn broader mastery when the body of knowledge is complete**

The product should reward meaningful learning rather than activity volume.

## Geography hierarchy

The durable geographic hierarchy is:

**World → Continent → Region**

The region is the first meaningful cross-domain learning unit, so it must always surface its four domains together — as direct domain-launch shortcuts on the region's card in the continent surface, not through a separate region-detail screen.

Country remains the canonical data identity and the atomic evidence unit underneath the learning engines, but country is not a learner-facing prestige tier.

Conventional learning scopes may eventually overlap canonical continent/subregion classification where pedagogically useful, as documented by the Middle East work in #28.

## Learning domains

### Flags

Recognise a country from its national flag.

Flags currently supports the full 195-country curriculum.

### Locations

Identify countries from their true map location.

Current production coverage is Africa-first.

### Outlines

Identify countries from their silhouette/outline.

Current production coverage is Africa-first and reuses canonical production geometry.

### Neighbours

Identify all direct land-border neighbours of a target country.

Current production coverage is Africa-first and uses adjacency derived from canonical topology.

Stable internal identifiers retain American spelling where required for compatibility (`neighbors`, `/neighbors`, storage keys, filenames/types).

## Africa-first rollout

Africa is the first complete production proving ground for all four learning domains.

Other continents should be allowed to exist as navigational/product shells where useful for design and IA testing, but unsupported domains must be represented honestly and must not contribute to completion.

Issues #22–#27 own the remaining continent expansion work. World-level completion is therefore part of the product model before it is technically obtainable.

## Learn and Play

### Learn

Learn is for familiarisation and corrective practice.

Its exact mechanic may differ by domain. Passive browse/reveal can be appropriate where it improves initial encoding, but passive exposure does not create scored learning evidence.

Flags Learn is being redesigned as a browse/reveal gallery in #30.

### Play

Play is scored retrieval and assessment.

Play provides stronger evidence of existing knowledge than passive study and may calibrate already-known material faster than ordinary corrective practice.

The internal activity value may remain `test`, including stable route/data-action identifiers. Learner-facing language is **Play**.

## Live learning evidence

Country-level records are the scheduler's evidence layer.

They should remain rich enough to support future learning-science refinement, including concepts such as:

- no scored evidence yet;
- active learning / uncertainty;
- strong evidence;
- due for review;
- lapse / contradictory evidence;
- response history;
- confusion history;
- domain-specific outcome quality.

Current internal fields such as `unseen`, `learning`, and `mastered` may remain for compatibility while the model evolves.

Do **not** simplify the backend merely because the learner-facing achievement system is more restrained.

Do **not** describe an individual country as a prestigious learner-facing mastery achievement.

Issue #29 owns refinement of this evidence model and Learn/Play weighting.

## Earned mastery and completion

Atlas separates **live learning evidence** from **earned achievement state**.

### Region × domain — Mastery

The first meaningful learner-facing mastery unit is one complete learning domain across an entire region.

Examples:

- Flags of West Africa mastered
- Locations of East Africa mastered
- Outlines of Southern Africa mastered
- Neighbours of North Africa mastered

Incomplete competencies are neutral. Earned competencies use the shared purple mastery language.

### Complete region

A region is complete when all required supported domain masteries are earned.

Keep the useful scope count, for example:

**West Africa — 17 countries**

Do not replace it with `100%` or `17/17` after completion.

A complete region receives a restrained gold accent/border. It does not receive a crown or separate emblem.

### Complete continent

A continent is complete when every required region/domain mastery for that continent is earned.

No completion quantity is needed.

Completion earns a prominent **continent crest** based on the continent silhouette with restrained purple/gold treatment.

### Complete world

World completion is Atlas's ultimate achievement.

Reserve the **Crown** for this state alone.

Do not show `195/195`, a percentage, a rank ladder, or a higher fantasy tier above it.

### Persistence

Earned mastery/completion is acquired and not lost in the current product model.

Live country evidence may later lapse or be revalidated without automatically revoking an earned achievement. Future decay/revalidation policy is intentionally a separate learning-model decision.

Issue #34 owns this achievement layer.

## Gamification philosophy

Gamification should reward meaningful learning, not every interaction.

Principles:

- ordinary interaction can feel tactile and satisfying;
- green/red feedback is immediate and temporary;
- purple is durable competence;
- gold is scarce prestige;
- achievement treatment becomes stronger as achievements become rarer;
- no XP economy;
- no coins;
- no arbitrary streak rewards;
- no achievement spam;
- no separate fantasy/rank system;
- stronger celebration is reserved for genuinely rare milestones.

See [`docs/product/gamification.md`](docs/product/gamification.md).

## Brand colour system

The palette is informed by quantitative analysis of the 195 national flags rather than arbitrary theme selection.

Locked semantic roles:

| Role | Colour |
| --- | --- |
| Primary action | `#2563EB` Atlas Blue |
| Pressed/depth | `#1749B8` |
| Action tint | `#EAF0FF` |
| Correct | `#137A55` |
| Wrong | `#B42318` |
| Mastery | `#6D3FC0` |
| Prestige / completeness | `#E0AF2F` |
| Canvas | `#F6F8FB` |
| Primary text | `#101318` |

Blue is the strongest major flag-derived family that remains semantically available after reserving green for correct and red for wrong. Purple is exceptionally rare in world flags, making it well suited to durable mastery. Gold remains deliberately scarce.

Do not create continent/region colour themes from the study.

See [`docs/product/colour-system.md`](docs/product/colour-system.md).

## Visual design status

The semantic colour system, achievement hierarchy and product principles are locked.

The visual style is locked: **Tactile Atlas**. Shape language, radii, elevation, press physics, typography personality and motion are decided and implemented; see `DESIGN.md` for the complete specification.

Issue #32 records the implemented visual-system rollout. Achievement art direction (region mastery badges, continent crests, the world Crown) remains genuinely open and depends on #34's earned-mastery persistence landing first.

`DESIGN.md`'s shipped Tactile Atlas aesthetic is now normative product truth, not a placeholder to be discarded on a future design pass.

## Navigation and information architecture

The interface should reveal only the next meaningful decision.

Core navigation principles:

- mobile-first;
- no horizontal scrolling for primary selection;
- geography and learning scope remain obvious;
- the region card is the cross-domain competency surface — no separate region-detail screen sits between it and Play;
- Learn and Play remain direct;
- Back/Forward and direct links remain first-class;
- URLs own durable navigation state;
- active-round internals remain ephemeral session state.

Issue #35 owns region × domain cross-domain competency, surfaced directly on the continent surface's region cards.

## Persistence and compatibility

- Preserve learner progress through redesigns.
- Keep domain ledgers independent.
- Version stored data when schemas change.
- Do not rename stable routes/storage identifiers solely to match learner-facing language or the Atlas rebrand.
- The repository name `flag` may remain.
- Legacy `flag-atlas:*` storage/cache identifiers may remain where migration cost outweighs cosmetic consistency.

Issue #36 owns the learner-facing product rename.

## Cartography

Production geography uses the canonical Natural Earth topology pipeline.

Do not:

- hand-author country geometry;
- add a second topology source;
- hand-maintain neighbour tables;
- change geopolitical/boundary policy as part of unrelated UI work.

Locations, Outlines and Neighbours should continue to reuse canonical geometry and adjacency infrastructure.

## Product language

All learner-facing copy uses modern British English (`en-GB`).

- **Neighbours**
- **colour**
- **centre**
- **behaviour**
- **practise** as a verb / **practice** as a noun

Stable technical identifiers may retain American spelling for compatibility.

Country names follow [`docs/product/country-naming.md`](docs/product/country-naming.md).

## Accessibility

Atlas must support:

- keyboard operation;
- visible focus;
- reduced motion;
- mobile safe areas;
- readable zoomed text;
- non-colour-only status communication;
- answer-safe accessible labels;
- stable focus after rerenders;
- usable portrait and short-landscape layouts.

## Product principles

1. Get the learner into useful geography quickly.
2. Keep scope under learner control while letting the evidence model adapt underneath it.
3. Separate passive study, scored retrieval, live evidence and earned mastery.
4. Make mastery meaningful by awarding it at region × domain scale, not per country.
5. Make prestige scarce: purple competence, gold completion, continent crest, world Crown.
6. Keep maps and flags more visually important than product chrome.
7. Preserve current progress and compatibility while the learning model becomes more sophisticated.
8. Expand globally through the existing canonical geography architecture rather than parallel systems.
