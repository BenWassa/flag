# Map Learning Mode — Issue #1 Implementation Plan

**Status:** scoped / ready for staged implementation  
**Tracking issue:** #1 (`maps`)  
**Feature class:** large — second learning modality, geodata pipeline, new interaction model  
**Recommended delivery:** staged commits; do not implement as one monolithic change

## 1. Product intent

Add a country-location map game alongside flag learning.

The learner chooses the same geographic scopes already used by Flag Atlas (continent and region), sees a map with country boundaries, receives a country-name prompt, and taps the country on the map.

The interaction should preserve the best part of the Seterra pattern: the completed map becomes a visual record of where the learner struggled.

### Core loop

1. Choose **Map** as the learning activity.
2. Choose a continent or region.
3. The map shows the selected area with country boundaries.
4. A country name is presented as the active target.
5. The learner taps a country.
6. Correct first try → target resolves **off-white**.
7. One prior miss → target resolves **yellow**.
8. Two prior misses → target resolves **orange**.
9. Third miss → target is revealed/resolved **red** and the round continues.
10. Continue until every country in the selected scope has been targeted once.
11. Results summarize first-try accuracy and offer **Review mistakes**.

The established Seterra reference pattern is essentially white → yellow → orange → red, with the correct location revealed after repeated misses. We should use that interaction principle without copying Seterra's visual design.

## 2. Scope decisions

### In scope for issue #1

- Continent map games.
- Existing region taxonomy as map scopes.
- Country-name → map-location interaction.
- One complete pass through the chosen scope per round.
- Three-strike guided-learning behavior.
- Persistent visual result on the map for the current round.
- Results screen with first-try accuracy and mistake review.
- Mobile-first pointer/touch interaction.
- Small-country and island handling.
- Lazy-loaded, locally hosted map geometry.
- Automated validation that every supported curriculum country has a geometry or an explicit locator treatment.

### Deliberately deferred

- World map mode. At phone scale it creates avoidable small-target and zoom problems; continent/region modes should be excellent first.
- Capitals, cities, rivers, states/provinces, or physical geography.
- Free-form map exploration.
- General-purpose slippy-map behavior, street maps, tiles, or GPS.
- Multiplayer, timers, leaderboards, streaks, lives, or scoring economies.
- Territories/dependencies outside the existing 195-country curriculum.
- Pinch/drag map navigation unless usability testing proves it necessary after the continent/region implementation.

## 3. Size assessment

This is **not a small feature**. The visible game is simple; the hidden work is data and interaction correctness.

Expected surface area:

- new geodata generation/verification pipeline;
- 6 continent map assets plus region viewport metadata;
- map-specific domain/session model;
- map renderer and hit-testing behavior;
- AppStore/view routing changes;
- scope/home information-architecture changes;
- map results/review behavior;
- responsive/touch styling;
- accessibility and reduced-motion behavior;
- verification coverage for geometry, IDs, state transitions, and rendering.

A reasonable implementation should be split into roughly **5–7 focused commits / implementation slices**, touching on the order of **12–18 project files** rather than one large commit.

## 4. Technical approach

### Decision: use SVG, not Leaflet/MapLibre

Flag Atlas currently has no runtime framework dependencies. A general mapping library would add substantial runtime and interaction machinery that the product does not need: there are no map tiles, arbitrary coordinates, routing, live layers, or GPS.

Use native inline SVG country paths instead:

- each country is a `<path>` associated with the canonical Flag Atlas country ID (ISO3);
- the SVG itself provides rendering and pointer hit-testing;
- CSS owns idle/hover/incorrect/solved states;
- event delegation continues through `data-action` / `data-id` conventions;
- the map can remain compatible with the current framework-free architecture.

### Geometry source

Use **Natural Earth Admin 0 Countries, 1:50m** as the primary source.

Why 1:50m:

- Natural Earth explicitly positions 1:50m for zoomed-out country and region maps;
- 1:110m is attractive for a whole-world locator but is too simplified for a country-picking game, especially islands and small states;
- 1:10m adds far more geometry than a phone-scale learning game needs.

Natural Earth data is public domain. Pin the source version/commit used to generate the app asset so map changes are intentional and reviewable.

