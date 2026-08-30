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

#138 is complete and closed through PR #145: the earned World Crown now has a learner-facing surface, consuming #34's existing achievement/read model without changing qualification, persistence or Mastery semantics.

### 3. Existing presentation bugs / cartography

#19 and #20 are complete and closed. Their closeout records are [`issue-19-neighbours-mobile-keyboard.md`](../closed/issue-19-neighbours-mobile-keyboard.md) and [`issue-20-map-colour-contrast.md`](../closed/issue-20-map-colour-contrast.md). #54's completed river removal narrows the shared physical-context policy without changing canonical country geometry, topology or adjacency.

#31 (short-landscape sizing) is resolved — see [`closed/issue-31-short-landscape.md`](../closed/issue-31-short-landscape.md).

#111 is complete. Its launcher-list, seeded-progress and brushed-metal completion treatment decisions and verification evidence are recorded in [`issue-111-launcher-polish.md`](../closed/issue-111-launcher-polish.md).
#112 is complete. Its Africa opening-frame and generated Togo-callout decisions and verification evidence are recorded in [`issue-112-africa-framing-togo-callout.md`](../closed/issue-112-africa-framing-togo-callout.md).
#113 is complete. Its Europe/Asia audit, generated inset contract and Eastern Mediterranean prototype evidence are recorded in [`issue-113-mobile-inset-pattern.md`](../closed/issue-113-mobile-inset-pattern.md).

The three largest follow-ups from #113 are complete. #115 corrected Western Europe framing, #116 corrected Asia's Russia-driven canvas fit, #86 clipped out-of-canvas context to return both modules inside their payload budgets, and #117 made real country polygons win contested taps over assisted marks. #90's stable Flags stage and #108's complete-region Mastery guard shipped in the same production merge. Durable closeout records:

- [`#86 map-context clipping`](../closed/issue-86-clip-map-context.md)
- [`#90 stable Flags stage`](../closed/issue-90-stable-flag-stage.md)
- [`#108 complete-region Mastery`](../closed/issue-108-complete-region-mastery.md)
- [`#115 Western Europe framing`](../closed/issue-115-western-europe-framing.md)
- [`#116 Asia/Russia framing`](../closed/issue-116-asia-russia-framing.md)
- [`#117 map hit precedence`](../closed/issue-117-map-hit-precedence.md)

Measured on-screen linear change was Western Europe **4.50x**, whole Europe **1.59x**, and every Asian country **2.30x** at maximum zoom. No region became smaller.

#104 (map-first continent launcher) is **closed**, not an open/deferred dependency. Its geography-first selection question remains historical input to #119's completed 2D continuity probe; #119 must not revive #104's conflicting colour-only progress or region-colour taxonomy. Historical scope/reasoning remains in [`issue-104-map-first-launcher.md`](issue-104-map-first-launcher.md).

### 4. Platform quality and IA

#89 and its final child validation issues (#93, #96–#101) are complete through PR #128 (`4275f1f`) and merged-main CI #33069168541. The production React/Vite closeout record is [`issue-89-react-vite-migration.md`](../closed/issue-89-react-vite-migration.md), with the executed plan and evidence log in [`issue-89-execution-plan.md`](../closed/issue-89-execution-plan.md) and [`issue-89-implementation-worklog.md`](../closed/issue-89-implementation-worklog.md). Physical-device validation remains separately open in #71.

#72 (legacy code/CSS audit) and #74 (full-continent Play evaluation) are complete and closed. Their closeout records are [`issue-72-legacy-code-css-audit.md`](../closed/issue-72-legacy-code-css-audit.md) and [`issue-74-full-continent-play.md`](../closed/issue-74-full-continent-play.md); each spun off a focused follow-up issue below.

