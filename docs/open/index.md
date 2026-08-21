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

- [#29 — Refine country learning evidence and Learn/Play mechanics](https://github.com/BenWassa/flag/issues/29)
- [#34 — Implement earned region mastery, continent crests, and world crown](https://github.com/BenWassa/flag/issues/34)
- [#30 — Replace Flags Learn quiz with an interactive browse-and-reveal study surface](https://github.com/BenWassa/flag/issues/30)

These issues are related but should remain separable: country evidence, earned achievements, region navigation and Flags study are distinct concerns.

#32, #35 and #40 are complete through PR #38. Their closeout records are [`issue-32-atlas-visual-system.md`](../closed/issue-32-atlas-visual-system.md), [`issue-35-region-detail.md`](../closed/issue-35-region-detail.md) and [`issue-40-phosphor-icon-system.md`](../closed/issue-40-phosphor-icon-system.md). Region mastery/gold visuals remain owned by #34.

### 3. Existing presentation bugs / cartography

- [#41 — Prevent intermittent focus outline on Atlas heading after refresh](issue-41-heading-focus.md)
- [#19 — Neighbours mobile input: keep map anchored when keyboard opens](https://github.com/BenWassa/flag/issues/19)
- [#20 — Improve map colour palette and water-feature contrast](https://github.com/BenWassa/flag/issues/20)
- [#54 — Remove rivers from Atlas maps to clarify political borders](https://github.com/BenWassa/flag/issues/54)

Focused usability bugs may ship independently where they remain reproducible. #54 establishes the global expansion cartography contract: ocean + useful lakes remain; river linework is removed so political borders dominate.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

### 4. Geography expansion foundation

Read [`../architecture/continent-expansion.md`](../architecture/continent-expansion.md) before any new continent implementation.

- [#57 — Generalise geography infrastructure for global continent expansion](https://github.com/BenWassa/flag/issues/57) — shared learning scopes, config-driven canonical generation, global-complete adjacency, lazy continent registry and parameterised verification.
- [#28 — Middle East conventional cross-continental learning scope](https://github.com/BenWassa/flag/issues/28) — consumes #57's overlapping-scope model; exact 17-country membership is locked.
- [#58 — Make zero-land-neighbour countries learnable in Neighbours](https://github.com/BenWassa/flag/issues/58) — required before Oceania can achieve honest four-domain parity in every region.

Africa remains the golden regression fixture. #57 must generalise the onboarding machinery without changing Africa behaviour.

### 5. Continent rollout

Recommended order after #57:

1. [#24 — South America](https://github.com/BenWassa/flag/issues/24) — second-continent proving ground for the generic pipeline.
2. [#22 — North America](https://github.com/BenWassa/flag/issues/22) — one parent asset containing Northern America, Central America and Caribbean.
3. [#27 — Oceania](https://github.com/BenWassa/flag/issues/27) — after #58; validates island-heavy/extreme-extent behaviour.
4. [#25 — Europe](https://github.com/BenWassa/flag/issues/25) — dense microstate/transcontinental hardening.
5. [#26 — Asia](https://github.com/BenWassa/flag/issues/26) — largest/policy-heavy expansion; consumes #28 and exposes Middle East + Caucasus.

[#23 — Central America](https://github.com/BenWassa/flag/issues/23) is superseded by #22 as a standalone implementation ticket. Central America remains a first-class 8-country learner-facing region inside North America; it does not get a second topology/runtime subsystem.

Once South America proves that a new continent is primarily configuration/policy/generated data rather than repeated core refactoring, later non-overlapping continent work may proceed in parallel where shared policy dependencies and branch conflicts are controlled.

Unsupported curriculum may appear as honest shell/navigation states before implementation, but must never count towards mastery/completion.

## Working rules

- Read the GitHub Issue fully before implementation.
- Read `PRODUCT.md`, `DESIGN.md`, and the relevant durable product/architecture docs.
- Read `docs/architecture/continent-expansion.md` for any continent expansion.
- `DESIGN.md` is the locked production design system (Tactile Atlas); only achievement art direction (#34) remains genuinely open.
- Preserve stable routing, country identity, storage and cartography contracts.
- Use canonical Natural Earth topology only; no handwritten geometry or neighbour tables.
- New runtime maps inherit #54's no-rivers policy.
- Use dedicated branches and focused PRs.
- Run `npm test`, inspect the exact production artifact and confirm CI before implementation merges.
- Do not claim physical-device/browser testing that was not performed.
