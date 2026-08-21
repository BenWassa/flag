# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## What this is

**Atlas** — a mobile-first, zero-runtime-framework TypeScript PWA for learning world geography across four learning domains: **Flags**, **Locations**, **Outlines**, and **Neighbours**. Deployed as a static site to GitHub Pages.

The repository remains named `flag`, and stable technical identifiers may retain legacy `flag-atlas` / American-spelled forms for compatibility. Do not rename routes, storage namespaces, cache identifiers, filenames/types, or internal action values merely to match the learner-facing Atlas brand.

Product copy is modern British English (`en-GB`). The learner-facing domain label is **Neighbours** and the learner-facing assessment activity is **Play**; stable technical identifiers such as `neighbors`, `/neighbors`, `neighbors.css`, `/test`, `test`, and `start-test` remain compatibility contracts.

## Current product reset

Read these before making product/UI changes:

- `PRODUCT.md` — current Atlas product truth.
- `DESIGN.md` — locked design foundations; final visual style is still pending Issue #32.
- `docs/product/colour-system.md` — flag-derived semantic palette.
- `docs/product/gamification.md` — mastery/completion scarcity hierarchy.
- `docs/product/learning-and-mastery.md` — live country evidence vs persistent earned mastery.
- `docs/open/index.md` — active work and recommended sequencing.

Important current decisions:

- country records are live learning evidence, not learner-facing prestige objects;
- **region × domain** is the first learner-facing Mastery unit;
- complete region = restrained gold treatment;
- complete continent = continent-silhouette crest;
- complete world = Crown only;
- earned mastery/completion is persistent for now, even if live country evidence later lapses/revalidates;
- Atlas Blue is action, green is correct, red is wrong, purple is mastery, gold is scarce prestige;
- Africa is the first complete four-domain production proving ground;
- other continents may appear as honest shells before their full data ships, but unsupported domains must never count as complete;
- region × domain cross-domain competency (#35) is surfaced directly on each region's card in the continent surface (identity, country count, one domain-launch shortcut per domain); there is no separate region-detail screen — it was built, then retired as redundant once the region card itself carried this;
- the final visual style is **not yet locked**. Do not preserve the old flat atlas-index aesthetic as a future requirement, and do not assume Tailwind/React/framework migration is part of the redesign.

## Commands

```bash
npm install
npm run check    # tsc --noEmit type-check only
npm run build    # tsc compile to dist/ + copy HTML/CSS/manifest/sw/icons
npm run verify   # run every verify script against the built dist/ output
npm test         # build + verify (this is what CI runs)
npm run maps:generate            # regenerate src/data/maps/africa.ts from pinned Natural Earth sources
npm run maps:generate -- --update-hashes   # only after a reviewed, intentional upstream source change
```

There is no unit-test framework. Tests are plain Node scripts in `scripts/verify-*.mjs` that assert invariants by importing compiled JS from `dist/`; they require a build first.

Requires Node 22+.

## Architecture

Layered, framework-free TypeScript under `src/`, composed in the browser by `src/app.ts`:

```text
src/data/            static curriculum + generated geography fixtures
src/domain/          pure learning/evidence/game rules — no DOM dependency
src/infrastructure/  persistence and asset providers
src/routing/         typed route model + hash-router transport
src/state/           application/session orchestration
src/ui/              render-only views/components; app.ts handles actions
```

Key rules:

- **Domain layer has zero DOM dependency.** Keep learning/evidence rules separate from rendering.
- **Canonical country ID is ISO3.** `src/data/countries.ts` and the documented country-naming policy remain authoritative for application identity.
- **Routing is typed and durable.** URLs own stable navigation state; session state owns quiz internals. Preserve Back/Forward and direct links.
- **Map/outline/neighbour geometry is generated, not hand-authored.** Use the canonical Natural Earth production topology pipeline; never create a second map source or handwritten neighbour table.
- **Country learning ledgers remain domain-specific.** New earned achievement state should be layered cleanly above them rather than flattening the domain mechanics.
- Currently only **Flags** supports the full world/195-country curriculum; **Locations**, **Outlines**, and **Neighbours** support Africa and its five production regions.

## Product naming and compatibility

The learner-facing brand is **Atlas**.

Issue #36 owns production UI/metadata rollout. Documentation can use Atlas now.

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

`DESIGN.md` currently contains **foundations, not a finished visual system**.

Locked:

- semantic palette;
- mastery/prestige hierarchy;
- mobile-first constraints;
- geography dominance;
- no horizontal scrolling for primary selection;
- no XP/coin/reward economy.

Open until #32 design exploration:

- visual personality;
- shape/radius/squircle language;
- depth/elevation/press physics;
- typography personality;
- navigation composition;
- exact badge/crest/Crown art direction;
- motion system.

Do not introduce React, Tailwind or another frontend toolchain merely because a mock-up used it. Tooling changes require their own justification.

## Where to look before changing things

- `docs/index.md` — documentation entry point.
- `docs/open/index.md` — current backlog/sequencing.
- `docs/architecture/routing.md` — route schema and Back/Forward semantics.
- `docs/architecture/cartography.md` — canonical topology/provenance policy.
- `PRODUCT.md` — product truth.
- `DESIGN.md` — current design foundations.
- `docs/product/colour-system.md` — colour rationale/tokens.
- `docs/product/gamification.md` — achievement hierarchy.
- `docs/product/learning-and-mastery.md` — evidence/mastery split.
- `docs/product/country-naming.md` — country display naming.

Persisted localStorage keys are versioned with separate namespaces per domain; introducing a new persisted shape needs a migration layer, not a silent key change.
