# Issue 72 — Legacy code paths, CSS architecture, and repository bloat audit

## Status

Audit completed (investigation only). No application code changes made.

This document records findings before any cleanup/refactor work. Recommendations are separated from confirmed issues.

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

The number of CSS files is not itself a problem.

For Atlas, feature-owned styles are preferable to one large stylesheet.

The concern is historical layering:

Possible risks:

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

# Root cause assessment

Current confidence:

## Most likely

PWA/service worker stale asset behaviour.

## Possible

A remaining legacy render path exists but has not been demonstrated.

## Unlikely

A completely separate old application still exists in active source.

---

# Recommended remediation sequence

## Phase 1 — Reproduce and capture

- reproduce on production build;
- inspect worker/cache state;
- capture loaded assets.

## Phase 2 — Asset lifecycle hardening

Only if confirmed:

- improve worker update behaviour;
- improve cache naming/invalidations;
- add diagnostics.

## Phase 3 — CSS audit

- map selectors;
- remove proven dead rules;
- consolidate only where ownership improves.

## Phase 4 — UI cleanup

- remove proven unused views/components;
- extract shared primitives where duplication is real.

---

# Decision

Issue #72 should remain an audit/cleanup umbrella.

Do not perform broad deletion or CSS consolidation until the refresh issue is reproduced with asset-level evidence.
