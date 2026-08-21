# Repository agent instructions

These instructions apply to the whole repository.

## Start with project context

- Read `PRODUCT.md` and `DESIGN.md` before changing product behaviour or interface code.
- `DESIGN.md` currently contains locked Atlas design foundations, **not a finished visual style**. Issue #32 owns the next visual-design decision and later implementation.
- Read `docs/product/colour-system.md`, `docs/product/gamification.md`, and `docs/product/learning-and-mastery.md` before changing colours, mastery, completion, progress or achievement presentation.
- Use `docs/index.md` as the documentation map and `docs/open/index.md` as the active-work/sequencing map.
- Learner-facing product name is **Atlas**. Production rollout is tracked in #36; preserve stable legacy repository/storage/cache identifiers unless a migration is explicitly justified.
- Preserve the language contracts: learner-facing copy uses British English, `Neighbours`, and `Play`; stable internal identifiers such as `neighbors`, `/neighbors`, `test`, `/test`, and `start-test` remain unchanged unless a migration is explicitly requested.
- Do not hand-edit generated cartography in `src/data/maps/africa.ts`. Follow `docs/architecture/cartography.md` and use the generation workflow.

## Current learning/achievement boundary

- Country-level records are live learning evidence and may remain rich/revisable.
- Do not present an individual country as a prestigious learner-facing Mastery achievement.
- Region × domain is the first learner-facing Mastery unit.
- Complete region = restrained gold treatment; complete continent = continent crest; complete World = Crown only.
- Earned mastery/completion is persistent in the current product model even if live country evidence later lapses/revalidates.
- Africa is the first complete four-domain proving ground. Unsupported continent/domain shells must not count as complete.

## Verification

- `npm run check` type-checks the source.
- `npm test` builds the production output and runs the complete verification suite. Verification scripts import from `dist/`, so build before running an individual script.
- Add focused assertions to the existing plain-Node verifier family rather than introducing a test framework without an explicit decision.
- Match validation to the risk. Interface work should include keyboard, accessibility semantics, responsive layouts, and loading/failure behaviour where relevant.
- Never claim a manual gate was run when it was inferred from code or automated coverage. Record substituted evidence and any unavailable environment explicitly.

## Issue delivery and closeout

Treat issue completion as a repository state transition, not just a code change:

1. Read the GitHub issue and its document under `docs/open/`. Establish exact acceptance criteria and deferred work.
2. Implement on a feature branch. Keep durable decisions in `PRODUCT.md`, `DESIGN.md`, `docs/product/`, or `docs/architecture/`; do not leave the issue worklog as the only source of truth.
3. Run the required automated and manual gates. Record concrete evidence, including viewport, keyboard, assistive-technology, degraded-state, or network conditions when the brief requires them.
4. Commit and push the implementation intentionally. Stage only confirmed paths and preserve unrelated or untracked user files.
5. Merge into `main`, update from `origin/main`, rerun `npm test` on the merged tree, and confirm `main` matches the intended remote commit.
6. Change the issue document status to `Complete`, add a closeout section with commit and verification evidence, move it from `docs/open/` to `docs/closed/`, and update every inbound link.
7. Commit and push the closeout documentation. Close the GitHub issue only after the closing commit is reachable from `origin/main`, and leave a concise comment with the shipped commit and verification summary.

If a required gate cannot be run, do not silently close the issue. Either complete it in a suitable environment or record the unavailable gate and obtain explicit user direction to accept the substitute evidence.
