# Atlas Architecture

## Objective

Keep Atlas easy to deploy while preserving clean boundaries for a larger geography-learning product. React 19 owns production presentation and Vite owns browser builds; curriculum, learning rules, achievements, persistence and typed routing remain framework-independent TypeScript.

## Layers

```text
src/
  data/             curriculum + generated geography configuration
  domain/           pure learning, scoring, achievement and IA rules
  infrastructure/   storage + asset providers
  routing/          typed routes + browser routing adapter
  state/            application/session orchestration
  react/            production React shell, screens and shared components
  ui/               framework-independent formatting/map/icon adapters + legacy verifier fixtures
  main.tsx          production browser entry point
  sw.ts             Workbox service-worker policy
```

### Data

`countries.ts` is the canonical 195-country curriculum. Country identity is ISO3. `continents.ts` and `learning-scopes.ts` own canonical navigation/learning scope identity; individual UI surfaces must not create competing geography trees.

Locations, Outlines and Neighbours reuse the generated production geography foundation. Neighbour adjacency is derived from canonical topology rather than handwritten tables.

### Domain

`models.ts` owns shared primitives including learning domains, activities, study scopes and persisted evidence shape.

`evidence.ts` normalises passive exposure, assisted retrieval, clean retrieval and contradictory evidence across domain-native ledgers. It is the live **country learning/scheduling** layer.

`achievements.ts` owns the separate earned hierarchy: region × domain Mastery, complete region, complete continent and World Crown. In v1 this hierarchy is driven by persisted region-scoped Play perfect-run streaks, not by aggregating country `mastered` status.

`qualifiesForRegionMastery(record)` remains in `evidence.ts` under a historical compatibility name for per-country strong-evidence qualification; it is **not** the current earned-achievement integration seam.

Issue #108 closed the qualification-integrity defect: all domains now launch
complete-region Play and verify the exact supported target set before recording
a region perfect-run event.

`progress.ts` owns Flags/Outlines country-record transitions. Locations and Neighbours retain domain-native session/progress models because their retrieval mechanics are not equivalent to multiple-choice recognition.

These rules remain DOM-independent.

### Infrastructure

`storage.ts`, `outline-storage.ts`, `map-storage.ts` and `neighbor-storage.ts` persist independent learning ledgers. `evidence-storage.ts` provides shared sanitisation/migration support.

`achievement-storage.ts` separately persists earned achievements and in-progress region-perfect-run streaks. Storage helpers also define explicit reset semantics, but the current React product does not expose a learner-facing coordinated full-reset action.

`flags.ts` remains the flag asset-provider seam.

### Routing

`routing/routes.ts` owns the typed route union plus parse/serialise, parent, stable-route, availability normalisation and title helpers. `routing/router.ts` is the current hash-URL browser adapter for GitHub Pages.

URLs own durable navigation state: learning domain, geographic scope, profile/stable screen identity and activity identity. Quiz ordering, current index, guesses, feedback, timers and result objects remain ephemeral session state.

A hard refresh of an activity route without its matching in-memory session returns to the activity's stable scope rather than serialising a partial quiz.

See `routing.md`.

### State

`AppStore` coordinates the four domain sessions, applies evidence transitions, persists attempts, records region-scoped Play outcomes into achievement streaks and refreshes earned achievements.

The stable internal `test` mode is learner-facing **Play**. Presentation must not duplicate scoring/evidence/achievement thresholds in React components.

Completed session objects may remain in memory so browser Back/Forward can revisit live round/result state within the same process. They are not persisted as durable route state.

### React production UI

`src/react/AtlasApp.tsx` composes the typed router, `AppStore` and round controllers into the production application. React components own production controls, lifecycle and screen composition.

Generated geography, projection maths, map pan/zoom and Neighbours map runtime remain imperative/framework-independent boundaries mounted by React where appropriate.

Legacy `src/ui/views/*` string renderers remain verifier compatibility fixtures after the v1 React/Vite migration; they are not production screens.

## Product-information-architecture boundary

The current production flow is mode-first:

`Home → domain index → supported continent launcher → Play continent/region`

Launcher rows start Play directly. Learn remains a subordinate whole-continent action; Flags Learn opens its browse/reveal gallery while the other domains start domain-appropriate Learn rounds.

Unsupported scopes normalise to the relevant **domain index**, which exposes honest availability shells. They are never silently substituted with Africa or treated as completed curriculum.

The dedicated Progress route/screen is retired; progress/achievement presentation now lives in Home, domain indexes, continent launchers and Results.

## Persistence

The four learning-ledger payloads use current versioned schemas while retaining stable compatibility namespaces including:

- `flag-atlas:progress:v1`;
- `flag-atlas:outline-progress:v1`;
- `flag-atlas:location-progress:v1`;
- `flag-atlas:neighbor-progress:v1`.

Loaders accept supported legacy/current payloads and migrate deterministically without inventing historical Learn/Play mode where it cannot be known.

Earned achievements and perfect-run streaks use independent namespaces:

- `flag-atlas:earned-achievements:v1`;
- `flag-atlas:region-domain-perfect-run-streaks:v1`.

Earned achievement is monotonic under the current product model; live country evidence may lapse independently.

## Firebase path

Firebase/Auth/Firestore integration is intentionally outside this product/design reconciliation. Existing Firebase behaviour and its dedicated documentation remain authoritative for cloud/account concerns. Product documentation must not infer new sync, hosting or reset semantics from the local achievement model.

## PWA

Vite builds `src/sw.ts` through Workbox InjectManifest. The generated precache owns the versioned shell; runtime caching covers same-origin lazy assets and the existing external flag-asset strategy. Hash deep links remain compatible with GitHub Pages and the installed PWA.

Lazy continent chunks become available offline after first use through runtime caching rather than being forced into the initial precache.

## Current geography support

- Flags: full 195-country curriculum.
- Locations: Africa, South America, Europe and Asia.
- Outlines: Africa, South America, Europe and Asia.
- Neighbours: Africa, South America, Europe and Asia, limited to targets with complete representable canonical land-neighbour sets.
- North America (#22) and Oceania (#27): incomplete for the three geography-dependent domains.

Availability is a data/support concern, not a reason for parallel routers or duplicate domain architectures.

## Quality gates

`npm test` is the primary repository gate under Node 22. It covers type checking, React component tests, the production Vite/PWA build and the plain-Node verification suite.

Product-semantics ownership is split intentionally:

- learning-evidence verification owns country evidence weighting, lapse/recovery, migration and domain mappings;
- achievement verification owns perfect-run streaks, support guards, persistence and region/continent/world aggregation;
- #108 added explicit complete-target-set qualification coverage without coupling achievements back to raw country scheduler fields;
- routing/IA verification owns the current one-tap launcher contract and unavailable-scope fallback;
- browser smoke tests cover production-preview desktop/mobile flows.

Exact production-artifact inspection and current-main sync remain required before merge for changes that affect production behaviour.
