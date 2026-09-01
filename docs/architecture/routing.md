# Routing and Product Information Architecture

**Status:** current production route/product contract  
**Transport:** hash URLs on GitHub Pages  
**Source of truth:** `src/routing/routes.ts`

## Core rule

**Routes own durable navigation state; Spatial Atlas interprets routes.**

`src/spatial/spatial-state.ts` is a pure presentation adapter. It does not call `pushState`, `replaceState` or maintain a second camera-owned navigation stack. Geography taps dispatch the same `AtlasActions` as equivalent DOM controls.

## Product dimensions

Atlas composes:

1. learning domain — Flags, Locations, Outlines, Neighbours;
2. geographic scope — World where applicable, continent, region;
3. activity — Learn, Play (`test` internally), Review where supported.

Navigation remains mode-first, but the normal presentation is spatial:

```text
Home / choose domain
→ world Earth / choose continent
→ continent stable scope
   ├── Play continent
   └── choose region
        → region stable scope
           ├── Play region
           └── Learn region
```

A geography tap selects/focuses a scope. It does **not** start Play. This deliberate selection→action seam is the production #166 behaviour and supersedes the old one-tap launcher-row interaction.

## Availability

All six real continents currently have intended four-domain production curriculum. Availability nevertheless remains explicit data so a future unsupported scope cannot become playable merely because its route parses.

A syntactically valid but unavailable scope normalises to an honest domain-level navigation state rather than silently substituting another continent.

## Representative routes

| State | URL |
| --- | --- |
| Home | `/#/` |
| Profile | `/#/profile` |
| Flags world/domain navigation | `/#/flags` |
| Flags → Africa focus | `/#/flags/africa` |
| Flags → West Africa focus | `/#/flags/africa/west-africa` |
| Flags → West Africa Learn | `/#/flags/africa/west-africa/learn` |
| Flags → World Play | `/#/flags/test` |
| Locations → Africa focus | `/#/locations/africa` |
| Locations → West Africa Play | `/#/locations/africa/west-africa/test` |
| Locations → Micronesia Play | `/#/locations/oceania/micronesia/test` |
| Locations → West Africa Review | `/#/locations/africa/west-africa/review` |
| Outlines → Europe focus | `/#/outlines/europe` |
| Neighbours → South America focus | `/#/neighbors/south-america` |

Region routes always serialise with their canonical parent continent; mismatched ancestry is invalid.

The retired `/atlas/*` scope-first family is not part of the grammar.

## URL state versus session state

### URL owns

- Home/profile stable identity;
- learning domain;
- continent/region scope;
- activity identity while active.

### Session/application state owns

- shuffled question/target order;
- current index;
- submitted answers/guesses;
- transient feedback/reveal state;
- map/session objects;
- timers/pending advance;
- current-process result state.

The URL is not a quiz event log.

## Refresh during an activity

If an activity URL loads without its matching in-memory session, the app returns by replacement navigation to that activity's stable scope. Persisted learning/achievement evidence survives; partial round internals are intentionally discarded.

Flags Learn is directly addressable as a stable browse/reveal surface; reveal state itself remains ephemeral.

## Back/Forward

Conceptual ancestry follows durable spatial scope:

```text
activity
→ region focus (when region-scoped)
→ continent focus
→ domain/world navigation
→ Home
```

Whole-continent activity returns to continent focus. Browser history remains native; camera travel merely visualises the route transition.

Cold deep links initialise at their target spatial state rather than replaying every ancestor camera move.

## Renderer failure

WebGL failure changes **presentation**, not route semantics. The conventional launcher fallback is built from the same scope model and must offer equivalent supported scopes/actions. Do not create fallback-only routes or different navigation truth.

## Product language versus identifiers

Learner-facing copy uses **Neighbours** and **Play**. Stable identifiers remain `neighbors`, `/neighbors`, `test`, `/test` and existing action/storage names. Do not create copy-only migrations.

## Document titles

Titles derive from typed route/result state and learner-facing names, e.g. `Flags · Atlas`, `West Africa flags · Atlas`, `Play West Africa locations · Atlas`, `Round complete · West Africa neighbours · Atlas`.

## Hosting

Hash routing remains appropriate for GitHub Pages and installed PWA cold starts. A future transport change may swap the browser adapter without changing the typed product hierarchy.

## Historical navigation work

#104 recorded an earlier map-first launcher exploration and the pre-Spatial row-launcher trade-offs. #119 established the continuous spatial architecture; #166 made it production. These are historical lineage, not concurrent navigation models. See [`../history.md`](../history.md).
