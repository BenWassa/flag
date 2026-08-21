# Issue #35 — Region detail and cross-domain competency

GitHub: https://github.com/BenWassa/flag/issues/35

## Status

**Implemented on `design/atlas-visual-system` (commit `c1abbd0` plus follow-up work), not yet merged — part of PR #38.** Move this doc to `closed/` once that branch merges to `main`.

## Goal

Add a stable routed region-detail screen that becomes the primary cross-domain view of a geographic region.

## Required content

- region identity;
- useful country count;
- Flags, Locations, Outlines and Neighbours competencies;
- neutral vs purple mastered competency states;
- Learn/Play entry points for supported domains;
- restrained gold treatment when the whole region is complete.

The region detail must remain useful without becoming a dashboard. Unsupported domain coverage must be represented honestly and cannot satisfy completion.

Africa is the first production proving ground.

Final visual composition depends on #32.

## What shipped

- New `/atlas/<continent>[/<region>]` routes (`src/routing/routes.ts`), with Back walking World → continent → region → domain launcher.
- `src/ui/views/atlas.ts`: a continent surface (region cards, each showing which of the four domains has real data) and a region surface (2×2 domain-play grid) using the Tactile Atlas arcade tier.
- `src/domain/scope-support.ts`: `scopeSupportsDomain`/`supportedDomainsForScope` as the single source of truth for which domains a scope actually has geometry for. Unsupported domains render as inert "coming soon" shells, never as launchers — satisfying "unsupported domain coverage must be represented honestly."
- Region country count and Learn/Play entry points: satisfied one level deeper, through the existing per-domain launcher (`open-scope`) reached from each region.
- A direct per-domain launch shortcut from the continent's region cards (icon buttons, 48px touch target) that starts a Play round for that domain/region immediately, without visiting the region-detail screen first.

## What's deferred to #34

- Purple mastered-competency state on domain icons.
- Restrained gold treatment for a fully complete region.
- The mastery medallion/badge shown in the approved mock-up.

These require the earned-mastery persistence model that #34 owns and were left as neutral/absent placeholders rather than guessed at.
