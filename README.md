# Atlas

Atlas is a mobile-first geography-learning PWA across **Flags, Locations, Outlines and Neighbours**.

## Product

Atlas teaches world geography through direct retrieval, geographic context and deliberately scarce mastery/completion. The production navigation is **Spatial Atlas**: after choosing a learning domain, the learner uses a persistent interactive Earth to select a continent or region, then deliberately starts **Play** or **Learn** for that scope.

Spatial Atlas is the accepted product direction, not a preview. The conventional launcher is retained only as the equivalent fallback when WebGL cannot start.

Current production coverage:

- **195** core sovereign-state flags.
- **Flags**: World, all six continents and learner-facing regions.
- **Locations**: all six continents and supported regions.
- **Outlines**: all six continents and supported regions.
- **Neighbours**: all six continents, restricted to targets whose complete canonical land-neighbour truth is representable, including explicit verified zero-land-neighbour targets.
- **Learn** for familiarisation/corrective practice appropriate to each domain.
- **Play** for scored retrieval/assessment.
- Country-level learning evidence kept separate from learner-facing prestige.
- **Region × domain Mastery** as the first durable mastery unit.
- Complete regions receive restrained gold treatment, complete continents receive their crest/trophy state, and genuine world completion earns the World Crown.

The learner-facing product language is modern British English (`en-GB`). User-facing copy uses **Neighbours** and **Play**. Stable compatibility identifiers remain unchanged where migration would add risk: the route is `/neighbors`, Play remains internal `test`, and existing `flag-atlas:*` storage/cache namespaces remain.

## Project truth

Read these in order before changing product behaviour:

1. [`PRODUCT.md`](PRODUCT.md) — current product contract.
2. [`DESIGN.md`](DESIGN.md) and [`.impeccable/design.json`](.impeccable/design.json) — current visual/interaction system.
3. [`docs/architecture/spatial-atlas.md`](docs/architecture/spatial-atlas.md) — production Spatial Atlas architecture.
4. [`docs/architecture/routing.md`](docs/architecture/routing.md) — typed URL/history contract.
5. [`docs/index.md`](docs/index.md) — documentation map.
6. [`docs/open/index.md`](docs/open/index.md) — genuinely open work and sequencing.
7. [`docs/history.md`](docs/history.md) — historical issue lineage and supersession map.

Closed GitHub issues and `docs/closed/` records are intentionally retained as decision/evidence history. Old feature, spike and agent branches are not project history and should be deleted once their useful work is merged, superseded or captured.

## Run locally

Requires Node 22.12+.

```bash
npm install
npm run dev
```

The Vite development server uses an isolated development progress sandbox and does not write learner production state.

Build and verify:

```bash
npm run build
npm test
```

`npm test` is the primary repository gate: strict checking, React/component coverage, production Vite/PWA build and the complete invariant verifier chain. Browser matrices run separately where required by an issue.

The deployable static application is written to `dist/`.

## Architecture

```text
src/data             curriculum + generated canonical geography
src/domain           pure learning/evidence/scoring/achievement rules
src/infrastructure   persistence + asset/cloud adapters
src/routing          typed routes + hash-router transport
src/state            application/session orchestration
src/react            production React shell and domain activities
src/spatial          production Spatial Atlas presentation
src/ui               framework-independent map/UI adapters
src/main.tsx         browser entry
src/sw.ts            Workbox service-worker policy
```

The spatial layer interprets authoritative routes; it does not own a second navigation state machine. Geography taps and equivalent DOM controls dispatch the same application actions. Domain-native activities retain their own primary learning surfaces rather than being forced into 3D.

## Deploy

Accepted `main` is built and deployed to GitHub Pages, the primary production host, and to Firebase Hosting as the secondary live target. Preserve the existing local-first progress/cloud-sync contracts and PWA/offline behaviour when changing unrelated product areas.
