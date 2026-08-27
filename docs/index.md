# Documentation

The documentation is organised by purpose rather than by file format or feature name.

## Start here

- [`../PRODUCT.md`](../PRODUCT.md) — current Atlas product truth.
- [`../DESIGN.md`](../DESIGN.md) — the Tactile Atlas visual system: locked and implemented, with achievement art direction open pending #34.
- [`product/colour-system.md`](product/colour-system.md) — quantitative flag-derived colour decision and semantic palette.
- [`product/gamification.md`](product/gamification.md) — mastery/completion hierarchy and scarcity rules.
- [`product/learning-and-mastery.md`](product/learning-and-mastery.md) — live country evidence vs persistent earned mastery.
- [`architecture/earned-achievements.md`](architecture/earned-achievements.md) — persistent achievement schema, qualification seam, support guards and reset semantics.
- [`architecture/react-vite-migration.md`](architecture/react-vite-migration.md) — #89 platform-migration architecture boundary, adapters, build/PWA strategy and rollback model.
- [`closed/issue-89-react-vite-migration.md`](closed/issue-89-react-vite-migration.md) — #89 closeout record, acceptance evidence and independent #71 boundary.
- [`closed/issue-89-execution-plan.md`](closed/issue-89-execution-plan.md) — executed 12-phase #89 delivery plan and acceptance gates.
- [`closed/issue-89-implementation-worklog.md`](closed/issue-89-implementation-worklog.md) — staged #89 decisions, deviations and verification evidence.
- [`closed/issue-90-stable-flag-stage.md`](closed/issue-90-stable-flag-stage.md) — shipped stable Flags question geometry across aspect ratios and loading states.
- [`closed/issue-86-clip-map-context.md`](closed/issue-86-clip-map-context.md) — shipped clipping of decorative map context to continent viewports.
- [`open/index.md`](open/index.md) — current issue map and recommended sequencing.

## Sections

- [`architecture/`](architecture/) — durable technical decisions, system boundaries, routing, and data provenance.
- [`product/`](product/) — current product requirements, behaviour, learning rules and content policies.
- [`research/`](research/) — supporting investigations and evidentiary material that inform product decisions without replacing current product truth.
- [`open/`](open/) — active issue plans and unresolved implementation work.
- [`closed/`](closed/) — completed issue worklogs, release records, superseded plans, and historical reviews.

Repository-level documents remain at the project root when they describe the whole project: [`README.md`](../README.md), [`PRODUCT.md`](../PRODUCT.md), and [`DESIGN.md`](../DESIGN.md).

## Current documentation status

The learner-facing product name is **Atlas** across current product documentation, production UI, browser titles, and install metadata. Stable legacy technical identifiers remain compatible as documented in `PRODUCT.md`.

The old flat “Flag Atlas / atlas-index” visual system is superseded. `DESIGN.md` documents the implemented Tactile Atlas system, closed through #32/#35/#40; achievement art direction (badges/crest/Crown) stays open under #34.

Atlas currently ships production geography for Africa, South America, Europe, Asia and North America. Oceania remains open expansion work under #27; #22 is in final merge/deployment closeout.

Issue #89 is an active incremental migration of the presentation/build layers to React and Vite. The existing typed router, product engine, persistence, geography and learning semantics are preservation boundaries; use the architecture decision and canonical execution plan above rather than treating the epic as a rewrite brief.

## Filing rules

- Use lowercase kebab-case filenames.
- Keep this structure shallow; add a new top-level category only when the existing categories do not fit.
- Move an issue document from `open/` to `closed/` when the issue is completed or superseded.
- Put lasting decisions in `architecture/` or `product/`; do not make worklogs or research reports the only source of truth.
- Put supporting studies, experiments and evidence in `research/`, and link the accepted interpretation back to product or design truth.
- Keep `open/index.md` aligned with the active backlog when product sequencing changes.
- Update this index and inbound links when moving a document.
