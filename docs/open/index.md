# Open Work

This directory mirrors active product/engineering work that benefits from a durable repository plan. GitHub Issues remain the canonical task tracker; these files preserve the decisions and relationships future agents need before implementation.

## Recommended sequencing

### 1. Product foundations — documented now

- Atlas learner-facing brand decision;
- global colour semantics;
- live country evidence vs earned regional mastery;
- scarcity-based gamification hierarchy;
- Africa-first complete proving ground;
- mode-first navigation: Home chooses a learning mode, each mode owns its continent index, and the launcher owns continent/region scope.

**2026-08-23: the dedicated Progress screen (and its Home button) was removed entirely**, along with its Reset-all-progress control, `progress.css`, and the domain-layer UI presenters (`achievement-art.ts`) it alone used. Region × domain cross-domain competency and continent/world completion state (#34/#56) keep being tracked and persisted (`AppStore.achievements`).

**2026-08-23 (same day, follow-up): region × domain mastery gained a first, lighter-weight surface again** — a purple mark and a restrained gold row outline attached directly to the existing region/continent launcher rows (`src/ui/views/scope.ts`, `map-home.ts`, `outline-home.ts`, `neighbor-home.ts`, `domain.ts`), not a revived Progress screen. The mastery trigger itself also changed: it's now earned by two consecutive 100%-correct full-region Play rounds in a domain (`PerfectRunStreakState` in `src/domain/achievements.ts`, persisted under `flag-atlas:region-domain-perfect-run-streaks:v1`), not by accumulating per-country evidence. The ordinary per-country/region progress bar also simplified to a single Atlas Blue "cleared" fill (answered correctly at least once) with no visible strong/learning/unseen taxonomy. See `docs/architecture/earned-achievements.md`, `docs/product/learning-and-mastery.md` and `docs/product/gamification.md`. Resetting earned mastery/streaks remains future work with no open issue yet.

### 2. Learning / achievement architecture

#29 (country learning evidence), #34 (persistent earned achievements), #56 (Progress mastery presentation), and #30 (Flags Learn gallery) are complete. Live country evidence can change while earned region/domain Mastery remains persistent. #29 and #34's closeout records are [`issue-29-learning-evidence.md`](../closed/issue-29-learning-evidence.md) and [`issue-34-earned-mastery.md`](../closed/issue-34-earned-mastery.md).

#32, #35 and #40 are complete through PR #38. Their closeout records are [`issue-32-atlas-visual-system.md`](../closed/issue-32-atlas-visual-system.md), [`issue-35-region-detail.md`](../closed/issue-35-region-detail.md) and [`issue-40-phosphor-icon-system.md`](../closed/issue-40-phosphor-icon-system.md).

### 3. Existing presentation bugs / cartography

#19 and #20 are complete and closed. Their closeout records are [`issue-19-neighbours-mobile-keyboard.md`](../closed/issue-19-neighbours-mobile-keyboard.md) and [`issue-20-map-colour-contrast.md`](../closed/issue-20-map-colour-contrast.md). #54's completed river removal narrows the shared physical-context policy without changing canonical country geometry, topology or adjacency.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

#111 is complete. Its launcher-list, seeded-progress and brushed-metal completion
treatment decisions and verification evidence are recorded in
[`issue-111-launcher-polish.md`](../closed/issue-111-launcher-polish.md).
#112 is complete. Its Africa opening-frame and generated Togo-callout decisions
and verification evidence are recorded in
[`issue-112-africa-framing-togo-callout.md`](../closed/issue-112-africa-framing-togo-callout.md).
#113 is complete. Its Europe/Asia audit, generated inset contract and Eastern
Mediterranean prototype evidence are recorded in
[`issue-113-mobile-inset-pattern.md`](../closed/issue-113-mobile-inset-pattern.md).

**#113's audit found that plain viewport framing buys more than any new mark**,
so the three largest measured wins were split out rather than folded into the
pattern work. Do these before adding further insets:

**#115, #116 and #86 are implemented together** on
`claude/open-issues-review-plan-tz6n9e`, because the two framing fixes share one
four-continent regeneration and #86's clipping is what returns Asia and Europe
inside their payload budgets afterwards. Measured on-screen linear change:
Western Europe **4.50x**, whole Europe **1.59x**, every Asian country **2.30x**
at maximum zoom, with every Asian region's opening frame also improving
(1.09x-2.30x) because three of them were pinned at the 180x170 focus floor. No
region on either continent got smaller. Evidence lives in
[`issue-86-clip-map-context.md`](issue-86-clip-map-context.md).

- [#115 — focus-exclude the Netherlands' Caribbean parts](https://github.com/BenWassa/flag/issues/115).
  Bonaire and Curaçao are 0.58% of `NLD` and about 1.2 × 1.0 CSS px on screen,
  yet they set both the west and south edge of the Western Europe frame.
  Excluding them makes that round **3.34× larger linearly, 11.2× by area**.
- [#116 — fit-exclude Russia from the Asia canvas](https://github.com/BenWassa/flag/issues/116).
  Asia has no `fitExcludeCountryIds`, so its canvas is fitted around Russia's
  trans-antimeridian geometry even though Russia is non-scoring Asia context.
  Every Asian country is **2.31× under-scaled, including at maximum zoom**,
  because max zoom is relative to the canvas. Also resolves the dead
  `fitContextCountryIds` entry.
- [#117 — clip locator and callout hit surfaces](https://github.com/BenWassa/flag/issues/117).
  The 44 CSS px assist discs are unclipped, so an assisted target silently steals
  taps from co-active neighbours. Only the Maldives locator has clean clearance
  across all of Europe and Asia. Likely a prerequisite for wider inset rollout.

- [#90 — keep the Flags question layout stable between flags](https://github.com/BenWassa/flag/issues/90).
  Different flag aspect ratios must not move the multiple-choice touch targets.
  The responsive implementation and verification scope is
  [`issue-90-stable-flag-stage.md`](issue-90-stable-flag-stage.md).
- [#104 — map-first continent launcher](https://github.com/BenWassa/flag/issues/104).
  **Deferred, captured only.** The launcher now has exactly one selection
  method: one tap on a scope row starts Play for that scope. The full-bleed
  region-map alternative (calm per-region colour, progress encoded into the
  geography) conflicts with the locked "no region colour taxonomy" decision in
  [`../product/colour-system.md`](../product/colour-system.md) and would encode
  progress in colour alone, so it needs its own product decision before any
  implementation. Scope and reasoning:
  [`issue-104-map-first-launcher.md`](issue-104-map-first-launcher.md).
- [#86 — clip continent context layers to the viewport](https://github.com/BenWassa/flag/issues/86).
  Reduce lazy map payloads in the shared generator without changing canonical
  country geometry or adjacency. The execution scope is
  [`issue-86-clip-map-context.md`](issue-86-clip-map-context.md).

### 4. Platform quality and IA

- [#89 — migrate Atlas to React and Vite without rewriting the product engine](https://github.com/BenWassa/flag/issues/89).
  This is the tracking epic for an incremental presentation/build-layer port.
  The scope-level epic is [`issue-89-react-vite-migration.md`](issue-89-react-vite-migration.md);
  the durable architecture decision is
  [`../architecture/react-vite-migration.md`](../architecture/react-vite-migration.md);
  the canonical dependency/order plan is
  [`issue-89-execution-plan.md`](issue-89-execution-plan.md); and implementation
  evidence is recorded in
  [`issue-89-implementation-worklog.md`](issue-89-implementation-worklog.md).
  The staged child chain is #91 → #92 → #93 → #94 → #95 → #96 → #97 → #98 →
  #99 → #100 → #101, followed by #89 closeout. Do not skip forward or collapse
  unrelated phases into one long-lived branch.
  Child issues #92–#101 are intentionally scoped as phase sections in the
  canonical execution plan rather than duplicated into ten competing issue
  documents.

#72 (legacy code/CSS audit) and #74 (full-continent Play evaluation) are
complete and closed. Their closeout records are
[`issue-72-legacy-code-css-audit.md`](../closed/issue-72-legacy-code-css-audit.md)
and [`issue-74-full-continent-play.md`](../closed/issue-74-full-continent-play.md); each
spun off a focused follow-up issue below.

- [#71 — mobile gestures, map immersion, safe areas](https://github.com/BenWassa/flag/issues/71).
  The gesture layer, map immersion and safe-area work are implemented and
  browser-verified; see [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
  and [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md).
  **Open only on physical-device validation** (Pixel/Android Chrome, iPhone/iOS
  Safari and installed PWA). Nothing further is verifiable in an emulator, so do
  not re-run browser checks expecting to close it. #89 must not claim this
  physical evidence unless #71 actually records it.
- [#46 — Firebase Hosting/Firestore port](https://github.com/BenWassa/flag/issues/46).
  Keep this separate from #89 so hosting/storage migration does not change the
  React/Vite compatibility boundary while the platform port is in flight.

#87 (gamification connective-tissue defects: due-state reporting, Play
feedback parity, Progress evidence coverage) is complete and closed. Its
closeout record is
[`issue-87-gamification-connective-tissue.md`](../closed/issue-87-gamification-connective-tissue.md).
The same 2026-08-23 review that surfaced #87 also identified a larger
achievement-milestone delivery/ceremony feature and full Locations/Neighbours
retention-scheduler unification; both were deliberately excluded from #87 and
need their own issues if pursued.

#77 (full-width continent/region navigation, Quick Play removal) and #78
(explicit Locations Play feedback) shipped in v0.7.0; their closeout records are
[`issue-77-full-width-navigation.md`](../closed/issue-77-full-width-navigation.md)
and [`issue-78-locations-play-feedback.md`](../closed/issue-78-locations-play-feedback.md).

#75 (silent round-drop on refresh) and #76 (full-continent Play) are complete
and closed. #76 remains the historical record for the direct-play experiment,
but #77 supersedes its learner-facing row-level Quick Play direction. Whole-
continent Play still exists as a normal deliberate launcher action; it is no
longer exposed as a trailing shortcut on continent or region selection rows.

**Mode-first IA change.** Navigation remains mode-first: Home lists the four
learning modes with their progress, `/{domain}` lists that mode's continents,
and `/{domain}/{continent}` is the launcher. Issue #77 refines the post-Home
presentation so continents and regions are full-width selection rows and the
active launcher owns Play/Learn. The `/atlas/*` routes, `src/ui/views/atlas.ts`
and the region card's four-domain launch row remain retired. Normative
descriptions live in `PRODUCT.md`, `DESIGN.md` and
[`../architecture/routing.md`](../architecture/routing.md); the closed records of
#35, #74 and #76 describe superseded historical presentation/shortcut decisions
and should be read as history.

### 5. Geography expansion

South America (#24), Europe (#25) and Asia (#26) shipped in v0.7.0 across all
four learning domains, together with the Middle East cross-continental scope
(#28). Their closeout records are
[`issue-24-south-america-expansion.md`](../closed/issue-24-south-america-expansion.md),
[`issue-25-europe-expansion.md`](../closed/issue-25-europe-expansion.md),
[`issue-26-asia-expansion.md`](../closed/issue-26-asia-expansion.md) and
[`issue-28-middle-east-region.md`](../closed/issue-28-middle-east-region.md).

Atlas now ships four production continents — Africa, South America, Europe and
Asia — each with a dedicated verifier gating curriculum, territory/context
policy, adjacency and runtime payload budget.

Still outstanding:

- [#22 — North America](https://github.com/BenWassa/flag/issues/22) (also owns Central America; #23 is superseded/closed — see [`issue-23-central-america-expansion.md`](../closed/issue-23-central-america-expansion.md))
- [#27 — Oceania](https://github.com/BenWassa/flag/issues/27)

Africa remains the reference baseline. North America and Oceania still appear
as shell/navigation states, and unsupported curriculum must never count towards
mastery/completion.

**Continent payload follow-up (#86).** Physical map context (ocean, coastline, lakes)
is now simplified per continent, which cut Europe by 29% and Asia by 21% of
gzip. Asia still ships the largest lazy chunk at roughly 478 KB gzip, because
its canvas spans canonical whole-country geometry. Clipping context layers to
each continent's viewport is the next available reduction and is tracked in
[`issue-86-clip-map-context.md`](issue-86-clip-map-context.md); it needs a
generator change and a full four-continent regeneration, so it was deliberately
not bundled into the v0.7.0 integration.

## Working rules

- Before starting new work, reconcile GitHub issue state against this file and `docs/closed/`.
- Read the live GitHub Issue fully before implementation.
- Read `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and the relevant durable product/architecture docs.
- Preserve stable routing, country identity, storage, learning and cartography contracts.
- Use dedicated branches and focused PRs.
- Run `npm test` under Node 22, inspect the exact production artifact and confirm CI before merge.
- Do not claim physical-device/browser testing that was not performed.
