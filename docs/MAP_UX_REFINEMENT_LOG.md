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
- WCAG 2.2 SC 2.5.8: 24×24 CSS px minimum or sufficient spacing; 44×44 is the enhanced target size.
- Apple HIG: frequent controls should have at least a 44×44pt hit region and custom controls need visible press state.
- Material accessibility guidance: 48×48dp touch targets, commonly with ~8dp separation.
- Retrieval-practice research supports attempting retrieval and receiving corrective feedback rather than passive exposure.

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

---
