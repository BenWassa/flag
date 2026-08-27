# Routing and Product Information Architecture

**Status:** Atlas v1.0 route/product contract
**Transport:** hash URLs on GitHub Pages
**Source of truth:** `src/routing/routes.ts`

## Product hierarchy

Atlas composes three independent dimensions:

1. **learning domain** — Flags, Locations, Outlines, Neighbours;
2. **geographic scope** — World where applicable, continent, region;
3. **activity** — Learn, Play, Review.

Navigation is **mode-first**: Home chooses the learning domain first. The next stable screen is that domain's continent index. Supported continent rows open a continent launcher; unavailable continents remain honest inert shells.

## Current production flow

```text
Home
├── Flags ─────► continent index ─► continent launcher ─► Play continent/region
├── Locations ─► continent index ─► continent launcher ─► Play continent/region
├── Outlines ──► continent index ─► continent launcher ─► Play continent/region
└── Neighbours ► continent index ─► continent launcher ─► Play continent/region
```

Inside a supported continent launcher:

- the whole-continent row starts Play for the continent;
- each region row starts Play for that region;
- a subordinate `Learn {Continent}` action starts whole-continent Learn;
- there is no ordinary select-region-then-Play step;
- no separate launcher map is required for the current production interaction.

Flags also exposes World Play/Learn because its curriculum is global. Flags Learn is the addressable browse/reveal study surface rather than an active quiz session.

This one-tap launcher contract supersedes the older Issue #77 select-then-play composition. Issue #104 records a deferred map-first alternative; it is not a second production navigation model.

## Current availability

| Domain | Production-ready geography |
| --- | --- |
| Flags | World, all six continents, all learner-facing regions in the 195-country curriculum |
| Locations | Africa, South America, Europe, Asia and North America plus supported regions |
| Outlines | Africa, South America, Europe, Asia and North America plus supported regions |
| Neighbours | Africa, South America, Europe, Asia and North America plus eligible topology-complete targets/regions |

Oceania (#27) remains unavailable for Locations, Outlines and Neighbours; North America is supported.

The route grammar can parse canonical continent/region identity independently of whether a domain currently ships that scope. `normalizeAvailableRoute(...)` owns availability: an unsupported scoped route falls back to that **domain's continent index**, not to Africa and not to an invented substitute continent.

## Product language versus stable identifiers

Learner-facing copy uses **Neighbours** and **Play**.

Compatibility identifiers remain:

- route/domain identifier `neighbors`;
- learner-facing Play activity stored/routed internally as `test`;
- existing storage/action identifiers where renaming would create migration risk.

Do not create a copy-only route/storage migration.

## Route schema

Representative stable routes:

| State | URL |
| --- | --- |
| Home | `/#/` |
| Profile | `/#/profile` |
| Flags continent index | `/#/flags` |
| Flags → Africa launcher | `/#/flags/africa` |
| Flags → West Africa stable scope | `/#/flags/africa/west-africa` |
| Flags → West Africa Learn | `/#/flags/africa/west-africa/learn` |
| Flags → World Play | `/#/flags/test` |
| Locations continent index | `/#/locations` |
| Locations → Africa launcher | `/#/locations/africa` |
| Locations → West Africa Play | `/#/locations/africa/west-africa/test` |
| Locations → West Africa Review | `/#/locations/africa/west-africa/review` |
| Outlines → Europe launcher | `/#/outlines/europe` |
| Neighbours → South America launcher | `/#/neighbors/south-america` |

Region routes always serialise with their canonical parent continent. The parser rejects a known region under the wrong continent.

The retired `/atlas/*` scope-first route family is not part of the current grammar.

## Stable route versus action meaning

A stable region URL such as `/#/locations/africa/west-africa` identifies the region scope within the typed route model, but the normal current launcher no longer asks the learner to park on that region selection before pressing a separate Play button. Tapping the West Africa launcher row starts the Play activity directly.

The stable scoped route remains useful as:

- the activity's refresh fallback;
- the route identity used by Back/Forward within a still-live process;
- a canonical directly addressable scope state when reached by URL/normalisation.

UI composition must not infer the old two-step launcher from the existence of a stable region route.

## URL state versus session state

### URL owns

- Home/profile stable screen identity;
- learning domain;
- continent/region scope;
- activity identity (`learn`, `test`, `review`) while active.

### Session/application state owns

- shuffled question/target order;
- current index;
- submitted answers/guesses;
- transient reveal/feedback state;
- map asset/session objects;
- timers and pending auto-advance;
- final result object retained during the current process.

The URL is not a quiz event log.

## Refresh during an active activity

If an activity URL loads without its matching in-memory activity/session, the app returns to the corresponding stable scope using replacement navigation.

Example:

`/#/locations/europe/western-europe/test` → `/#/locations/europe/western-europe`

Existing persisted learning/achievement evidence survives; partial round internals are intentionally discarded.

Flags Learn is different: the browse/reveal study surface is stable without a quiz session and therefore remains directly addressable. Its reveal state itself is ephemeral.

## Back/Forward

`parentRoute(...)` defines conceptual ancestry:

- activity → stable scope;
- stable continent/region scope → that domain's continent index;
- domain index → Home;
- Profile → Home.

Starting Play/Learn pushes an activity route. Exiting/Back returns toward the stable entry. Forward into an abandoned activity is normalised safely rather than reviving stale state.

Because launcher rows now start Play directly, a region round launched from a continent launcher should return to the continent launcher experience rather than recreating a retired intermediate selected-region UI.

Browser history remains native; Atlas does not maintain a parallel application-owned navigation stack.

## Invalid and unavailable routes

The parser rejects malformed paths, unknown IDs, mismatched continent/region ancestry and invalid activity combinations.

A syntactically valid but unsupported scope is normalised to the relevant domain index. That screen exposes availability honestly through supported rows and inert `Coming soon` shells.

Unsupported geography must not appear Play/Learn-ready and must not become Mastery/completion eligible merely because the route grammar recognises its ID.

## Document titles

Titles derive from typed route/result state and learner-facing domain names, for example:

- `Flags · Atlas`;
- `West Africa flags · Atlas`;
- `Play West Africa locations · Atlas`;
- `Play West Africa neighbours · Atlas`;
- `Round complete · West Africa neighbours · Atlas`.

## Hosting decision

Hash routing remains appropriate on GitHub Pages because the fragment is not sent to the static host. Cold deep links load the known app root, Back/Forward remains meaningful, and the installed PWA can launch deterministically.

A future hosting change may swap the transport adapter for clean History paths, but the typed route/product hierarchy should remain stable unless a separate product decision changes it.

## Deferred map-first exploration

Issue #104 is **DEFERRED PRODUCT EXPLORATION**. It may revisit the launcher as a geography-first interactive map, but it must not create a second concurrent selection model and must reconcile the locked colour/accessibility rules before implementation.
