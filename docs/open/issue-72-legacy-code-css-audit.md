# Issue 72 — Legacy code paths, CSS architecture, and repository bloat audit

## Status

Audit completed (investigation only). No application code changes made.

**The reported bug is now reproduced and its root cause identified. It is not legacy code, a second application, or a stale service-worker cache** — those hypotheses are disproved below. See "Root cause — confirmed by reproduction".

This document records findings before any cleanup/refactor work. Recommendations are separated from confirmed issues.

---

# Root cause — confirmed by reproduction

Reproduced 2026-08-22 against the production `dist/` build of `main`, served over HTTP with the service worker active, in Chromium 151 (Playwright 1.62.1) at a 390×844 phone viewport.

## Steps

1. Load the app; let the service worker install and take control.
2. Navigate to `#/flags/africa/west-africa` (the West Africa Flags launcher).
3. Start the round — the URL becomes `#/flags/africa/west-africa/test` and the quiz renders (`#app > .quiz-shell`, `h1` = "West Africa").
4. Refresh.

## Observed

| | before refresh | after refresh |
|---|---|---|
| route | `#/flags/africa/west-africa/test` | `#/flags/africa/west-africa` |
| rendered shell | `.quiz-shell` | `.page.page--launcher` |
| `h1` | "West Africa" | **"Africa"** |
| stylesheets loaded | 7 | identical 7 |
| service worker | controlled | controlled |
| caches present | `flag-atlas-v25` only | `flag-atlas-v25` only |

## Mechanism

`routeHasActiveRound()` in `src/app.ts` gates every activity route on live in-memory session state (`store.session`, `store.mapSession`, `store.outlineSession`, `store.neighborSession`). A reload discards that state by design, so the guard fails and the app redirects the activity route back to its launcher.

The learner therefore lands on the **continent-scoped launcher**, whose heading is "Africa" and whose layout is a completely different shell from the quiz they were just in. That is the "older Africa-era app experience with different styling" in the report: it is the current launcher, not old code.

## What this disproves

- **Not stale assets.** The same seven stylesheets load before and after refresh, from a single `flag-atlas-v25` cache.
- **Not a stale service worker.** `shellFromNetwork` is network-first for same-origin requests; the cache is only a fallback for failed fetches.
- **Not a second application or legacy render path.** One router, one entry point, one shell rendered both times.

## Classification

This is **working as architected** (`PRODUCT.md`/`CLAUDE.md`: URLs own navigation state, session state owns quiz internals) with a **UX gap**, not a code-hygiene defect:

- the redirect is silent — no notice explains that the in-progress round ended;
- the destination heading ("Africa") is broader than the route the learner was in (West Africa), which reads as being thrown back to an older, wider screen.

Any fix belongs in a focused UX issue (explain the dropped round, and/or land on the region-scoped launcher), **not** in a legacy-code cleanup. No cleanup in this audit would have changed this behaviour.

---

## Trigger

Observed behaviour:

1. Open a regional learning surface (example: West Africa Flags).
2. Refresh the page.
3. An older Africa-era application experience can appear with different styling.

The initial hypothesis was legacy code or CSS surviving a redesign. Investigation shows the likely problem space is narrower: runtime asset/state restoration rather than multiple active applications.

---

# Findings summary

| Area | Finding | Classification |
|---|---|---|
| Routing | Current router architecture is coherent; no second router discovered | Healthy |
| Bootstrap | Current app entry owns route rendering | Healthy |
| Service worker | Highest-risk area for stale application experience | Investigate/fix candidate |
| Legacy Africa code | Historical Africa-specific material exists, mostly data/docs lineage | Expected history |
| UI views | Current view architecture is feature/domain based | Healthy, monitor |
| CSS | Multiple files are justified, but ownership needs tightening | Cleanup candidate |
| Repository bloat | No confirmed dead-code removal candidates yet | Requires tooling pass |

---

# 1. Refresh / routing investigation

## Reviewed

- `src/app.ts`
- `src/routing/router.ts`
- `src/routing/routes.ts`

## Findings

The current application has a single hash router.

Route ownership follows:

```
URL hash
  ↓
router
  ↓
AppRoute
  ↓
app.ts render selection
  ↓
ui/views renderer
```

The router supports current Atlas concepts:

- home
- progress
- atlas continent surfaces
- learning domains
- activities

No evidence was found of an old standalone Africa application router still being mounted.

## Conclusion

The refresh issue is unlikely to be caused by an old route implementation directly replacing Atlas.

Primary remaining suspects:

1. cached production shell/assets;
2. stale deployed JS bundle;
3. service worker lifecycle issue;
4. browser retaining an older application state.

---

# 2. Service worker/cache investigation

## Reviewed

- `public/sw.js`

## Findings

The service worker intentionally maintains release lineage:

- current cache version: `flag-atlas-v24`
- previous versions documented in comments

The worker:

- installs shell assets;
- deletes previous cache versions on activation;
- serves cached/network resources.

This architecture is reasonable for a PWA.

## Risk identified

The reported symptom matches a class of PWA problems where:

