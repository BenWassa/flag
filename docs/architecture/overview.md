# Atlas Architecture

## Objective

Keep the application extremely easy to deploy while preserving clean boundaries for a larger geography-learning product. The project uses TypeScript with zero runtime framework dependencies. This gives the GitHub Pages PWA a small surface area while keeping learning logic and navigation portable.

## Layers

```text
src/
  data/             Static curriculum and curated confusion clusters
  domain/           Pure learning, quiz-generation, and shared IA primitives
  infrastructure/   Storage and asset providers
  routing/          Typed routes plus browser routing adapter
  state/            App/session orchestration
  ui/               Render-only components and views
  app.ts             Browser composition root and interaction routing
```

### Data

`countries.ts` is the canonical 195-country curriculum. `continents.ts` owns geographic group metadata. UI screens and routes reuse those IDs rather than creating parallel geography trees.

Map-specific country membership may remain in map curriculum configuration, but continent/region identity and labels come from the shared geography taxonomy.

### Domain

`models.ts` owns shared product primitives including learning domains, activities, and geographic study scopes.

`progress.ts` owns flag-knowledge transitions, retention state, and scope statistics.

`quiz.ts` owns target selection, distractor choice, seeded randomization, and correct-position balancing.

Map learning keeps its own session/progress model because flag recognition and country-location knowledge are separate competencies.

These modules have no DOM dependencies and can be moved into a React Native/Expo or backend environment later.

### Infrastructure

`storage.ts` is the flag-progress persistence adapter. Map progress has its own storage adapter/key. A Firebase implementation should satisfy the same conceptual responsibilities rather than leaking Firestore APIs into domain/UI code.

`flags.ts` is the flag asset-provider seam. MVP uses FlagCDN. A later local asset bundle or Firebase Storage provider can replace it centrally.

### Routing

`routing/routes.ts` is the durable navigation model. It owns one typed route union plus pure parsing, serialization, parent, stable-route, and title helpers.

`routing/router.ts` is the browser transport adapter. The current adapter uses hash URLs because GitHub Pages has no SPA rewrite. Product navigation consumes typed routes, so a later clean History-path adapter can replace the transport without changing domain/scope navigation calls.

The URL owns stable navigation state: learning domain, geographic scope, stable screens, and active activity identity. Quiz ordering, current index, guesses, feedback, timers, and result objects remain session state.

Active-round hard refresh intentionally returns to the round's stable scope rather than attempting partial restoration. See [`routing.md`](routing.md) for the full route contract and migration rationale.

### State

`AppStore` coordinates flag and location sessions, applies domain transitions, persists attempts, and exposes state to views. It no longer acts as the authoritative navigation model; the current typed URL route determines which stable screen or live session view should render.

Completed session objects remain in memory so browser Back/Forward can revisit a still-live round/result during the current process. They are not persisted as route state.

### UI

Views are pure-ish HTML render functions. They consume current state and emit semantic `data-action` attributes; `app.ts` performs interaction routing. This avoids coupling learning rules or raw URL strings to screen templates.

Home is a compact learning-domain index. Flags and Locations are peer domains; Outlines and Neighbors have reserved homes for Issues #2/#3. Each available domain then reuses the same domain → continent → region → Learn/Test/Review hierarchy where the mechanic supports it.

## Why no runtime framework yet

The application remains small enough that a framework would add installation and bundle complexity without improving the learning engines or router. The key long-term assets are the data/domain/routing boundaries. If product complexity later justifies React, React Native, or Expo, views can be replaced while keeping `data/`, `domain/`, `routing/`, and most infrastructure contracts.

## Persistence

Flag LocalStorage keys are versioned, including:

- `flag-atlas:progress:v1`
- `flag-atlas:attempts:v1`

Location learning uses separate persisted state/attempt history. A schema migration layer should be added before introducing a v2 persisted shape.

Attempt history is bounded to prevent unbounded local-storage growth.

## Firebase path

Recommended sequence:

1. Keep local-first state as source of immediate UI response.
2. Add Firebase Auth only when cross-device identity is required.
3. Add Firestore sync through a repository adapter.
4. Resolve conflicts using event timestamps plus a monotonic attempt log where practical.
5. Use Remote Config for adaptive-scheduler experiments only after the baseline model is measured.
6. Keep hosting independent from data services; Firebase Hosting can replace GitHub Pages at any time.
7. If hosting gains SPA rewrites, swap the hash router transport for clean History paths while retaining the typed route model.

## PWA

The service worker caches the application shell and runtime-fetched same-origin modules/assets, with a network-first application-shell policy and cached `index.html` navigation fallback when offline.

Hash deep links are compatible with GitHub Pages and the PWA because fragments do not alter the server request path. The manifest launches at the canonical `./#/` Home route.

For production-grade offline flag learning, vendor the 195 flag SVGs into the repository or a controlled asset host and precache them.

## Quality gates

`scripts/verify.mjs` asserts the core flag curriculum and quiz invariants.

Map verification scripts assert the location-game, Africa coverage, feedback, and map interaction contracts.

`scripts/verify-routing.mjs` asserts:

- typed route parse/serialize round trips;
- canonical continent/region ancestry;
- conceptual parent hierarchy;
- invalid-route rejection;
- active activity → stable scope refresh fallback contract;
- absence of the legacy in-memory `viewStack`/history index;
- Home learning-domain IA;
- shared Back semantics across flags and locations;
- PWA hash start route, cache version, and offline navigation fallback.

CI runs build + every verification script before producing the GitHub Pages artifact.

## Future test strategy

As logic expands, add focused unit suites around:

- state transition tables;
- mastered lapse/recovery;
- retention scheduling;
- candidate weighting;
- confusion-aware distractors;
- deterministic seeded sessions;
- persistence migrations;
- browser route transitions and focus restoration.

A browser E2E suite should cover Home → Domain → Region → Learn → Results, Test-mode no-feedback behavior, cold deep links, refresh fallback, Back/Forward, and PWA/offline navigation.
