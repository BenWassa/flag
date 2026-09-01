# Atlas Architecture

## Objective

Keep Atlas easy to deploy while preserving clean boundaries for a world-scale geography-learning product. React 19 owns production presentation, Vite owns browser builds, and the persistent Spatial Atlas is the default navigation presentation. Curriculum, learning rules, achievements, persistence and typed routing remain framework-independent TypeScript.

## Layers

```text
src/
  data/             curriculum + generated projected/spherical geography
  domain/           pure learning, scoring, evidence and achievement rules
  infrastructure/   storage, asset and cloud providers
  routing/          typed routes + browser routing adapter
  state/            application/session orchestration
  react/            production React shell + domain activities
  spatial/          production Three.js Earth, camera, picking and spatial state
  ui/               framework-independent formatting/map/icon adapters
  main.tsx          production browser entry
  sw.ts             Workbox service-worker policy
```

## Authority boundaries

### Data and geography

`countries.ts` owns canonical 195-country identity (ISO3). `continents.ts` / learning-scope data own navigable geography identity. UI surfaces do not create competing geography trees.

Locations, Outlines, Neighbours and Spatial Atlas reuse the canonical Natural Earth 1:10m source/policy. Projected continent assets and spherical world/continent LODs are generated outputs of the same pinned source, not parallel datasets. Neighbour adjacency is topology-derived.

### Domain

Domain modules own learning/scoring/evidence/achievement rules and have no DOM/React dependency. Presentation never reimplements evidence weights or mastery thresholds.

Country evidence is the live learning/scheduling layer. `achievements.ts` owns separate persistent region × domain Mastery, complete-region, complete-continent and World Crown state. #108 ensures only exact complete-region qualifying Play can advance Mastery streaks.

### Infrastructure

Domain ledgers persist independently. Achievement state and in-progress region-perfect-run streaks persist separately. Firebase/Auth/Firestore remains optional local-first infrastructure and must not leak account concerns into geography/domain rules.

### Routing

`routing/routes.ts` owns typed route identity, parse/serialise, ancestry, stable-route and availability normalisation. Hash transport remains appropriate for GitHub Pages/PWA.

URLs own durable navigation state (domain, scope, activity, profile). Round order, question index, guesses, timers and result process state remain ephemeral.

### State

`AppStore` coordinates domain sessions, evidence persistence and achievement recording. Stable internal `test` is learner-facing **Play**.

### React and Spatial presentation

`src/react/AtlasApp.tsx` composes the router, store and activities. `src/spatial/` is the normal navigation presentation:

```text
route + current view + achievements
        ↓
deriveSpatialState(...)    # pure
        ↓
SpatialShell
  ├── SpatialStage         # persistent Earth
  └── SpatialCommand       # real DOM navigation
```

There is no second spatial navigation stack. Geography taps and DOM controls dispatch the same `AtlasActions`.

When WebGL cannot start, the conventional `Launcher` renders from the same `scopeModelFor` model. It is fallback infrastructure, not an alternate product IA.

## Production information architecture

```text
choose domain
→ Earth: choose continent
→ continent focus: Play continent or choose region
→ region focus: Play/Learn region
→ domain-native activity
→ Results / spatial context
```

Geography selection and starting a round are deliberately separate. The old one-tap region launcher row is historical, not normal production behaviour.

The dedicated Progress route/screen is retired. Progress and prestige are disclosed in current navigation/activity/results surfaces rather than a separate dashboard.

## Activity boundary

Spatial Atlas yields the viewport when a second geography/recognition surface would compete or leak information:

- Locations Play/Learn: projected map owns the screen;
- Outlines Play/Learn: silhouette owns the screen;
- Neighbours Play/Learn: neighbour map/set interaction owns the screen;
- Flags Learn/Profile: full surface;
- Flags Play: inert answer-safe spatial context may remain;
- Results: reframe the scope just practised.

## Persistence

Stable compatibility namespaces remain versioned (`flag-atlas:*`). Persisted schema changes require migration rather than silent key changes. Earned achievement is monotonic under the current model while live evidence may lapse independently.

## PWA

Vite/Workbox builds the service worker. The shell and required Spatial bootstrap are cached according to the established policy; heavy continent detail remains lazy/runtime-cached. Renderer failure must remain recoverable and the app remains usable without WebGL.

## Current support

Flags, Locations, Outlines and Neighbours now ship intended production curriculum across all six real continents, with the domain-specific completeness constraints documented in `PRODUCT.md`. `worldHasCompleteCurriculum()` is true; the World Crown still requires all six actual continent-completion achievements and #138 already surfaces it when earned.

## Quality gates

`npm test` is the primary repository gate under Node 22. Changes additionally exercise the relevant browser/accessibility/PWA/geography matrix based on risk. Production changes require current-main sync, exact artifact inspection where relevant and green CI before merge. Physical-device evidence is only claimed when actually performed.