- an old worker remains active;
- an old tab retains a previous worker-controlled page;
- deployment updates assets but not the active client immediately.

## Required follow-up

Production verification should capture:

- active service worker version;
- cache contents;
- loaded JS/CSS filenames;
- whether refresh occurs before or after worker activation.

No cache changes should be made until this evidence is collected.

---

# 3. Legacy application archaeology

## Reviewed areas

Search performed across current repository references.

Historical Africa material exists in:

- closed Africa expansion documentation;
- Africa map/data foundations;
- historical issue records.

These are not automatically bloat.

## Classification

| Item | Classification |
|---|---|
| Africa expansion docs | Historical documentation, retain |
| Africa geography data | Active foundation, retain |
| Historical issue docs | Retain for project history |
| Old UI implementation | Not yet confirmed present |

The existence of Africa-specific files is expected because Africa was the first production geography foundation.

---

# 4. CSS architecture audit

## Current structure

Styles are split by responsibility:

- `styles.css`
- `atlas-theme.css`
- `map.css`
- `map-cartography.css`
- `progress.css`
- `outline.css`
- `neighbors.css`

## Assessment

The number of CSS files is not itself a problem. For Atlas, feature-owned styles are preferable to one large stylesheet.

The confirmed concern is **historical layering between the two largest sheets**, now measured rather than hypothesised:

| sheet | lines |
|---|---|
| `atlas-theme.css` | 995 |
| `styles.css` | 938 |
| `progress.css` | 404 |
| `map.css` | 402 |
| `neighbors.css` | 320 |
| `map-cartography.css` | 157 |
| `outline.css` | 79 |

**63 class selectors are defined in both `styles.css` and `atlas-theme.css`** — including `.button`, `.button--primary`, `.answer-button`, `.answer-panel`, `.answer-feedback` and its three state modifiers. `atlas-theme.css` loads later and acts as an override layer that re-styles components `styles.css` already owns.

That split is the real finding of this audit. It means a component's final appearance is decided by two files, and a change in the "wrong" one is silently overridden — which is how the codebase acquires rules that look dead but are not, and rules that look live but are.

Remaining risks, still unproven and needing the selector map below:

- selectors that no longer have owners;
- old redesign rules surviving;
- duplicated spacing/colour values;
- global styles leaking into domains.

## Recommended future cleanup

Create a CSS ownership map:

```
selector
 ↓
stylesheet
 ↓
component/view usage
 ↓
keep/remove decision
```

Do not merge stylesheets without this mapping.

---

# 5. UI/view architecture audit

## Current structure

`src/ui` is organised into:

```
src/ui
├── components
├── views
├── format/focus helpers
```

Views are separated by learning surfaces:

- flags
- locations/maps
- outlines
- neighbours
- progress
- atlas/navigation

## Assessment

The current structure matches the intended Atlas architecture.

Potential future simplifications:

- shared quiz shell extraction;
- shared result presentation patterns;
- repeated layout primitives.

These are refactoring opportunities, not confirmed bloat.

---

# 6. Repository hygiene audit

No immediate high-confidence deletion candidates identified.

Future checks required:

- TypeScript unused exports;
- unused CSS selectors;
- unused assets;
- generated files;
- stale documentation references;
- duplicated utilities.

The project is large enough now that automated dead-code checks should be added rather than relying on manual inspection.

---

# Root cause assessment — resolved

Superseded by "Root cause — confirmed by reproduction" above. The earlier ranking was wrong:

| earlier hypothesis | verdict |
|---|---|
| PWA/service worker stale assets (*most likely*) | **disproved** — network-first fetch, single live cache, identical assets across refresh |
| a remaining legacy render path (*possible*) | **disproved** — one router, one entry, same shell before and after |
| a separate old application in source (*unlikely*) | **disproved** — no unreferenced modules found |

The observed behaviour is the session guard redirecting an unresumable activity route to its launcher.

---

# Repository hygiene — measured

- `dist/` is correctly git-ignored; no generated artifacts are tracked.
- No unreferenced TypeScript modules found in `src/` (every module is imported by at least one other).
- No confirmed dead-code deletion candidates. Automated unused-export/unused-selector tooling is still the right way to go further; manual inspection found nothing.

---

# Recommended remediation sequence

## Phase 1 — Reproduce and capture — **done**

Completed; see the reproduction section above. No asset-lifecycle problem exists to fix.

## Phase 2 — Refresh UX (new, separate issue)

The real user-facing problem. Out of scope for this audit:

- tell the learner their in-progress round ended rather than redirecting silently;
- consider landing on the region-scoped launcher instead of the continent one, so the heading matches the route they left.

## Phase 3 — CSS ownership (the substantive cleanup)

Highest-value work remaining in this issue's scope:

1. map the 63 selectors shared by `styles.css` and `atlas-theme.css`;
2. for each, decide which sheet owns it and delete the loser;
3. only then consider consolidation.

Do not merge stylesheets before that map exists.

## Phase 4 — UI cleanup

- remove proven unused views/components;
- extract shared primitives where duplication is real.

---

# Decision

The reported bug needs no cleanup work — it is architectural behaviour plus a UX gap, and should be handled as its own focused issue.

