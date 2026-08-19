# Map UX Refinement Worklog

**Branch:** `agent/map-ux-refinement`  
**Started:** 2026-08-19 00:45 EDT (America/Toronto)  
**Scope:** West Africa map mode — visual system, interaction behavior, mobile ergonomics, feedback, accessibility, and consistency with the existing Impeccable / Atlas Index design system.

## Method

This log records material observations, decisions, changes, tests, and outcomes. Entries are timestamped in Toronto time. The goal is to make the refinement auditable rather than rely on an undocumented polish pass.

Evaluation lenses:

1. Existing Flag Atlas Impeccable design contract (`DESIGN.md`, `.impeccable/design.json`, `docs/IMPECCABLE_REVIEW.md`).
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
- Read `.impeccable/design.json`, `DESIGN.md`, and the previous `docs/IMPECCABLE_REVIEW.md`.

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
`docs/MAPS_PILOT.md` now supersedes the original horizontal-pan mobile decision and records the fit-width + safe-hit-assistance contract for future regions.

---

## Current evaluation

### What is materially better

- **Visual cohesion:** map mode now reads as Flag Atlas rather than an embedded prototype.
- **Task hierarchy:** target → map → response is explicit and stable.
- **Mobile cognition:** the learner sees the whole pilot region while searching instead of panning a wide canvas.
- **Input confidence:** touch/focus/press states are visible and wrong taps produce an unmistakable local response.
- **Learning integrity:** small-target assistance no longer gets permission to turn a neighbouring-country tap into a correct answer.
- **Mode clarity:** Learn teaches; Test records without leaking correctness.
- **Results utility:** the screen points directly at error severity and review rather than a decorative percentage.
- **Maintainability:** map CSS now derives from the shared design tokens and the UX contract has regression coverage.

### Still to evaluate before merge

- Run the expanded verification suite in GitHub CI.
- Review CI-built artifact contents after the new safe-hit implementation.
- Decide whether the fixed Learn auto-advance dwell (currently 620ms after a resolved target) gives a revealed answer enough study time or should become outcome-sensitive.
- Perform final diff/red-team pass for regressions in existing flag UI.
- Update this worklog with final CI result and merge/deploy state.
