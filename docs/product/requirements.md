# Atlas — Product Requirements

**Status:** current v1.0 product baseline
**Normative overview:** `../../PRODUCT.md`

This document records durable implementation requirements without duplicating closed-issue history.

## 1. Product thesis

Atlas is a mobile-first geography-learning PWA across Flags, Locations, Outlines and Neighbours.

It should provide direct geographic practice, domain-appropriate Learn experiences, clean scored Play, persistent country-level learning evidence and a deliberately scarce higher-order achievement hierarchy.

Engagement should come from learning, tactile interaction and meaningful completion rather than XP, currency, lives, reward stores, leaderboards or constant celebration.

## 2. Product identity and language

- Learner-facing product name: **Atlas**.
- Learner-facing language: modern British English (`en-GB`).
- Use **Neighbours**, **colour**, **centre**, **behaviour**, **practise** as the verb / **practice** as the noun.
- Stable technical identifiers may retain `flag`, `flag-atlas`, `neighbors` and `test` where compatibility requires them.
- Canonical country identity is ISO3 and follows `country-naming.md`.

## 3. Current navigation

Production navigation is mode-first:

`Home → domain → supported continent launcher → Play continent/region`

Requirements:

- Home chooses one of the four peer learning domains and starts no round;
- every domain index exposes all six continents, with unsupported ones as inert honest shells;
- supported continent rows open launchers;
- launcher whole-continent and region rows start Play directly;
- a subordinate whole-continent Learn action remains available;
- Flags additionally supports World Play/Learn;
- do not restore the retired select-region-then-Play flow without a focused product decision;
- browser Back/Forward, deep links and activity-refresh fallback remain first-class.

See `../architecture/routing.md`.

## 4. Geography and coverage

Core curriculum: 195 sovereign states (193 UN members + Palestine + Vatican City/Holy See).

Current production coverage:

| Domain | Coverage |
| --- | --- |
| Flags | all 195 countries; World/all continents/learner regions |
| Locations | Africa, South America, Europe, Asia |
| Outlines | Africa, South America, Europe, Asia |
| Neighbours | Africa, South America, Europe, Asia, limited to topology-complete eligible targets |

