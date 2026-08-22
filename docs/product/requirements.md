# Atlas — Product Requirements

**Status:** current product baseline; Tactile Atlas visual system implemented
**Product:** mobile-first geography-learning PWA  
**Core country catalogue:** 195 sovereign states  
**Learning domains:** Flags, Locations, Outlines, Neighbours  
**Primary hierarchy:** World → Continent → Region

## 1. Product thesis

Atlas should make learning world geography fast, legible and intrinsically satisfying.

The product combines:

- direct geographic practice;
- domain-appropriate Learn experiences;
- clean scored Play;
- rich persistent country-level learning evidence;
- scarce higher-order mastery/completion achievements.

Engagement should come from learning, tactile interaction and meaningful completion rather than an activity economy.

Atlas does not need XP, coins, arbitrary streak rewards, lives, reward stores, leaderboards or constant celebration to feel like a game.

## 2. Product identity

Learner-facing product name: **Atlas**.

The four product domains are equal parts of the broader geography-learning system:

1. Flags;
2. Locations;
3. Outlines;
4. Neighbours.

Stable technical identifiers may retain legacy `flag`, `flag-atlas`, `neighbors` and `test` naming for compatibility. The rebrand must not create breaking storage/routing migrations solely for cosmetic consistency.

## 3. Core learner journey

The durable conceptual path is:

**choose geography → choose learning intent/domain as appropriate → Learn or Play → interact with geography → update live evidence → review/continue**

Navigation should progressively disclose only the next useful decision.

Each region card is the cross-domain mastery surface, exposing all four learning domains directly without a separate region-detail step.

Browser Back/Forward and direct links remain first-class product behaviour.

## 4. Geography and curriculum

### Core catalogue

The canonical curriculum contains 195 sovereign states:

- 193 UN member states;
- Palestine;
- Vatican City / Holy See.

Territories/dependencies do not silently enter the core denominator.

Country identity remains canonical ISO3 and follows `docs/product/country-naming.md`.

### Hierarchy

The base hierarchy is:

**World → Continent → Region**

Canonical classification and learner-facing learning scopes may diverge where useful. Issue #28 establishes the direction for conventional overlapping scopes such as the Middle East without duplicating country records or corrupting canonical continent ownership.

### Current coverage

- Flags: full 195-country curriculum.
- Locations: Africa and its production regions.
- Outlines: Africa and its production regions.
- Neighbours: eligible Africa targets/regions supported by complete canonical topology-derived adjacency.

Africa is therefore the first production proving ground for the complete four-domain system.

Issues #22–#27 own global expansion. Other continents may appear as honest shell/navigation states before all gameplay data is available, but unavailable domains must never be treated as completed curriculum.

## 5. Learning domains

### Flags

Target skill: identify a country from its national flag.

Requirements:

- preserve true flag aspect ratios;
- no answer leakage before a scored response;
- confusion-aware distractors where multiple choice is used;
- full World/continent/region scope support;
- Flags Learn should become a browse/reveal comparison surface under #30;
- Play remains the scored retrieval path.

### Locations

Target skill: identify countries by true geographic position.

Requirements:

- use canonical production cartography;
- preserve geographic truth and context;
- keep active geography usable on mobile;
- distinguish clean first-try success from corrective/revealed outcomes;
- no parallel map dataset.

Detailed map-learning behaviour is documented in `map-learning.md`, subject to the newer evidence semantics in `learning-and-mastery.md`.

### Outlines

Target skill: identify countries by silhouette.

Requirements:

- derive silhouettes from canonical production geometry;
- preserve shape/aspect ratio while normalising presentation enough to avoid trivial scale cues;
- avoid answer leakage in accessible labels;
- remain usable on mobile portrait and short landscape.

Detailed domain requirements remain in `outlines.md`, subject to the newer evidence semantics in `learning-and-mastery.md`.

### Neighbours

Target skill: identify all direct land-border neighbours of a target country.

Requirements:

- adjacency comes only from canonical topology-derived data;
- do not teach incomplete neighbour sets;
- preserve the established set-building/attempt semantics unless a focused issue changes them;
- the map remains the main geographic learning surface;
- autocomplete/input must remain mobile-usable and answer-safe.

