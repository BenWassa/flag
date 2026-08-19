# Issue #16 — Neighbors map-centred reveal worklog

**Branch:** `agent/issue-16-neighbor-map`  
**Started:** 2026-08-19 16:28 EDT (America/Toronto)  
**Last updated:** 2026-08-19 16:45 EDT  
**Scope:** visual Neighbors learning surface only: canonical geometry integration, puzzle-state rendering, fitted viewport, label placement, responsive/accessibility behavior, tests, PWA/artifact verification.

Entries use **observation → assessment → change → verification → evaluation**. Issue #15 owns British-English product-language cleanup; internal `neighbor` identifiers/routes/storage are intentionally unchanged.

## 2026-08-19

### 16:28 — Source-of-truth and dependency audit

**Observation**
- Issue #16 asks for a progressive geographic reveal, not a replacement for Issue #3 gameplay.
- PR #14 already owns topology-derived adjacency, aliases/autocomplete, `n + 2` unique-guess accounting, free duplicates, exhaustion/reveal, independent mastery, routing, and the Africa-only coverage exclusions for Egypt and Morocco.
- PR #12 already owns the canonical Natural Earth 1:10m Africa geometry, shared political-boundary/coastline/water layers, small-country presentation metadata, lazy continent loading, and the native SVG `viewBox` pan/zoom controller.
- PR #11 already owns typed domain/scope/activity routes and the active-round refresh fallback.
- `NeighborTargetState.foundIds` and `revealedIds` already encode all map resolution states needed by this issue.

**Assessment**
The safest architecture is a derived presentation model. Map state must be a pure projection of the existing Neighbors round plus canonical geometry, so wrong/duplicate guesses literally have nothing new to mutate.

**Change**
Created `agent/issue-16-neighbor-map` from current `main` at `b3f55f80fb1de9fff1e33c09ed04fc4df871a0b7`. No route, mastery, adjacency, or country-naming model is being duplicated.

**Verification**
Read Issue #16, `DESIGN.md`, Issue #3/#9 worklogs, `MAP_GEOMETRY_SOURCES.md`, `ROUTING.md`, `COUNTRY_NAMING.md`, the Neighbors state machine/UI/tests, map asset loader/models/renderer/viewport/CSS, PWA shell, and integration verification before writing implementation code.

**Evaluation**
Issue #16 can remain a focused presentation feature built on the three already-merged foundations.

### 16:32 — Local checkout path failed; connector-first implementation retained

**Observation**
The execution container cannot resolve `github.com`, so a normal `git clone`/local checkout cannot reach the repository even though the connected GitHub API can read and write it.

**Assessment**
Substituting guessed repository state would be unsafe. The connected GitHub repository is the source of truth; GitHub Actions can provide the authoritative Node/TypeScript/test execution environment after commits are published.

**Change**
Switched repository inspection/writes to the connected GitHub API. A local scratch TypeScript workspace is used only to syntax/type-check the new isolated modules against minimal interface stubs; it is not treated as repository CI.

**Verification**
The new TypeScript modules compile under TypeScript 5.8.3 in the scratch workspace. Final readiness still requires the repository's complete `npm test` through GitHub Actions and exact CI-artifact inspection.

**Evaluation**
The environment limitation changes the execution path, not the release gate. No physical-device/browser claim will be made.

### 16:37 — Map-state and lazy-loading architecture

**Observation**
The existing Neighbors quiz is text-only and intentionally does not import the ~920 KB generated Africa geometry module. The existing map loader already caches a dynamic `import('./africa.js')` and the service worker caches same-origin dynamic modules after use.

**Assessment**
Importing Africa geometry from the Neighbors view/app bundle would regress startup weight. Rebuilding the entire SVG after every unique guess would also waste work and could reset viewport state.

**Change**
Implemented a lightweight `neighbor-map-runtime` sidecar:
- it watches only for a live `[data-neighbor-map-host]`;
- only then calls the existing `loadMapAsset('africa')` dynamic-loader path;
- derives unresolved membership from the existing lightweight `AFRICA_LAND_ADJACENCY` fixture rather than serializing unresolved answers into DOM data;
- preserves/detaches the existing SVG shell across normal Neighbors quiz `innerHTML` rerenders;
- when the target is unchanged, patches only puzzle/label layers;
- if a wrong or duplicate guess leaves `foundIds|revealedIds` unchanged, it reuses the SVG without any puzzle-layer mutation;
- a new target gets a new `${session}:${ISO3}` viewport key and its own fitted cluster.

