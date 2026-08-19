# Map Learning Pilot — West Africa

**Tracking:** issue #1  
**Status:** core via PR #4; visual/behavior refinement via PR #5; continent/mobile gameplay via PR #6; feedback/callouts/naming via PR #7  
**Pilot scope:** West Africa (16 scored countries inside full-Africa context)  
**Architecture target:** reusable for later continent and region assets

## What is implemented

The map feature is complete as a product loop while scored geography is deliberately constrained to one region.

- Dedicated **Country locations** entry point from the Flag Atlas home screen.
- **Learn** mode with Seterra-style guided feedback:
  - first-try correct → strong transient green confirmation, then stored off-white;
  - correct after one prior miss → amber/yellow immediately;
  - correct after two prior misses → orange immediately;
  - third miss → target resolved/revealed red.
- Green is reserved for **first-try correctness only**. A later correct answer never flashes green before amber/orange.
- Wrongly selected countries receive transient red feedback and never remain filled as solved.
- Resolved countries become non-interactive for the remainder of the round.
- **Test** mode gives one scored tap per country, visibly acknowledges the tap with a neutral state, and withholds correctness until results.
- Test feedback is guarded so a previous selection cannot carry into the next question and accidentally cue the answer.
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

The scored West Africa polygons and faded full-Africa context are projected from a **coarse Natural Earth-derived Admin-0 dataset**. Cabo Verde is represented by an explicit island locator because coarse global polygon sets can omit tiny island states.

This geometry is explicitly **MVP-grade**, not the final fidelity standard. A quantitative audit of the compiled polygons found measurable positive-area intersections at some shared borders, especially around small/narrow states. Styling reduces the visual seam amplification but does not repair source topology.

The production expansion pipeline should move to one consistent high-detail source/topology. The current near-term candidate is **Natural Earth 1:10m Admin-0 Countries with companion boundary data**; UN Maps authoritative boundary products should also be evaluated before final broad rollout. See [`MAP_GEOMETRY_SOURCES.md`](MAP_GEOMETRY_SOURCES.md).

`MapRegionAsset` now supports:

- active/scored `countries`;
- faded, non-interactive `contextPaths`;
- an `initialFocus` rectangle for opening the continent canvas around the selected region;
- optional explicit `callout` metadata for phone-small states/islands;
- optional clipped `hitAssist` metadata where a visible callout would add unnecessary clutter.

## Regional mobile interaction decision — refined 2026-08-19

Regional study should preserve **continent context** without turning navigation into the learning task.

The current contract is:

1. render the full parent continent;
2. show active-region countries at normal emphasis and out-of-region countries faded;
3. make only active-region countries selectable/scorable;
4. open the pannable continent canvas focused on the chosen region;
5. allow native two-axis panning around the continent and preserve pan position across answer rerenders;
6. keep the active country prompt outside/stable above the pannable map;
7. retain the true country polygon/locator as the geography being taught;
8. for genuinely phone-small geography, prefer an explicit nearby cartographic callout with a leader line and roughly 44px effective touch area;
9. ensure callout hit areas do not overlap active country geometry or one another;
10. use clipped neutral-space assistance only where it remains geographically honest and a visible callout would add needless clutter;
11. make resolved countries and their callouts/assists inert for the remainder of the round.

The earlier PR #5 rule that the entire **region itself** should fit phone width without panning is superseded. The better compromise is region-focused initial framing plus a larger pannable **continent** canvas: spatial context is preserved, but learners are not forced to hunt for the active region on every question.

### Current small-country treatment

Visible callouts:

- Cabo Verde;
- The Gambia;
- Guinea-Bissau;
- Sierra Leone;
- Togo.

Benin currently retains clipped neutral-space hit assistance rather than another Gulf callout.

## Country focus and feedback decision — refined 2026-08-19

- Do **not** show a rectangular SVG element bounding-box outline around a selected/focused country.
- Keyboard focus remains visible by highlighting the actual country geometry in action blue.
- Physical press gets a neutral action response before scoring.
- Learn feedback and persistent score are separate states:
  - first-try correct → transient green, then off-white;
  - correct after 1 miss → amber immediately;
  - correct after 2 misses → orange immediately;
  - reveal → red;
  - wrong selection → transient red only.
