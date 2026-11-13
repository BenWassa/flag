# Closed Issue Records

This directory preserves completed, superseded and historical implementation worklogs, acceptance evidence and design investigations. These records may describe products, selectors, routes or UI that no longer ship.

- For **current product requirements**, read [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md), and [docs/index.md](../index.md).
- For **open work and dependencies**, use [docs/open/index.md](../open/index.md) and the live GitHub issue.
- For **historical lineage and superseded decisions**, use [docs/history.md](../history.md).

For #71's historical, pre-Spatial mobile implementation evidence, see [original mobile interaction specification](issue-71-mobile-interaction.md) and [implementation notes](issue-71-implementation-notes.md). The active physical-device checklist remains in [docs/open/](../open/issue-71-physical-device-gate.md).

When an issue is completed or superseded, move its worklog from `docs/open/` to `docs/closed/` in a focused PR, repair inbound links, and retain meaningful closeout/verification history. Do not interpret a historical worklog as authority to reopen already-shipped behaviour.

## Branch retirement checklist (14 October 2026)

After a PR merges and its verification evidence is preserved, delete its short-lived remote branch. Never delete `main`, the intentional `archive/atlas-alpha-pre-spatial-cutover-2026-08-29` checkpoint, or branches for open PRs.

**Strict ancestors of `main` (ahead = 0; eligible for deletion after final ref check):**

- `claude/flags-activity-viewport-hoc8pw`
- `docs-current-state-2026-09-07`
- `issue-196-home-chooser-chrome`
- `issue-199-spatial-framing-synced`
- `issue-200-spatial-marker-hit-parity`
- `issue-201-locations-feedback-geometry`
- `issue-202-locations-three-strike`
- `issue-210-actions-cleanup-v2`
- `issue-216-ci-wall-time`

**Diverged historical branches (inspect superseding PR/unique commits before deletion):**

- `claude/atlas-progressive-disclosure-wjpa42` (merged PR #205)
- `issue-196-home-chooser-material` (superseded by merged PR #217)
- `issue-198-spatial-scope-selection` (merged PR #206)
- `issue-199-spatial-framing` (merged PR #208)
- `issue-210-actions-cleanup` (superseded by merged PR #211)
- `issue-212-main-acceptance-unblock` (merged PR #223)
- `issue-212-playwright-reconciliation` (closed draft PR #213, superseded by active PR #222)
- `issue-221-island-touch-contract` (merged PR #225)

**Later:** delete `chore/issue-docs-reconciliation-2026-10-14` after PR #232 merges, and delete `issue-212-broad-suite-reconciliation` / `fix-inset-touch-pointer-events` only after PRs #222 / #231 respectively merge or are explicitly retired.

This is a recorded candidate inventory, **not confirmation that refs have been deleted**. Recheck branch ancestry and open PR associations immediately before deletion.
