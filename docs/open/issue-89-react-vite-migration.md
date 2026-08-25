# Issue #89: Migrate Atlas to React and Vite without rewriting the product engine

**Status:** Open

## Summary

Migrate Atlas's presentation and build layers from hand-rendered HTML and bespoke
build tooling to React, Vite and TypeScript. Treat this as an incremental,
in-place platform migration, not a product rewrite.

The migration should preserve Atlas's domain, geography, learning, evidence,
achievement, persistence and routing contracts while replacing the parts that
now carry disproportionate lifecycle complexity:

- `src/app.ts` as the central UI and event coordinator;
- string-template screen renderers and full-root `innerHTML` replacement;
- global delegated `data-action` event dispatch;
- manual focus, scroll and asynchronous view lifecycle recovery;
- the bespoke TypeScript build, asset-copy and polling development server.

This issue is a tracking epic. It should be delivered through a sequence of
small, independently verifiable pull requests rather than one long-lived port
branch or a new application scaffold.

## Why now

Atlas is already a strict TypeScript application with strong separation across
`data`, `domain`, `infrastructure`, `routing`, `state` and `ui`. The product
engine is not the migration problem and should not be rewritten.

The pressure is concentrated above those layers:

- `src/app.ts` is 952 lines and owns bootstrap, routing, round orchestration,
  rendering, install UI, notices, live announcements, focus, scroll, keyboard
  input, delegated events, gestures, persistence flushing and service-worker
  registration;
- 15 view modules and shared UI helpers return HTML strings;
- every material state transition replaces `#app`, forcing transient state and
  DOM continuity to be restored manually;
- `scripts/build.mjs` and `scripts/dev.mjs` implement compilation, staged
  atomic builds, locking, asset copying, file watching and static serving;
- the six production stylesheets remain hand-authored and valuable, but their
  ownership is increasingly detached from the views they style.

React is justified by the UI lifecycle and ownership problem. Vite is justified
independently by the build and development tooling problem.

## Decision

Use:

- React with the current supported major at implementation time;
- Vite with a Node 22-compatible supported release;
- TypeScript in strict mode;
- the existing typed Atlas hash router behind a React adapter;
- the existing `AppStore` and round controllers behind a small observable
  adapter during the port;
- plain CSS, existing semantic tokens and focused feature stylesheets;
- Vitest and Testing Library for new unit/component coverage;
- Playwright for critical browser flows;
- GitHub Pages as the static deployment target;
- an explicit custom-service-worker integration, likely InjectManifest, that
  preserves Atlas's runtime caching policy while incorporating Vite's generated
  asset manifest.

Do not add Next.js, React Router, Redux, Zustand, Tailwind or a server runtime as
part of this migration. Any later adoption needs its own demonstrated need.

## Architectural boundary

### Preserve without semantic changes

- country, continent, region and curriculum data;
- generated cartography and pinned Natural Earth provenance;
- topology, adjacency and neighbour derivation;
- scoring, evidence, scheduling and achievement rules;
- stored payload schemas, storage keys and migration behaviour;
- route parsing, serialisation, normalisation and stable hash URLs;
- active-round refresh policy and route/session compatibility;
- round controllers and their timing/outcome semantics;
- British-English learner copy and stable internal identifiers;
- Tactile Atlas colour, typography, spacing, control, motion and achievement
  contracts;
- GitHub Pages static hosting and PWA installability;
- existing invariant verifiers and generated-asset workflows.

### Replace or adapt

- application bootstrap and root composition;
- route/store subscriptions into React;
- string-template view modules;
- delegated `data-action` dispatch;
- global view-specific event handling;
- root-wide `innerHTML` replacement;
- DOM-discovery-based component setup where a ref or component lifecycle is the
  appropriate owner;
- bespoke build, watcher and development server;
- hard-coded service-worker shell asset names;
- UI-specific verifier assertions that intentionally depend on old template
  implementation details.

### Keep outside React

React must not become a dependency of `src/domain`, `src/data`, cartography
generation or persistence implementations. Geometry calculation and gesture
math may remain imperative modules even when React owns their DOM lifecycle.

## Target dependency direction

```text
React features and shared UI
            |
            v
application adapters and round controllers
            |
            v
domain models and rules
            |
            v
data and generated geography

infrastructure implements storage, assets and PWA boundaries
```

