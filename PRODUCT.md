# Atlas Product

**Status:** current production truth after the Spatial Atlas cutover  
**Product:** mobile-first geography-learning PWA  
**Learner-facing language:** modern British English (`en-GB`)

## Product purpose

Atlas teaches world geography through direct retrieval and geographic context across four peer learning domains:

- **Flags** — identify countries from national flags;
- **Locations** — identify countries by geographic position;
- **Outlines** — identify countries by silhouette;
- **Neighbours** — identify complete direct land-border neighbour sets.

Atlas is fast, low-friction and information-first, and gamified only inside a round. Geography should usually be the dominant visual object, and it is the surface that carries the product's colour: land green, water blue, space night, with the chrome around it neutral. Engagement comes from learning, tactile interaction, felt momentum within a round and meaningful completion rather than XP, currency, lives, levels, daily-streak obligations, reward shops, leaderboards or constant celebration.

## Production navigation: Spatial Atlas

Spatial Atlas is the default production navigation presentation on supported devices. This is the accepted product direction established by #119 and promoted to production by #166; it is not an optional preview or a pending experiment.

Conceptually:

```text
Home / choose domain
        ↓
World Earth / choose continent
        ↓
Continent focus / Play continent or choose region
        ↓
Region focus / Play or Learn region
        ↓
Domain-native activity
        ↓
Results / geographic context
```

The important product rules are:

