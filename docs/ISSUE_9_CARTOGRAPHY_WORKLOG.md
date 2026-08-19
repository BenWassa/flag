# Issue #9 — Production cartography worklog

**Branch:** `agent/issue-9-production-cartography`  
**Started:** 2026-08-19 11:31 EDT (America/Toronto)  
**Scope:** production map geometry/data pipeline, water layers, explicit map viewport/zoom, and regression coverage. Navigation/router work remains out of scope for Issue #10.

This log uses **observation → hypothesis/assessment → change → verification → evaluation**. It records material source, geometry, interaction, test, political-policy, and artifact decisions. It does not claim live-device testing unless such testing actually occurs.

## 2026-08-19

### 11:31 — Issue and repository source-of-truth recovered

**Observation**
- Issue #9 explicitly replaces the Africa MVP cartography and oversized-scroll viewport.
- `docs/MAP_GEOMETRY_SOURCES.md` already records measurable coarse-border overlap/gap risk.
- `src/data/maps/africa.ts` is a hand-maintained/generated-looking low-resolution path catalog rather than a reproducible production source build.
- `src/map-viewport.ts` remembers only `scrollLeft`/`scrollTop`; there is no zoom contract.
- The renderer strokes active/context country polygons independently, so a political edge can be painted twice.
- Ocean is a canvas rectangle; there are no source-derived lakes or rivers.
- Existing mobile gameplay has a proven small-country contract: visible mainland callouts only for The Gambia and Togo; island countries use one locator dot with a larger invisible hit surface.
- Another autonomous workstream may modify `main`; final integration with current `main` is a hard release gate.

**Assessment**
Issue #9 should not patch individual SVG coordinates. Production correctness needs to move upstream: pinned source → topology → projected/simplified generated asset → renderer/viewport. The existing map domain/gameplay and navigation can remain intact.

**Change**
Created dedicated branch `agent/issue-9-production-cartography`. No application-navigation changes were made.

**Verification**
At branch creation there were no open PRs. Current `main` was `f71429f81f0b3269303e3a73234418099bc7bfc4`.

**Evaluation**
The issue can be isolated to map data, renderer, viewport, CSS/PWA shell, tests, and documentation.

### 11:38 — Natural Earth source family audited

**Observation**
Official Natural Earth 1:10m themes are not all on one theme version. At the pinned upstream repository commit `ca96624a56bd078437bca8184e78163e5039ad19`:
- Admin-0 Countries: 5.1.1
- Admin-0 Boundary Lines — land: 5.1.0
- Ocean: 5.1.1
- Lakes + Reservoirs: 5.0.0
- Rivers + lake centerlines: 5.0.0
- Minor islands: 4.1.0

Natural Earth documents the default Admin-0 presentation as de-facto and provides POV variants. Minor-island data improves small-island context but is not an ownership-aware substitute for Admin-0 country geometry.

**Assessment**
Pinning only “Natural Earth 5.1.1” would be imprecise. Provenance must pin the upstream commit, each theme path/version, and content hash. Country ownership comes from Admin-0 Countries; minor islands are evaluated as supplemental data only.

**Change**
Added a source manifest contract at `scripts/map-sources/natural-earth.json` and a generator designed to record/verify SHA-256 for every evaluated source.

**Verification**
The official Natural Earth repository exposes the 5.1.1 Countries version file at the pinned commit. Current official download pages report the same independent theme versions.

**Evaluation**
Natural Earth remains the strongest practical production source: appropriate cartographic scale, public domain, stable offline redistribution, and reproducible source files.

### 11:43 — UN boundary-policy role resolved

**Observation**
UN Maps describes its national/subnational boundaries and coastline data as accurate/up-to-date. UN Geodata simplified is downloadable and intended for generalized global/web maps. UN Clear Map is specifically a UN Secretariat/community publication product tied to UN map-publication procedures, clearance, and political-boundary disclaimers.

**Assessment**
UN products are materially useful for boundary-policy/dispute review, but using UN Clear Map as an app runtime dependency would create avoidable operational/licensing/publication ambiguity compared with Natural Earth. The UN disclaimer framework is more valuable here as policy guidance than as a silently substituted geometry source.

**Change**
Recorded the production policy:
- Natural Earth public-domain geometry is the runtime source.
- UN Maps / UN Geospatial is the policy/dispute/disclaimer audit reference.
- Natural Earth default de-facto geometry is not treated as an app endorsement.
- The 54 canonical ISO3 app countries remain the scored set.
- Somaliland is dissolved into canonical `SOM` scoring geometry to preserve the existing 54-country/UN-ISO curriculum contract rather than exposing a separate target.
- Western Sahara remains non-scoring context and is not silently merged into `MAR`.

**Verification**
Issue #9 received a research-decision comment with the source/version/topology/UN-policy baseline.

**Evaluation**
The political-boundary behavior is explicit and reviewable rather than implicit in whichever GIS file happens to be rendered.

### 11:49 — Production data architecture selected

**Observation**
The app has zero runtime framework dependencies and does not need tiles, GPS, arbitrary slippy-map layers, or a general map engine.

**Assessment**
Topology should remain build-time infrastructure. A small set of dev-only D3/TopoJSON packages materially improves correctness without changing the runtime dependency profile.

