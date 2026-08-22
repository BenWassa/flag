# Open Work

This directory mirrors active product/engineering work that benefits from a durable repository plan. GitHub Issues remain the canonical task tracker; these files preserve the decisions and relationships future agents need before implementation.

## Recommended sequencing

### 1. Product foundations — documented now

- Atlas learner-facing brand decision;
- global colour semantics;
- live country evidence vs earned regional mastery;
- scarcity-based gamification hierarchy;
- Africa-first complete proving ground;
- region × domain cross-domain competency, surfaced on the continent surface's region cards rather than a separate region-detail screen.

### 2. Learning / achievement architecture

#29 (country learning evidence), #34 (persistent earned achievements), #56 (Progress mastery presentation), and #30 (Flags Learn gallery) are complete. Live country evidence can change while earned region/domain Mastery remains persistent. #29 and #34's closeout records are [`issue-29-learning-evidence.md`](../closed/issue-29-learning-evidence.md) and [`issue-34-earned-mastery.md`](../closed/issue-34-earned-mastery.md).

#32, #35 and #40 are complete through PR #38. Their closeout records are [`issue-32-atlas-visual-system.md`](../closed/issue-32-atlas-visual-system.md), [`issue-35-region-detail.md`](../closed/issue-35-region-detail.md) and [`issue-40-phosphor-icon-system.md`](../closed/issue-40-phosphor-icon-system.md).

### 3. Existing presentation bugs / cartography

- [#19 — Neighbours mobile input: keep map anchored when keyboard opens](https://github.com/BenWassa/flag/issues/19)
- [#20 — Improve map colour palette and water-feature contrast](https://github.com/BenWassa/flag/issues/20)

Issue #19 is implemented through PR #51 and remains open for device QA. Focused usability bugs may ship independently where they remain reproducible. #54's completed river removal narrows the shared physical-context policy without changing canonical country geometry, topology or adjacency. #20's retained ocean/lake/land/border contrast remains relevant.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

### 4. Geography expansion

- [#22 — North America](https://github.com/BenWassa/flag/issues/22) (also owns Central America; #23 is superseded/closed — see [`issue-23-central-america-expansion.md`](../closed/issue-23-central-america-expansion.md))
- [#24 — South America](https://github.com/BenWassa/flag/issues/24)
- [#25 — Europe](https://github.com/BenWassa/flag/issues/25)
- [#26 — Asia](https://github.com/BenWassa/flag/issues/26)
- [#27 — Oceania](https://github.com/BenWassa/flag/issues/27)
- [#28 — Middle East conventional cross-continental learning region](https://github.com/BenWassa/flag/issues/28)

Africa remains the production baseline. Other continents can appear as shell/navigation states for visual and IA testing before their full Locations/Outlines/Neighbours data is implemented, but unsupported curriculum must never count towards mastery/completion.

## Working rules

- Before starting new work, check `gh issue list --state open` against this file and `docs/closed/`: any issue already closed on GitHub whose doc still lives in `docs/open/` should be moved to `docs/closed/` (`git mv`) and this index updated to drop/relink it.
- Read the GitHub Issue fully before implementation.
- Read `PRODUCT.md`, `DESIGN.md`, and the relevant durable product/architecture docs.
- `DESIGN.md` and `.impeccable/design.json` define the locked Tactile Atlas production system; focused issues may resolve previously deferred achievement presentation without creating a second visual language.
- Preserve stable routing, country identity, storage and cartography contracts.
- Use dedicated branches and focused PRs.
- Run `npm test`, inspect the exact production artifact and confirm CI before merge.
- Do not claim physical-device/browser testing that was not performed.
