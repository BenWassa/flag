# Issue #104: Map-first continent launcher

**Status:** Deferred — captured, not scheduled  
**GitHub:** [#104](https://github.com/BenWassa/flag/issues/104)

## Context

The continent launcher (`/{domain}/{continent}`) previously offered **two ways to choose a scope**: tapping a region row (which only *selected* it) and tapping a region label on the continent map (which also only selected it). Play was then a separate button. That two-method, two-step model is retired in favour of one-tap rows — the whole-continent row and each region row start Play directly, and Learn stays a single subordinate whole-continent action below the list.

This issue captures the **more ambitious map-first launcher** that was considered and deliberately deferred, so the reasoning is not lost.

## The deferred idea

Replace the row list with a full-bleed, immersive continent map as the single selection surface:

- clean SVG, country borders present but not hyper-realistic outlines;
- mainland plus major islands only;
- each region tinted in a calm, low-saturation colour;
- progress encoded *into the geography itself* — colour saturation, fill density, or similar — instead of a separate progress bar;
- possibly the country itself becoming the achievement badge.

## Why it is deferred, not rejected

**1. It contradicts a locked product decision.** `docs/product/colour-system.md` explicitly states: *"no continent colour taxonomy; no region colour taxonomy; no hemisphere theming; geography identity comes from the geography itself."* Tinting regions by identity is a direct reversal of that decision. It may be the right reversal, but it must be a deliberate product decision with its own rationale — not a side effect of a launcher redesign.

**2. Encoding progress as saturation is a legibility and accessibility regression.** The same document requires that *"colour must always reinforce another state cue"*. Saturation-as-progress is colour-only. It also collides with the semantic palette: Atlas Blue is action/selection, so a region filling with blue reads as "selected", not "70% cleared". A learner cannot read "11 of 16 cleared" off a fill density.

**3. The current launcher "map" was never a real map.** It was a 48×48 continent *icon* silhouette (`CONTINENT_PATHS`) with absolutely-positioned percentage-offset HTML labels on top. A genuinely region-clickable map is a new component, not a restyle.

**4. The geometry does exist, so this is feasible later.** `MapRegionAsset` already carries per-country paths, shared boundary paths, coastlines and a per-continent `viewBox`, generated from the pinned Natural Earth pipeline. A region map can be composed by grouping country geometry by region. No new map source is needed — and per `docs/architecture/cartography.md`, none may be created.

**5. Timing.** #89 (React/Vite migration) still has phases #92–#101 open, including the React map surfaces. Building a new interactive map component mid-migration means building it twice or blocking the migration.

## What shipped instead

One-tap row-wise launcher, as a deliberate interim to test the interaction model:

- whole-continent row at the top, carrying the Atlas Blue action emphasis the retired primary Play button owned, plus its own progress strip;
- one row per region, each with its own progress strip, mastery mark and completion treatment;
- one tap on any row starts Play for that scope;
- a single tertiary "Learn {Continent}" below the list;
- the launcher map, the separate Play button, the select-then-play step and all `select-region`/`select-continent` dispatch removed.

Because a row now starts its round directly, Back from a region round returns to the **continent** launcher it was started from, rather than to an intermediate region selection.

## Open questions for when this is picked up

- Does the region-colour reversal earn its keep, and what replaces "geography identity comes from the geography itself"?
- What is the non-colour progress cue that accompanies any saturation/density encoding?
- Does the whole-continent Play action survive on a map-first launcher, and where does it live?
- Where does Learn live when there is no list?
- How does an honest shell continent (North America, Oceania) render in a map-first launcher without implying coverage it lacks?

## Preservation boundaries

- Natural Earth 1:10m remains the sole production source; no second map source or hand-authored geometry.
- Canonical country ID remains ISO3.
- Purple stays mastery, gold stays scarce prestige, blue stays action, green/red stay answer feedback.
- Routing stays typed and durable; Back/Forward and activity-refresh fallback must keep working.