Stable internal spelling remains `neighbors` where required.

## 6. Learn and Play

Atlas has two learner-facing intents.

### Learn

Purpose: familiarisation and corrective learning.

Learn may differ by domain. It does not need to be a slower copy of Play.

Requirements:

- passive exposure/reveal does not create scored evidence;
- corrective interactions should stay in the primary task surface where possible;
- avoid repetitive detached Next interactions;
- immediate feedback must remain perceivable and accessible;
- domain mechanics may produce lower-strength evidence when genuine unassisted retrieval occurs.

### Play

Purpose: clean scored retrieval / assessment.

Requirements:

- no corrective cue before the scored response is committed, except where the domain's set-building mechanic necessarily shows solved members;
- results update live country evidence;
- Play can provide stronger diagnostic evidence than ordinary corrective Learn;
- clean performance can calibrate already-known material faster than a rigid repeated-practice rule;
- exact evidence weighting belongs in the learning model, not UI conditionals.

Learner-facing label is **Play**. Stable internal value/route/action naming may remain `test`.

## 7. Live country learning evidence

Country records are the atomic scheduler/evidence layer.

They must remain rich enough to represent or derive:

- absence of scored evidence;
- current uncertainty/learning state;
- strong evidence;
- first-try vs assisted/revealed outcomes;
- assessment evidence;
- response history;
- confusion history;
- review/due state;
- lapse/contradictory evidence;
- domain-specific outcome quality.

Existing internal `unseen`, `learning`, `mastered` fields may remain for compatibility while the model evolves.

### Critical language rule

Do **not** present an individual country as a prestigious learner-facing “Mastered” achievement.

Country evidence answers operational questions such as what should be practised/reviewed. It is not the product's achievement unit.

### Scheduler flexibility

Do not expose an internal algorithm such as `1/3` or `2/3` as the product contract.

The evidence model should be replaceable/refinable without changing the visible mastery hierarchy or resetting learner progress.

Issue #29 owns implementation refinement.

## 8. Earned Mastery and completion

Earned achievement state is separate from live country evidence.

### Region × domain — Mastery

The first learner-facing Mastery unit is a complete domain across a complete region.

Examples:

- Flags of West Africa mastered;
- Locations of West Africa mastered;
- Outlines of West Africa mastered;
- Neighbours of West Africa mastered.

The UI uses a neutral domain competency mark before mastery and purple after mastery.

### Complete region

A region is complete after all required supported domain masteries have been earned.

Requirements:

- preserve useful scope count such as `17 countries`;
- do not replace completion with `100%` / `17/17`;
- use restrained gold prestige treatment;
- no separate region emblem/crown.

### Complete continent

A continent is complete after all required region/domain mastery is earned.

Requirements:

- no completion quantity required;
- award a continent-silhouette crest;
- use restrained purple/gold treatment;
- unavailable curriculum cannot satisfy requirements.

### Complete World

World completion is the ultimate achievement.

Requirements:

- reserve the Crown for this state alone;
- no higher achievement tier;
- no `195/195` or percentage needed after completion;
- the Crown remains unobtainable until the global four-domain curriculum exists.

### Persistence rule

Earned mastery/completion is acquired and not lost in the current product model.

Live country evidence may later lapse or become due without automatically revoking the historical achievement.

Future revalidation/decay is a separate product decision.

Issue #34 owns implementation.

## 9. Region cross-domain surface

Atlas surfaces each region directly on its continent screen. The region card is the stable cross-domain surface; a dedicated intermediate region-detail route is not required.

It should expose:

- region identity;
- useful country count;
- four domain competencies;
- supported/unsupported domain availability;
- neutral vs purple mastered competency state;
- clear Learn/Play entry points;
- restrained gold treatment when the region is fully complete.

It should not become a dense analytics dashboard.

Issue #35 records this implemented composition. Achievement states remain owned by #34.

## 10. Gamification requirements

The achievement hierarchy is:

**live country evidence → region/domain Mastery → complete region → continent crest → world Crown**

The visual prestige hierarchy is:

**purple competence → scarce gold completion → continent crest → singular Crown**

Do not introduce by default:

