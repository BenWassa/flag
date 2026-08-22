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

#19 and #20 are complete and closed. Their closeout records are [`issue-19-neighbours-mobile-keyboard.md`](../closed/issue-19-neighbours-mobile-keyboard.md) and [`issue-20-map-colour-contrast.md`](../closed/issue-20-map-colour-contrast.md). #54's completed river removal narrows the shared physical-context policy without changing canonical country geometry, topology or adjacency.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

### 4. Platform quality and IA

- [#71 — mobile gestures, map immersion, safe areas](https://github.com/BenWassa/flag/issues/71).
  The gesture layer, map immersion and safe-area work are implemented and
  browser-verified; see [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
  and [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md).
  **Open only on physical-device validation** (Pixel/Android Chrome, iPhone/iOS
  Safari and installed PWA). Nothing further is verifiable in an emulator, so do
  not re-run browser checks expecting to close it.
- [#72 — legacy code, CSS architecture, repository bloat](https://github.com/BenWassa/flag/issues/72).
  Audit complete and Phase 3 (CSS ownership) delivered: 91 provably dead
  declarations removed, and two verifiers re-pointed at the sheets that actually
  own their values. See [`issue-72-legacy-code-css-audit.md`](issue-72-legacy-code-css-audit.md).
  Remaining: Phase 2 (refresh UX) belongs in its own issue.
- [#74 — full-continent Play entry](https://github.com/BenWassa/flag/issues/74).
  Evaluation complete with a recommendation to add it as a distinct first row
  above the region cards; the capability already works and is only unreachable
  from the continent surface. See [`issue-74-full-continent-play.md`](issue-74-full-continent-play.md).
  Delivery is a follow-up issue.
- [#46 — Firebase Hosting/Firestore port](https://github.com/BenWassa/flag/issues/46).
  No repository plan yet; read the GitHub issue before starting.

### 5. Geography expansion

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
