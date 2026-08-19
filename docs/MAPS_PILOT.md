# Map Learning Pilot — West Africa

**Tracking:** issue #1  
**Status:** core merged via PR #4; visual/behavior refinement via PR #5; mobile gameplay refinement via PR #6  
**Pilot scope:** West Africa (16 scored countries inside full-Africa context)  
**Architecture target:** reusable for later continent and region assets

## What is implemented

The map feature is complete as a product loop while scored geography is deliberately constrained to one region.

- Dedicated **Country locations** entry point from the Flag Atlas home screen.
- **Learn** mode with Seterra-style guided feedback:
  - first-try correct → off-white;
  - one prior miss → amber/yellow;
  - two prior misses → orange;
  - third miss → target resolved/revealed red.
- Immediate correct taps receive transient green confirmation before settling to their persistent score fill.
- Wrongly selected countries receive transient red feedback and never remain filled as solved.
- **Test** mode gives one scored tap per country and withholds correctness until results.
- Every target appears once per standard round in deterministic shuffled order.
- Results map, first-try score, repeat, and mistake-only review.
- Separate persistent location-mastery ledger. Map answers never alter flag mastery.
- Location confusion counts record which active country was selected for a missed target.
- Three first-try successes in separate rounds master a location; a mastered miss lapses it and uses a two-success recovery goal.
- Dedicated map attempt log and storage sanitization.
- Keyboard-operable SVG countries, persistent live-region announcements, reduced-motion and forced-colors handling.
- Lazy-loaded map asset: geography is fetched by the browser only when map learning starts.
- Service worker caches the map module and mobile viewport helper after deployment.

## Pilot geometry

The scored West Africa polygons and faded full-Africa context are projected from Natural Earth's public-domain Admin-0 low-resolution data. Cabo Verde is represented by an explicit island locator because coarse global polygon sets omit tiny island states.

The expansion pipeline should replace the pilot polygon source with **Natural Earth 1:50m Admin-0 Countries v5.1.1**, preserving the same `MapRegionAsset` contract. The contract now supports:

- active/scored `countries`;
- faded, non-interactive `contextPaths`;
- an `initialFocus` rectangle for opening the continent canvas around the selected region.

## Regional mobile interaction decision — refined 2026-08-19

Regional study should preserve **continent context** without turning navigation into the learning task.

The current contract is:

1. render the full parent continent;
2. show active-region countries at normal emphasis and out-of-region countries faded;
3. make only active-region countries selectable/scorable;
4. open the pannable continent canvas focused on the chosen region;
5. allow native two-axis panning around the continent and preserve pan position across answer rerenders;
6. keep the active country prompt outside/stable above the pannable map;
7. use narrow-country hit assistance only where metadata requests it;
8. aim for roughly a **44px effective target diameter** where practical rather than arbitrarily oversized invisible circles;
9. clip enlarged assistance around every other active and context country, so a geographically wrong tap can never be silently credited as correct;
10. use a visible island locator when the source geometry cannot preserve a tiny state;
11. retain the true polygon as the visible scoring shape wherever a polygon exists.

The earlier PR #5 rule that the entire **region itself** should fit phone width without panning is superseded by PR #6. The better compromise is region-focused initial framing plus a larger pannable **continent** canvas: spatial context is preserved, but learners are not forced to hunt for the active region on every question.

## Country focus and feedback decision — refined 2026-08-19

- Do **not** show a rectangular SVG element bounding-box outline around a selected/focused country.
- Keyboard focus remains visible by highlighting the actual country border in action blue.
- Correct tap confirmation and persistent score are separate states:
  - immediate correct → transient green;
  - stored first try → off-white;
  - stored one miss → amber;
  - stored two misses → orange;
  - reveal → red.
- This keeps round-performance colors separate from durable mastery colors.
- Color is not the only feedback channel; prompt text and live announcements communicate outcomes too.

## Visual-system decision

Map mode is an extension of the Flag Atlas **Atlas Index** system, not a separate visual sub-product.

- Shared typography, progress strips, state vocabulary, action hierarchy, spacing, radii, and color tokens are reused.
- Large promotional cards, glass/blur surfaces, decorative shadows, oversized radii, and bespoke map-progress colors are excluded.
- The map itself is the dominant visual object during a round.
- Test confirms that a tap was recorded without revealing correctness.
- Results emphasize error structure (first try / one miss / two misses / revealed) and mistake review rather than a decorative percentage.

Detailed audits:

- [`MAP_UX_REFINEMENT_LOG.md`](MAP_UX_REFINEMENT_LOG.md) — visual-system and first interaction refinement.
- [`MAP_GAMEPLAY_REFINEMENT_LOG.md`](MAP_GAMEPLAY_REFINEMENT_LOG.md) — production gameplay feedback, continent-context/panning redesign, scoring colors, target sizing, CI/artifact review, and merge closeout.

## Accessibility boundary

The surrounding controls, focus restoration, keyboard activation, Escape handling, live announcements, reduced-motion handling, and forced-colors fallback remain accessible. Individual map areas deliberately do **not** announce country names while answering because that would disclose the solution. Country-location identification is inherently spatial; the app should document that limitation rather than create an assistive path that destroys the exercise.

Target-size guidance recognizes essential spatial map geometry, but the product still enlarges usable targets where doing so does not falsify geography or create ambiguous adjacent selections.

## Expansion checklist

Before enabling another scope:

- add a lazily loaded `MapRegionAsset`;
- include the full parent-continent context for regional scopes;
- define an appropriate `initialFocus` for the active region;
- reconcile every scored asset ID to the canonical `COUNTRIES` ISO3 ID;
- verify every curriculum country in the scope has either a path or explicit locator;
- inspect narrow states/islands at real phone scale and add targeted assistance where needed;
- ensure enlarged hit assistance cannot cross into any other active or context country geometry;
- verify country focus follows geography rather than SVG bounding boxes;
- verify immediate tap feedback and stored round score are visually distinct;
- add the scope to automated geometry/interaction verification;
- visually inspect borders and political-boundary implications;
- test Learn, Test, review-mistakes, pan preservation, keyboard selection, storage failure, reduced motion, forced colors, and offline revisit;
- perform production-device QA at representative portrait and short-landscape sizes before declaring the scope complete.

## Explicitly still pilot-limited

The engine supports multiple assets, modes, independent mastery, review, continent context, and pan preservation. The repository intentionally exposes only **West Africa** until additional geometry passes the same coverage, mobile-hit, interaction, and production-device validation. World-map mode remains deferred because it is a different interaction problem on phones.