- XP;
- coins/currency;
- reward stores;
- arbitrary streak achievements;
- achievement spam;
- fantasy rank ladders;
- crowns on ordinary objects;
- confetti for routine correct answers.

See `gamification.md`.

## 11. Colour semantics

Locked palette:

| Role | Colour |
| --- | --- |
| Atlas Blue / primary action | `#2563EB` |
| Pressed/depth blue | `#1749B8` |
| Action tint | `#EAF0FF` |
| Correct | `#137A55` |
| Wrong | `#B42318` |
| Mastery | `#6D3FC0` |
| Prestige / completeness | `#E0AF2F` |
| Canvas | `#F6F8FB` |
| Primary text | `#101318` |

Use one global semantic palette. Do not theme continents/regions/hemispheres from their flag-colour distributions.

See `colour-system.md`.

## 12. Visual-system status

The palette, semantic hierarchy and gamification rules are locked.

The final visual style is Tactile Atlas and is implemented. `DESIGN.md` defines its personality, radius system, depth and press physics, typography, mode-first navigation, routine iconography and motion system.

Issue #34 separately owns achievement persistence and the exact mastery-shield, continent-crest and world-Crown art direction.

Do not infer React, Tailwind or another frontend framework/tooling migration from mock-up technology. The desired visual outcome and the implementation stack are separate decisions.

## 13. Cartography requirements

Production cartography remains one canonical reproducible system.

Requirements:

- no handwritten country geometry;
- no second topology source;
- no handwritten neighbour tables;
- reuse canonical geometry for Locations, Outlines and Neighbours where appropriate;
- preserve documented geopolitical/boundary policy;
- keep water/context/learning-state contrast coherent;
- do not theme cartography by continent flag colours.

Issue #20 owns map colour/water contrast refinement.

## 14. Persistence and migration

- learner progress survives app restarts;
- domain learning ledgers remain independent;
- achievement persistence must be layered above live evidence cleanly;
- persisted schema changes require deterministic migration;
- existing progress must not be reset by visual/brand work;
- stable storage namespaces should not be renamed without product value;
- active quiz internals remain ephemeral session state unless a deliberate recovery design is introduced.

## 15. Routing

- typed routes remain source of truth;
- hash routing remains appropriate for GitHub Pages unless separately migrated;
- URLs own durable navigation state;
- session state owns transient round internals;
- Back/Forward must work naturally;
- stable screens must be directly addressable; legacy region-detail URLs may collapse safely to their continent surface;
- unavailable domain data is an availability concern rather than justification for parallel routing systems.

## 16. Accessibility

Atlas must support:

- keyboard operation;
- visible focus;
- non-colour-only state communication;
- reduced motion;
- mobile safe areas;
- readable zoomed text;
- answer-safe accessible descriptions;
- stable focus after rerenders;
- deliberate portrait and short-landscape layouts;
- honest degraded/asset-failure states.

All assistive-technology copy follows the same British-English standard as visible copy.

## 17. Product language

Use modern British English (`en-GB`).

- Neighbours;
- colour;
- centre;
- behaviour;
- practise as a verb / practice as a noun.

Country display names follow `country-naming.md`.

Stable implementation contracts may retain American spelling.

## 18. Architecture constraints

- keep pure learning rules outside UI rendering;
- keep country identity canonical and shared;
- investigate before refactoring;
- prefer coherent extensions over duplicate systems;
- preserve backwards compatibility unless migration has clear value;
- keep the scheduler replaceable;
- keep earned achievement state separable from live evidence;
- preserve canonical cartography and topology provenance.

## 19. Current implementation roadmap

Primary active work is indexed in `../open/index.md`.

Near-term sequence:

1. close out the implemented visual system (#32), routine icons (#40) and region-card composition (#35);
2. implement/refine country evidence (#29);
3. implement Flags Learn browse/reveal (#30);
4. implement earned regional/continent/world achievements (#34);
5. upgrade Progress across all four domains (#42);
6. close out the implemented Atlas brand rollout (#36) and deliver the source-derived app icon (#43) as focused work;
7. continue Africa-first cartography/usability fixes while continent expansion remains deliberately parked.

Focused bugs may ship sooner where independent.
