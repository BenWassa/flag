# Open Work

This directory mirrors active product/engineering work that benefits from a durable repository plan. GitHub Issues remain the canonical task tracker; these files preserve the decisions and relationships future agents need before implementation.

## Recommended sequencing

### 1. Product foundations — documented now

- Atlas learner-facing brand decision;
- global colour semantics;
- live country evidence vs earned regional mastery;
- scarcity-based gamification hierarchy;
- Africa-first complete proving ground;
- dedicated region-detail requirement.

### 2. Visual direction

- [#32 — Define and implement the new Atlas visual system](https://github.com/BenWassa/flag/issues/32)

#32 is intentionally blocked on the next visual-design exploration. Do not implement a broad style rewrite until `DESIGN.md` is expanded from foundations into the final production system.

### 3. Learning / achievement architecture

- [#29 — Refine country learning evidence and Learn/Play mechanics](https://github.com/BenWassa/flag/issues/29)
- [#34 — Implement earned region mastery, continent crests, and world crown](https://github.com/BenWassa/flag/issues/34)
- [#35 — Add region detail screen with cross-domain competency progress](https://github.com/BenWassa/flag/issues/35) — implemented: Home → continent → region → four-domain play grid (`src/ui/views/atlas.ts`, `/atlas/*` routes). Mastery badges/gold accents on that screen remain neutral placeholders pending #34.
- [#30 — Replace Flags Learn quiz with an interactive browse-and-reveal study surface](https://github.com/BenWassa/flag/issues/30)

These issues are related but should remain separable: country evidence, earned achievements, region navigation and Flags study are distinct concerns.

### 4. Brand rollout

- [#36 — Rename learner-facing product from Flag Atlas to Atlas](https://github.com/BenWassa/flag/issues/36)

Documentation may use Atlas now. Production UI/metadata should change in a focused implementation while stable technical identifiers remain compatible.

### 5. Existing presentation bugs / cartography

- [#19 — Neighbours mobile input: keep map anchored when keyboard opens](https://github.com/BenWassa/flag/issues/19)
- [#20 — Improve map colour palette and water-feature contrast](https://github.com/BenWassa/flag/issues/20)
- [#31 — Fix mobile landscape sizing bugs](https://github.com/BenWassa/flag/issues/31)

Focused usability bugs may ship independently where they remain reproducible. #20 should consume the new semantic palette without changing canonical geometry.

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
- Treat `DESIGN.md` as foundations-only until #32's style exploration is complete.
- Preserve stable routing, country identity, storage and cartography contracts.
- Use dedicated branches and focused PRs.
- Run `npm test`, inspect the exact production artifact and confirm CI before merge.
- Do not claim physical-device/browser testing that was not performed.