The exact folder layout can evolve during the migration. Dependency direction
and ownership boundaries matter more than a speculative large-scale directory
move.

## Delivery strategy

Each phase below should be a focused child issue or pull request with its own
acceptance criteria. `main` must stay deployable between phases. Temporary
adapters are expected and should be named and tracked for removal.

### Phase 0: baseline and migration contract

- Record the current production routes and critical learner flows.
- Capture representative screenshots at phone portrait, short landscape and
  desktop widths for parity comparison.
- Record the current built shell, lazy geography chunks, PWA install/offline
  behaviour and service-worker update behaviour.
- Map existing verifiers to preserved contract, implementation-coupled assertion
  or missing browser coverage.
- Add a short architecture decision record for the migration boundary and
  dependency rules.
- Decide whether #71 physical-device validation is completed before the port or
  explicitly repeated against both the current and migrated gesture layers.
- Avoid overlapping hosting/storage changes from #46 during this migration.

Exit gate: parity evidence and the non-regression matrix are committed before
the production entry point changes.

### Phase 1: Vite foundation with the existing UI

- Introduce Vite while retaining the current vanilla TypeScript application.
- Preserve the repository-relative GitHub Pages base path and hash routes.
- Move static assets to a Vite-compatible structure without renaming stable PWA
  or storage identities unnecessarily.
- Preserve lazy continent asset loading and verify chunk budgets.
- Replace `scripts/build.mjs` and `scripts/dev.mjs` only after their concurrency,
  complete-artifact and no-partial-`dist` guarantees are either retained or
  made unnecessary by the new workflow.
- Update TypeScript and CI configuration so `npm run check`, `npm run build` and
  `npm test` retain their meanings.
- Adapt existing `dist/`-importing verifiers to Vite output deliberately. Do not
  silently drop them.

Exit gate: unchanged UI and behaviour build and deploy through Vite, all existing
verifiers pass, direct/hash navigation works on GitHub Pages, and output has no
absolute-root asset assumptions.

### Phase 2: PWA and generated-asset integration

- Replace the hard-coded service-worker shell list with a build-aware manifest
  integration while preserving Atlas-specific behaviour:
  - versioned shell lifecycle and old-cache cleanup;
  - offline navigation fallback;
  - network-first same-origin application/geography assets;
  - cache-first external `flagcdn.com` flags;
  - lazy geography caching after first use;
  - update and reload behaviour that does not strand a mixed-version shell.
- Preserve the web app manifest, icons, iOS metadata, install prompt and
  dismissal persistence.
- Verify install and offline behaviour from the built production artifact, not
  only Vite's development server.

Exit gate: an installed/offline Atlas session can open the shell, revisit loaded
geography and recover correctly after a new deployment.

### Phase 3: React shell and compatibility adapters

- Add `main.tsx`, `App` and an application shell.
- Wrap the existing hash router with a React subscription hook, preferably using
  `useSyncExternalStore` or an equivalently tear-safe adapter.
- Give `AppStore` an explicit subscribe/notify boundary without changing its
  learning or persistence semantics.
- Move document title, route normalisation, visible notices, hidden routine live
  announcements and install UI into stable React-owned lifecycles.
- Preserve page focus, scroll restoration, active-round refresh handling,
  navigation gestures, persistence flushing and service-worker registration.
- Define an error boundary and user-visible degraded state for render failures.

Exit gate: React owns the application shell, while existing screens can still be
hosted through a temporary compatibility boundary with no learner-visible
regression.

### Phase 4: passive navigation and study surfaces

Port lower-risk surfaces first:

- Home;
- per-domain continent index;
- continent/region launcher and launcher map;
- unavailable/shell states;
- Flags browse-and-reveal Learn surface.

Build only the shared primitives that these surfaces prove they need, such as
buttons, icon buttons, page headers, mode cards, geography rows, progress bars,
notices and busy states. Preserve Phosphor through Atlas's semantic icon adapter
and preserve the Tactile Atlas CSS tokens.

Exit gate: route navigation, Back/Forward, direct links, busy/error states,
keyboard focus, install/notice UI and responsive layouts match or improve on the
baseline.

