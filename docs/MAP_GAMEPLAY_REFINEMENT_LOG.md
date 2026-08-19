# Map Gameplay Refinement Log

**Branch:** `agent/map-gameplay-v3`  
**Started:** 2026-08-19 09:30 EDT (America/Toronto)  
**Scope:** regional map gameplay — country selection visuals, continent context, panning, scoring fills, touch precision, and mobile interaction behavior.  
**Timestamp note:** entries are minute-level Toronto time. Late-pass timestamps were reconciled against GitHub commit/CI timing at closeout so the audit does not record future times.

## Method

Every material observation is recorded as **observation → assessment → change → verification → evaluation**. This pass extends the earlier `MAP_UX_REFINEMENT_LOG.md` and focuses specifically on physical map play rather than general visual-system cleanup.

Evaluation lenses:

1. Geographic learning integrity — the location the learner taps must be the location the engine scores.
2. Mobile motor behavior — targets need reasonable tolerance without creating false positives.
3. Spatial context — a region should remain situated within its continent.
4. State legibility — tap feedback and stored round score are separate visual jobs.
5. Interaction continuity — panning should survive answer rerenders and target changes.
6. Accessibility — keyboard focus remains visible on the country geometry, without a misleading rectangular SVG bounding-box outline.
7. Existing Flag Atlas visual system — shared tokens and restrained chrome remain the baseline.

---

## 2026-08-19

### 09:30 — User gameplay feedback received

Observed issues from production use:

- Clicking a country can leave a **rectangular outline around the SVG group's bounding box**.
- A regional round shows only the region; the user wants the **full continent retained as faded spatial context**.
- The map should remain **pannable around the continent**, especially on mobile.
- A country scored correct does not appear to **fill/confirm strongly enough**.
- Color use and country-click behavior need another full gameplay review.

### 09:33 — Root causes confirmed in source

**Rectangular focus**

Global `styles.css` applies a focus outline to every `[tabindex]:focus-visible`. Interactive map countries are focusable SVG `<g>` elements. Browsers draw that outline around the SVG element's rectangular bounding box, which is visually wrong for geographic selection.

**Correct fill weakness**

The first-try stored score uses `var(--surface)`, visually close to both the page surface and surrounding light map colors. The engine is setting the correct resolution class, but the visual confirmation is too low-salience during the short auto-advance dwell.

**Lost continent context**

`MapRegionAsset` only contains active region polygons. There is no data contract for surrounding non-interactive geography.

**Pan behavior**

The prior refinement deliberately removed the old oversized horizontally scrolling region canvas. That fixed search friction but over-corrected: it also removed the useful mental model of a region sitting inside a larger continent.

### 09:36 — Best-practice check

Sources reviewed:

- W3C WCAG 2.2 SC 2.5.8 / Understanding Target Size (Minimum): spatial maps can qualify for the essential-presentation exception, but larger targets and spacing remain recommended where practical.
- W3C WCAG 2.5.5 Target Size (Enhanced): 44×44 CSS px is the enhanced touch-target target.
- Apple HIG Accessibility / Buttons: iOS controls generally target a 44×44pt hit region and custom controls need a visible press state.

**Design conclusion**

A geography quiz should not inflate every country until borders cease to matter. The better model is:

- true geography remains the scoring surface;
- narrow-country assistance aims for roughly a **44px diameter**, not an arbitrary oversized radius;
- assistance may expand only into neutral/non-country space;
- region countries are visually active;
- out-of-region continent countries remain visible but faded and non-interactive;
- touch uses native pan behavior instead of custom gesture recognizers where possible.

### 09:39 — P1 target-size bug found in previous refinement

The prior safe-hit pass used `Math.max(assist.r, 46)` where the value is an SVG **radius**. At the pilot's near-1:1 mobile scale, that creates an invisible target roughly **92px wide**.

This misapplied the 44px target-size guidance and made narrow countries materially too forgiving.

**Change**

- Reduced the assistance floor to radius `22`, giving roughly a 44px diameter at the normal pilot scale.
- Kept the even-odd clipping model.
- Expanded the clip exclusions to include faded continent context as well as active region countries, so a neutral out-of-scope country can never be silently scored as the current target.

### 09:42 — Full-continent regional asset implemented

**Data contract**

`MapRegionAsset` now supports:

- `contextPaths` — non-interactive surrounding geography;
- `initialFocus` — preferred opening viewport within the larger continent canvas.

**West Africa asset**

- Reprojected the pilot into a full-Africa canvas.
- West Africa's 16 curriculum countries remain the only selectable/scored countries.
- Other African mainland geography is rendered as context.
- Cabo Verde remains an explicit island locator.
- Initial focus is defined around West Africa, while the full Africa canvas remains available by panning.

### 09:42 — Click/focus visual model rebuilt

**Focus**

- Interactive SVG country groups explicitly suppress the global rectangular outline for both `:focus` and `:focus-visible`.
- Keyboard focus remains visible by strengthening the **actual country border** in action blue.

**Tap feedback vs stored score**

These are now separate states:

1. **Immediate correct tap:** temporary green fill + green geographic outline.
2. **After advancing:** country settles to persistent round score:
   - first try → off-white;
   - one miss → light amber;
   - two misses → stronger amber/orange;
   - reveal → red/error tint.
