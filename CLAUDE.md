# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this is

**Atlas** — a mobile-first TypeScript PWA for learning world geography across four learning domains: **Flags**, **Locations**, **Outlines**, and **Neighbours**. Deployed as a static site to GitHub Pages.

The repository remains named `flag`, and stable technical identifiers may retain legacy `flag-atlas` / American-spelled forms for compatibility. Do not rename routes, storage namespaces, cache identifiers, filenames/types, or internal action values merely to match the learner-facing Atlas brand.

Product copy is modern British English (`en-GB`). The learner-facing domain label is **Neighbours** and the learner-facing assessment activity is **Play**; stable technical identifiers such as `neighbors`, `/neighbors`, `neighbors.css`, `/test`, `test`, and `start-test` remain compatibility contracts.

## Current product reset

Read these before making product/UI changes:

- `PRODUCT.md` — current Atlas product truth.
- `DESIGN.md` — implemented Tactile Atlas production system; #34 owns remaining achievement art.
- `docs/product/colour-system.md` — flag-derived semantic palette.
- `docs/product/gamification.md` — mastery/completion scarcity hierarchy.
- `docs/product/learning-and-mastery.md` — live country evidence vs persistent earned mastery.
- `docs/architecture/react-vite-migration.md` — #89 platform-migration architecture decision.
- `docs/closed/issue-89-execution-plan.md` — completed #89 dependency/order and closeout record.
- `docs/open/index.md` — active work and recommended sequencing.

Important current decisions:

- country records are live learning evidence, not learner-facing prestige objects;
- **region × domain** is the first learner-facing Mastery unit;
- complete region = restrained gold treatment;
- complete continent = continent-silhouette crest;
- complete world = Crown only;
- earned mastery/completion is persistent for now, even if live country evidence later lapses/revalidates;
- Atlas Blue is action, green is correct, red is wrong, purple is mastery, gold is scarce prestige;
- Africa was the first complete four-domain production proving ground and remains the reference baseline; South America, Europe, Asia, North America and Oceania now ship to the same bar;
- all six real continents have intended four-domain production curriculum; future unsupported scopes must remain honest and must never count as complete;
- navigation is **mode-first**: Home chooses a learning domain, `/{domain}` lists that domain's continents, and `/{domain}/{continent}` is the launcher (whole-continent Play plus its region list). The scope-first `/atlas/*` surface and the region card's four-domain launch row are retired;
- the production visual style is **Tactile Atlas**. Preserve its documented system unless a focused product decision changes it;
- Issue #89's integrated candidate runs the production presentation/build layers on React and Vite. Treat the existing router, product engine, persistence, learning rules, cartography and CSS semantics as preservation boundaries; the remaining legacy view modules are verifier fixtures, not the production entry path.

## Commands

```bash
npm install
npm run dev      # Vite development server
npm run check    # strict application + Vite-config type-check
npm run build    # Vite production build + temporary verifier compatibility emit
npm run verify   # run every invariant verifier against the built artifact/contracts
npm test         # check + production build + complete verifier suite (CI gate)
npm run test:browser          # production-preview desktop/mobile Chromium smoke matrix
npm run maps:generate            # regenerate canonical generated geography from pinned Natural Earth sources
npm run maps:generate -- --update-hashes   # only after a reviewed, intentional upstream source change
```

Phase #92 uses Vite for browser development and the deployable `dist/` artifact. The existing plain-Node invariant suite still imports framework-independent compiled modules from `dist/`; a narrow `tsconfig.verify.json` compatibility emit preserves that coverage during the staged migration. Do not treat that temporary emit as a second production build system. It is removed/adapted when legacy compatibility is retired in #100.

Requires Node 22.12+.

## Architecture

The product engine remains layered TypeScript under `src/`. React owns browser presentation, but the dependency direction does not:

```text
src/data/            static curriculum + generated geography fixtures
src/domain/          pure learning/evidence/game rules — no DOM/React dependency
src/infrastructure/  persistence and asset providers
src/routing/         typed route model + hash-router transport
src/state/           application/session orchestration
src/react/           React application shell, screens and components
src/ui/              framework-independent adapters + temporary verifier fixtures
```

Key rules:

