# Atlas

A mobile-first geography-learning PWA across **Flags, Locations, Outlines, and Neighbours**.

## Product

Atlas combines fast geographic practice with persistent learning evidence and a deliberately scarce mastery/completion system.

- **195** core national flags.
- World → continent → region geographic hierarchy.
- **Flags** across the full 195-country curriculum.
- **Locations** currently production-ready for Africa, South America, Europe and Asia plus their supported regions.
- **Outlines** currently production-ready for Africa, South America, Europe and Asia plus their supported regions.
- **Neighbours** uses canonical generated production topology and land-border adjacency for supported geography.
- **Learn** for familiarisation/corrective practice appropriate to each domain.
- **Play** for scored retrieval/assessment.
- Rich country-level learning evidence kept separate from learner-facing achievements.
- **Region × domain** is the first meaningful mastery unit.
- Complete regions receive scarce gold treatment; complete continents earn a continent crest; complete World earns the Crown.
- Local-first progress with PWA support.

The product language is modern British English (`en-GB`). User-facing domain labels use **Neighbours**, and the learner-facing assessment activity is **Play**. Stable implementation contracts remain unchanged: the domain route is `/neighbors`, while Play continues to use internal `test` identifiers such as the `/test` route segment and `start-test` actions.

The repository still uses the legacy name `flag`, and stable technical identifiers such as `flag-atlas:*` storage/cache namespaces remain for compatibility. The learner-facing product name is **Atlas** across the UI and install metadata.

Product truth lives in [`PRODUCT.md`](PRODUCT.md). The implemented Tactile Atlas production system lives in [`DESIGN.md`](DESIGN.md). Durable learning/mastery decisions are in [`docs/product/`](docs/product/) and current work sequencing is in [`docs/open/index.md`](docs/open/index.md).

## Run locally

Requires Node 22.12+.

```bash
npm install
npm run dev
```

Vite serves the source application at `http://localhost:5173` with module-aware hot updates. The production artifact is generated separately:

The development server runs in an isolated sandbox. Learner progress is stored under `flag-atlas:dev-sandbox:*`, never under production learner keys, and Firebase authentication is disabled. Open Profile to seed common edge cases, reset the sandbox, or import/export its complete JSON dataset. Sandbox state survives reloads until explicitly reset.

```bash
npm run build
```

To run the complete verification suite:

```bash
npm test
```

`npm test` type-checks the application and Vite configuration, runs React component tests, builds the production app and Workbox service worker, emits the temporary plain-Node verifier modules only to ignored `.verify-dist/`, and verifies curriculum, routing, cartography, learning-domain, build and product-copy contracts. `npm run test:browser` runs desktop/mobile Chromium smoke tests against the production preview. The deployable static app is written to `dist/`.

Serve `dist/` with any static server for production-artifact inspection, for example:

```bash
npx serve dist
```

## Interaction shortcuts

During supported quizzes:

- `1`–`4` selects a multiple-choice answer.
- `Enter` advances after Learn-mode feedback where applicable.
- `Esc` exits the active round.

## Deploy

Pushes to `main` build after CI and deploy the static `dist/` artifact to both
GitHub Pages and Firebase Hosting (`atlas-3c48a.web.app`). GitHub Pages remains
the declared primary production host. Issue #107 owns Firebase-origin browser,
Auth, degraded-state and rollback acceptance before any explicit primary-host
cutover; #106 separately owns real cloud progress sync.

## Architecture

```text
src/data             curriculum + generated geography fixtures
src/domain           learning evidence + domain engines
src/infrastructure   persistence + flag assets
src/routing          stable hash-route model
src/state            application/session state
src/react            React shell, screens and components
src/ui               framework-independent UI/map adapters
src/main.tsx         production browser entry
src/sw.ts            generated Workbox service-worker policy
```

The domain layer has no browser UI dependency. The learning evidence model, earned-achievement layer and presentation system should remain separable so each can evolve without forcing a rewrite of the others.
