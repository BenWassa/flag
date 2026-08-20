# Map UX Refinement Worklog

**Branch:** `agent/map-ux-refinement`  
**Started:** 2026-08-19 00:45 EDT (America/Toronto)  
**Scope:** West Africa map mode — visual system, interaction behavior, mobile ergonomics, feedback, accessibility, and consistency with the existing Impeccable / Atlas Index design system.

## Method

This log records material observations, decisions, changes, tests, and outcomes. Entries are timestamped in Toronto time. The goal is to make the refinement auditable rather than rely on an undocumented polish pass.

Evaluation lenses:

1. Existing Flag Atlas Impeccable design contract (`DESIGN.md`, `.impeccable/design.json`, `docs/closed/impeccable-review.md`).
2. Operate-surface heuristics: task speed, scanability, state clarity, hierarchy, recoverability, responsive behavior.
3. Mobile interaction ergonomics: effective hit target, thumb reach, viewport use, accidental-tap risk.
4. Learning behavior: retrieval attempt, corrective feedback, reveal timing, assessment integrity.
5. Accessibility: target size, focus, live feedback, reduced motion, color-independent meaning.
6. Regression safety: existing flag learning must remain unchanged.

---

## 2026-08-19

### 00:45 — Work started

**Action**
- Created branch `agent/map-ux-refinement` from `main`.
- Read `.impeccable/design.json`, `DESIGN.md`, and the previous `docs/closed/impeccable-review.md`.

**Existing design contract recovered**
- Flag Atlas is an **Operate** surface.
- Rules/proximity should beat containers.
- Corners should remain modest (6–9px in the documented system).
- Routine navigation should stay quiet.
- 44px is the product minimum touch target.
- Action blue is semantic, not decorative.
- Motion should be short and state-linked.
- The product deliberately avoids generic rounded-card/dashboard styling.

**Initial finding — P1: map mode visibly diverged from its parent design system**
`map.css` currently introduces a separate visual language: 16–20px radii, multiple rounded cards, a floating/sticky translucent prompt with blur and shadow, many hard-coded colors, and a large rounded map container. This directly contradicts the existing Atlas Index rules and makes map mode feel bolted on rather than native to Flag Atlas.

**Initial finding — P1: token discipline regressed**
`map.css` contains numerous literal colors even though `DESIGN.md` explicitly states that colors belong in the shared token block. This makes state semantics drift from the rest of the app and prevents coherent future tuning.

**Initial finding — P1: mobile map geometry is solved by horizontal scrolling rather than task framing**
The SVG has `min-width: 700px` on mobile. This preserves hit size, but turns the core learning action into map panning + searching. Horizontal movement is especially costly because the prompt is sticky below the map and the user can lose the target-country context while moving around.

**Initial finding — P1: prompt hierarchy is visually heavy and spatially detached**
The bottom prompt is styled like a floating sheet (`border-radius: 18px`, shadow, backdrop blur). It competes with the map instead of acting as a compact task command. It also consumes meaningful vertical space on a mobile activity whose scarce resource is map viewport height.

**Initial finding — P2: map home over-explains before play**
The map landing page adds a pilot eyebrow, rounded progress card, action group, legend, and explanatory paragraph. This is more ceremony than the flag flow and delays entry into the task. Learn/Test semantics can be made clearer with less UI.

**Initial finding — P2: learned-state colors do not share the established mastery vocabulary**
The map-progress bar uses a bespoke blue palette rather than the app's Mastered/Learning semantic colors. Round-performance colors (white/yellow/orange/red) and durable mastery colors are distinct concepts and should not be conflated, but the persistent progress indicator should still use the product's shared Mastered/Learning/Unseen vocabulary.

**Initial finding — P2: Test mode copy is cognitively repetitive**
`One tap. Correctness is held until the round ends.` is repeated under every prompt. That rule belongs in the mode entry/first question, not as permanent per-question chrome.

**Initial finding — P2: Learn feedback tells attempts remaining, but not what just happened**
After an error the persistent text becomes “2 tries left before reveal.” This communicates mechanics but weakly communicates the learning event. Immediate response should first say the selected location was not the target, then maintain the target prompt without making the user parse a countdown.