- geographic detail is disclosed progressively (#197): world navigation shows continents rather than a country tessellation, a framed continent reveals its learner-facing areas, selecting an area keeps navigation at area level, and country boundaries appear only where the learning mechanic is actually about countries;
- each currently selectable continent or area is named on the Earth itself by a real, focusable control that dispatches the same action as its equivalent chip;
- the typed hash router remains authoritative;
- the persistent Earth interprets route state rather than creating a second navigation stack;
- tapping geography **selects/focuses** a durable scope and never starts a round accidentally;
- when a continent or region is focused, **Play {Scope}** is immediately available and **Learn {Scope}** remains secondary where supported;
- whole-continent Play is available at continent focus;
- parent/sibling geography remains quiet secondary navigation;
- equivalent real DOM controls remain available for keyboard and assistive technology;
- the conventional launcher is retained only as the semantically equivalent renderer-failure fallback when WebGL cannot start;
- browser Back/Forward, cold deep links and activity-refresh fallback remain first-class.

Do not restore the old `globe + launcher page underneath`, one-tap launcher-row model, or a parallel map-first navigation implementation as an incidental change. Historical launcher work remains useful evidence but is not current product behaviour.

## Activity boundary

Spatial continuity does not mean every learning mechanic becomes a globe interaction.

- **Flags Play** keeps the flag as the recognition object; quiet inert spatial context may remain where it cannot hint the answer.
- **Flags Learn** is the browse/reveal gallery and may take the viewport.
- **Locations** yields to its canonical projected map activity.
- **Outlines** yields to the silhouette activity.
- **Neighbours** yields to its target/neighbour map and set-entry interaction.
- **Results** can re-establish the geography just practised.

No live-question spatial highlight may leak an answer.

## Learn and Play

### Learn

Learn is familiarisation and corrective learning, not merely slower Play.

- **Flags Learn**: browse/reveal gallery for the complete selected scope. Reveal state is ephemeral and passive browsing/reveal writes no country learning evidence.
- **Locations Learn**: guided map retrieval with distinct clean, after-miss and revealed outcomes.
- **Outlines Learn**: multiple-choice silhouette retrieval with corrective feedback.
- **Neighbours Learn**: build the complete land-neighbour set with clean/assisted/revealed outcome distinctions.

### Play

Play is scored retrieval/assessment. The stable internal identifier remains `test` for compatibility.

Presentation must not duplicate scoring, evidence or achievement rules. Each domain keeps its native scoring semantics.

## Country learning evidence

Country records are the live learning/scheduling layer. They can record encounters, clean retrieval, weaker assisted evidence, contradictory evidence, confusion history and due/review information where supported.

Country evidence is **not learner-facing prestige**. Internal compatibility state may still use names such as `mastered`; routine UI must not promote an individual country into a prestigious Mastery achievement.

Ordinary progress is the restrained Atlas Blue successful-retrieval strip.

## Perfect round and Mastery

A **Perfect round** is one miss-free Play result under the domain's scoring rules. It is transient Results feedback, not a persistent achievement.

The first durable learner-facing prestige unit is **region × domain Mastery**. Current qualification is two consecutive perfect **complete-region** Play results for that region/domain. The achievement layer verifies exact supported-target coverage before advancing the streak. Sampled/review rounds do not qualify. A qualifying non-perfect round resets an unearned streak; earned Mastery is not revoked.

## Completion hierarchy

### Complete region

A region is complete only when it has genuine non-empty curriculum in all four domains and all four region × domain Masteries have been earned. Presentation is restrained gold plus explicit non-colour semantics; there is no separate region Crown.

### Complete continent

A continent is complete only when all required learner-facing regions are complete. The persisted completion state and continent crest/trophy artwork remain part of the achievement system. Spatial navigation must surface the same completion truth as the fallback presentation; it must not invent a second qualification rule.

### World Crown

World completion is the highest and final prestige tier. All six continents now have complete intended four-domain curriculum, so the curriculum gate is satisfied. The Crown is awarded only after all six continent-completion achievements are earned.

Issue #138 shipped the learner-facing earned-only World Crown surface on Home. Do not show routine locked/decorative Crowns and do not introduce a prestige tier above it.

## Geography coverage

| Domain | Production-ready coverage |
| --- | --- |
| Flags | full 195-country curriculum; World, all six continents and learner-facing regions |
| Locations | Africa, South America, Europe, Asia, North America and Oceania plus supported regions |
| Outlines | Africa, South America, Europe, Asia, North America and Oceania plus supported regions |
| Neighbours | all six continents, limited to targets whose complete canonical land-neighbour set is representable, including explicit verified zero-land-neighbour targets |

Atlas uses one canonical ISO3 identity model and one reproducible Natural Earth 1:10m production geography pipeline. The projected learning maps and spherical Spatial Atlas assets are two generated outputs of the same pinned source/policy, not parallel geography systems.

## Persistence

The four domain learning ledgers remain independent. Earned achievements and in-progress region-perfect-run streaks persist separately. Earned prestige is monotonic under the current product model while live evidence may weaken or become due independently.

Stable storage, route, cache and cloud-sync identifiers must not be renamed casually. Persisted shape changes require explicit deterministic migration.

Active quiz order, current question, guesses, timers and result process state remain ephemeral session state.

## Progress presentation

The dedicated Progress screen remains retired. Progress and prestige are progressively disclosed in the flow: Home/domain choice, Spatial command surfaces, domain-native activities/Results, and equivalent fallback controls where needed. Do not create a dashboard merely to centralise metrics.

## Locked product constraints

- canonical country identity is ISO3;
- product copy uses British English: **Neighbours, colour, centre, behaviour, practise** as the verb;
- stable internal identifiers such as `neighbors`, `/neighbors`, `test` and existing storage keys remain for compatibility;
- typed hash routes and browser Back/Forward remain authoritative;
- one canonical Natural Earth 1:10m source/provenance policy owns projected and spherical geography;
- no handwritten country geometry, second topology source or handwritten neighbour table;
- Atlas Blue = ordinary action/progress; green/red = correctness; purple = durable Mastery; gold = scarce prestige;
- state cannot rely on colour alone;
- geography should normally be the richest visual object;
- no glassmorphism, bento dashboard treatment, decorative overload or reward economy;
- tactile depth is purposeful but not toy-like;
- PWA/offline and renderer-failure behaviour remain product requirements.

## Historical decisions and active work

Closed issues are retained as project history. #104 is the earlier map-first launcher exploration; #119 proved the continuous Spatial model; #166 made it production. The accepted Spatial direction supersedes #104 as a separate future launcher programme.

The #118 specialist UX audit is also closed; its concrete surviving defects are tracked by #146–#152. Current open work and sequencing live in [`docs/open/index.md`](docs/open/index.md); historical relationships live in [`docs/history.md`](docs/history.md).