North America (#22) and Oceania (#27) remain incomplete for Locations/Outlines/Neighbours.

Unsupported geography must not imply gameplay availability or completion eligibility.

## 5. Domain requirements

### Flags

- preserve true flag aspect ratios;
- avoid answer leakage before scored responses;
- use plausible/confusion-aware distractors where applicable;
- Play is scored recognition;
- Learn is the shipped browse/reveal gallery for the complete selected scope;
- gallery browsing/reveal is passive familiarisation and writes no evidence.

### Locations

- use canonical generated production cartography;
- keep geography dominant and mobile-usable;
- Learn distinguishes first-try, assisted and revealed outcomes;
- Play gives one scored tap per target and current feedback/result treatment;
- preserve pan/zoom/context behaviour and truthful geography;
- no parallel map dataset.

### Outlines

- derive silhouettes only from canonical production geometry;
- preserve shape/aspect ratio while removing avoidable absolute-size/location cues;
- prevent answer leakage through accessible metadata;
- Learn gives immediate corrective feedback;
- Play is scored recognition;
- remain usable on mobile portrait and short landscape.

### Neighbours

- derive adjacency from canonical topology only;
- never teach a known incomplete land-neighbour set;
- preserve set-building mechanics and explicit zero-neighbour answer where supported;
- Learn/Play retain domain-native clean/assisted/exhausted semantics;
- keep input/autocomplete mobile-usable and answer-safe.

## 6. Learn versus Play

**Learn** supports familiarisation/correction. Passive exposure never creates scored strength credit. Genuine clean retrieval in interactive Learn modes may create learning evidence according to the shared evidence reducer.

**Play** is scored retrieval/assessment and may create stronger diagnostic evidence. Presentation code must not own evidence weights.

Flags Learn is intentionally exceptional: it is a passive browse/reveal surface and creates no evidence.

## 7. Country learning evidence

Country records are the scheduler/evidence layer, not learner-facing prestige.

They must preserve or derive:

- unseen/weak/strong evidence;
- clean versus assisted/revealed outcomes;
- contradictions/lapses;
- relevant confusion/miss history;
- due/review state where supported;
- domain-specific outcome quality.

Do not present an individual country as a prestigious Mastered achievement. Internal `mastered` compatibility state may remain.

Do not expose the current strength-credit algorithm as immutable product UI.

## 8. Perfect round and Mastery

A **Perfect round** is one Play result with no misses under the domain's native scoring rule. It is transient Results feedback and does not persist.

**Region × domain Mastery** is persistent prestige.

Current v1 engine behaviour:

- two consecutive perfect region-scoped Play results award Mastery;
- a non-perfect region-scoped Play resets the unearned streak;
- earned Mastery is not revoked;
- Learn/Review/continent/world rounds do not qualify.

The product requirement and shipped implementation require two consecutive
perfect **complete-region** Play results. Issue #108 added full-region launches
and exact supported-target coverage validation across all four domains.

## 9. Completion hierarchy

### Complete region

Requires genuine non-empty curriculum in all four domains plus all four region × domain Masteries.

Presentation requirements:

- preserve useful scope count/progress;
- use restrained gold completion treatment;
- no separate region emblem/crown.

### Complete continent

Requires every learner-facing required region to have complete four-domain curriculum and to be complete.

Production presentation uses the shipped continent trophy/crest artwork on completed rows in domain continent indexes. No separate full-screen trophy ceremony ships today.

### Complete World

World completion is the final tier and reserves the Crown.

The state exists in the achievement model but is not currently achievable because North America/Oceania are incomplete, and there is no learner-facing React Crown surface in v1. Do not create a higher tier.

## 10. Persistence and reset

- four domain learning ledgers remain independent;
- achievement state and in-progress perfect-run streaks persist separately;
- earned achievements are monotonic under the current model;
- evidence can lapse/become due independently;
- persisted schema changes require deterministic migration;
- stable storage namespaces are not renamed casually;
- active round internals remain ephemeral unless a separate recovery design is approved.

Current production exposes no learner-facing coordinated full reset. Any future reset must account for all learning ledgers plus achievements/streaks together.

## 11. Progress presentation

The dedicated Progress screen is retired and no replacement dashboard is currently promised.

Current progress appears in Home, domain indexes, continent launchers and Results. Ordinary progress uses the quiet blue successful-retrieval strip; Mastery/completion remains visually distinct.

## 12. Visual requirements

`DESIGN.md` is authoritative for Tactile Atlas.

Locked semantic colour roles:

- Atlas Blue `#2563EB` — ordinary action/progress;
- green `#137A55` — correct;
- red `#B42318` — wrong;
- purple `#6D3FC0` — durable Mastery;
- gold `#E0AF2F` — scarce prestige/completion.

No continent/region/hemisphere colour taxonomy. State cannot rely on colour alone.

Geography should usually be the richest visual object. No glassmorphism, bento dashboards or decorative overload.

## 13. Cartography

- one reproducible Natural Earth 1:10m production topology pipeline;
- no handwritten country geometry;
- no second topology source;
- no handwritten neighbour tables;
- reuse canonical geometry for Locations, Outlines and Neighbours;
- preserve documented boundary/geopolitical policy;
- do not theme maps by continent flag colours.

## 14. Accessibility

Atlas must preserve:

- keyboard operation where applicable;
- visible focus;
- non-colour-only state communication;
- reduced motion;
- mobile safe areas;
- readable zoomed text;
- answer-safe accessible descriptions;
- stable focus after route/question transitions;
- portrait and short-landscape usability;
- honest unavailable/asset-failure states.

## 15. Architecture constraints

- keep domain rules outside UI rendering;
- keep country identity canonical/shared;
- keep typed routes authoritative;
- keep evidence separate from earned achievement;
- keep scheduler rules replaceable;
- keep production React presentation separate from framework-independent domain/state layers;
- preserve backwards compatibility unless migration has clear product value;
- investigate before refactoring and avoid duplicate systems.

## 16. Deferred product/design work

- #104: deferred map-first continent-launcher exploration, not scheduled;
- richer milestone ceremony: optional, not current v1 behaviour;
- new Progress dashboard: not currently promised;
- World Crown learner-facing presentation: future state tied to genuine global completion;
- full-region Mastery qualification integrity: shipped under #108.
