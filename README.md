# Flag Atlas

A mobile-first adaptive app for learning world geography through **Flags, Locations, Outlines, and Neighbours**.

## Product

Flag Atlas combines Seterra-style speed and geographic organisation with a persistent learning model:

- **195** core national flags.
- World → continent → region study scopes where supported.
- **Flags** for visual flag recognition across the full 195-country curriculum.
- **Locations** for map-based country identification in Africa and its five learning regions.
- **Outlines** for country-silhouette identification in Africa and its five learning regions.
- **Neighbours** for naming every land-border neighbour, currently using Africa production topology.
- **Learn** mode for adaptive practice and immediate feedback.
- **Play** mode for clean scope-level assessment.
- Persistent **Unseen → Learning → Mastered** state.
- Confusion-aware distractors and mistake review where applicable.
- Balanced answer-position randomisation for multiple-choice domains.
- Local-first progress with PWA support.

The product language is modern British English (`en-GB`). User-facing domain labels use **Neighbours**, and the learner-facing assessment activity is **Play**. Stable implementation contracts remain unchanged: the domain route is `/neighbors`, while Play continues to use internal `test` identifiers such as the `/test` route segment and `start-test` actions.

Product truth lives in [`PRODUCT.md`](PRODUCT.md), the full requirements in [`docs/product/requirements.md`](docs/product/requirements.md), technical boundaries in [`docs/architecture/overview.md`](docs/architecture/overview.md), and the shipped visual system in [`DESIGN.md`](DESIGN.md). See the [`docs` index](docs/index.md) for current references, open plans, and completed worklogs.

## Run locally

Requires Node 22+.

```bash
npm install
npm test
```

`npm test` compiles the TypeScript application and verifies curriculum, routing, cartography, learning-domain and product-copy invariants. The built static app is written to `dist/`.

Serve `dist/` with any static server, for example:

```bash
npx serve dist
```

## Interaction shortcuts

During supported quizzes:

- `1`–`4` selects a multiple-choice answer.
- `Enter` advances after Learn-mode feedback where applicable.
- `Esc` exits the active round.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`, which builds, verifies, and deploys `dist/` to GitHub Pages once Pages is configured to use **GitHub Actions** as its source.

Firebase Hosting can replace GitHub Pages later without changing the application structure.

## Architecture

```text
src/data             curriculum + generated geography fixtures
src/domain           mastery + learning engines
src/infrastructure   persistence + flag assets
src/routing          stable hash-route model
src/state            application/session state
src/ui               components and screens
```

The domain layer has no browser UI dependency, so the adaptive learning engines can evolve independently of presentation technology.
