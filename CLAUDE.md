# CLAUDE.md

Guidance for Claude Code and other coding agents working in this repository.

## What this is

**Atlas** is a mobile-first TypeScript/React/Vite PWA for learning world geography across **Flags, Locations, Outlines and Neighbours**.

The repository remains named `flag`. Stable technical identifiers may retain legacy `flag-atlas`, `neighbors` and `test` forms for compatibility. Learner-facing copy is modern British English (`en-GB`): **Neighbours** and **Play**.

## Read first

Before product/UI work, read:

1. `PRODUCT.md` — current product truth.
2. `DESIGN.md` and `.impeccable/design.json` — current production design system.
3. `docs/architecture/spatial-atlas.md` — production Spatial Atlas architecture.
4. `docs/architecture/routing.md` — typed routes/history semantics.
5. `docs/architecture/cartography.md` — canonical geography/provenance.
6. `docs/open/index.md` — current work and sequencing.
7. `docs/history.md` — issue lineage and superseded directions.

Closed GitHub issues and `docs/closed/` are intentional historical evidence. Do not infer current behaviour from an old issue body when normative docs/current `main` disagree.

## Current product truth

- **Spatial Atlas is production navigation.** It is not a preview or experiment.
- Navigation remains mode-first: choose a domain, use the Earth to select a continent/region, then deliberately choose Play or Learn for the focused scope.
- Geography taps select scope; they do not start rounds.
- The typed hash router is authoritative. `src/spatial/` interprets route/application state and must never become a second navigation state machine.
- The conventional `Launcher` survives only as the equivalent WebGL/renderer-failure fallback and shares `scopeModelFor` with the Spatial command surface.
- Domain-native activities own their learning surface. Locations/Outlines/Neighbours and Flags Learn yield the globe; Flags Play may keep inert answer-safe context; Results can reframe the completed scope.
- Country records are live learning evidence, not learner-facing prestige.
- Region × domain is the first durable Mastery unit.
- Complete region = restrained gold; complete continent = persisted crest/trophy state; complete World = earned-only Crown.
- #138 already shipped the learner-facing earned World Crown line. Do not describe it as future work.
- All six real continents have intended four-domain production curriculum.
- #104, #118, #119 and #166 are closed history. Their records remain useful but their old implementation instructions are not current work.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run verify
npm test
npm run test:browser
npm run maps:generate
npm run maps:generate -- --update-hashes   # only after reviewed upstream source change
npm run globe:generate
```

Requires Node 22.12+; CI uses Node 22. `npm test` is the primary repository gate.

## Architecture

```text
src/data/            curriculum + generated geography
src/domain/          pure learning/evidence/scoring/achievement rules
src/infrastructure/  persistence, assets and cloud adapters
src/routing/         typed routes + hash-router transport
src/state/           application/session orchestration
src/react/           production React shell and activities
src/spatial/         production Three.js Spatial Atlas presentation
src/ui/              framework-independent UI/map adapters
```

### Spatial Atlas

`src/spatial/` is presentation only. `deriveSpatialState(...)` is pure and owns no navigation state. Geography taps and DOM controls dispatch the same `AtlasActions`. Read `docs/architecture/spatial-atlas.md` before touching the globe, camera, picking, touch envelopes or composition.

Preserve:

- route → spatial state as one-way interpretation;
- WebGL failure fallback;
- invisible source-derived tiny-country interaction envelopes;
- tap/drag threshold and pointerdown-position tap resolution;
- platform edge-back gesture ownership;
- reduced-motion behaviour;
- lazy/adaptive spatial payload strategy;
- answer-safe activity boundary.

### Domain and persistence

The domain layer has zero DOM/React dependency. Scoring/evidence/achievement semantics do not belong in presentation components.

Country identity is ISO3. Learning ledgers remain domain-specific. Earned achievements and region-perfect-run streaks persist separately. Stable storage namespaces require explicit migration if changed.

### Geography

Projected learning maps and spherical Spatial assets are generated from the same pinned Natural Earth 1:10m source/policy. Never create handwritten country geometry, a second topology source or handwritten neighbour tables. Use the generator and documented geopolitical policy.

## Product naming and compatibility

Do not casually rename:

- repository `flag`;
- `flag-atlas:*` localStorage/cache namespaces;
- `/neighbors` or neighbour internal identifiers;
- internal `test`, `/test`, `start-test` values.

Compatibility outranks cosmetic consistency unless a migration has explicit value.

## Visual work

`DESIGN.md` is authoritative. The production direction is visually quiet, geography-first and tactile without becoming toy-like. Atlas Blue is ordinary action/progress; green/red are correctness; purple is Mastery; gold is scarce prestige. No colour-only state, continent/region identity palette, glassmorphism, bento dashboard treatment or reward economy.

Do not revive pre-Spatial launcher layouts simply because old CSS/tests/issues mention them. Fallback UI is a compatibility/accessibility surface, not the normal visual direction.

## Current open work

Treat GitHub as the task authority and `docs/open/index.md` as the sequencing map. Current open work is #71, #137, #146–#152 and #160.

Key dependency rules:

- #137 must be reconciled against current Spatial `main`; its old branch predates the cutover and must not be merged mechanically.
- #148 follows #137 because both touch Locations map feedback/rendering.
- #150 follows #147 and #148 so tokens codify corrected behaviour.
- #146 must be re-scoped against Spatial production because its original launcher assumptions predate #166; #152 follows the resulting navigation semantics.
- #71 owns real physical-device/iOS/installed-PWA evidence. Never claim that evidence from emulation.

## Issue delivery and repository hygiene

Before implementation, fetch current `main`, read the complete GitHub issue, inspect related closed decisions, and branch from current truth.

For a production change:

1. use a focused branch/PR;
2. preserve unrelated work;
3. run risk-appropriate focused checks and the complete `npm test` gate;
4. inspect the exact production artifact where behaviour changed;
5. sync current `main` before merge and resolve conflicts semantically;
6. require green CI;
7. verify merged-main deployment where the issue requires it;
8. record durable decisions in product/architecture docs, not only an issue comment.

Closed issue documents belong in `docs/closed/`; only genuinely unresolved working records belong in `docs/open/`.

**Branch history is not project history.** Once a branch is merged, superseded, or its unique evidence is captured in `main`/closed docs, delete the remote branch. Preserve closed GitHub issues and closeout/history documents so future agents can trace decisions without carrying every implementation ref forever.

Do not claim browser/device/manual testing that was not actually performed.
