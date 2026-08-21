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

`models.ts` owns shared product primitives including learning domains, activities, geographic study scopes and the persisted shared country-evidence summary.

`evidence.ts` is the narrow cross-domain evidence seam. It normalises passive exposure, assisted retrieval, clean retrieval and contradictory evidence; applies Learn/Play/Review weighting behind one reducer; and exposes `qualifiesForRegionMastery(record)` as the contract consumed by the earned-achievement layer. Issue #34 must use this selector rather than inspect raw scheduler/storage fields.

`progress.ts` owns Flags/Outlines recognition transitions, retention state and scope statistics around the shared evidence reducer.

`quiz.ts` owns target selection, distractor choice, seeded randomization, and correct-position balancing.

Locations and Neighbours keep their own session/progress models because location retrieval and complete-neighbour-set knowledge are distinct competencies. Their engines map resolved native outcomes into `evidence.ts` without flattening native miss, reveal, set-completion or confusion history.

These modules have no DOM dependencies and can be moved into a React Native/Expo or backend environment later.

### Infrastructure

`storage.ts`, `outline-storage.ts`, `map-storage.ts` and `neighbor-storage.ts` persist the four independent learning ledgers. `evidence-storage.ts` provides the shared evidence-summary sanitiser/migration helper while each domain adapter remains responsible for translating its native legacy counters honestly.

`flags.ts` is the flag asset-provider seam. MVP uses FlagCDN. A later local asset bundle or Firebase Storage provider can replace it centrally.

### Routing

`routing/routes.ts` is the durable navigation model. It owns one typed route union plus pure parsing, serialization, parent, stable-route, and title helpers.

`routing/router.ts` is the browser transport adapter. The current adapter uses hash URLs because GitHub Pages has no SPA rewrite. Product navigation consumes typed routes, so a later clean History-path adapter can replace the transport without changing domain/scope navigation calls.

The URL owns stable navigation state: learning domain, geographic scope, stable screens, and active activity identity. Quiz ordering, current index, guesses, feedback, timers, and result objects remain session state.

Active-round hard refresh intentionally returns to the round's stable scope rather than attempting partial restoration. See [`routing.md`](routing.md) for the full route contract and migration rationale.

### State

`AppStore` coordinates the four domain sessions, applies domain transitions, persists attempts, and exposes state to views. It passes stable internal `test` activity to the evidence layer as learner-facing Play without hard-coding scoring weights in UI/application code.

Completed session objects remain in memory so browser Back/Forward can revisit a still-live round/result during the current process. They are not persisted as route state.

### UI

Views are pure-ish HTML render functions. They consume current state and emit semantic `data-action` attributes; `app.ts` performs interaction routing. This avoids coupling learning rules or raw URL strings to screen templates.

Country-level scheduler values remain internal. Routine UI uses Unseen, Learning, Strong evidence and Due for review rather than individual-country Mastered achievements or scheduler `x/y` punch cards.

## Why no runtime framework yet

The application remains small enough that a framework would add installation and bundle complexity without improving the learning engines or router. The key long-term assets are the data/domain/routing boundaries. If product complexity later justifies React, React Native, or Expo, views can be replaced while keeping `data/`, `domain/`, `routing/`, and most infrastructure contracts.

## Persistence

The four learning ledgers now use payload schema `version: 2` while retaining stable existing LocalStorage namespaces, including:

- `flag-atlas:progress:v1`
- `flag-atlas:outline-progress:v1`
- `flag-atlas:location-progress:v1`
- `flag-atlas:neighbor-progress:v1`

The key suffix remains a compatibility namespace; the payload contains the authoritative schema version.

Each loader accepts legacy payload `version: 1` and current payload `version: 2`, sanitises every record, deterministically reconstructs the shared evidence summary from known native history, and returns a v2 in-memory ledger. Existing strong records, lapses, confusion counts and domain-native counters are preserved. Historical clean retrievals whose Learn/Play mode cannot be known are retained as `legacyScoredRetrievals` rather than guessed.

Attempt-history namespaces remain separate and bounded to prevent unbounded local-storage growth.

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

`scripts/verify.mjs` asserts the core flag curriculum, quiz invariants, degraded states and shared UI hardening.

`scripts/verify-learning-evidence.mjs` asserts passive/assisted/clean/Play/Review evidence semantics, lapse recovery, domain-specific mappings, v1 → v2 migration, ledger independence, the #34 qualification selector and country-level UI language.

Map/outline/neighbour verification scripts assert their native learning engines, Africa coverage, feedback and interaction contracts.

`scripts/verify-routing.mjs` asserts:

- typed route parse/serialize round trips;
- canonical continent/region ancestry;
- conceptual parent hierarchy;
- invalid-route rejection;
- active activity → stable scope refresh fallback contract;
- absence of the legacy in-memory `viewStack`/history index;
- current Home/scope IA;
- shared Back semantics across domains;
- PWA hash start route, cache version, and offline navigation fallback.

`npm test` runs `npm run check`, the production build and every verification script. CI executes it under Node 22 before uploading the exact `dist/` production artifact.

## Future test strategy

As logic expands, add focused unit suites around:

- evidence transition tables;
- lapse/recovery and review retention;
- candidate weighting;
- confusion-aware distractors;
- deterministic seeded sessions;
- persistence migrations;
- region × domain qualification/achievement integration;
- browser route transitions and focus restoration.

A browser E2E suite should cover Home → scope → domain Learn/Play → Results, Play-mode feedback behaviour, cold deep links, refresh fallback, Back/Forward, and PWA/offline navigation.