Issue #72's remaining value is the **CSS ownership split** (Phase 3), which is now evidenced rather than suspected. Broad deletion or stylesheet consolidation should still wait for the selector map.

---

# Phase 3 — CSS ownership resolved (2026-08-22)

Phase 3 is complete. The selector-ownership map the audit called for was built,
and every declaration it proved dead has been removed.

## What "dead" means here

A declaration was treated as dead only when a later declaration in the cascade
has **the same normalised selector, the same media context, and the same
property**. Same selector implies same specificity, so the later declaration
always wins and the earlier one can never affect any element. This also holds
for shorthands: the winner is the same shorthand, so it resets exactly the same
longhands.

Two guards were applied:

- **Grouped selectors.** A declaration in `a, b { … }` is removed only if the
  property is overridden later for *every* selector in the group. Partial
  overlaps were left alone.
- **Fallback stacks.** A property repeated inside the *same* rule is deliberate
  progressive enhancement, not duplication. `.neighbor-quiz-page`'s
  `min-height: 100vh` followed by `100svh` is preserved.

## Result

| sheet | dead declarations removed | owner it lost to |
|---|---|---|
| `styles.css` | 74 | `atlas-theme.css` |
| `map.css` | 11 | `map-cartography.css` |
| `neighbors.css` | 4 | `atlas-theme.css` |
| `outline.css` | 2 | `atlas-theme.css` |
| **total** | **91** | |

The audit counted 63 shared class *names* between `styles.css` and
`atlas-theme.css`; measured at property level the overlap is 74 declarations
across 40 rules.

`atlas-theme.css` is confirmed as the production owner of component appearance,
which matches its role as the Tactile Atlas layer in `DESIGN.md`. `styles.css`
now owns structure and layout that atlas-theme does not restate.

Several removed declarations were pre-colour-system fossils that said the wrong
thing: `.answer-button--correct`, `.status-strip__mastered` and
`.status-text--mastered` still used `--mastered` (purple) where `atlas-theme.css`
correctly applies `--correct` (green) and `--action`. Anyone editing those lines
would have seen no effect — exactly the trap this phase existed to remove.

## Verification — proven to be a rendering no-op

Two independent proofs, both against the production `dist/` build, Chromium 151
(Playwright 1.62.1):

1. **Cascade level.** Both builds' stylesheets were parsed by the browser's own
   CSSOM, and the winning declaration was resolved for every
   (media context, selector, property) triple. **5,761 keys before and after: 0
   lost, 0 added, 0 with a changed winning value.**
2. **DOM level.** Computed styles for ~50 properties on every element of 56
   URL-reachable surfaces — Home, Progress, Atlas continent, all four domain
   launchers, region launchers and Flags Learn — at 390×844, 844×390, 768×1024
   and 320×568. **406,800 property comparisons, 0 differences.**

Quiz and results surfaces were also captured but are not part of the numeric
proof: question selection is seeded from `sessionId`, and Play mode auto-advances
on a timer, so repeated runs legitimately differ. The cascade proof covers those
selectors instead, and it covers them completely.

## The more important finding: tests were guarding dead text

Removing the dead declarations broke two verifiers, which is how a second and
more serious problem surfaced. Both asserted CSS contracts against a sheet whose
declarations are overridden at runtime, so both were passing on values that never
applied:

- `verify-ia.mjs` asserted `.launcher__learn { min-height: 44px }` in
  `styles.css`. The live value is `50px`, from `atlas-theme.css`. The touch-target
  guarantee held, but by accident — the test was not reading the number that
  decides it.
- `verify-map.mjs` asserted `overflow: auto` and
  `touch-action: pan-x pan-y pinch-zoom` in `map.css` under the labels "the
  continent map is natively pannable" and "touch gestures prioritize map panning".
  Neither applies: `map-cartography.css` sets `overflow: hidden` and
  `touch-action: none`, because the production map is an explicitly clipped
  viewport driven by the pointer controller. The same file asserted
  `touch-action: none` twelve lines later, contradicting itself.

`map-cartography.css` had already recorded this in a comment — "Legacy
verification strings are retained only as documentation" — an explicit
acknowledgement that those `map.css` declarations existed to keep a test green
rather than to affect rendering. That comment is now removed along with the
declarations.

Both verifiers now read the sheet that owns the value. The assertions were kept
at equal or greater strength; `verify-ia.mjs` now parses the numeric
`min-height` and asserts `>= 44px` rather than matching one hardcoded string.

## Follow-up left open

- **`--map-canvas-width` is now write-only.** `src/ui/components/map.ts` still
  emits it as an inline style on `.map-svg`, but its only CSS consumer was the
  `map.css` rule removed here; `map-cartography.css` sizes the SVG at `100%`.
  Removing the inline style is a renderer change and belongs with the cartography
  owner, not a CSS pass.
- **Consolidation is still not recommended.** With ownership now unambiguous, the
  seven-sheet split is defensible. Merging sheets would be a separate decision
  needing its own justification.
- **Phase 2 (refresh UX) is unchanged** and still belongs in its own issue.
