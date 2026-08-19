# Map Learning Pilot — West Africa

**Tracking:** issue #1  
**Status:** merged to `main` via PR #4; UX refinement tracked in PR #5  
**Pilot scope:** West Africa (16 countries)  
**Architecture target:** reusable for later continent and region assets

## What is implemented

The map feature is complete as a product loop while geography is deliberately constrained to one region.

- Dedicated **Country locations** entry point from the Flag Atlas home screen.
- **Learn** mode with Seterra-style guided feedback:
  - first-try correct → off-white;
  - one prior miss → yellow;
  - two prior misses → orange;
  - third miss → target resolved/revealed red.
- **Test** mode with one tap per country and correctness withheld until results.
- Every target appears once per standard round in deterministic shuffled order.
- Results map, first-try score, repeat, and mistake-only review.
- Separate persistent location-mastery ledger. Map answers never alter flag mastery.
- Location confusion counts record which country was selected for a missed target.
- Three first-try successes in separate rounds master a location; a mastered miss lapses it and uses a two-success recovery goal.
- Dedicated map attempt log and storage sanitization.
- Keyboard-operable SVG countries, persistent live-region announcements, reduced-motion and forced-colors handling.
- Lazy-loaded map asset: geometry is fetched by the browser only when map learning starts.
- Service worker caches the map module after first same-origin fetch and precaches map styling.

## Pilot geometry

The 15 mainland polygons are projected from Natural Earth's public-domain Admin-0 low-resolution data. Cabo Verde is represented by an explicit island locator because coarse global polygon sets omit tiny island states.

The expansion pipeline should replace the pilot polygon source with **Natural Earth 1:50m Admin-0 Countries v5.1.1**, preserving the same `MapRegionAsset` contract. No UI, state, or persistence changes should be required for that upgrade.

## Mobile interaction decision — refined 2026-08-19

The first pilot implementation kept the SVG at a 700px minimum width and relied on horizontal panning to preserve small hit targets. The UX refinement supersedes that approach: map searching should test geographic recall, not the learner's ability to pan a canvas while remembering the prompt.

The pilot now:

1. fits the complete West Africa geography to the available phone width by default;
2. keeps the active country prompt above the map so the target remains visible while scanning;
3. uses enlarged hit assistance for narrow countries only where metadata explicitly requests it;
4. clips that enlarged assistance around every other country's geometry, so tapping a neighbour still records the neighbour as the selection rather than being silently credited to the current target;
5. uses a visible island locator for Cabo Verde;
6. retains the real polygon as the visible geographic shape wherever a polygon exists;
7. gives map areas visible press/focus feedback without permanently coloring a wrongly tapped country.

This preserves both touch usability and the learning contract. An accessibility assist must never make an adjacent wrong country count as correct.

## Visual-system decision — refined 2026-08-19

Map mode is an extension of the Flag Atlas **Atlas Index** system, not a separate visual sub-product.

- Shared typography, progress strips, state vocabulary, action hierarchy, spacing, radii, and color tokens are reused.
- Large promotional cards, glass/blur surfaces, decorative shadows, oversized radii, and bespoke map-progress colors are excluded.
- The map itself is the dominant visual object during a round.
- Learn feedback is expressed in text and semantic color.
- Test confirms that a tap was recorded without revealing correctness.
- Results emphasize error structure (first try / one miss / two misses / revealed) and the review action rather than a generic percentage score.

The detailed timestamped audit and implementation record is in [`MAP_UX_REFINEMENT_LOG.md`](MAP_UX_REFINEMENT_LOG.md).

## Accessibility boundary

The surrounding controls, focus restoration, keyboard activation, Escape handling, live announcements, reduced-motion handling, and forced-colors fallback remain accessible. Individual map areas deliberately do **not** announce country names while answering because that would disclose the solution. Country-location identification is inherently spatial; the app should document that limitation rather than create an assistive path that destroys the exercise.

WCAG target-size requirements recognize that spatial map targets can qualify for the essential-presentation exception, but the product still aims to enlarge usable targets where doing so does not falsify the geography or create ambiguous adjacent selections.

## Expansion checklist

Before enabling another scope:

- add a lazily loaded `MapRegionAsset`;
- reconcile every asset ID to the canonical `COUNTRIES` ISO3 ID;
- verify every curriculum country in the scope has either a path or explicit locator;
- inspect narrow states/islands at phone width and add hit treatment where needed;
- ensure enlarged hit assistance cannot cross into another country's selectable geometry;
- add the scope to automated verification;
- visually inspect borders and political-boundary implications;
- test Learn, Test, review-mistakes, keyboard selection, storage failure, reduced motion, forced colors, and offline revisit;
- perform production-device QA at representative portrait and landscape sizes before declaring the scope complete.

## Explicitly still pilot-limited

The engine supports multiple assets, modes, independent mastery, and review. The repository intentionally exposes only **West Africa** until additional geometry passes the same coverage and mobile-hit validation. World-map mode remains deferred because it is a different interaction problem on phones.
