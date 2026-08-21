# Flag Atlas — Gamification Design Brief

> **Archival note:** This brief was created while the learner-facing product was named **Flag Atlas**. The product was subsequently renamed **Atlas**. Historical wording below is retained intentionally; current product truth lives in the product/design documentation linked from the companion research README.


## Core Principle

Gamification should reward **meaningful learning**, not every interaction.

The interface can feel tactile and playful, but prestige signals must remain scarce. The more valuable the achievement, the rarer and more visually distinctive its treatment.

## Colour Semantics

| Role | Colour | Meaning |
|---|---|---|
| Primary / action | `#2563EB` Atlas Blue | Navigation, actions, selected states |
| Pressed / depth | `#1749B8` | Physical button depth |
| Action tint | `#EAF0FF` | Selected/light action surfaces |
| Correct | `#137A55` | Immediate correct-answer feedback |
| Wrong | `#B42318` | Immediate wrong-answer feedback |
| Mastery / competence | `#6D3FC0` | Durable evidence of learned material |
| Prestige / completeness | `#E0AF2F` | Rare high-value achievement accent |
| Canvas | `#F6F8FB` | App background |
| Primary text | `#101318` | Graphite text |

Green and red are **temporary feedback colours**. Purple is persistent. Gold is deliberately scarce.

## Achievement Hierarchy

### Country

Do not present an individual country as “mastered”.

Country-level learning remains underlying evidence used to determine broader completion.

### Region × Domain

The meaningful competency unit is mastering one learning domain across an entire region:

- Flags
- Outlines
- Locations
- Neighbours

**Selected direction: Option B — Clean Icons.**

In region lists, show four compact domain icons:

- Flag → flag icon
- Outlines → country-outline icon
- Locations → map-pin icon
- Neighbours → shared-border / adjacency icon

Incomplete icons remain neutral. Completed competencies turn purple.

On the region-detail view, completed competencies may receive the fuller **icon-on-shield badge** treatment.

Avoid shield-within-shield designs.

### Region Complete

A region is fully complete when all four domains are complete.

Keep the useful country count, e.g.:

**West Africa**  
17 countries

Do not replace this with `100%` or `17/17`.

A completed region should receive a restrained prestige treatment rather than a crown.

### Continent Complete

Continents do not need completion quantities.

Completing all regions/domains within a continent earns a prominent **continent crest** using the continent silhouette with restrained purple/gold treatment.

This is a rare, high-status achievement.

### World Complete

World completion is the ultimate achievement.

Reserve the **Crown** for this state: one crown, one highest status.

No `195/195`, percentage, or other completion metric is required.

## Visual Hierarchy

**Atlas Blue** → ordinary navigation and action  
**Green / Red** → transient answer feedback  
**Purple icons/badges** → learned competency  
**Gold accent** → completeness / prestige  
**Continent crest** → major achievement  
**Crown** → world completion only

## Gamification Rules

- Make ordinary interactions tactile and satisfying.
- Keep achievement visuals tied directly to geography learning.
- Avoid XP, coins, arbitrary streak rewards, achievement spam, and constant celebration.
- Do not give every completed object a badge.
- Use stronger animation/celebration only for genuinely rare milestones.
- Mastery/completion is acquired and not lost for now; decay/revalidation is a separate future learning-model question.

## Region-Complete Treatment

**Decision: gold accent only.**

When all four regional domain competencies are complete, the region receives a restrained gold accent or border.

Do not add a separate region emblem, medal, or crown.

This keeps the hierarchy clear and preserves scarcity:

**purple competency → gold-complete region → continent crest → world crown.**