### Phase 5: Flags and Outlines active rounds

- Port quiz, feedback, results, repeat and review flows for Flags.
- Port the equivalent Outlines flows.
- Retain existing round controllers and evidence updates.
- Replace action delegation with component-owned handlers without changing
  learner-facing timing or announcement order.
- Preserve image failure handling, answer-safe accessible names, autofocus
  intent, keyboard shortcuts and reduced-motion behaviour.

Exit gate: Learn, Play, wrong/correct feedback, review, repeat, exit, refresh
recovery, evidence persistence and earned-achievement updates pass automated and
browser tests for both domains.

### Phase 6: Locations map surfaces

- Port launcher/quiz/results map composition.
- Put DOM ownership in React while retaining map geometry and viewport maths.
- Bind imperative pan, zoom, pointer and keyboard behaviour through explicit refs
  with deterministic setup and cleanup.
- Preserve lazy geometry loading, stale-request invalidation, launch busy/error
  feedback, selected/wrong/correct visual states and map framing.
- Verify touch, mouse, keyboard and reduced-motion paths.

Exit gate: all Locations routes and active-round flows pass parity, accessibility,
mobile gesture and cartography checks across every supported continent.

### Phase 7: Neighbours map and input surfaces

- Port the map, combobox/suggestions, guess submission, zero-neighbour case,
  feedback and results flows.
- Preserve keyboard semantics and the mobile keyboard/map anchoring contract.
- Replace partial layer `innerHTML` updates only where React ownership improves
  lifecycle clarity without regressing map performance.
- Preserve country resolution, adjacency policy and answer announcements.

Exit gate: Neighbours passes keyboard, mobile viewport, map, zero-neighbour,
review and persistence tests across every supported continent.

### Phase 8: remove compatibility layer and rationalise CSS

- Remove all migrated string renderers, delegated action dispatch and obsolete
  app coordinator code.
- Delete temporary React/legacy mounting adapters.
- Split CSS by stable ownership only after old markup is gone.
- Preserve `atlas-theme.css` as normative design-system truth or migrate its
  rules into equivalently documented token/primitives files in a dedicated,
  reviewable change.
- Use coverage and production markup inspection to remove dead selectors.
- Update architecture and contributor documentation to describe the final
  runtime and development workflow.

Exit gate: no production UI depends on `innerHTML` string screens or global
`data-action` routing, and no temporary migration adapter remains untracked.

### Phase 9: optional post-parity state decomposition

Splitting `AppStore` is not required to complete the React port. After parity,
evaluate smaller application stores for progress, achievements, sessions and
rounds. Do this only if the React adapter exposes a concrete maintainability or
rendering problem. Do not introduce a third-party state library by default.

## Cross-cutting acceptance criteria

### Product and compatibility

- Atlas remains the learner-facing name.
- Learner copy remains British English, including `Neighbours` and `Play`.
- Stable internal `neighbors`, `test`, route, storage and cache identifiers are
  preserved unless a separately documented migration is necessary.
- Existing learner progress and earned achievements load without loss.
- Unsupported continent/domain shells remain inert and cannot count as complete.
- No country is promoted to a learner-facing prestige Mastery achievement.
- The mode-first Home, continent index and launcher information architecture is
  unchanged unless separately approved.

### Accessibility and interaction

- Every route and control is keyboard operable with visible focus.
- Route changes and material state changes place focus deliberately.
- Routine announcements and visible failed-action notices remain distinct and
  are not duplicated.
- Controls retain practical 44px touch targets where required.
- State is not communicated by colour alone.
- Reduced motion removes transform-based press/motion effects as today.
- Layout remains usable at phone portrait, short landscape, desktop and 200%
  text zoom.
- Browser Back/Forward, direct hash links and refresh behave consistently.

### Performance and maps

- Initial shell and lazy-continent payload budgets are measured before and after.
- React does not pull all continent geometry into the initial bundle.
- Map interaction remains responsive during pan, zoom, answer and label updates.
- No second cartographic source or hand-maintained geometry is introduced.
- Generated map files remain generated through the documented workflow.

### PWA and deployment