**Initial finding — P2: the current wrong-tap response is visually subtle relative to the cost of an error**
A short outline pulse is easy to miss on a dense map, especially under touch where hover context does not exist. The response needs to be immediate and localized without permanently coloring the wrong country.

**Initial finding — P2: results prioritize a percentage over error structure**
For a learning map, the actionable result is *which places needed help and how much*. First-try percentage is useful, but mistake categories and a direct review path should carry more weight than a generic percent score.

### 00:48 — External behavior/accessibility baseline checked

**Research checked**
- W3C WCAG 2.2 SC 2.5.8 requires pointer targets of at least 24×24 CSS px unless an exception applies, and explicitly notes the essential-presentation exception for dense map locations. Larger targets are still recommended where practical: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Apple HIG recommends at least a 44×44pt hit region for buttons and requires a visible press state for custom controls: https://developer.apple.com/design/human-interface-guidelines/buttons
- Apple accessibility guidance also stresses spacing to reduce accidental activation: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Retrieval-practice research supports retrieval attempts followed by corrective feedback; feedback improves the benefits of testing and reduces error persistence. Relevant review / experiments: https://pubmed.ncbi.nlm.nih.gov/20951630/ and https://pubmed.ncbi.nlm.nih.gov/18194050/

**Behavior conclusion**
- Keep **immediate corrective feedback in Learn**.
- Keep **correctness withheld in Test**.
- Preserve the three-strike reveal mechanic, but make each miss response clearer and faster.
- Optimize the map for reliable single taps before adding gesture complexity.

### 00:50 — Test-environment limitation recorded

**Action**
- Tried to exercise the exact CI artifact with a headless browser under the `/flag/` project subpath.
- The session environment blocks localhost browser navigation and the installed Chromium cannot initialize its GPU/headless rendering path in this sandbox.

**Result**
- Browser-based screenshot automation is not reliable in this environment.
- Continue using the exact built artifact for structural/runtime inspection plus source-level interaction analysis, and use repository CI for executable verification after changes.
- Do not claim visual pixel inspection that was not actually performed.

**Implication for this pass**
The strongest improvements will be grounded in the current rendered structure/CSS, established product design contract, interaction-state code, and objective mobile/accessibility constraints. A final production-device visual QA remains necessary after deployment.

### 00:52 — First visual-system implementation pass

**Changes**
- Replaced the Home promotional map card with a flat **Country locations** atlas row.
- Rebuilt map home using the same title, progress strip, stat legend, and Learn/Test action hierarchy as flag scope pages.
- Removed map-only progress blues; durable location progress now uses the shared Mastered/Learning/Unseen vocabulary.
- Removed glass/blur, shadows, 16–20px card radii, and bespoke map chrome.
- Moved the active country prompt above the geography so the target stays in view during map scanning.
- Removed the old 700px mobile minimum canvas and horizontal-search requirement; the map now fits available width.
- Added visible touch-down, keyboard-focus, fine-pointer hover, reduced-motion, and forced-colors states.
- Strengthened wrong-tap response with a temporary error fill/stroke plus explicit text naming what was selected.
- Removed percentage emphasis from results and added first-try / one-miss / two-miss / reveal breakdown.

**Evaluation**
The map now belongs to the same product system as flags. The map itself becomes the dominant visual object, while surrounding UI returns to the quieter Atlas Index language.

### 00:54 — First CI run failed; failure investigated

**Run**
- PR #5 CI run `32217406620`.

**Failure**
TypeScript rejected passing `LocationScopeStats` directly to the shared `progressStrip` / `statLegend` renderers because flag `ScopeStats` also contains a `due` field.

**Assessment**
This is a useful boundary failure, not a reason to duplicate the component or weaken the shared type. Location learning currently has no due scheduler.

**Fix**
Adapt map stats at the UI boundary with `due: 0`, preserving the shared progress component and flag-domain type contract.

### 00:55 — Corrected CI run passed

**Run**
- PR #5 CI run `32217490882`.

**Result**
- `npm install`: pass.
- Full `npm test`: pass.
- Existing flag verification remains intact.
- Map verification remains intact after the first visual-system changes.

### 00:57 — P0 learning-integrity issue found in touch-target assistance

**Finding**
The initial pilot enlarges only the *current target* with an invisible circle rendered over the map. My first fit-width pass increased its minimum SVG radius to 26 to compensate for the smaller rendered map.

