# Impeccable Design Review — 2026-08-16

## Scope

Reviewed the Flag Atlas MVP against Impeccable v4.1.1, including the core skill and all 39 reference documents. The app is classified as an **Operate** surface: task speed, scanability, familiar controls, state clarity, responsive behavior, accessibility, and implementation consistency take precedence over decorative expression.

## Pre-implementation findings

### P1 — Visual world was an AI-default composition

The initial system combined warm paper, editorial serif headings, ocean teal, oversized rounded cards, soft shadows, and decorative grid texture. The treatment was coherent but too generic and competed with the flags themselves.

**Resolution:** replaced with the Atlas Index system documented in `/DESIGN.md`: cool neutral canvas, one system sans, registration-blue action color, flat ruled lists, modest corners, minimal elevation.

### P1 — Card structure obscured task hierarchy

Home used a hero card followed by six repeated continent cards; scope pages nested progress and mode choices inside another large rounded panel.

**Resolution:** Home is now a linear atlas index. World status is part of the page hierarchy, continents are rows with embedded progress, and scope actions are explicit controls rather than content cards.

### P1 — Operational typography was split across UI sans + display serif

The serif treatment made the app feel editorial instead of like a fast recognition tool and required fluid display sizing in a product UI.

**Resolution:** one fixed-role system sans stack across the product, with tabular figures for comparable progress data.

### P1 — Progress ledger eagerly loaded every flag image

The generic flag helper always emitted `loading="eager"`, so opening the 195-country ledger could immediately request every flag.

**Resolution:** noncritical flag images are lazy by default; the active quiz flag opts into eager/high-priority loading.

### P2 — Quiz could be more efficient for repeat use

The visible A–D markers had no matching keyboard interaction. Exiting a World quiz also routed into an invalid generic scope view.

**Resolution:** answers are numbered 1–4 and those keys submit directly; Enter advances Learn feedback; Escape exits. World quiz exit now returns Home while continent/region quizzes return to their scope.

### P2 — Browser/component finish was incomplete

The initial system had visible focus and reduced motion, but lacked a deliberate selection treatment, fine-pointer hover gating, compact landscape adaptation, forced-colors consideration, and consistent shared icons.

**Resolution:** added semantic browser theming, hover feature queries, short-landscape quiz topology, forced-colors fallback, targeted reduced-motion behavior, and one shared SVG icon primitive.

### P2 — Results underplayed mastery, the core product mechanism

Round results showed the number of newly mastered flags but did not identify them.

**Resolution:** newly mastered countries now receive their own compact result section with the actual flag and country name. This is the product-specific delight moment; routine answers remain restrained.

## Design thesis after review

**The flag is the color system.** Flag Atlas should feel like a precise international identification desk surrounding highly visual source material. The application chrome remains neutral and systematic; color appears because the flag demands it or because a state/action has semantic meaning.

## Responsive contract

- Mobile portrait: linear page hierarchy; four full-width answer choices; primary actions remain easy to reach.
- ≥640px: paired action layouts where useful.
- ≥700px: quiz answers become a 2×2 grid.
- Short landscape ≥700px wide / ≤600px high: flag and choices split into side-by-side work areas instead of compressing the portrait stack.
- Safe-area insets are respected.
- Hover styling only activates where hover and a fine pointer exist.

## Finish review

The CI-built artifact was rendered and visually inspected at the following representative viewports:

- **412×915** — portrait mobile Home, continent scope, and quiz.
- **1440×1000** — desktop Home.
- **844×390** — short landscape quiz.

### Finish findings

1. **Mobile Progress icon initially resembled a navigation menu.** Replaced the list glyph with a compact three-bar progress glyph so the icon remains legible when its text label is hidden on small screens.
2. **Numeric answer shortcuts could intercept browser shortcuts such as Ctrl+1.** Keyboard accelerators now ignore Ctrl, Meta, and Alt modified input.
3. **Long country names in the global ledger were truncated.** Country identity and evidence text now wrap safely rather than hiding content.

### Finish verdict

- Home reads as an atlas index rather than a card dashboard.
- Scope hierarchy is legible without nested panel chrome.
- The active flag dominates portrait quiz composition while the answer controls remain in the lower thumb zone.
- Short-landscape layout reflows structurally into flag and answer columns instead of compressing the portrait stack.
- Desktop retains a compact operational width and scan-friendly row rhythm.
- Product state uses text plus semantic color; primary blue remains reserved for action/selection/progress.
- Routine surfaces remain visually quiet; mastery is the designated stronger success moment.
- The final source tree passes the automated build, curriculum, mastery-transition, quiz-integrity, and answer-randomization checks in CI.

## Second critique pass — 2026-08-16

Re-reviewed the shipped MVP as a **product** register surface. Heuristic total: **28/40** before this pass. The visual system held up; the failures were concentrated in state handling, recoverability, and things the interface never explains.