- [#71 — mobile gestures, map immersion, safe areas](https://github.com/BenWassa/flag/issues/71).
  The gesture layer, map immersion and safe-area work are implemented and browser-verified; see [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md) and [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md).
  **Open only on physical-device validation** (Pixel/Android Chrome, iPhone/iOS Safari and installed PWA). Nothing further is verifiable in an emulator, so do not re-run browser checks expecting to close it. #89 must not claim this physical evidence unless #71 actually records it.

The Firebase programme (#46) is complete. #106 shipped optional local-first cloud progress/account lifecycle and #107 accepted Firebase Hosting as a live secondary target while GitHub Pages remains primary. Durable production architecture is [`../architecture/firebase.md`](../architecture/firebase.md); final programme and Hosting evidence are [`../closed/issue-46-firebase.md`](../closed/issue-46-firebase.md) and [`../closed/issue-107-firebase-hosting.md`](../closed/issue-107-firebase-hosting.md).

#87 (gamification connective-tissue defects: due-state reporting, Play feedback parity, Progress evidence coverage) is complete and closed. Its closeout record is [`issue-87-gamification-connective-tissue.md`](../closed/issue-87-gamification-connective-tissue.md). The same 2026-08-23 review that surfaced #87 also identified a larger achievement-milestone delivery/ceremony feature and full Locations/Neighbours retention-scheduler unification; both were deliberately excluded from #87 and need their own issues if pursued.

#77 (full-width continent/region navigation, Quick Play removal) and #78 (explicit Locations Play feedback) shipped in v0.7.0; their closeout records are [`issue-77-full-width-navigation.md`](../closed/issue-77-full-width-navigation.md) and [`issue-78-locations-play-feedback.md`](../closed/issue-78-locations-play-feedback.md).

#75 (silent round-drop on refresh) and #76 (full-continent Play) are complete and closed. #76 remains the historical record for the direct-play experiment, but #77 supersedes its learner-facing row-level Quick Play direction. Whole-continent Play still exists as a normal deliberate launcher action; it is no longer exposed as a trailing shortcut on continent or region selection rows.

**Mode-first IA change.** Navigation remains mode-first: Home lists the four learning modes with their progress, `/{domain}` lists that mode's continents, and `/{domain}/{continent}` is the launcher. Issue #77 refines the post-Home presentation so continents and regions are full-width selection rows and the active launcher owns Play/Learn. The `/atlas/*` routes, `src/ui/views/atlas.ts` and the region card's four-domain launch row remain retired. Normative descriptions live in `PRODUCT.md`, `DESIGN.md` and [`../architecture/routing.md`](../architecture/routing.md); the closed records of #35, #74 and #76 describe superseded historical presentation/shortcut decisions and should be read as history.

### 5. Geography expansion

South America (#24), Europe (#25), Asia (#26), North America (#22) and Oceania (#27) are shipped across all four learning domains, together with the Middle East cross-continental scope (#28). Durable closeout records are
[`issue-24-south-america-expansion.md`](../closed/issue-24-south-america-expansion.md),
[`issue-25-europe-expansion.md`](../closed/issue-25-europe-expansion.md),
[`issue-26-asia-expansion.md`](../closed/issue-26-asia-expansion.md),
[`issue-22-north-america-expansion.md`](../closed/issue-22-north-america-expansion.md),
[`issue-27-oceania-expansion.md`](../closed/issue-27-oceania-expansion.md) and
[`issue-28-middle-east-region.md`](../closed/issue-28-middle-east-region.md).

#27 shipped through PR #143. Its post-#22 technical candidate `24d3e3a4f476ec5a20be198c0aec5e194a5a40f9` passed integrated acceptance in Actions run `33137730483`; merge/deployment evidence is in the closed record above.

Atlas now ships production curriculum for all six real continents — Africa, South America, Europe, Asia, North America and Oceania — through the shared generator/topology architecture. Africa remains the reference baseline.

#22 also owns Central America; #23 remains superseded/closed and was not recreated as a parallel runtime/topology path. Oceania adds truthful `PNG ↔ IDN` cross-continent adjacency plus explicit zero-land-neighbour targets without changing the neighbour definition.

All six continents satisfy the four-domain curriculum gate used by the achievement read model. Learner-facing World Crown surfacing remains separate under #138; #27 did not alter achievement semantics.

- [#137 — Asia Locations/cartography hardening](https://github.com/BenWassa/flag/issues/137) remains open. It no longer blocks #119's owner-authorised full-candidate implementation; any eventual production migration must reconcile against then-current `main`.

**Continent payload follow-up (#86).** Context clipping is complete. Europe is 432,961 bytes gzip against a 440,000-byte budget and Asia is 493,590 against a 500,000-byte budget, while Africa and South America remain byte-identical. See the [`#86 closeout record`](../closed/issue-86-clip-map-context.md).

### 6. Spatial Atlas

- [#119 — continuous spatial Atlas shell](https://github.com/BenWassa/flag/issues/119).
  **Accepted and shipped.** The renderer comparison, the geometry/LOD envelope,
  the candidate build and the deployed `./spatial/` preview all belong to #119;
  its durable architecture record is
  [`../architecture/spatial-atlas.md`](../architecture/spatial-atlas.md).
  Supporting evidence remains in
  [`renderer comparison`](issue-119-renderer-comparison.md),
  [`geometry/LOD envelope`](issue-119-geometry-lod-experiment.md),
  [`R3F spike`](issue-119-r3f-spike-results.md) and
  [`MapLibre spike`](issue-119-maplibre-spike-results.md); the deployed-preview
  contract is closed at
  [`issue-119-deployed-preview.md`](../closed/issue-119-deployed-preview.md).

- [#166 — Spatial Atlas production cutover](https://github.com/BenWassa/flag/issues/166).
  Promotes the accepted candidate to the default presentation, replaces the
  globe-over-launcher composition with a single spatial navigation surface, and
  fixes the shared tiny-country touch defect that blocked it. Record:
  [`issue-166-spatial-production-cutover.md`](issue-166-spatial-production-cutover.md).

  #104's map-first launcher question is answered by the cutover: continent and
  region selection now happen on real geography, without colour-only progress
  encoding.

### 7. Other open work

- [#118 — audit Atlas mobile UX, motion and game feel](https://github.com/BenWassa/flag/issues/118).
  **Audit complete; implementation not started.** Report:
  [`issue-118-design-skill-audit.md`](issue-118-design-skill-audit.md). It ran
  against the built artifact on `3e7fed2` and produced eighteen findings, of
  which the load-bearing ones are: launcher scope rows expose only
  `"Play {scope}"` to assistive technology, so count, progress and earned
  Mastery are all suppressed; complete-region is a colour-only state against
  locked principle 8; earned region × domain Mastery has no row treatment at
  all; Outlines Play advances after a measured 238 ms where Flags Play holds a
  wrong answer for 1560 ms; and the Locations wrong-guess colour is cleared
  only by an animation keyframe, so it never clears under reduced motion. Seven
  focused follow-up issues are filed as
  [#146](https://github.com/BenWassa/flag/issues/146) (launcher accessible names,
  Mastery and complete-region cues),
  [#147](https://github.com/BenWassa/flag/issues/147) (Outlines Play dwell and
  live score), [#148](https://github.com/BenWassa/flag/issues/148)
  (reduced-motion map clearing),
  [#149](https://github.com/BenWassa/flag/issues/149) (Neighbours combobox
  semantics), [#150](https://github.com/BenWassa/flag/issues/150) (motion tokens
  and a control-height scale),
  [#151](https://github.com/BenWassa/flag/issues/151) (retired-subsystem CSS and
  the empty launcher badge) and
  [#152](https://github.com/BenWassa/flag/issues/152) (degenerate Home coverage
  label) — none of them a redesign.

  On the skills question the answer is mostly negative: of eight candidate
  families, one earns selective adoption (`emilkowalski/skills` —
  `review-animations`, `animation-vocabulary`), two are reference-only, and five
  are rejected, including two 3-star native-first packs and two very widely
  installed skills whose purpose is to *invent* a design direction Atlas has
  already locked. The motion and game-feel lenses were the only ones that found
  what the existing Impeccable/Taste workflow does not.

  Its mobile-ergonomics and motion-timing measurements remain reusable baseline evidence for #119 rather than something that must be recaptured before the full candidate can start. Physical-device questions raised by the audit (E-02, E-03) were deferred to #71 rather than answered, and #104 was not reopened.

## Working rules

- Before starting new work, reconcile GitHub issue state against this file and `docs/closed/`.
- Read the live GitHub Issue fully before implementation.
- Read `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and the relevant durable product/architecture docs.
- Preserve stable routing, country identity, storage, learning and cartography contracts.
- Use dedicated branches and focused PRs.
- Run `npm test` under Node 22, inspect the exact production artifact and confirm CI before merge.
- Do not claim physical-device/browser testing that was not performed.