**Change**
Generator design:
1. parse the canonical Africa ISO3 curriculum from `src/data/countries.ts`;
2. load pinned Natural Earth GeoJSON;
3. normalize IDs and explicitly resolve the Somalia/Somaliland + Western Sahara policy cases;
4. create topology before projection;
5. project once with `d3.geoNaturalEarth1`;
6. rebuild/simplify projected topology so shared edges remain shared;
7. derive country fills, one shared political-border mesh, coastline, land-border adjacency, regional focus boxes, island locators, and the two approved mainland callouts;
8. project source-derived ocean, selected major lakes/reservoirs, and restrained major rivers on the same canvas;
9. emit deterministic `src/data/maps/africa.ts` plus machine-readable provenance.

**Verification**
The generator and new cartography verifier both pass `node --check`. The replacement viewport passes standalone TypeScript checking with TypeScript 5.8.3.

**Evaluation**
The same normalized topology now has a direct path to Issue #2 silhouettes and Issue #3 adjacency without duplicating source geometry or hand-maintained border logic.

### 11:52 — Explicit viewport contract implemented

**Observation**
The old map model is a fixed 835px+ SVG inside an overflow-scrolling container. At phone width this cannot establish a true “minimum zoom = full Africa” state, and hit circles scale unpredictably with the SVG.

**Assessment**
A native SVG `viewBox` controller is sufficient; a runtime pan/zoom dependency is unnecessary. Pointer Events provide pinch/drag behavior, wheel can zoom, and command buttons provide deterministic keyboard/pointer zoom + fit behavior.

**Change**
Implemented a custom viewport contract:
- minimum view = fitted full continent;
- region rounds initially fit their stored region focus;
- explicit Fit Region / Fit Africa controls;
- bounded maximum zoom 5.5×;
- pointer drag + two-pointer pinch;
- wheel zoom;
- Ctrl/Meta-wheel deliberately left to browser/page zoom;
- viewport state stored by map session across root rerenders;
- dragged gestures suppress accidental country clicks;
- invisible island/callout hit radii are recalculated from CSS pixels as zoom changes;
- map SVG is a stable clipped viewport rather than an oversized scroll canvas.

**Verification**
Standalone `src/map-viewport.ts` type-check passes. Full repository CI remains pending until pinned production geodata has been generated in GitHub Actions.

**Evaluation**
The implementation satisfies the map-specific gesture contract while leaving browser zoom available outside the map and through standard Ctrl/Meta-wheel behavior. Real iPhone/Android physical gesture feel remains a post-artifact/live-device QA item; it is not claimed here.

### 12:04 — Runtime layering and PWA contract implemented

**Observation**
Source correctness alone does not remove visible border seams if the renderer continues painting a stroke on every country polygon. A generated continent module also should not return to the flag-learning startup path.

**Assessment**
Country geometry should be used primarily as fill/hit geometry. Political borders and coastlines need dedicated non-interactive layers rendered once. The Africa module should be dynamically imported only when a map scope opens, then become available offline through the existing same-origin service-worker cache.

**Change**
- Extended `MapRegionAsset` with source-derived water, shared-boundary, and coastline layers.
- Changed Africa data loading to a cached dynamic `import('./africa.js')`.
- Added renderer layers in cartographic order: ocean → land/context fills → lakes/rivers → shared boundaries/coastline.
- Water and border groups are `aria-hidden` and `pointer-events: none`.
- Kept the proven GMB/TGO callout and single-dot island contracts in generated data.
- Added a production cartography stylesheet after the established map stylesheet rather than rewriting unrelated map/game styling.
- Added explicit viewport controls without changing the router/application navigation.
- Bumped the PWA shell to `flag-atlas-v8`; the dynamically imported continent module is cached after first map use rather than preloaded into the initial shell.

**Verification**
New regression checks assert source/version/hash provenance, 54-country reconciliation, water layers, topology-derived shared borders, symmetric adjacency, small-country treatment, lazy loading, viewport controls, browser-zoom preservation, PWA shell compatibility, and a runtime-asset size ceiling.

**Evaluation**
The runtime remains framework-free and light at startup while the map data becomes reusable infrastructure. First-ever offline use of a continent that has never been opened remains intentionally unsupported; once fetched, same-origin cache behavior supports offline revisits.

### 12:10 — Pinned-source generation delegated to branch-only CI

**Observation**
The execution sandbox cannot download the Natural Earth binary/raw assets directly from GitHub because outbound GitHub DNS/raw-file access is blocked, although GitHub Actions has normal network access.

**Assessment**
Substituting local/coarse geometry would violate the issue. Generation must run against the actual pinned upstream data.

**Change**
Added a temporary branch-only Action that installs the pinned dev toolchain, runs `npm run maps:generate -- --update-hashes`, and commits the generated Africa asset, lockfile, resolved source hashes, and machine-readable provenance back to the issue branch. This workflow is temporary scaffolding and will be removed before the final PR is recommended for merge.

**Verification**
The first generated-data commit had not appeared at the time this entry was written. This is recorded as pending rather than assumed successful; the workflow will be instrumented to expose its actual failure if necessary.

**Evaluation**
The source-of-truth requirement is preserved: production geometry will only enter the branch if it was generated from the pinned Natural Earth inputs.
