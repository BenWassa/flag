# Flag Atlas Architecture

## Objective

Keep the MVP extremely easy to deploy while preserving clean boundaries for a larger application. The project uses TypeScript with zero runtime framework dependencies. This gives the GitHub Pages prototype a tiny surface area while keeping learning logic portable.

## Layers

```text
src/
  data/             Static curriculum and curated confusion clusters
  domain/           Pure learning and quiz-generation rules
  infrastructure/   Storage and flag-asset providers
  state/            App/session orchestration
  ui/               Render-only components and views
  app.ts             Browser composition root and event routing
```

### Data

`countries.ts` is the canonical 195-country curriculum. `continents.ts` owns geographic group metadata. UI screens never duplicate those records.

### Domain

`progress.ts` owns knowledge transitions, retention state, and scope statistics.

`quiz.ts` owns target selection, distractor choice, seeded randomization, and correct-position balancing.

These modules have no DOM or persistence dependencies. They can be moved into a React Native/Expo or backend environment later.

### Infrastructure

`storage.ts` is the local persistence adapter. A Firebase implementation should satisfy the same conceptual responsibilities rather than leaking Firestore APIs into domain/UI code.

`flags.ts` is the asset-provider seam. MVP uses FlagCDN. A later local asset bundle or Firebase Storage provider can replace it centrally.

### State

`AppStore` coordinates sessions, applies domain transitions, persists attempts, and exposes state to views.

### UI

Views are pure-ish HTML render functions. They consume current state and emit data attributes; `app.ts` performs event routing. This avoids coupling learning rules to click handlers.

## Why no runtime framework yet

The MVP is small enough that a framework would add installation and bundle complexity without improving the learning engine. The key long-term asset is the domain/data separation. If product complexity later justifies React, React Native, or Expo, views can be replaced while keeping `data/`, `domain/`, and most infrastructure contracts.

## Persistence

LocalStorage keys are versioned:

- `flag-atlas:progress:v1`
- `flag-atlas:attempts:v1`

A schema migration layer should be added before introducing a v2 persisted shape.

Attempt history is bounded to the most recent 5,000 events in the MVP to prevent unbounded local storage growth.

## Firebase path

Recommended sequence:

1. Keep local-first state as source of immediate UI response.
2. Add Firebase Auth only when cross-device identity is required.
3. Add Firestore sync through a repository adapter.
4. Resolve conflicts using event timestamps plus a monotonic attempt log where practical.
5. Use Remote Config for adaptive-scheduler experiments only after the baseline model is measured.
6. Keep hosting independent from data services; Firebase Hosting can replace GitHub Pages at any time.

## PWA

The service worker caches:

- application shell;
- compiled module requests after first use;
- fetched FlagCDN SVGs.

For production-grade offline learning, vendor the 195 flag SVGs into the repository or a controlled asset host and precache them.

## Quality gates

`scripts/verify.mjs` asserts:

- 195-country catalog;
- unique ISO3 values;
- valid continent/region assignments;
- standard question option uniqueness;
- correct-answer integrity;
- balanced answer positions;
- no three-position run.

CI runs build + verification before GitHub Pages deployment.

## Future test strategy

As logic expands, add focused unit suites around:

- state transition table;
- mastered lapse/recovery;
- retention scheduling;
- candidate weighting;
- confusion-aware distractors;
- deterministic seeded sessions;
- persistence migrations.

A browser E2E suite should cover Home → Region → Learn → Results and Test-mode no-feedback behavior.
