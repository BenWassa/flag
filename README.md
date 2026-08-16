# Flag Atlas

A mobile-first adaptive app for learning the flags of the world.

## Product

Flag Atlas combines Seterra-style speed and geographic organization with a persistent learning model:

- **195** core national flags.
- World → continent → region study scopes.
- **Learn** mode for adaptive practice and immediate feedback.
- **Test** mode for clean scope-level assessment.
- Persistent **Unseen → Learning → Mastered** state.
- Confusion-aware distractors and mistake review.
- Balanced answer-position randomization.
- Local-first progress with PWA support.

Product truth lives in [`PRODUCT.md`](PRODUCT.md), the full requirements in [`docs/PRD.md`](docs/PRD.md), technical boundaries in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and the shipped visual system in [`DESIGN.md`](DESIGN.md). The Impeccable redesign review is recorded in [`docs/IMPECCABLE_REVIEW.md`](docs/IMPECCABLE_REVIEW.md).

## Run locally

Requires Node 22+.

```bash
npm install
npm test
```

`npm test` compiles the TypeScript application and verifies curriculum + quiz invariants. The built static app is written to `dist/`.

Serve `dist/` with any static server, for example:

```bash
npx serve dist
```

## Interaction shortcuts

During a quiz:

- `1`–`4` selects an answer.
- `Enter` advances after Learn-mode feedback.
- `Esc` exits the quiz.

## Deploy

Pushes to `main` run `.github/workflows/pages.yml`, which builds, verifies, and deploys `dist/` to GitHub Pages once Pages is configured to use **GitHub Actions** as its source.

Firebase Hosting can replace GitHub Pages later without changing the application structure.

## Architecture

```text
src/data             curriculum
src/domain           mastery + quiz engine
src/infrastructure   persistence + flag assets
src/state            application/session state
src/ui               components and screens
```

The domain layer has no browser UI dependency, so the adaptive learning engine can evolve independently of presentation technology.
