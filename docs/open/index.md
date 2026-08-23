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

**2026-08-23: the dedicated Progress screen (and its Home button) was removed entirely**, along with its Reset-all-progress control, `progress.css`, and the domain-layer UI presenters (`achievement-art.ts`) it alone used. Region × domain cross-domain competency and continent/world completion state (#34/#56) keep being tracked and persisted (`AppStore.achievements`), but no current surface reads or resets them. Reintroducing a way to see or reset earned mastery is future work with no open issue yet.

### 2. Learning / achievement architecture

#29 (country learning evidence), #34 (persistent earned achievements), #56 (Progress mastery presentation), and #30 (Flags Learn gallery) are complete. Live country evidence can change while earned region/domain Mastery remains persistent. #29 and #34's closeout records are [`issue-29-learning-evidence.md`](../closed/issue-29-learning-evidence.md) and [`issue-34-earned-mastery.md`](../closed/issue-34-earned-mastery.md).

#32, #35 and #40 are complete through PR #38. Their closeout records are [`issue-32-atlas-visual-system.md`](../closed/issue-32-atlas-visual-system.md), [`issue-35-region-detail.md`](../closed/issue-35-region-detail.md) and [`issue-40-phosphor-icon-system.md`](../closed/issue-40-phosphor-icon-system.md).

### 3. Existing presentation bugs / cartography

#19 and #20 are complete and closed. Their closeout records are [`issue-19-neighbours-mobile-keyboard.md`](../closed/issue-19-neighbours-mobile-keyboard.md) and [`issue-20-map-colour-contrast.md`](../closed/issue-20-map-colour-contrast.md). #54's completed river removal narrows the shared physical-context policy without changing canonical country geometry, topology or adjacency.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

### 4. Platform quality and IA

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
  not re-run browser checks expecting to close it.
- [#46 — Firebase Hosting/Firestore port](https://github.com/BenWassa/flag/issues/46).
  No repository plan yet; read the GitHub issue before starting.

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

**Continent payload follow-up.** Physical map context (ocean, coastline, lakes)
is now simplified per continent, which cut Europe by 29% and Asia by 21% of
gzip. Asia still ships the largest lazy chunk at roughly 478 KB gzip, because
its canvas spans canonical whole-country geometry. Clipping context layers to
each continent's viewport is the next available reduction and is tracked
separately; it needs a generator change and a full four-continent regeneration,
so it was deliberately not bundled into the v0.7.0 integration.

## Working rules

- Before starting new work, check `gh issue list --state open` against this file and `docs/closed/`: any issue already closed on GitHub whose doc still lives in `docs/open/` should be moved to `docs/closed/` (`git mv`) and this index updated to drop/relink it.
- Read the GitHub Issue fully before implementation.
- Read `PRODUCT.md`, `DESIGN.md`, and the relevant durable product/architecture docs.
- `DESIGN.md` and `.impeccable/design.json` define the locked Tactile Atlas production system; focused issues may resolve previously deferred achievement presentation without creating a second visual language.
- Preserve stable routing, country identity, storage and cartography contracts.
- Use dedicated branches and focused PRs.
- Run `npm test`, inspect the exact production artifact and confirm CI before merge.
- Do not claim physical-device/browser testing that was not performed.