Benin's assist center is `(505.2, 348.2)` and Togo's is `(484.8, 361.8)`: only about **24.5 SVG units apart**. A radius of 26 therefore reaches past the neighbour's center. In the existing overlay order, a learner could tap geographically inside the neighbouring country and still be credited with the target.

**Severity**
P0 for the learning contract. Accessibility assistance cannot change which geography counts as correct.

**Resolution design**
- Keep the full region fitted to the phone.
- Allow a larger effective assist for narrow targets.
- Clip the assist around every *other* country's real geometry and locator area using an SVG even-odd clip path.
- Tapping another country therefore remains a real wrong answer; enlargement only gains usable neutral/ocean space around the tiny target.
- Added regression assertions for the clip and target size.

**Rule established**
> Accessibility enlargement may make a country easier to hit, but it must never make an adjacent country count as that country.

### 00:58 — Test-mode feedback simplified

**Change**
- First Test prompt explains the rule once: `One tap each · results at the end.`
- Later prompts simply say `Tap one country.`
- After a tap, the transient message is `Answer recorded`, with no correctness leak.

**Reason**
Mode rules should be learned once and then disappear into the interaction. Repeating a full sentence on all 16 questions adds reading without adding information.

### 00:59 — UX contract converted into automated checks

**Added verification for**
- explicit wrong-selection text (`Not Mali…`) in Learn;
- explicit reveal copy after three misses;
- neutral `Answer recorded` confirmation in Test;
- prompt appearing before map in the rendered DOM;
- enlarged narrow-state assistance plus neighbour-excluding clip path;
- diagnostic results breakdown and removal of percentage emphasis;
- shared map-home progress/action vocabulary;
- no map-only progress-card regression;
- no literal colors in `map.css`;
- no `backdrop-filter` glass chrome;
- no return of the 700px minimum horizontal-search canvas;
- hover gating to fine-pointer devices;
- forced-colors support.

**Documentation update**
`docs/product/map-learning.md` now supersedes the original horizontal-pan mobile decision and records the fit-width + safe-hit-assistance contract for future regions.

### 01:01 — Feedback timing and scroll behavior refined

**Finding**
The UI told the learner to inspect a revealed country, but the app advanced after the same 620ms used for an ordinary resolved answer. That made the corrective-feedback state too brief relative to its learning purpose.

**Change**
Map auto-advance is now outcome-sensitive:
- Test answer recorded: **180ms**;
- first-try correct: **520ms**;
- correct after one miss: **700ms**;
- correct after two misses: **850ms**;
- three-miss reveal: **1400ms**.

These values are interaction pacing choices, not claims of a universal cognitive optimum. The design principle is the important part: more corrective information receives more dwell time.

**Scroll refinement**
The app previously called `window.scrollTo(0,0)` on every rerender. Map wrong-tap feedback rerenders the same target, so this could create a visible jump on short viewports. A route/question key now resets scroll only when the screen, session, or question/target changes. Same-question feedback stays spatially stable; the next flag question or map target still returns to its prompt.

**Red-team check**
The route key includes `currentIndex` for both flag and map quizzes. This preserves the established flag behavior instead of accidentally leaving a user scrolled down when the next flag question starts.

### 01:02 — Short-landscape reflow added

**Change**
For landscape viewports at 600px height or less, the map round structurally reflows:
- round header spans the top;
- target / feedback becomes a compact left column;
- map occupies the larger right column.

**Reason**
This follows the existing Flag Atlas rule that short landscape should reflow structurally rather than merely shrink a portrait stack. It also gives the West Africa aspect ratio substantially more useful map area without introducing pan/zoom controls.

### 01:03 — Expanded UX verification passed in CI

**Runs**
- CI run `32217783208`: pass after safe-hit implementation, new behavioral copy, and expanded UX assertions.
- CI run `32218010820`: pass after outcome-sensitive timing and scroll-stability changes.

**Result**
The full repository `npm test` path passes, including the pre-existing flag suite and the expanded map UX contract.

### 01:04 — Exact CI-built artifact inspected