### Do not ship raw GIS data to the browser

The browser should not parse a multi-megabyte GeoJSON file or depend on a GIS library at runtime.

Add a developer-only generation step that:

1. reads a pinned Natural Earth GeoJSON source;
2. reconciles Natural Earth identifiers to the 195-country `COUNTRIES` catalog;
3. projects geometry into SVG coordinates;
4. emits compact path data and map metadata;
5. records explicit overrides/locators for microstates or source edge cases;
6. verifies complete curriculum coverage.

The generated assets are committed to the repo and lazy-loaded only when map mode is opened. Normal flag-learning startup should not pay the map payload cost.

### Projection / asset strategy

Generate **one projected asset per continent**, not one giant world asset and not one duplicated asset per region.

Benefits:

- sensible framing for phone screens;
- Oceania can be centered appropriately around the Pacific rather than split awkwardly at the antimeridian;
- region games can reuse their parent continent geometry with a tighter stored `viewBox`;
- nearby out-of-scope countries can remain faint geographic context without being interactive;
- less duplicated geometry than generating every region independently.

A dev-only `d3-geo` step is appropriate for projection/path generation (`geoNaturalEarth1`, `geoPath`, bounds/fit helpers). D3 does not need to ship in the runtime bundle.

## 5. Country ID reconciliation

The app's canonical country ID is ISO3 (`Country.id === Country.iso3`). Natural Earth includes several administrative/ISO fields and has known cases where the plain `ISO_A3` field is `-99`, so map generation must never assume `ISO_A3` is universally usable.

Create a deterministic resolver with an explicit priority and override table. Recommended shape:

```text
Natural Earth feature
  -> explicit NE_ID / ADM0 override when required
  -> ISO_A3_EH / ADM0_A3 / ISO_A3 candidate
  -> canonical Flag Atlas ISO3
```

Generation must fail if:

- a Flag Atlas country has no map representation and no explicit locator rule;
- two Natural Earth features resolve to one curriculum country unexpectedly;
- an unexpected extra feature becomes interactive;
- a region/continent asset omits an in-scope country.

Do not silently add Western Sahara, dependencies, or other Natural Earth features to the 195-country denominator.

## 6. Small states and islands

This is a first-class requirement, not polish.

Examples include Vatican City, Monaco, San Marino, Liechtenstein, Singapore, Nauru, Tuvalu, several Caribbean states, and small Pacific islands. Their true polygons can be too small to tap reliably at continent scale.

Use two layers:

1. **Visible geometry layer** — real country shape/border wherever the source provides it.
2. **Interaction layer** — a transparent or minimally styled enlarged hit target / locator marker for countries below the usable target threshold.

The locator must still teach the true location. It should be centered on the country and visually tied to it; never replace a tiny country with a large arbitrary polygon.

Where nearby microstates would make expanded hit targets overlap, use deliberate locator dots/callouts rather than ambiguous overlapping invisible targets.

## 7. Map round domain model

Do not force map questions into the existing four-option `Question` type. Introduce a map-specific session model while sharing country/scope primitives.

Suggested model:

```ts
type MapResolution = 'first-try' | 'one-error' | 'two-errors' | 'revealed';

interface MapTargetResult {
  countryId: string;
  wrongCountryIds: string[];
  resolution: MapResolution;
  responseTimeMs: number;
}

interface MapSession {
  id: string;
  scope: StudyScope;
  countryIds: string[];
  currentIndex: number;
  currentWrongCountryIds: string[];
  results: MapTargetResult[];
}
```

### Per-target state machine

```text
0 misses + correct -> first-try -> off-white -> advance
0 misses + wrong   -> 1 miss -> transient wrong feedback
1 miss   + correct -> one-error -> yellow -> advance
1 miss   + wrong   -> 2 misses -> transient wrong feedback
2 misses + correct -> two-errors -> orange -> advance
2 misses + wrong   -> revealed -> correct target flashes/resolves red -> advance
```

Wrongly clicked countries should **not** receive a permanent solved fill. The permanent fill belongs to the target country and represents how many attempts were needed to locate it.

