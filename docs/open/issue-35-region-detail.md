# Issue #35 — Region detail and cross-domain competency

GitHub: https://github.com/BenWassa/flag/issues/35

## Status

**Superseded on `design/atlas-visual-system`.** The dedicated region-detail screen (the 2×2 domain-play grid at `/atlas/{continent}/{region}`) shipped first, then was removed once the continent surface's per-region domain-launch shortcuts made it a redundant extra tap: every region card already names its four domains and starts a round directly, so the intermediate "select a mode" screen had nothing left to do. Cross-domain competency now lives one level up, on the continent surface. Move this doc to `closed/` once that decision merges to `main`.

## Goal

Give a region a stable, cross-domain view: region identity, country count, and the four learning-domain competencies, reachable in one tap from the continent surface.

## Required content

- region identity;
- useful country count;
- Flags, Locations, Outlines and Neighbours competencies;
- neutral vs purple mastered competency states;
- Learn/Play entry points for supported domains;
- restrained gold treatment when the whole region is complete.

Unsupported domain coverage must be represented honestly and cannot satisfy completion.

Africa is the first production proving ground.

Final visual composition depends on #32.

## What shipped

- `/atlas/<continent>` (`src/routing/routes.ts`): the continent surface lists every region as a card, each showing region identity, country count, and one domain-launch icon per domain. Back walks World → continent → Home. The legacy `/atlas/{continent}/{region}` URL still parses (for old links/bookmarks) but now collapses onto its continent's route rather than opening a separate screen.
- `src/ui/views/atlas.ts`: `renderContinent` — region cards (`regionCard`), each with a `domain-launch-row` of direct per-domain Play shortcuts (`quick-play`, 48px touch target) that start a round immediately, without an intermediate region screen.
- `src/domain/scope-support.ts`: `scopeSupportsDomain`/`supportedDomainsForScope` as the single source of truth for which domains a scope actually has geometry for. Unsupported domains render as inert "coming soon" shells (`domain-launch--absent`) on the region card itself, never as launchers — satisfying "unsupported domain coverage must be represented honestly."
- Region country count: shown directly on the region card.

## What's deferred to #34

- Purple mastered-competency state on domain icons.
- Restrained gold treatment for a fully complete region.
- The mastery medallion/badge shown in the approved mock-up.

These require the earned-mastery persistence model that #34 owns and were left as neutral/absent placeholders rather than guessed at. Since there is no longer a separate region-detail screen, this treatment will land on the region card itself.