- **Domain layer has zero DOM/React dependency.** Keep learning/evidence rules separate from rendering.
- **Canonical country ID is ISO3.** `src/data/countries.ts` and the documented country-naming policy remain authoritative for application identity.
- **Routing is typed and durable.** URLs own stable navigation state; session state owns quiz internals. Preserve Back/Forward, direct links and activity-refresh fallback.
- **Map/outline/neighbour geometry is generated, not hand-authored.** Use the canonical Natural Earth production topology pipeline; never create a second map source or handwritten neighbour table.
- **Country learning ledgers remain domain-specific.** New earned achievement state should be layered cleanly above them rather than flattening the domain mechanics.
- **Flags** supports the full world/195-country curriculum. **Locations**, **Outlines**, and **Neighbours** support all six real continents: Africa (5 regions), South America (3), Europe (4), Asia (6 learner-facing regions, including the cross-continental Middle East scope from #28), North America (3) and Oceania (4).
- Oceania uses the shared canonical topology pipeline, Pacific-centred projection, topology-derived `PNG ↔ IDN` adjacency and explicit truthful zero-land-neighbour records; do not fork those rules into a second geography system.
- `worldHasCompleteCurriculum()` is now true, but learner-facing World Crown presentation remains a separate #138 concern; do not alter achievement semantics incidentally.
- **React is a presentation dependency only.** Keep adapters around the typed router, `AppStore`, round controllers, map viewport maths and persistence rather than replacing those systems.

## Product naming and compatibility

The learner-facing brand is **Atlas**.

Issue #36 records the production UI/metadata rollout. Learner-facing surfaces use Atlas while stable technical identifiers remain compatible.

Do not casually rename stable legacy identifiers such as:

- repository name `flag`;
- localStorage keys such as `flag-atlas:progress:v1`;
- service-worker/cache keys;
- `/neighbors`;
- internal `test` activity values/routes/actions.

Compatibility outranks cosmetic consistency unless a migration has explicit product value.

## Learning evidence vs mastery

Do not use `mastered` internal country state as a reason to call an individual country “Mastered” in the UI.

The backend may retain rich country states and fields for compatibility/scheduling. Learner-facing achievement aggregation belongs above that layer.

Read Issue #29 and `docs/product/learning-and-mastery.md` before changing scheduler/evidence semantics. Read #34 before adding mastery/completion persistence.

## Visual work

`DESIGN.md` contains the implemented **Tactile Atlas** visual system.

Implemented:

- semantic palette and mastery/prestige hierarchy;
- mobile-first mode-first navigation;
- four-tier radius system and restrained tactile depth;
- system-sans typography and reduced-motion behaviour;
- Phosphor Bold routine iconography;
- geography dominance and no horizontal scrolling for primary selection;
- no XP/coin/reward economy.

Open under #34:

- exact mastery-badge, continent-crest and world-Crown artwork;
- earned-milestone ceremony.

Issue #89 does not authorise a visual redesign. React ports preserve existing Tactile Atlas tokens, CSS semantics, interaction physics and learner-facing hierarchy unless a separate focused product decision changes them. Do not introduce Tailwind or CSS-in-JS as part of the migration.

## Working on issues

Before starting work on an issue (and again before wrapping up a session that touched issues):

- Run `gh issue list --state open` and compare it against `docs/open/index.md` and the files in `docs/open/`. Close out any GitHub issue that is actually done, superseded, or merged into another issue.
- For any issue that is closed on GitHub but still has a doc in `docs/open/`, `git mv` that doc into `docs/closed/` and update `docs/open/index.md` to drop it from active sequencing (linking to the closed doc instead where useful, matching the existing `closed/issue-NN-*.md` closeout pattern).
- `docs/open/index.md` is the source of truth for what's actually still active — keep it reconciled with GitHub state rather than letting it drift.
- The completed #89 migration record retains its focused-PR, Node verification and artifact-inspection evidence in `docs/closed/issue-89-implementation-worklog.md`.

## Where to look before changing things

- `docs/index.md` — documentation entry point.
- `docs/open/index.md` — current backlog/sequencing.
- `docs/architecture/routing.md` — route schema and Back/Forward semantics.
- `docs/architecture/cartography.md` — canonical topology/provenance policy.
- `docs/architecture/react-vite-migration.md` — #89 migration architecture and preserved contracts.
- `docs/closed/issue-89-execution-plan.md` — completed #89 phase order, gates and rollback boundaries.
- `PRODUCT.md` — product truth.
- `DESIGN.md` — implemented production design system.
- `docs/product/colour-system.md` — colour rationale/tokens.
- `docs/product/gamification.md` — achievement hierarchy.
- `docs/product/learning-and-mastery.md` — evidence/mastery split.
- `docs/product/country-naming.md` — country display naming.

Persisted localStorage keys are versioned with separate namespaces per domain; introducing a new persisted shape needs a migration layer, not a silent key change.