- Test uses a visible neutral/blue “recorded” response with no correctness leakage.
- Unanswered countries remain neutral gray enough that an off-white completed first-try state reads as a real visual change.
- Color is not the only feedback channel; prompt text and live announcements communicate outcomes too.

## Country naming decision

Country names are not maintained ad hoc. See [`COUNTRY_NAMING.md`](COUNTRY_NAMING.md).

- **UNGEGN / UNTERM** is the primary reference for current English short/formal country names and article treatment.
- **UN Statistics Division M49** is the reference for ISO-alpha3 linkage, UN regional grouping, current-name tables, and recent country-name changes.
- National government sources may confirm natural English display treatment where useful.
- ISO3 remains the stable application country ID.
- Familiar/legacy forms can remain aliases when useful to learners.

Current example: the primary UI label is **The Gambia**; `Gambia` remains an alias.

## Visual-system decision

Map mode is an extension of the Flag Atlas **Atlas Index** system, not a separate visual sub-product.

- Shared typography, progress strips, state vocabulary, action hierarchy, spacing, radii, and color tokens are reused.
- Large promotional cards, glass/blur surfaces, decorative shadows, oversized radii, and bespoke map-progress colors are excluded.
- The map itself is the dominant visual object during a round.
- Results emphasize error structure (first try / one miss / two misses / revealed) and mistake review rather than a decorative percentage.

Detailed audits:

- [`MAP_UX_REFINEMENT_LOG.md`](MAP_UX_REFINEMENT_LOG.md) — visual-system and first interaction refinement.
- [`MAP_GAMEPLAY_REFINEMENT_LOG.md`](MAP_GAMEPLAY_REFINEMENT_LOG.md) — continent-context/panning redesign and first mobile gameplay pass.
- [`MAP_FEEDBACK_V4_LOG.md`](MAP_FEEDBACK_V4_LOG.md) — on-device feedback, naming, callouts, quantitative border audit, CI/artifact review, and final evaluation.
- [`MAP_FEEDBACK_V4_RELEASE.md`](MAP_FEEDBACK_V4_RELEASE.md) — final PR-head gate and merge closeout.

## Accessibility boundary

The surrounding controls, focus restoration, keyboard activation, Escape handling, live announcements, reduced-motion handling, and forced-colors fallback remain accessible. Individual map areas deliberately do **not** announce country names while answering because that would disclose the solution. Country-location identification is inherently spatial; the app should document that limitation rather than create an assistive path that destroys the exercise.

Target-size guidance recognizes essential spatial map geometry, but the product still enlarges usable targets where doing so does not falsify geography or create ambiguous adjacent selections.

## Expansion checklist

Before enabling another scope:

- upgrade the geography pipeline to the approved high-fidelity topology/source standard;
- add a lazily loaded `MapRegionAsset`;
- include the full parent-continent context for regional scopes;
- define an appropriate `initialFocus` for the active region;
- reconcile every scored asset ID to the canonical `COUNTRIES` ISO3 ID;
- verify every curriculum country in the scope has a validated path or explicit locator/callout treatment;
- inspect small/narrow states at real phone scale and choose callout vs clipped assistance intentionally;
- ensure callout/hit assistance cannot cross into another country or another callout;
- verify shared-border geometry does not contain material polygon overlaps/gaps at normal gameplay scale;
- verify country focus follows geography rather than SVG bounding boxes;
- verify first-try-only green and direct amber/orange behavior after prior misses;
- verify resolved countries are inert;
- verify Test acknowledgment cannot cue a later answer;
- verify current country names against the UN-first naming policy;
- add the scope to automated geometry/interaction verification;
- document political/disputed-boundary implications;
- test Learn, Test, review-mistakes, pan preservation, keyboard selection, storage failure, reduced motion, forced colors, and offline revisit;
- perform production-device QA at representative portrait and short-landscape sizes before declaring the scope complete.

## Explicitly still pilot-limited

The engine supports multiple assets, modes, independent mastery, review, continent context, pan preservation, explicit callouts, and separate flag/location learning. The repository intentionally exposes only **West Africa** until additional geography passes the same coverage, naming, topology, mobile-hit, interaction, and production-device validation. World-map mode remains deferred because it is a different interaction problem on phones.
