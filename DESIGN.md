# Atlas Design Foundations

## Status

Atlas is entering a full visual redesign.

This document records the **locked design foundations** that the next visual-style exploration must preserve. It intentionally does **not** lock the final shape language, radius system, elevation, typography personality, navigation composition, motion style, or exact crest/crown art direction yet.

Issue #32 owns that next design phase and the later production implementation.

The previously shipped flat “atlas index” aesthetic is no longer a requirement to preserve.

## Core principle

**Geography is the content. Interface is the instrument. Prestige is scarce.**

Flags, maps, outlines and geographic context should remain the richest and most important visual objects. Product chrome may become more tactile and playful, but it should not visually overpower the geography.

Gamification should concentrate around meaningful learning milestones rather than decorate every interaction.

## Locked colour system

```yaml
colors:
  canvas: "#F6F8FB"
  text: "#101318"
  action: "#2563EB"
  action-pressed: "#1749B8"
  action-soft: "#EAF0FF"
  correct: "#137A55"
  wrong: "#B42318"
  mastery: "#6D3FC0"
  prestige: "#E0AF2F"
```

These roles are semantic.

### Atlas Blue — action

`#2563EB`

Use for ordinary primary action, navigation emphasis, selection, focus and active controls.

Pressed/depth state: `#1749B8`.

Light selected/action surface: `#EAF0FF`.

Blue was selected from the world-flag colour study because it is a major flag-derived colour family while remaining semantically available after reserving green and red for answer feedback.

### Green — correct

`#137A55`

Use for immediate correct-answer feedback and positive resolution of the current task.

Green is transient. It should not become the general brand colour or the durable mastery colour.

### Red — wrong

`#B42318`

Use for immediate wrong-answer feedback, genuine error states and destructive actions where appropriate.

Avoid routine decorative red so it retains immediate meaning.

### Purple — mastery

`#6D3FC0`

Use for durable region × domain mastery.

Purple is intentionally distinct from ordinary flag imagery and from the action/correct/wrong loop.

### Gold — prestige / completeness

`#E0AF2F`

Gold is deliberately scarce.

Use for:

- complete-region accents;
- continent-crest prestige detail;
- the world Crown;
- exceptional milestone treatment.

Do not use gold for ordinary navigation, generic highlights, progress bars, routine active states or decorative trim.

### Neutral base

Canvas: `#F6F8FB`.

Primary text: `#101318`.

The supporting neutral scale may be refined during the visual-style pass, but it should stay cool, legible and subordinate to flags/maps.

## Colour-study rule

The global palette is derived from the aggregate visual vocabulary of national flags.

Do **not** create separate continent, region or hemisphere theme colours from the research. Geographic identity should primarily come from maps, silhouettes, names and grouping rather than a parallel rainbow taxonomy.

See `docs/product/colour-system.md`.

## Achievement visual hierarchy

### Country

Country records are learning evidence, not prestigious mastery objects.

Do not give individual countries crowns, medals or high-status mastery treatment.

Country-level evidence may still need neutral/learning/review cues where operationally useful, but those should not compete with earned regional achievements.

### Region × domain mastery

The first learner-facing mastery state is one full learning domain across a region.

Use a compact domain icon:

- Flags — flag icon;
- Outlines — country-outline icon;
- Locations — map-pin/location icon;
- Neighbours — adjacency/shared-border icon.

Incomplete competency is neutral.

Mastered competency becomes purple.

In an expanded/dedicated region context, a mastered competency may use a fuller icon-on-shield badge treatment.

Avoid shield-within-shield designs and unnecessary heraldic complexity.

### Complete region

When all required regional domain competencies are complete, use a restrained **gold accent or border**.

Do not add a separate region emblem, medal or crown.

Keep useful scope information such as country count.

Do not show `100%` or `x/x` merely to restate completion.

### Complete continent

Award a **continent crest** based on the continent silhouette.

The crest may use restrained purple/gold treatment and should feel materially rarer and more prestigious than region completion.

Continents do not need completion quantities.

### Complete world

Reserve the **Crown** for world completion alone.

The Crown is the highest visual status in the product. Do not add a higher tier above it.

No `195/195` or percentage is required once the Crown has been earned.

## Scarcity rule

Visual prestige must scale inversely with frequency.

**Purple competence → gold-complete region → continent crest → world Crown.**

The higher the achievement, the less frequently its visual language should appear elsewhere.

Do not dilute gold or Crown imagery through decorative reuse.

## Interaction character

Ordinary controls should feel responsive and satisfying.

The exact visual mechanism is still open, but the design exploration may use:

- tactile press response;
- physical depth;
- transform-based motion;
- strong touch affordance;
- softened geometry;
- concise state transitions.

Do not assume that a specific “Juicy Squircle” implementation, Tailwind class system, radius value or 3D border recipe is already final. Those belong to the next design decision.

