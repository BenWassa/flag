# Atlas

A mobile-first geography-learning PWA across **Flags, Locations, Outlines, and Neighbours**.

## Product

Atlas combines fast geographic practice with persistent learning evidence and a deliberately scarce mastery/completion system.

- **195** core national flags.
- World → continent → region geographic hierarchy.
- **Flags** across the full 195-country curriculum.
- **Locations** currently production-ready for Africa and its five learning regions.
- **Outlines** currently production-ready for Africa and its five learning regions.
- **Neighbours** currently uses Africa production topology and generated land-border adjacency.
- **Learn** for familiarisation/corrective practice appropriate to each domain.
- **Play** for scored retrieval/assessment.
- Rich country-level learning evidence kept separate from learner-facing achievements.
- **Region × domain** is the first meaningful mastery unit.
- Complete regions receive scarce gold treatment; complete continents earn a continent crest; complete World earns the Crown.
- Local-first progress with PWA support.

The product language is modern British English (`en-GB`). User-facing domain labels use **Neighbours**, and the learner-facing assessment activity is **Play**. Stable implementation contracts remain unchanged: the domain route is `/neighbors`, while Play continues to use internal `test` identifiers such as the `/test` route segment and `start-test` actions.

The repository still uses the legacy name `flag`, and stable technical identifiers such as `flag-atlas:*` storage/cache namespaces may remain for compatibility. The learner-facing product name is **Atlas**; production brand rollout is tracked in #36.

Product truth lives in [`PRODUCT.md`](PRODUCT.md). Locked colour/gamification foundations and the pending visual-system status live in [`DESIGN.md`](DESIGN.md). Durable learning/mastery decisions are in [`docs/product/`](docs/product/) and current work sequencing is in [`docs/open/index.md`](docs/open/index.md).

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
src/domain           learning evidence + domain engines
src/infrastructure   persistence + flag assets
src/routing          stable hash-route model
src/state            application/session state
src/ui               components and screens
```

The domain layer has no browser UI dependency. The learning evidence model, earned-achievement layer and presentation system should remain separable so each can evolve without forcing a rewrite of the others.
