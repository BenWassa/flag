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

## Hardening pass — 2026-08-16

Ran `$impeccable harden` over the shipped MVP. The visual system and the interaction model were not the problem this time; every finding was a way that real conditions, rather than the idealised data the code was written against, take the app down.

### P0 — A blocked localStorage froze the round mid-question

`saveProgress` and `appendAttempt` called `localStorage.setItem` unguarded. Safari private browsing throws on every write, a blocked-cookie policy throws on every read, and a full origin quota throws once the log grows. Any of those propagated out of `store.answer()` through `submitAnswer()` and into the root click handler, so the render that follows an answer never ran. The app did not report an error; it simply stopped responding on the question the learner had just answered, and every subsequent tap did nothing.

**Resolution:** every access is guarded in `src/infrastructure/storage.ts`, failure flips a `persisting` flag instead of throwing, and studying continues from memory. The Progress footer stops claiming the ledger is saved on a device that refuses to save it, and Home carries one quiet notice explaining that the session will not outlive the tab.

### P1 — The cost of answering grew with study history

`appendAttempt` re-read, parsed, and re-serialised the entire attempt log on every single answer. At the 5000-entry cap that is well over a megabyte of synchronous JSON work on the main thread, at the exact moment of the tap, and it got slower the longer someone had studied.

**Resolution:** the log is held in memory, capped at 2000, and written on a 500ms trailing delay. `flushAttempts` runs on `pagehide` and on `visibilitychange`, because a PWA is usually left by being backgrounded rather than closed.

### P1 — A corrupted ledger reached the views as an exception or a NaN

`loadProgress` cast `JSON.parse` straight to `ProgressState` on the strength of `version === 1`. Six view sites then indexed `progress.records[id]` directly. A truncated write, a hand-edited record, or a single `null` produced either a thrown TypeError that took out the whole Progress screen, or arithmetic on `undefined` rendered as `NaN` in the ledger.

**Resolution:** the ledger is rebuilt field by field at the storage boundary, with unknown statuses and malformed counts dropped rather than trusted, and records for countries no longer in the catalog discarded. Every view now reads through `getRecord`. The defensive work sits at the boundary so the views stay written against well-formed data.

### P1 — Learn did nothing at all over plain http

`startSession` called `crypto.randomUUID()`, which needs a secure context and is simply absent otherwise. That is exactly how a mobile-first PWA gets tested: from a phone, against a laptop's IP, over http. The call threw, the click handler died, and the button appeared inert.

**Resolution:** a fallback id when `crypto.randomUUID` is unavailable.

### P1 — A shipped fix could sit invisible behind a warm cache

The service worker served same-origin requests cache-first, so a returning learner kept running the previously installed build until the hardcoded cache name happened to change. A deploy that did not also edit `VERSION` reached nobody who had already visited.

**Resolution:** the shell is network-first with cache fallback, so the network decides which build runs and the cache is what makes the app work offline. Flags stay cache-first, which is correct because they are content-addressed by country code and never change.

### P2 — Catalog text was interpolated raw into markup and attributes

The curriculum already carries `Australia & New Zealand` and `Côte d'Ivoire`, and both go into `aria-label` attributes. Nothing broke today, but a single future entry containing a quote would have silently truncated an attribute.

**Resolution:** `escapeHtml` in `src/ui/format.ts`, applied at every country name, region name, and scope label.

### P2 — Two dead ends built from stale ids

`renderQuiz` and `renderResults` asserted catalog lookups with `!` inside their templates, so an id the catalog no longer knew threw from mid-render and took the screen down. Separately, `buildQuiz` clamps its size to the scope, so a review list of unresolvable ids produced a round with zero questions and `beginSession` navigated into it regardless.

**Resolution:** options and mistake pairs are resolved before the template, and a question survives losing a distractor. `startSession` returns false when there is nothing to ask, and the learner stays where they were with the live region explaining why.

### P2 — Two mobile layout defects

The quiz flag was sized in `vh`, which is the large viewport: with the mobile URL bar visible the flag pushed the answer buttons below the fold at the exact moment they were needed. The short-landscape layout was gated at `min-width: 700px`, so a 667×375 phone held sideways missed it and fell back to a portrait stack that does not fit in 375px of height.

**Resolution:** `dvh` throughout the quiz stage, and the landscape breakpoint lowered to 600px with tightened columns and a 46px answer height, still above the 44px minimum target.

### P3 — Stacked announcement timers, and a live region inside the replaced tree

Rapid answers queued several 60ms announcement timers, any of which could overwrite the live region after the one that replaced it. The new storage notice initially carried `role="status"`, which contradicts the app's own documented rule that live regions do not belong inside `#app`.

**Resolution:** the pending timer is cancelled before a new one is queued, and the notice is static copy.

### Verification

`scripts/verify.mjs` grew coverage for escaping, ledger sanitisation, missing records, stale distractors and targets, unresolvable mistakes, both storage notices, and the refused empty round. It also drives `AppStore` through three answers against a `localStorage` that throws on write and one that throws on read, asserting that answering does not throw, that progress is still tracked in memory, and that the failure is reported. That last test is the regression guard for the P0.

## Remaining product-level work

These are outside the visual redesign rather than hidden design defects:

1. Vendor all 195 SVG flag assets so offline recognition never depends on FlagCDN.
2. Run the planned adaptive-mastery literature review and replace Mastery v1 only when evidence supports a better scheduler.
3. Complete production device/browser accessibility QA once the deploy target is enabled and reachable.
4. Add cloud sync only when a concrete Firebase-backed requirement exists.
