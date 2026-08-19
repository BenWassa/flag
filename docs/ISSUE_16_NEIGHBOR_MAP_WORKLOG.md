# Issue #16 — Neighbors map-centred reveal worklog

**Branch:** `agent/issue-16-neighbor-map`  
**Started:** 2026-08-19 16:28 EDT (America/Toronto)  
**Last updated:** 2026-08-19 17:01 EDT  
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
The implementation does not statically import `src/data/maps/africa.ts`, does not add URL state, and uses the existing map viewport DOM/data contract. Automated verification covers lazy loading, shell reuse, unchanged wrong/duplicate map state, and PWA caching.

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

### 16:52 — CI run #138: stale cartography cache-lineage assertion

**Observation**
PR-head CI run `32300769671` (#138) built successfully, then failed in the pre-existing `scripts/verify-map.mjs` before the new Issue #16 verifier ran. The assertion expected the service-worker source to retain the historical `flag-atlas-v8` cache-lineage marker.

**Assessment**
The new v12 cache version was correct, but replacing the old service-worker header removed a historical marker that the cartography regression suite intentionally uses to verify release lineage. This was not a map-state or gameplay failure.

**Change**
Kept `const VERSION = 'flag-atlas-v12'` as the real cache key and restored the historical v8/v9/v10 lineage in a source comment, preserving the older regression contract without reverting the cache bump.

**Verification**
The next run passed `verify-map.mjs`, proving the v12 shell and historical cartography guard coexist.

**Evaluation**
No production behavior changed beyond retaining release-history documentation in the service-worker source.

### 16:54 — CI run #139: canonical-name escaping test defect

**Observation**
PR-head CI run `32300920106` (#139) passed the complete existing Flags, map, routing, cartography, outlines, and Neighbors suites, then failed the new completion assertion for `Côte d'Ivoire`.

**Assessment**
The production renderer was behaving correctly: `escapeHtml` emitted the apostrophe as `&#39;`. The test incorrectly searched rendered HTML for the unescaped canonical string.

**Change**
Updated completion verification to assert the canonical name in the derived model and the safely escaped representation in rendered HTML.

**Verification**
PR-head CI run `32301119200` (#140), head `db3e1ecb8352faae50f656e002df4f2df2392ec5`, passed the entire `npm test` chain including the new neighbor-map verifier and cross-domain integration.

**Evaluation**
The failure strengthened the test: canonical naming and safe HTML output are now verified separately.

### 16:57 — Exact run #140 artifact inspection and visual diagnostic

**Observation**
The exact CI artifact `flag-atlas-dist` from run #140 had artifact ID `9383042288`, size 341,889 bytes, and GitHub digest `sha256:c963553f35706fb0355ec9dee7b667f0c809de25bb75276f1ff75c9422e6e0cd`. The downloaded ZIP independently hashed to the same digest.

Static rendering from those exact built modules showed:
- Gambia, Lesotho, DR Congo, Tanzania, dense West Africa, Equatorial Guinea, Angola, and South Africa all fit target + required neighbors inside deterministic focus bounds;
- exercised label layouts had zero major label-box overlap;
- unresolved `?` counts exactly matched generic unresolved accessible labels;
- the lightweight `neighbor-map-runtime.js` was 4,228 bytes raw / 1,375 bytes gzip while `data/maps/africa.js` remained a separate 929,989-byte raw / ~248 KB gzip module;
- the service worker carried v12 and cached the lightweight runtime, while heavy Africa geometry remained behind `loadMapAsset('africa')`.

A static SVG raster diagnostic exposed one presentation flaw: label outline strokes were defined in SVG user units and therefore became visually heavy at close-fit zoom levels.

**Assessment**
A technically passing map with zoom-scaled text halos would undermine legibility, especially for small/dense clusters. This is exactly the kind of problem artifact inspection should catch before readiness.

**Change**
Added `vector-effect: non-scaling-stroke` to neighbor-map SVG text, matching the non-scaling treatment already used for country borders and leader lines.

**Verification**
PR-head CI run `32301649848` (#141), head `87d711ba7ed4acbe1637c142a70d00b04a11a8cc`, passed the entire `npm test` chain after the visual correction.

**Evaluation**
Text halos now remain screen-stable while the map zooms, avoiding the close-fit label blob effect without changing geometry, label positions, or status colors.

### 17:01 — Exact run #141 production artifact and QA limitations

**Observation**
Run #141 produced `flag-atlas-dist` artifact ID `9383222381`, size 341,892 bytes, GitHub digest `sha256:05dbfaf48a5591e07206a3135cc610fed5589f840affe5d62394365b54f230c4`. The downloaded ZIP independently matched that SHA-256 exactly. The unzipped production artifact contained 60 files (~1.4 MB total):
- `neighbor-map-runtime.js`: 4,228 bytes;
- `domain/neighbor-map.js`: 17,543 bytes;
- `ui/components/neighbor-map.js`: 6,736 bytes;
- `neighbors.css`: 9,581 bytes;
- canonical `data/maps/africa.js`: 929,989 bytes, still separately loaded.

Representative exact-artifact model rendering again produced deterministic padded focus boxes and zero major label-box overlap for GMB, LSO, COD, TZA, GHA, GNQ, AGO, ZAF, TGO, BEN, and BFA. Initial Gambia and Lesotho each rendered exactly one anonymous unresolved slot; partial DR Congo rendered four unresolved slots after five solved neighbors; solved/revealed cases rendered no residual question marks.

Chromium is installed in the container, but headless Chromium hangs even on `about:blank` and never emits a screenshot. A local HTTP artifact harness therefore could not provide trustworthy browser/device screenshots. The static SVG raster diagnostic is useful for geometry/label inspection, but it is not claimed as browser QA.

**Assessment**
The strongest available evidence is the exact CI artifact, deterministic model/rendering inspection, CSS/media-query inspection, and the full automated suite. Claiming portrait-device or short-landscape browser testing would be false.

**Change**
No workaround was introduced into production code. The browser limitation is documented explicitly. Responsive contracts remain enforced structurally by production CSS and verification: portrait map-above-sticky-input, keyboard-shortened portrait map height, short-landscape split layout, and wide map-left layout.

**Verification**
At this checkpoint `main` remains `b3f55f80fb1de9fff1e33c09ed04fc4df871a0b7`, the original branch base, so there are no concurrent-main changes to integrate. PR #17 has no review threads or submitted reviews.

**Evaluation**
Code, data, accessibility, performance, PWA, and static visual geometry gates are satisfied. A final documentation-only commit will trigger one final PR-head CI/artifact refresh; that resulting run is the merge-readiness evidence recorded on the PR/issue rather than creating an endless documentation/CI loop here.

## Verification history

- CI #138 / run `32300769671`: **failed** — existing map verifier lost historical `flag-atlas-v8` source marker when the PWA cache advanced; restored lineage comment while keeping v12 active.
- CI #139 / run `32300920106`: **failed** — new test compared raw `Côte d'Ivoire` with correctly escaped rendered HTML; fixed test to verify canonical model text plus escaped output.
- CI #140 / run `32301119200`: **passed** — complete `npm test`; exact artifact downloaded and inspected.
- CI #141 / run `32301649848`: **passed** — complete `npm test` after non-scaling label-stroke visual correction; exact artifact downloaded, hash-verified, and inspected.

## Final release gate

Status at the final documentation commit:
1. current `main` re-fetched: **unchanged from branch base; integrated**;
2. complete repository `npm test`: **green on code head #141**;
3. final documentation commit: **must receive a fresh green PR-head CI run before readiness**;
4. review threads: **none**;
5. exact CI artifact: **run #141 hash-verified and inspected; final documentation-head artifact must be checked for equivalence**;
6. answer leakage: **automated DOM/model verification green**;
7. duplicate geometry/adjacency source: **none introduced**;
8. Flags, Locations, Outlines, and Neighbors mechanics: **all existing suites green**;
9. physical/mobile browser QA: **not available; Chromium headless is nonfunctional in this execution container and no device claim is made**.
