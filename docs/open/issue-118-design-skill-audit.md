# Issue 118 — Atlas mobile UX, motion and game-feel audit

**Status:** audit complete. No production `src/` changes were made.
**Baseline:** `main` @ `3e7fed2` (`docs(#27): close Oceania delivery`), production Vite build, Node 22.22.2.
**Date:** 2026-08-28.

---

## 0. Method and evidence standard

The audit ran against the **built production artifact** (`npm run build` → `dist/`, served by
`vite preview`), driven in a Pixel-7-class Chromium at 412×915 and at 844×390 short landscape.
Findings below cite one of:

- **measured** — a number produced by driving the running application;
- **AX tree** — a name read from Chrome's own `Accessibility.getFullAXTree`, not inferred from markup;
- **source** — a line in the repository;
- **observed** — a rendered screenshot.

**What this audit does not claim.** No physical device was used. Chromium touch/viewport emulation
is not device evidence, and **#71 remains the sole authority for physical-device, safe-area,
installed-PWA and software-keyboard behaviour**. Where a finding would need hardware to confirm, it
says so and is scored low confidence. **#104 remains deferred**; nothing here reopens it. No finding
below asks for a change to `DESIGN.md`.

The specialist passes were run **separately and in sequence** (taste → motion → game feel →
ergonomics → accessibility/platform → design-system), not blended into one prompt. Conflicts between
a third-party lens and Atlas policy are recorded in §4 and resolved against `DESIGN.md`, never
averaged.

---

## 1. Executive assessment

**Atlas is a study app with an unusually well-built interface, not a hybrid and not a game.** The
evidence for that is consistent rather than rhetorical: geography genuinely dominates every learning
surface; there is no reward economy, no celebration layer and no colour taxonomy; safe areas are
handled with the correct `max(token, env())` pattern in every stylesheet; keyboard accelerators are
gated behind `(hover: hover) and (pointer: fine)` so they never occupy phone space; no tested
viewport scrolls horizontally; every measured touch target clears 44 px. The Tactile Atlas system
described in `DESIGN.md` is, in the main, the system that ships.

The gaps are **not** taste failures. They are three specific classes of defect:

**1. The prestige layer is largely invisible in production.** `DESIGN.md` says earned Mastery "is
purple and must include a non-colour cue" and that "compact launcher rows use accessible Mastered
labelling". Production has neither. A Mastered region row is pixel-identical to an unmastered one
(F-03), and Chrome's accessibility tree reports its button as exactly `"Play North Africa"` — the
`, Mastered` text in the DOM is suppressed by the row's own `aria-label` (A-01). A **complete**
region is distinguished only by a gold gradient border with no text and no accessible difference
(A-02), which is the one thing locked principle 8 forbids. The most valuable state in the product is
the state the product communicates least.

**2. Feedback weight does not match event importance, and one domain is a clear outlier.** Flags
Play holds a wrong answer for **1560 ms measured**. Outlines Play — the same `RecognitionQuiz`
component, the same four-option mechanic, the same feedback panel — advances after **238 ms
measured**, correct and wrong alike, which is less time than the feedback panel's own 140 ms
entrance animation needs to finish (G-01). Outlines Play also renders no live score while Flags and
Locations Play both do (G-02). This is the single highest-impact learning defect found.

**3. Motion is load-bearing for state, in one place where it must not be.** In Locations Learn a
wrong guess flashes red and returns to neutral — but the return is encoded **only** in the terminal
keyframe of `@keyframes map-wrong`. Under `prefers-reduced-motion: reduce` the animation does not
run, so the country stays red indefinitely. Measured at two time points in both modes (M-01).

**On the skills question — the honest answer is that most of the candidate stack is not worth
keeping.** Of eight candidate families, one earns selective adoption, two earn narrow reference use,
and five should be rejected. Two candidates (`draftbit/mobile-taste-skill`, `Elevatormusic/apple-hig`)
have **3 stars each** and are native-first; re-verifying at execution time, as #118 required, is what
surfaced that. The largest by adoption (`ui-ux-pro-max`, 122k stars; Anthropic `frontend-design`,
~797k installs) are the *least* applicable, because both are optimised for **inventing** a design
direction and Atlas's direction is locked. Details in §4.