- `dist/` is a complete static GitHub Pages artifact.
- Asset URLs work under the repository subpath, not only at `/`.
- The manifest, icons, theme metadata and standalone iOS metadata are retained.
- Install prompting and dismissal persistence continue to work.
- Offline shell fallback, cached flags and previously loaded geography work.
- A deployment update does not leave incompatible old HTML and new hashed assets.

### Verification

- `npm run check` type-checks all TypeScript and TSX.
- `npm test` builds production output and runs the full invariant suite.
- Existing plain-Node geography, learning, routing, product-language,
  achievement and cartography verifiers remain in force.
- New component behaviour uses Vitest and Testing Library where DOM-level unit
  coverage is appropriate.
- Playwright covers at minimum:
  - Home to launcher to Learn/Play navigation;
  - Back/Forward, direct hash URL and refresh;
  - one complete Flags and Outlines flow;
  - Locations load, answer, pan/zoom and results;
  - Neighbours input, keyboard selection, map feedback and results;
  - unavailable geography and failed lazy-load feedback;
  - stored progress reload;
  - service-worker/offline smoke checks against production build.
- Required physical-device checks are recorded honestly. Emulator or code
  inspection is not reported as physical-device evidence.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| One large rewrite branch drifts from production | Use child issues, small PRs and a deployable `main` after each phase |
| Vite hashes assets that the current service worker hard-codes | Design PWA integration before removing the old build and test mixed-version updates |
| React causes all map data to enter the initial bundle | Preserve dynamic continent imports and enforce bundle budgets |
| Store conversion changes learning semantics | Adapt the existing store first; decompose only after parity |
| React Router changes stable URLs or unsupported-route rules | Keep the typed Atlas router behind a React adapter |
| JSX conversion changes accessible names or announcement order | Baseline semantics, add Testing Library assertions and run browser/a11y gates per surface |
| Gesture effects leak or bind twice under React lifecycle behaviour | Use explicit ref ownership, deterministic cleanup and development Strict Mode tests |
| CSS cleanup changes the locked Tactile Atlas system | Defer deletion until markup is migrated and compare representative screenshots |
| Verifiers are deleted because they import the old `dist` shape | Classify and adapt each verifier; remove only implementation-coupled checks with replacement evidence |
| Port overlaps Firebase or geography-expansion work | Sequence #46 separately and coordinate UI-touching work from #22/#27 through small rebases |

## Non-goals

- redesigning Atlas or changing the mode-first information architecture;
- changing learning, scoring, evidence, mastery or achievement policy;
- changing country naming, boundary policy, topology or cartographic sources;
- migrating storage schemas or resetting learner progress;
- adding Firebase, server rendering, server routes or authentication;
- replacing the hash router;
- replacing plain CSS with Tailwind or CSS-in-JS;
- adding Redux, Zustand or another global state dependency without later evidence;
- completing North America or Oceania curriculum work;
- reintroducing the retired Progress screen or designing milestone ceremony;
- broad directory churn before migrated ownership makes it useful.

## Definition of done

- Vite owns development and production builds.
- React owns every production application surface and lifecycle.
- The typed Atlas router, product engine, persistence formats and round semantics
  remain intact behind explicit adapters or framework-independent modules.
- All four learning domains achieve behavioural, accessibility, responsive and
  persistence parity.
- PWA install, offline, update and GitHub Pages behaviour are verified against
  production output.
- Existing invariant coverage remains active, and browser/component coverage
  protects the new lifecycle boundaries.
- Legacy string renderers, root-wide `innerHTML` rendering, global action
  delegation and temporary migration adapters are removed.
- Durable architecture/build/PWA decisions are documented.
- Every child issue is closed with concrete automated and manual evidence, and
  the final merged `main` passes `npm test`.

## Recommended issue decomposition

Create child issues for:

1. baseline, non-regression matrix and architecture decision;
2. Vite build/dev/CI conversion;
3. PWA manifest and service-worker asset integration;
4. React shell, router/store adapters, notices, install and accessibility;
5. Home, domain index, launcher and Flags study;
6. Flags active rounds;
7. Outlines active rounds;
8. Locations map surfaces;
9. Neighbours map/input surfaces;
10. legacy renderer removal, CSS rationalisation and documentation;
11. final production, offline, accessibility and physical-device validation.

The tracking issue should close only after all required child issues are merged
and their evidence is recorded.