### Feedback intensity

Use three broad intensity levels:

1. **ordinary interaction** — responsive/tactile;
2. **correct/wrong** — crisp, immediate semantic feedback;
3. **earned milestone** — stronger but still controlled ceremony.

Constant celebration makes meaningful milestones cheaper.

## Layout foundations

### Mobile first

Phone portrait is the primary design context.

Short landscape must be deliberately supported rather than treated as an afterthought.

### Primary selection

Do not use horizontal scrolling for primary navigation or scope selection.

Navigation should be immediately scannable and support large touch targets.

The exact card/list/grid language is intentionally pending the next visual-style decision.

### Region detail

A dedicated region-detail screen is required.

It should make region identity, country count, four domain competencies, mastery state and Learn/Play entry points understandable without becoming a dense dashboard.

Issue #35 owns implementation.

### Learning surfaces

In active rounds, the learning object should dominate available space:

- flag;
- map;
- outline;
- neighbour geography.

Answer controls should remain easily reachable, especially on mobile.

### Progress and results

Treat analytics as compact, readable information surfaces.

Prefer stacked/grouped information over spreadsheet-like tables.

Avoid turning every statistic into a separate promotional card.

## Maps and cartography

The visual redesign must not create a second cartographic system.

Production maps continue to use canonical geometry/topology and the existing projection/data pipeline.

App chrome and map styling can evolve together, but cartography has distinct functional needs for:

- land/water differentiation;
- context geography;
- targets;
- solved/revealed states;
- borders/coastlines;
- lakes/rivers;
- labels/callouts.

Issue #20 owns the shared cartographic colour/contrast refinement.

Do not theme maps by continent flag palette.

## Typography

Typography must remain highly legible, mobile-safe and compatible with British-English product copy.

The exact family, weight hierarchy and level of roundness/personality are **not yet locked**.

Requirements that remain:

- body text must remain comfortable at phone scale;
- metadata must not shrink into unreadability;
- comparative numerals should use tabular figures where useful;
- headings should create clear hierarchy without dominating the geography;
- avoid novelty type that makes the product feel themed rather than durable.

## Shapes, radius and elevation

**Not yet locked.**

The next design pass should explicitly decide:

- squircle vs conventional rounded rectangle language;
- radius scale;
- whether controls use physical bottom depth, soft shadow, inset treatment or another tactile model;
- where elevation is appropriate;
- how selected cards differ from buttons;
- how achievement badges/crests relate to ordinary controls.

Do not preserve the old 6px/9px radius system merely because it is currently shipped.

Do not introduce visual depth everywhere. Tactility and prestige should still have hierarchy.

## Motion

Motion should explain state and improve physicality, not become ambient decoration.

Requirements:

- transform/opacity are preferred for routine motion;
- interactions should feel immediate;
- milestone animation may be stronger than routine feedback;
- avoid long blocking celebrations;
- respect `prefers-reduced-motion`;
- keep focus and page position stable through rerenders;
- never let animation interfere with answer timing or accessibility announcements.

Exact spring/easing values are part of the next design pass.

## Accessibility

Every visual state must remain understandable without colour alone.

Preserve:

- visible keyboard focus;
- 44px minimum practical touch targets where controls require it;
- non-colour state cues;
- answer-safe accessible names;
- screen-reader announcements through stable live regions;
- reduced-motion alternatives;
- readable zoomed text;
- mobile safe areas;
- stable focus after state changes;
- deliberate short-landscape behaviour.

Gold should generally be treated as an accent rather than small text. Use dark text on gold surfaces where text is necessary and contrast supports it.

## Product language

All learner-facing copy uses modern British English (`en-GB`).

The learner-facing product name is **Atlas**.

The learner-facing domain is **Neighbours** and the assessment action is **Play**.

Stable technical identifiers may retain legacy spelling/naming for compatibility.

## Design anti-patterns

Do not introduce:

- XP/coin/reward economies;
- arbitrary streak rewards;
- achievement spam;
- crowns on ordinary objects;
- gold as generic decoration;
- continent/region colour themes;
- decorative geography backgrounds that compete with real maps;
- glassmorphism for its own sake;
- bento/dashboard styling that fragments the learning hierarchy;
- a parallel icon system of emoji/Unicode symbols;
- framework/tooling changes justified only by fashion.

## Decisions pending the next design session

The next design work should resolve, in order:

1. overall visual personality and reference family;
2. shape/radius language;
3. control depth and press physics;
4. navigation composition for Home / continents / regions;
5. region-detail composition;
6. typography;
7. ordinary icon style;
8. region mastery badge/shield treatment;
9. continent crest art direction;
10. world Crown art direction;
11. motion intensity and milestone ceremony;
12. final component/token specification.

Once those are selected, rewrite this file from “foundations” into the complete production design system before implementing #32.
