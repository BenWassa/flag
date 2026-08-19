# Map Learning Pilot — West Africa

**Tracking:** issue #1  
**Status:** merged to `main` via PR #4  
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
- Keyboard-operable SVG countries, persistent live-region announcements, reduced-motion handling, and scrollable mobile map treatment.
- Lazy-loaded map asset: geometry is fetched by the browser only when map learning starts.
- Service worker caches the map module after first same-origin fetch and precaches map styling.

## Pilot geometry

The 15 mainland polygons are projected from Natural Earth's public-domain Admin-0 low-resolution data. Cabo Verde is represented by an explicit island locator because coarse global polygon sets omit tiny island states.

The expansion pipeline should replace the pilot polygon source with **Natural Earth 1:50m Admin-0 Countries v5.1.1**, preserving the same `MapRegionAsset` contract. No UI, state, or persistence changes should be required for that upgrade.

## Mobile interaction decision

A literal whole-region map makes narrow countries difficult to hit at 360px viewport width. The pilot therefore:

1. keeps the SVG at a minimum rendered width on small screens and lets the map pan horizontally;
2. uses transparent hit assists for Benin, Togo, Gambia, Guinea-Bissau, and Cabo Verde;
3. uses a visible island locator for Cabo Verde;
4. retains the true polygon as the visible geographic shape whenever a polygon exists.

This is part of the feature contract, not optional polish. It supersedes the initial planning assumption that the full map should never require horizontal movement on a phone; preserving geographic precision and reliable targets is more important for the pilot.

## Accessibility boundary

The surrounding controls, focus restoration, keyboard activation, Escape handling, and live announcements remain accessible. Individual map areas deliberately do **not** announce country names while answering because that would disclose the solution. Country-location identification is inherently spatial; the app should document that limitation rather than create an assistive path that destroys the exercise.

## Expansion checklist

Before enabling another scope:

- add a lazily loaded `MapRegionAsset`;
- reconcile every asset ID to the canonical `COUNTRIES` ISO3 ID;
- verify every curriculum country in the scope has either a path or explicit locator;
- inspect narrow states/islands at phone width and add hit treatment where needed;
- add the scope to automated verification;
- visually inspect borders and political-boundary implications;
- test Learn, Test, review-mistakes, keyboard selection, storage failure, and offline revisit.

## Explicitly still pilot-limited

The engine supports multiple assets, modes, independent mastery, and review. The repository intentionally exposes only **West Africa** until additional geometry passes the same coverage and mobile-hit validation. World-map mode remains deferred because it is a different interaction problem on phones.