**Artifact**
- Workflow run `32218010820` produced `flag-atlas-dist` artifact `9352975586`.
- Artifact digest: `sha256:abf7f8a7bff390c10a57d8184b8bfa7d60376a56260bcdbc07e71c3eae47398a`.

**Checks against compiled output**
- `Country locations` entry exists in compiled home/app code.
- compiled map quiz contains explicit three-miss reveal feedback.
- compiled map component contains the neighbour-excluding `map-target-hit-clip`.
- compiled app contains the outcome-sensitive 1400/850/700/520ms Learn pacing.
- compiled CSS contains short-landscape and forced-colors media queries.
- no root-relative asset references were found that would break under the GitHub Pages `/flag/` project subpath.
- no literal hex colors were found in compiled `map.css`.

### 01:05 — Final diff / red-team review

**Diff scope**
- 10 changed files.
- Map CSS is smaller overall despite adding responsive/accessibility behavior: generic prototype chrome was removed rather than layered over.
- Existing flag domain/state/storage code is untouched.
- `src/app.ts` changes are limited to render-scroll stability and map answer dwell timing.

**Material red-team checks**
- Flag question scroll reset preserved by including question index in the route key.
- Test mode still does not expose correctness before results.
- Wrong countries still do not receive persistent solved color.
- Results remain non-interactive map evidence.
- Hit-area enlargement is prevented from stealing taps from neighbouring country geometry.
- Mobile no longer requires horizontal canvas search.
- Short landscape has an explicit layout instead of accidental overflow.
- PWA/build paths remain unchanged.

---

## Final evaluation before merge

### Resolved P0/P1 issues

- **Learning integrity:** assisted hit regions cannot intentionally overlap selectable neighbour geometry.
- **Visual-system fragmentation:** map UI now extends Atlas Index rather than introducing a card/glass sub-design.
- **Mobile search friction:** full West Africa scope is visible without mandatory horizontal panning.
- **Prompt continuity:** target stays with the map and feedback rerenders no longer force scroll jumps.
- **Corrective-feedback pacing:** reveals receive enough dwell to be meaningfully inspected.

### Resolved P2 issues

- Test instructions are no longer repeated verbosely on every target.
- Learn wrong feedback says what was selected, not only attempts remaining.
- Results expose mistake severity and put review ahead of a generic percentage.
- Hover, press, focus, reduced-motion, and forced-colors behaviors are explicit.
- Shared design tokens replace map-only literal colors.

### Known limitation / next QA layer

This environment cannot run a reliable interactive browser against the fresh GitHub Pages origin, so this worklog does **not** claim pixel-perfect production-device observation. The exact CI-built artifact and interaction/render contracts were inspected and tested. After merge/deploy, a real-device pass should still check physical feel at representative iPhone/Pixel portrait and short-landscape sizes. Any observations from that pass should be appended here rather than handled as untracked visual tweaks.

### Merge recommendation

**Ready to merge** if the latest PR CI remains green. The pass materially improves coherence, task flow, accessibility, learning correctness, and responsive behavior without changing the flag-learning domain or the map mastery model.

### 01:07 — PR #5 merged

**Result**
- Final PR-head CI run `32218173648` completed successfully.
- PR #5 was marked ready and squash-merged to `main`.
- Merge commit: `bed2cee9ad3a5be23a835b3d32b7aa9b66896514`.
- Issue #1 remains open as the umbrella tracker; its body was updated so future region work inherits the refined visual, mobile, feedback, and hit-target rules from this pass.

**Release assessment**
The code and automated UX contract are ready for production deployment. The remaining QA layer is physical production-device feel, not an identified code blocker.

### 01:10 — Public-origin verification attempted

**Action**
- Retried access to the configured GitHub Pages origin after merge.
- The public web tool still rejects the fresh `github.io` URL as unavailable to its current safe/indexed URL set, and search indexing returns no result yet.

**Result**
- No claim is made that the post-merge production origin was visually clicked through from this environment.
- The exact CI-built artifact, compiled interaction states, project-subpath asset paths, and final PR-head test suite were verified before merge.
- The repository's CI→Pages automation remains the deployment path for successful `main` pushes.

**Closeout**
This worklog is now the source of truth for the West Africa map UX refinement. Future visual or behavioral changes should append a timestamped observation → hypothesis → change → verification → evaluation entry rather than making untracked polish edits.