---

## 2. Findings matrix

Impact = learner harm. Confidence = strength of the evidence recorded here.

| ID | Surface | Lens | Current behaviour | Recommended direction | Impact | Conf. | Existing issue? |
|---|---|---|---|---|---|---|---|
| **A-01** | All four launchers | Accessibility / platform | `.region-row__open` carries `aria-label="Play West Africa"`. **AX tree** confirms that is the entire accessible name. The `, Mastered` span, the `16 flags` count and the `0 of 16 cleared` strip are all button *contents* and are suppressed by accname precedence. A screen-reader user tabbing the launcher gets the scope name and nothing else. | Drop the blanket `aria-label`; let the name compose from contents, or extend the label to carry count, progress and Mastered. | High | High | New |
| **A-02** | All four launchers | Accessibility / taste | Complete region renders as a brushed-metal gold border (`border-color: rgba(0,0,0,0)` + gradient `background-image` + inset shadow). **No text, no icon, no accessible-name difference.** Locked principle 8 says state must never rely on colour alone. | Add a non-colour cue (a word, a mark, or accessible-name text) alongside the gold. | High | High | New |
| **A-03** | Neighbours Play | Accessibility | Input has `aria-autocomplete="list"` + `aria-controls`, but **no `role="combobox"`, no `aria-expanded`, no `aria-activedescendant`**. Suggestions are `<button role="option">` with no `id` and no `aria-selected`; there is **no arrow-key handling anywhere** in `NeighborScreens.tsx`. Reaching a suggestion requires Tab. | Complete the ARIA 1.2 combobox pattern, or drop `role="option"`/`role="listbox"` and present the suggestions as a plain labelled button group. | Med-High | High | New (#19 is closed and covered the soft keyboard, not this) |
| **A-04** | Locations Play/Learn | Accessibility | Every country is `role="button"`, `tabindex="0"`, `aria-label="Selectable country area"` — 6 identical tab stops in North Africa, up to 54 in a continent round. Correctly refuses to leak the answer (`DESIGN.md` permits the limitation) but leaves AT users the *appearance* of operability with none of the substance. | Keep the no-leak policy. Consider removing the shapes from the tab order and stating the limitation honestly, rather than offering unusable stops. | Medium | High | New |
| **G-01** | Outlines Play | Game feel | **Measured 238 ms** from answer to next question, flat for correct and wrong (`outlines-round.ts:117`, hard-coded `180`). Flags Play **measured 1560 ms** on a wrong answer (`PLAY_DWELL_WRONG_MS = 1500`). Same component, same mechanic. The feedback panel's own entrance is `140 ms`, so it barely finishes rendering before the silhouette swaps. | Give Outlines Play the same correct/wrong dwell split the other domains use. | High | High | New |
| **G-02** | Outlines Play | Game feel | `RecognitionQuiz` renders `<LiveScore>` only when `play && !outlineAsset`. **Measured**: Flags Play has 1 `.round-score`, Outlines Play has 0. Locations Play has one too. Three of four domains show live score; Outlines shows none. | Decide deliberately: either Outlines gets parity, or record why it is exempt. | Medium | High | New |
| **G-03** | All launchers | Game feel | Earned region × domain Mastery produces **no feedback moment at all** — no visual mark on the row (see F-03), and its AT text is suppressed by A-01. The product's first durable prestige unit is, in production, unrepresented except where it contributes to a complete region's gold edge. | Give Mastery the restrained purple mark + non-colour cue `DESIGN.md` already specifies. | High | High | Overlaps #34 (closed) — the art landed, the row treatment did not |
| **M-01** | Locations Learn | Motion | Wrong guess: **measured** fill at 120 ms / 1500 ms is `rgb(251,237,236)` → `rgb(248,250,252)` under normal motion (flash, then neutral), but `rgb(252,232,230)` → `rgb(252,232,230)` under `reducedMotion: reduce`, with `animationName: "none"`. The neutral reset lives **only** in the `100%` keyframe of `@keyframes map-wrong`. Wrong guesses therefore accumulate as permanent red under reduced motion. | Move the resting state into a CSS declaration or a state change; use the animation only to decorate a transition that would happen anyway. | High | High | New |
| **M-02** | Whole product | Motion | **No motion tokens exist** — no `--duration-*`, no `--ease-*`. 30 motion declarations use three unrelated curve families: `ease` (default, ~22 uses), `ease-out` (4), and one bespoke `cubic-bezier(.22,1,.36,1)` (2). Durations run 90/100/120/140/160/180/480/520 ms with no scale. | Add a small duration + easing token set and migrate. Press response should decelerate (`ease-out`), not use the symmetric default. | Medium | High | New |
| **M-03** | Round controllers | Motion / architecture | `PLAY_DWELL_CORRECT_MS = 620` / `PLAY_DWELL_WRONG_MS = 1500` are **duplicated verbatim** in `flags-round.ts` and `locations-round.ts`; `outlines-round.ts` hard-codes `180` inline; Locations Learn has a fourth, graded ladder (520/700/850/1400) that is genuinely well-judged. Four files, no shared module — which is how G-01 drifted. | Extract one timing module so the four domains cannot diverge silently again. | Medium | High | New |
| **T-01** | Home | Taste / IA | All four domain cards render the subtitle **`World`**. `coverageLabel()` returns `'World'` when supported continents equal all continents (`ui/format.ts:58`); since #27 shipped Oceania that is true for all four domains. The only descriptive line on the Home cards is now identical across them, and on a fresh profile all four progress strips are empty too. | Replace the coverage line with something that differentiates the domains, or remove it. | Medium | High | New — a direct #27 consequence, distinct from #138 |
| **T-02** | All four launchers | Taste | `.launcher-header__badge` is an **empty `<span>` rendered as a 32×32 dashed box** next to every launcher title. Its own source comment says: *"Placeholder slot only — reserves size/position for the future continent crest badge… No art yet."* It ships in production. | Remove it, or fill it. A dashed empty square reads as an unfinished screen. | Medium | High | Related to #34 (closed) |
| **F-01** | Whole product | Design system | Roughly **29 distinct interactive control heights** (34, 36, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 68, 78, 92, 94, 112 …), eleven of them inside a single 20 px band. `DESIGN.md` documents a precise **four-tier radius scale** and says nothing at all about control height. | Document a height scale beside the radius scale, then reconcile. | Medium | High | New |
| **F-02** | Stylesheets | Design system | **~80 lines of CSS for four retired subsystems still ship**: the removed Progress screen (`progress-achievement-*`, `mastery-list`, `ledger-*`, `mini-ledger*`, `filter-tab*`), the retired per-country status taxonomy (`status-chip--mastered`, `status-text--mastered`), the replaced map viewport controls (`map-viewport-control*`), and `.test-advance`. `.text-icon-button` is defined **three times** across two stylesheets and rendered by nothing. | Delete. | Low-Med | High | #72 is closed and did not catch these |
| **F-03** | All four launchers | Design system | `ScopeRow` applies a class for `complete` but **none for `domainMastered`**. **Measured computed styles**: a Mastered row's `border-color` is `rgb(217,224,234)` and its `box-shadow` is byte-identical to an unmastered row. | Covered by G-03. | High | High | See G-03 |
| **E-01** | Locations Play | Ergonomics / platform | First-question prompt reads *"One tap each · pinch or **wheel** to zoom · swipe or drag to pan Africa · results at the end."* — a mouse-wheel instruction delivered to a touch device, inside the highest-value copy slot in the round. | Split the copy by pointer type, as `.quiz-hint` already does correctly. | Low | High | New |
| **E-02** | Neighbours Play | Ergonomics | At rest the input sits at ~50 % viewport height with the lower ~45 % empty; the suggestion list only fills it once typing starts. Whether this reads as balanced or unfinished depends on where the software keyboard lands. | **Needs a physical device.** Hand to #71 rather than resolving here. | Low | Low | #71 |
| **E-03** | Cold load | Ergonomics / platform | On first paint the `[data-autofocus]` heading takes focus and, in headless Chromium, renders the 3 px focus ring around the "Atlas" wordmark. The CSS intent is correct (`[tabindex="-1"]:focus { outline: none }` + `:focus-visible` ring), so on a device where the user *tapped*, this most likely does not appear. | **Not claimed as a defect.** Verify on hardware under #71 before acting. | Low | Low | #71 |

**Confirmed strengths** (recorded so later work does not regress them): safe-area handling via
`max(token, env())` in all five stylesheets; `.quiz-hint` gated behind `(hover:hover) and
(pointer:fine)`; no horizontal overflow at 412×915 or 844×390; answer buttons 347×60 in short
landscape; `forced-colors: active` blocks in three stylesheets; the graded Locations Learn dwell
ladder; `FlagImage`'s ratio-publishing fix for stage stability (#90); the deliberate, documented
`--mastered → --correct` compatibility alias.

---

## 3. Where the specialist lenses actually earned their keep

| Lens | Findings it produced | Would Impeccable/Taste have found these? |
|---|---|---|
| Motion / interaction timing | M-01, M-02, M-03 | Unlikely. M-01 requires asking *"what does this look like when the animation does not run?"* — a question general visual-direction review does not ask. |
| Game feel / feedback weight | G-01, G-02, G-03 | Unlikely. G-01 is invisible in a screenshot; it only exists in time. |
| Accessibility / platform | A-01, A-02, A-03, A-04 | Partly. A-01 needs the AX tree, not the markup. |
| Design-system consistency | F-01, F-02, F-03 | Yes, eventually — this is the most duplicative lens. |
| Mobile ergonomics | E-01 only (E-02/E-03 deferred to #71) | Mostly yes. The genuinely device-dependent parts are #71's, not a skill's. |
| Visual hierarchy / taste | T-01, T-02 | Yes. Atlas's existing review already covers this well. |

**The two lenses that paid for themselves are motion and game feel.** Both produced defects that are
invisible to static review because they exist only in time. Ergonomics and taste were largely
redundant with the existing workflow, and the genuinely valuable mobile questions need hardware,
which is #71's job and not a skill's.

---

## 4. Skill-stack recommendation

All eight candidates were re-verified by fetching them on 2026-08-28, per the acceptance criterion.

| # | Candidate | Verified | Value to Atlas | Overlap | Mobile-web fit | Verdict |
|---|---|---|---|---|---|---|
| 1 | **`emilkowalski/skills`** | MIT, **33.2k★**, 12 skills, all named skills present | High. Produced the M-* class directly. `review-animations` and `animation-vocabulary` are the two that matter. Also ships **`apple-design`**, which #118 did not know about and which covers candidate 6's brief. | Low — Atlas has no motion guidance at all | Good (web/CSS-first). `animate-expo` is RN-only; ignore it | **Selective adopt** — `review-animations` + `animation-vocabulary` only |
| 2 | **`draftbit/mobile-taste-skill`** | MIT, **3★**, **4 commits**, all six skills RN/Expo | Near zero. Default stack is Expo Router + NativeWind + React Native Reusables + Reanimated — none of it transfers | High with existing taste review | **None.** Explicitly "native mobile only — does not target mobile web" | **Reject** |
| 3 | **`gamedev-skills/awesome-gamedev-agent-skills`** | Apache-2.0, **692★**, 68 skills, 84 commits | Narrow but real. `game-feel`'s **"feedback tiers"** and hit-stop reasoning is precisely the G-01 frame. `game-ui-ux` covers safe areas and focus navigation — which Atlas already does better | Low | Cross-engine, not web-native | **Reference** — feedback-tier reasoning only; see conflict C1 |
| 4 | **`nextlevelbuilder/ui-ux-pro-max-skill`** | MIT, **122.3k★**, v2.0 | Mixed. Its **119 UX guidelines** (accessibility, anti-patterns, text resilience) are a useful lookup. Its headline feature — a generator that outputs a complete design system — is a liability here | Direct conflict with `DESIGN.md` authority | Web-primary | **Reference only** — guidelines as lookup; never the generator; see conflict C2 |
| 5 | **`wshobson/agents`** | MIT, **39.2k★**, **93 plugins / 202 agents / 181 skills** | Unverifiable at the granularity #118 assumed; the landing page does not enumerate the named skills. Size is itself the argument — installing this *is* the prompt-soup failure #118 set out to avoid | High | Mixed | **Reject as a pack.** Cite individual files if ever needed |
| 6 | **`Elevatormusic/apple-hig`** | MIT, **3★**, 1 fork, 201 commits | Low. Native-first (iOS/iPadOS/macOS/watchOS/tvOS/visionOS); defers to host conventions for web rather than specifying them | Candidate 1's `apple-design` covers the transferable part | Weak | **Reject** — superseded by `emilkowalski/apple-design` |
| 7 | **`Dammyjay93/interface-design`** | MIT, **5.6k★**, ~50 commits | Diagnosis is correct and Atlas has an instance of it (**F-01**). Mechanism is wrong: it persists to `.interface-design/system.md` | Would create a **third** design source of truth beside `DESIGN.md` and `.impeccable/design.json`, against `CLAUDE.md`'s authority hierarchy | Fine | **Reject the mechanism, keep the diagnosis** (F-01 already captures it) |
| 8 | **Anthropic `frontend-design`** | Official Anthropic skill, ~797k installs | Structurally redundant. Its core action is to plan a palette, a type pairing, a layout and a signature element *before writing code* — the exact work Atlas has completed and locked | Total | Good, in general | **Reject as redundant** |

**Net recommendation: adopt one skill family selectively, keep two as reference lookups, reject
five.** Concretely: install `review-animations` and `animation-vocabulary` from
`emilkowalski/skills`; bookmark `game-feel` and the UX Pro Max guideline set as read-only
references; install nothing else.

### Recorded conflicts and their resolution

- **C1 — `game-feel` vs `DESIGN.md`.** The skill's `game-feel` is defined as *"Juice: screen shake,
  hit-stop, tweening/easing, squash & stretch, feedback tiers."* Screen shake and squash-and-stretch
  are directly excluded by `DESIGN.md` ("exaggerated spring/bounce motion", "tactile press physics …
  without toy-like bounce"). **Resolved:** take the *feedback-tier* and *hit-stop* (dwell) reasoning,
  which is what produced G-01; reject the juice catalogue. `DESIGN.md` wins.
- **C2 — UX Pro Max style catalogue vs `DESIGN.md` excluded aesthetics.** Its 79-style database
  leads with Glassmorphism, Claymorphism and Brutalism; `DESIGN.md` excludes glassmorphism by name.
  **Resolved:** the style catalogue and the design-system generator are never consulted for Atlas;
  only the UX-guideline set is, as a lookup. `DESIGN.md` wins.
- **C3 — `interface-design` state file vs Atlas authority hierarchy.** **Resolved:** `DESIGN.md` and
  `.impeccable/design.json` remain the only design authorities. No third state file.

---

## 5. Follow-up issue map

Seven focused issues, all filed 2026-08-28. None is a redesign, none is "fix all UX", and each is
independently valuable and independently shippable. Ordered by impact.

1. **[#153](https://github.com/BenWassa/flag/issues/153) — launcher scope rows hide count, progress
   and earned Mastery from assistive technology.** — A-01, A-02, G-03, F-03.
   The row's `aria-label` suppresses count, progress and Mastered state; complete-region is
   colour-only; Mastery has no visual mark at all. One surface, one coherent change. Must satisfy
   `DESIGN.md` principle 8 and must not add a purple star that merely repeats state.
2. **[#154](https://github.com/BenWassa/flag/issues/154) — Outlines Play advances after 180 ms flat,
   and shows no live score.** — G-01, G-02, M-03.
   Replace the flat `180 ms` with the correct/wrong dwell split, decide the live-score question
   deliberately, and extract the duplicated dwell constants into one shared timing module. Carries
   the additional finding that `verify-play-feedback.mjs` asserts outcome-aware dwell for Flags and
   Locations only, while naming Outlines in its pass message — which is how this drifted in.
3. **[#155](https://github.com/BenWassa/flag/issues/155) — wrong-guess map colour never clears under
   `prefers-reduced-motion`.** — M-01.
   Move the neutral resting state out of the `map-wrong` terminal keyframe. Small, self-contained,
   and currently a real reduced-motion regression.
4. **[#156](https://github.com/BenWassa/flag/issues/156) — Neighbours suggestion list is a
   half-implemented ARIA combobox.** — A-03.
   Either implement ARIA 1.2 properly with arrow-key navigation, or drop `role="listbox"`/`option`
   for a plain labelled button group. The current half-pattern is worse than either.
5. **[#157](https://github.com/BenWassa/flag/issues/157) — add motion tokens and a control-height
   scale.** — M-02, F-01.
   A small `--duration-*` / `--ease-*` set plus a documented height scale beside the existing radius
   tiers, then migrate. This is the durable fix that makes #154 and #155 hard to reintroduce.
6. **[#158](https://github.com/BenWassa/flag/issues/158) — remove retired-subsystem CSS and the empty
   launcher badge placeholder.** — F-02, T-02.
   Delete the ~80 lines of retired-subsystem CSS and the triple-defined `.text-icon-button`; remove
   or fill the empty dashed `.launcher-header__badge`.
7. **[#159](https://github.com/BenWassa/flag/issues/159) — all four Home domain cards now read
   "World" after Oceania shipped.** — T-01.
   Decide what that line should say, or drop it. Distinct from #138, which owns the Crown surface.

**Deferred, not filed:** A-04 (Locations map tab stops) needs a product decision about whether
offering unusable AT stops is better or worse than removing them — worth raising, not worth a
speculative issue. E-02 and E-03 belong to **#71** and are recorded there rather than duplicated.

---

## 6. Acceptance criteria

| Criterion | Status |
|---|---|
| Current `main`, production React surfaces and current docs used as baseline | Yes — `3e7fed2`, built artifact, `CLAUDE.md`/`DESIGN.md`/`PRODUCT.md`/`.impeccable/design.json` read in full |
| Candidate repositories re-verified at execution time | Yes — all eight fetched 2026-08-28; two turned out to have 3 stars, one could not be verified at the assumed granularity |
| Skills used in defined roles, not as competing art directors | Yes — six sequential passes, §3 |
| Native/Expo advice separated from React/Vite-transferable guidance | Yes — §4, candidates 2, 3 and 6 |
| Home, navigation, four domains, Results, achievement and responsive states audited | Yes — Home, domain index, launcher (×4 domains), Flags/Outlines/Locations/Neighbours Play, Results paths, seeded Mastery/complete-region states, portrait + short landscape + reduced motion |
| Motion, game feel, ergonomics, accessibility, design-system each get a dedicated pass | Yes — §2 IDs are prefixed by pass |
| Findings cite concrete behaviour, ranked by impact/confidence | Yes — measured values throughout |
| Existing issues reused | Yes — #71 (E-02/E-03), #34 (G-03/T-02), #72 (F-02), #19 (A-03), #27 (T-01) |
| #71 remains the authority for physical-device evidence | Yes — no device claim made anywhere |
| #104 remains deferred | Yes — untouched |
| adopt/selective/reference/reject for each candidate | Yes — §4 |
| Redundant generalist skills identified rather than retained | Yes — five rejections, two on redundancy grounds |
| Implementation split into focused follow-ups | Yes — §5; #153–#159 filed 2026-08-28 |
| No production application changes | Yes — this document is the only change |

`npm test` (check + unit + Firebase rules + production build + full verifier suite) passes on the
audit branch, exit 0. It covers no part of this document — no verifier reads `docs/open` — so it
confirms only that the audit changed nothing it should not have.