### P1 — Every re-render destroyed focus and swallowed announcements

`render()` replaces the whole of `#app`, so focus fell to `<body>` after every answer, filter change, and navigation. Keyboard users restarted the tab order each time; screen-reader users lost their position. The `aria-live` regions were themselves recreated in the same paint as their content, which is the one arrangement that reliably does not announce.

**Resolution:** a persistent live region now sits outside `#app` in `index.html` and carries answer results, round summaries, round starts, and reset confirmation. After each render, focus returns to the control the user just used if it still exists, otherwise to a single `data-autofocus` landing element per view. In the quiz that landing point is the first answer choice, not the heading, so the scope is not re-announced on every question.

### P1 — The platform Back gesture left the app

A five-view single-document app with no history integration. On Android, Back from a quiz or the ledger exited Flag Atlas rather than moving up the atlas hierarchy.

**Resolution:** each view change records a history entry against an in-memory view stack, and `popstate` restores it. Quiz entries are transient: leaving a round replaces its entry, so Back never lands inside a finished quiz. Document titles now track the current view.

### P1 — A failed flag image was an unanswerable question

Flags resolve through FlagCDN, and the service worker only caches a flag after one successful fetch. Offline on a fresh scope produced a broken-image icon mid-round with no explanation and no way to answer.

**Resolution:** `flagImage` now emits a frame that reserves the space and carries a labelled fallback, revealed by `markFailedFlags` on error. Thumbnails show a mark with visually hidden wording rather than shrinking type.

### P1 — Test mode could yank the user out of a screen they had chosen

Answering in Test mode queued a 180ms auto-advance that nothing cancelled. Leaving the round inside that window let the timer fire against a dead session and, on the last question, replaced the screen the user had just navigated to with a results view.

**Resolution:** the pending advance is tracked and cancelled on exit, on `popstate`, and on starting a new round; the callback also re-checks that a round is still in progress.

### P1 — Three of the four ledger filters were blank on a first run

Filtering to Learning or Mastered before studying anything rendered tabs above empty space.

**Resolution:** each filter has an empty state naming the condition and what produces rows.

### P2 — The core mechanic was never explained, and was implemented twice

Nothing in the interface said what mastery requires. Separately, the region ledger recomputed the goal inline as `record.lapseCount ? 2 : 3` instead of calling `masteryGoal`, so the rule had two implementations.

**Resolution:** the rule is stated once on the Progress screen, `src/ui/format.ts` holds the shared status vocabulary, and every surface reads the goal from `masteryGoal`. Learn feedback reads `Learning · 1 of 3 rounds` rather than a bare `1/3`. Keyboard accelerators are now advertised in the quiz on fine-pointer devices.

### P2 — Progress could be built but never erased

`resetAllProgress` existed in storage and was called from nowhere. A local-first ledger with no reset is a one-way door.

**Resolution:** a quiet reset lives at the foot of the Progress ledger, appearing only once there is progress to erase, and confirming through a two-step inline exchange rather than a modal.

### P2 — Token drift, a contrast failure, and type below the documented floor

Nine color literals sat outside the token block. `unseen` at `#6B7480` measured 4.44:1 on canvas, below AA. Status chips rendered at 10px and dropped to 9px on small screens, against DESIGN.md's own 11px metadata floor. The product mark was CSS-drawn while a shared SVG icon system existed, and did not match `app-icon.svg`.

**Resolution:** all literals are tokens, `unseen` moved to `#626B78` (5.09:1), 11px is enforced as a floor, and the mark is now an SVG primitive matching the app icon.

### P3 — The round-progress bar animated a layout property

Caught by the deterministic scan: `transition: width` on the quiz progress fill.

**Resolution:** the fill scales on the X axis from a left origin.

### Verification

`scripts/verify.mjs` gained view-rendering assertions covering focus landing points, empty states, the shared mastery goal including the post-lapse value of 2, the flag fallback, and the absence of re-rendered live regions. The deterministic scan of the built artifact reports zero findings.

### Deliberately not changed

- **No dark theme.** DESIGN.md commits to a cool near-white field so flags stay dominant, and that reasoning still holds for a daylight study tool. A night-use variant is a product decision, not a defect to patch.
- **Learn world as the beginner's default.** Starting a novice on 195 flags is arguably the hardest possible entry, but scope control belongs to the learner by principle 2. Worth a usability test rather than a unilateral change.

## Remaining product-level work

These are outside the visual redesign rather than hidden design defects:

1. Vendor all 195 SVG flag assets so offline recognition never depends on FlagCDN.
2. Run the planned adaptive-mastery literature review and replace Mastery v1 only when evidence supports a better scheduler.
3. Complete production device/browser accessibility QA once the deploy target is enabled and reachable.
4. Add cloud sync only when a concrete Firebase-backed requirement exists.