## 8. Learning progress: keep map knowledge separate from flag knowledge

Knowing Ghana's flag and knowing where Ghana is are different competencies. A map answer must never advance or reset the existing flag mastery record.

The current `ProgressState` / `ProgressRecord` logic is already mostly competency-agnostic, so avoid a large schema rewrite. Recommended path:

- add a `StudyTopic` / competency concept (`flags`, `locations`);
- keep separate ledgers per topic;
- preserve the existing flag storage key/migration behavior;
- add a location-progress key rather than overwriting flag progress;
- add topic information to new attempt history or maintain a separate location attempt log.

For map progression, one target should yield one knowledge outcome. A target solved first try is a clean retrieval success. A target requiring any hint/miss should count as a learning error for mastery purposes, while the specific wrong-country clicks can still be retained as geographic confusion data.

This progression integration should come **after** the round interaction is stable; it is easier to validate the map game before coupling it to persistent mastery.

## 9. Information architecture

Avoid mixing “Map” into every existing flag button label.

Recommended hierarchy:

```text
Home
  Flags
    World / continent / region
    Learn / Test
  Map
    Continent / region
    Learn first
```

The initial map implementation is guided Learn mode. A strict Test mode can follow once the learning interaction is proven. In Test, use one click per target and withhold correctness until the end, matching the existing product distinction between Learn and Test.

## 10. Results and review

Map results should emphasize useful learning information rather than points.

Show:

- first-try correct: `x / n`;
- needed one retry;
- needed two retries;
- revealed after three misses;
- **Review mistakes** for every target that was not first-try correct;
- **Repeat scope**.

Review mistakes should start a map round containing only the missed targets while preserving the same geographic context.

## 11. Mobile and accessibility requirements

- Map must fit the primary mobile viewport without forcing horizontal scrolling.
- Pointer targets need deliberate sizing/spacing; WCAG 2.2's minimum target guidance is 24×24 CSS px, while acknowledging maps can invoke the essential-presentation exception. Use larger effective hit targets whenever geography permits.
- Do not rely on color alone: resolved countries need an additional state cue in accessible text/results and the active prompt/feedback should be announced through the existing persistent live region.
- Wrong-click feedback should be brief and should respect `prefers-reduced-motion`.
- Preserve visible focus on all non-map controls.
- Do not expose the target country's name as an ARIA label on every map path during the question, since that would reveal the answer to assistive technology. Spatial map identification is inherently visual; keep the surrounding application controls accessible and document the limitation rather than creating a fake accessible equivalent that destroys the task.

## 12. Proposed file layout

```text
scripts/
  generate-maps.mjs          # dev-only geometry conversion
  verify.mjs                 # extend with map coverage/state assertions

src/
  data/
    maps/
      manifest.ts            # asset URLs, continent/region viewport metadata, overrides
  domain/
    map.ts                   # target order and map-session transitions
    models.ts                # map session/result + StudyTopic types
  infrastructure/
    map-assets.ts            # lazy asset loader/cache
    storage.ts               # separate location ledger / attempt persistence
  state/
    store.ts                 # map session orchestration
  ui/
    components/
      map.ts                 # SVG markup/state rendering
    views/
      map-quiz.ts
      map-results.ts
      map-scope.ts           # if existing scope view cannot stay clean

public/
  maps/
    africa.json
    asia.json
    europe.json
    north-america.json
    south-america.json
    oceania.json
```

Exact filenames can change during implementation; the separation of generated data, map domain logic, loading, state, and render-only UI should remain.

## 13. Implementation slices

### Slice 1 — Foundation / contracts

- [ ] Add map/session domain types.
- [ ] Add pure map state-transition functions.
- [ ] Add deterministic target ordering/shuffling.
- [ ] Add unit/verification coverage for 0/1/2/3-miss behavior.
- [ ] Define `StudyTopic` / separate progress ledger contract without changing current flag behavior.

**Exit condition:** map game logic can be tested with country IDs and no SVG/UI.

### Slice 2 — Geodata pipeline