3. **Wrong tap:** transient red fill/stroke on the selected country; it never becomes permanently solved.

This makes the tap feel acknowledged while preserving the original first-try / one-miss / two-miss / reveal scoring language.

### 09:43 — Mobile continent panning implemented

**Viewport**

- Map stage is now a bounded gameplay viewport rather than an infinitely growing page element.
- The full Africa SVG is larger than a phone viewport.
- Native `overflow: auto` enables two-axis pan.
- `touch-action: pan-x pan-y pinch-zoom` keeps browser-native touch behavior.
- Scrollbars are visually hidden so the surface reads as a map, not a scroll panel.
- Overscroll is contained inside the map.

**Pan continuity**

Added `src/map-viewport.ts`:

- remembers pan offset by map session;
- restores it after the app's full-root rerenders;
- centers the initial West Africa focus on first render;
- keeps the same position across wrong-answer feedback, target advances, and results for the same session.

The helper is loaded by the production shell and added to the service-worker app shell.

### 09:43 — Gameplay copy and regression contract refined

The first question now teaches the gesture once: **swipe or drag to pan Africa**. Later questions return to minimal instructions.

Out-of-region countries are intentionally visible but not selectable. This avoids penalizing a learner for touching context that is outside the chosen quiz scope.

Automated verification now requires:

- >20 Africa context paths on the West Africa region asset;
- region `initialFocus` metadata;
- context rendered separately from selectable countries;
- dedicated pannable viewport metadata;
- first-question pan instruction;
- narrow assist radius `22`, replacing the previous radius `46`;
- geometry exclusion clip retained;
- strong transient `map-country--current-correct` state;
- native two-axis pan CSS;
- explicit override of SVG country rectangular focus outlines;
- production shell loading `map-viewport.js`;
- service worker caching the viewport helper.

### 09:44 — First full CI verification passed

**Run:** GitHub Actions CI #26 (`32259704594`).

**Result**

- TypeScript/build: pass.
- Existing flag tests: pass.
- Map domain/persistence tests: pass.
- New continent-context/mobile-gameplay contract: pass.
- CI artifact `flag-atlas-dist` produced successfully (artifact `9367729285`, digest `sha256:31c8a159c417ff718e48bec604a58ece44137b42e0b6f299ff5191f7edbc98cb`).

### 09:45 — CI artifact and geometry visually red-teamed

**Artifact inspection**

Verified the compiled production artifact contains:

- `map-viewport.js`;
- `map-target-hit-clip`;
- `data-map-focus` / session viewport metadata;
- full Africa context paths;
- `map-country--current-correct` state;
- service-worker shell entry for the viewport helper.

**Geometry preview**

Rendered the actual compiled map geometry to a static image for visual inspection. Findings:

- Africa reads coherently as the parent geography.
- West Africa is visibly stronger than the faded continent context.
- Active and context borders remain distinguishable without turning the rest of Africa into visual noise.
- Cabo Verde remains visible as an explicit locator west of the mainland.
- The initial West Africa focus covers the intended active cluster while leaving the rest of Africa accessible through pan.

### 09:47 — Color semantics red-team

**Finding**

The first implementation of this pass gave the persistent first-try state a slight mastery-green tint. That unnecessarily reused the durable mastery semantic for a different concept: round performance.

**Resolution**

- Green is now reserved for the immediate correct-tap confirmation.
- Persistent score returns to the intended stepped language: **off-white → amber → orange → red**.
- Unanswered active countries remain neutral gray, so an off-white first-try fill still reads clearly as completed.
- Text feedback remains present, so color is evidence rather than the sole carrier of meaning.

### 09:48 — CI #27 passed after color correction

**Run:** GitHub Actions CI #27 (`32260192528`).

**Result:** success after the final color-semantics correction.

### 09:49 — Audit closeout and final PR-head CI

A documentation-only closeout commit reconciled the worklog. The resulting PR head ran the complete suite again.

**Run:** GitHub Actions CI #28 (`32260304005`).  
**Result:** success.

### 09:50 — PR #6 merged

PR #6, **Refine mobile map gameplay**, was marked ready and squash-merged to `main`.

- Merge commit: `38928cf69182aa9da9f3782330cecf1851a3f1d2`.
- Issue #1 remains the umbrella tracker for expanding the map system.
- The CI→Pages workflow remains the production deployment path for `main`.

### Final red-team evaluation

- **Rectangle artifact:** removed; focus follows country geometry.
- **Region context:** full Africa remains visible; West Africa is active, other countries are faded and non-scoring.
- **Pan:** native two-axis pan is available and position survives application rerenders.
- **Tap precision:** narrow-country assistance targets ~44px effective diameter and cannot cross into another country's geometry.
- **Correct feedback:** immediate green confirmation is visually strong; completed country then retains its scored fill.
- **Wrong feedback:** red is transient on the selected wrong country; it does not become permanently solved.
- **Score palette:** off-white / amber / orange / red remains conceptually separate from long-term mastery.
- **Mobile topology:** bounded map viewport keeps the prompt stable while allowing geographic exploration; short landscape still reflows structurally.
- **Regression safety:** existing flag domain/state/storage behavior remains untouched.

## Closeout

The requested gameplay changes are merged. Future map-region work should reuse the continent-context + active-region layering, native pan/pan-preservation model, geographic focus treatment, and separation between immediate interaction feedback and persistent round score.