**Verification**
The implementation does not statically import `src/data/maps/africa.ts`, does not add URL state, and uses the existing map viewport DOM/data contract. Automated verification is being added for lazy loading, shell reuse, unchanged wrong/duplicate map state, and PWA caching.

**Evaluation**
Initial geography remains lazy, while post-load correct guesses can update the map without reparsing surrounding cartography or losing pan/zoom.

### 16:41 — Framing and label-placement strategy

**Observation**
Bounding-box-centre labels fail for concave/multipart countries and dense West Africa. Gambia/Togo already have approved mainland callout metadata; island locators are interaction aids and must not replace true polygons in this game.

**Assessment**
The map needs deterministic geometry-derived placement with exceptional callouts, not a manual country-coordinate table.

**Change**
Added a pure Neighbors map model that:
- always selects `outlinePath ?? path` from Issue #9 geometry for target/neighbour polygons;
- unions target + direct-neighbour polygon bounds and applies deterministic, clamped padding for the initial focus;
- parses polygon rings and derives an interior point using area centroid when valid, otherwise a deterministic maximum-clearance grid/refinement search;
- estimates label boxes and places target/solved/revealed labels before unresolved `?` markers;
- keeps labels inside polygons when practical, then tries collision-aware callout positions;
- reuses only canonical `geometry.callout` metadata for the established Gambia/Togo exceptions;
- renders no locator dot as substitute country geometry and introduces no ISO-specific coordinate exceptions.

**Verification**
Representative automated cases cover The Gambia, Lesotho, DR Congo, Tanzania, Togo/Benin/Ghana/Burkina Faso, Equatorial Guinea, Angola, and South Africa. Tests require deterministic focus/labels, full cluster containment, canonical path identity, and no major label-box overlap.

**Evaluation**
This gives the puzzle a reusable geometry-derived label system while respecting the existing small-country cartographic policy.

### 16:45 — Responsive and accessibility contract encoded

**Observation**
Portrait phones need both a meaningful map and a keyboard-safe entry surface; unresolved geography must not disclose answer names to assistive technology.

**Assessment**
A fixed desktop-style map plus below-fold autocomplete would make the map ornamental. Exposing neighbour IDs/names through SVG titles or hidden text would defeat the test mechanic for screen-reader users.

**Change**
- Portrait: map above a sticky input; suggestions open as a bounded overlay above the input rather than pushing the map away.
- Keyboard-shortened portrait: map height deliberately contracts to a useful 190 px slice.
- Wide/desktop: one split task surface, map left and entry/status right.
- Short landscape: explicit map-left / interaction-right layout.
- Target, unresolved, solved, and missed/revealed states use existing action/mastered/wrong/neutral tokens and text/state labels.
- Unresolved SVG groups expose only `Unresolved neighboring country`; their country names are absent from titles, ARIA, hidden summaries, and quiz-host data.
- Solved/revealed names become accessible only when the existing round state says they are known.
- Context/water/boundaries remain non-interactive; color is reinforced by labels, outlines/dashes, and textual status.
- Reduced-motion and forced-colors rules are explicit.

**Verification**
New tests inspect generated DOM strings for answer leakage and state transitions, production CSS for portrait/landscape/forced-colors/reduced-motion contracts, and the renderer for non-clickable map geography.

**Evaluation**
The map becomes the dominant learning surface without changing the text-entry game or making color the sole carrier of state.

## Verification history

Pending first repository CI run.

## Final release gate

Before merge recommendation:
1. re-fetch current `main` and integrate it if it advanced;
2. run the complete repository `npm test` on the integrated PR head;
3. require final PR-head GitHub Actions green;
4. inspect open review threads and resolve actionable feedback;
5. download and inspect the exact CI-built `flag-atlas-dist` artifact, including module structure, PWA shell, unresolved-name leakage, CSS, and representative generated map markup/static geometry;
6. record any remaining limitation honestly, including the absence of physical phone/browser automation if still true.