- [ ] Pin Natural Earth source/version.
- [ ] Add generator.
- [ ] Add ISO3 reconciliation + explicit overrides.
- [ ] Generate six lazy-loaded continent assets.
- [ ] Generate region viewports.
- [ ] Add microstate/island locator metadata.
- [ ] Extend verification to require complete map coverage for the 195-country curriculum.

**Exit condition:** every in-scope country can be rendered and selected from generated assets.

### Slice 3 — Map renderer

- [ ] Render continent/region SVG.
- [ ] Distinguish interactive in-scope countries from faint context countries.
- [ ] Add enlarged hit areas/locator dots where required.
- [ ] Add hover/focus/pressed/transient-wrong states.
- [ ] Add resolved off-white/yellow/orange/red states.
- [ ] Validate phone layouts, especially Europe, Caribbean, Micronesia/Polynesia.

**Exit condition:** a static test harness can reliably tap every country on phone-size layouts.

### Slice 4 — Guided Learn game

- [ ] Add Map entry point and scope routing.
- [ ] Start/exit/repeat map sessions.
- [ ] Present target country name.
- [ ] Wire clicks to the 3-strike state machine.
- [ ] Auto-advance/reveal behavior.
- [ ] Results screen + Review mistakes.
- [ ] Preserve browser Back behavior and live-region announcements.

**Exit condition:** complete continent and region map rounds work end-to-end without persistent map mastery.

### Slice 5 — Persistent location learning

- [ ] Add location-progress ledger separate from flags.
- [ ] Convert map target outcomes into mastery evidence.
- [ ] Record geographic confusion selections.
- [ ] Add location progress stats where useful without cluttering the current flag UI.
- [ ] Verify reset semantics and storage failure degradation.

**Exit condition:** map learning survives app restarts and never changes flag mastery.

### Slice 6 — Hardening / release

- [ ] Extend `verify.mjs` for all map invariants.
- [ ] Test corrupt/missing map assets and stale country IDs.
- [ ] Test small-target locator behavior.
- [ ] Test reduced motion and mobile touch behavior.
- [ ] Verify no regression in current flag Home → Scope → Learn/Test → Results flow.
- [ ] Confirm service-worker caching of generated map assets after first use.

**Exit condition:** issue #1 can close with map mode stable across all supported continent/region scopes.

### Follow-up — Map Test mode

- [ ] One selection per target.
- [ ] No correctness reveal during the round.
- [ ] End-of-round map/results reveal.
- [ ] Decide whether Test outcomes should carry different mastery evidence than Learn outcomes.

## 14. Acceptance criteria for issue #1

Issue #1 is complete when:

1. A learner can choose Map and start any supported continent or existing region scope.
2. Every target country in that scope is represented once per standard round.
3. Clicking the correct country first try resolves it off-white.
4. One prior wrong click resolves the correct country yellow.
5. Two prior wrong clicks resolves it orange.
6. A third wrong click reveals/resolves the correct country red.
7. The game never permanently colors the wrong country as though it were solved.
8. Small countries remain practically selectable on a phone through explicit locator/hit-target treatment.
9. The end screen reports first-try accuracy and can launch a mistake-only review.
10. Map learning does not alter flag mastery.
11. All 195 curriculum countries either map to valid geometry or have an explicit validated locator treatment.
12. Map assets are locally hosted/lazy-loaded and no general map library ships at runtime.
13. Existing build, verification, PWA, flag-learning, storage-failure, and accessibility behavior remain passing.

## 15. Research notes / sources

- Natural Earth 1:50m Cultural Vectors — Admin 0 Countries: https://www.naturalearthdata.com/downloads/50m-cultural-vectors/
- Natural Earth Terms of Use (public domain): https://www.naturalearthdata.com/about/terms-of-use/
- Natural Earth canonical GeoJSON repository: https://github.com/nvkelso/natural-earth-vector
- D3 geographic projection/path tooling: https://d3js.org/d3-geo/projection and https://d3js.org/d3-geo/path
- WCAG 2.2 target-size guidance: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum

## 16. Recommendation

Keep issue #1 as the umbrella feature and implement the slices above in order. The first engineering change should be **Slice 1 (domain contracts/state machine)**, not the SVG UI. That establishes the behavior to test before geodata and rendering complexity arrive.
