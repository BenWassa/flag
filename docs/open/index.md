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

### 2. Visual direction

- [#32 — Define and implement the new Atlas visual system](https://github.com/BenWassa/flag/issues/32)
- [#40 — Adopt Phosphor for routine Atlas iconography](https://github.com/BenWassa/flag/issues/40)

#32's visual-design exploration is decided and documented in `DESIGN.md` (Tactile Atlas). Implementation is landing incrementally on `design/atlas-visual-system` (PR #38); the issue stays open until that branch merges to `main`.

#40 is the focused follow-up for the remaining ordinary-icon decision: Phosphor Bold is the baseline, exact domain glyphs must be auditioned at production sizes, and custom artwork stays reserved for Atlas identity and prestige.

### 3. Learning / achievement architecture

- [#29 — Refine country learning evidence and Learn/Play mechanics](https://github.com/BenWassa/flag/issues/29)
- [#34 — Implement earned region mastery, continent crests, and world crown](https://github.com/BenWassa/flag/issues/34)
- [#30 — Replace Flags Learn quiz with an interactive browse-and-reveal study surface](https://github.com/BenWassa/flag/issues/30)

These issues are related but should remain separable: country evidence, earned achievements, region navigation and Flags study are distinct concerns.

#35 (region cross-domain competency) is implemented on `design/atlas-visual-system`, pending merge via PR #38 — see [`issue-35-region-detail.md`](issue-35-region-detail.md). The separate region-detail screen it originally shipped was retired in favour of direct domain-launch shortcuts on the continent surface's region cards. Its mastery/gold visuals still depend on #34.

### 4. Brand rollout

- [#36 — Rename learner-facing product from Flag Atlas to Atlas](https://github.com/BenWassa/flag/issues/36)

Documentation may use Atlas now. Production UI/metadata should change in a focused implementation while stable technical identifiers remain compatible.

### 5. Existing presentation bugs / cartography

- [#19 — Neighbours mobile input: keep map anchored when keyboard opens](https://github.com/BenWassa/flag/issues/19)
- [#20 — Improve map colour palette and water-feature contrast](https://github.com/BenWassa/flag/issues/20)

Focused usability bugs may ship independently where they remain reproducible. #20 should consume the new semantic palette without changing canonical geometry.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

### 6. Geography expansion

- [#22 — North America](https://github.com/BenWassa/flag/issues/22)
- [#23 — Central America](https://github.com/BenWassa/flag/issues/23)
- [#24 — South America](https://github.com/BenWassa/flag/issues/24)
- [#25 — Europe](https://github.com/BenWassa/flag/issues/25)
- [#26 — Asia](https://github.com/BenWassa/flag/issues/26)
- [#27 — Oceania](https://github.com/BenWassa/flag/issues/27)
- [#28 — Middle East conventional cross-continental learning region](https://github.com/BenWassa/flag/issues/28)

Africa remains the production baseline. Other continents can appear as shell/navigation states for visual and IA testing before their full Locations/Outlines/Neighbours data is implemented, but unsupported curriculum must never count towards mastery/completion.

## Working rules

- Read the GitHub Issue fully before implementation.
- Read `PRODUCT.md`, `DESIGN.md`, and the relevant durable product/architecture docs.
- `DESIGN.md` is the locked production design system (Tactile Atlas); only achievement art direction (#34) remains genuinely open.
- Preserve stable routing, country identity, storage and cartography contracts.
- Use dedicated branches and focused PRs.
- Run `npm test`, inspect the exact production artifact and confirm CI before merge.
- Do not claim physical-device/browser testing that was not performed.
