# Issue #9 — Production cartography worklog

**Branch:** `agent/issue-9-production-cartography`  
**Started:** 2026-08-19 11:31 EDT (America/Toronto)  
**Scope:** production map geometry/data pipeline, water layers, explicit map viewport/zoom, tests, provenance, PWA artifact verification. Issue #10 navigation/router work is out of scope.

Each entry follows **observation → hypothesis/assessment → change → verification → evaluation**. Failed experiments and political/data assumptions are retained intentionally. No physical-device testing is claimed unless explicitly recorded.

## 2026-08-19

### 11:31 — Issue and repository source of truth recovered

**Observation**
- Issue #9 owns the Africa MVP cartography successor and viewport defects, not general navigation.
- Existing Africa paths were coarse and independently maintained/simplified enough to create measurable shared-edge disagreement.
- The renderer stroked country polygons independently.
- Ocean was primarily a canvas background; lakes and rivers were absent.
- `src/map-viewport.ts` persisted scroll offsets on an oversized SVG rather than an explicit zoom model.
- Existing gameplay had a proven small-country contract: Gambia/Togo mainland callouts only; island targets use a single visible locator with a larger invisible hit surface.
- Another agent may modify `main`, so current-main integration is a release gate rather than a one-time branch-creation assumption.

**Assessment**
Hand-tuning SVG coordinates would preserve the architectural defect. The fix belongs upstream in a reproducible topology-aware source pipeline plus an explicit SVG viewport.

**Change**
Created `agent/issue-9-production-cartography` from `main` at `f71429f81f0b3269303e3a73234418099bc7bfc4` and kept work scoped to cartography/data/viewport/PWA/tests/docs.

**Verification**
No open PR collision existed at branch creation. Relevant design, map UX/gameplay logs, geometry-source docs, current Africa data, renderer, viewport, tests, build, Pages/PWA, and naming policy were inspected before implementation.

**Evaluation**
Issue #9 can be delivered without competing with Issue #10's navigation architecture.

### 11:38 — Natural Earth source family audited

**Observation**
Natural Earth 1:10m themes at the pinned official upstream commit are versioned independently:
- Admin-0 Countries 5.1.1
- Admin-0 Boundary Lines — land 5.1.0
- Ocean 5.1.1
- Lakes + Reservoirs 5.0.0
- Rivers + lake centerlines 5.0.0
- Minor Islands 4.1.0

Natural Earth documents its default Admin-0 presentation as de-facto and supplies point-of-view variants.

**Assessment**
Calling the whole input bundle “5.1.1” would be false provenance. Country ownership should come from Admin-0 Countries; minor islands can supplement evaluation but should not silently decide sovereignty.

**Change**
Pinned official upstream `nvkelso/natural-earth-vector` commit `ca96624a56bd078437bca8184e78163e5039ad19`, theme versions, paths, roles, and ultimately SHA-256 values in `scripts/map-sources/natural-earth.json`.

**Verification**
The generator hash-checks every evaluated source. Exact hashes and byte sizes are also emitted into `docs/CARTOGRAPHY_PROVENANCE.json`.

**Evaluation**
Natural Earth is a practical production source for this PWA: 1:10m detail, public-domain redistribution, global consistency, physical companion layers, and reproducible source files.

### 11:43 — UN boundary-policy role resolved

**Observation**
UN Maps / UN Geospatial products are materially useful for authoritative boundary/currentness/dispute review. UN Clear Map is also tied to UN publication, clearance, and disclaimer practices.

**Assessment**
UN products add policy authority, but making a UN publication product the app's runtime geometry dependency would create operational/redistribution ambiguity that Natural Earth's public-domain build does not. The useful role here is explicit policy auditing rather than silent geometry substitution.

**Change**
Recorded the production policy:
- Natural Earth is runtime geometry.
- UN Maps / UN Geospatial is the dispute/boundary/disclaimer audit reference.
- Dataset point of view does not create scoring identities.
- canonical 54 Africa ISO3 countries remain the scoring set.
- Natural Earth's Somaliland feature is dissolved into canonical `SOM`.
- Western Sahara remains non-scoring context and is not merged into `MAR`.

**Verification**
Issue #9 received a research-decision update before the implementation was called production-ready.

**Evaluation**
Political choices are now reviewable product/data policy rather than accidental consequences of one GIS file.

### 11:49 — Topology-first production architecture selected

**Observation**
The application has a low-runtime-dependency bias and does not need tiles, GPS, arbitrary layer composition, or a slippy-map engine.

**Assessment**
D3 Geo and TopoJSON materially improve build correctness but do not need to ship to the browser. Topology must be created before independent country simplification so adjacent fills share the same arcs.

**Change**
Implemented a dev-only pipeline:
1. parse the canonical Africa curriculum;
2. fetch exact pinned Natural Earth GeoJSON;
3. normalize IDs and explicit policy cases;
4. create political topology;
5. resolve canonical scoring/context geometries;
6. project once with `d3.geoNaturalEarth1`;
7. rebuild/simplify projected topology;
8. derive fills, one shared-border mesh, coastline, adjacency, region focus bounds, island locators, and GMB/TGO callouts;
9. project ocean/lakes/rivers on the same canvas;
10. emit deterministic continent-local runtime data and machine-readable provenance.

**Verification**
The same canonical topology emits a symmetric land-neighbor graph and can produce country geometry for future Issue #2 silhouettes without another source.

**Evaluation**
This is reusable geospatial infrastructure rather than an Africa-only SVG patch.

### 11:52 — Explicit map viewport implemented

**Observation**
The old fixed-width scroll surface could not define “minimum zoom = fit full Africa” and made touch-target scale dependent on SVG size.

**Assessment**
Native SVG `viewBox` control plus Pointer Events is sufficient. A runtime zoom dependency would add weight without supplying needed GIS functionality.

**Change**
Implemented:
- full-continent fitted minimum view;
- generated regional initial focus;
- deterministic Region/Africa fit commands;
- bounded 5.5× max zoom;
- mouse/touch drag pan;
- two-pointer pinch zoom;
- wheel/trackpad zoom;
- Ctrl/Meta-wheel left to browser/page zoom;
- viewport persistence keyed by map session across feedback rerenders;
- drag-click suppression;
- zoom-normalized approximately 44 CSS px invisible island/callout targets.

**Verification**
TypeScript checks pass; regression coverage asserts the max-zoom, fit, pointer, browser-modifier, persistence, and hit-normalization contracts.

**Evaluation**
A small custom controller is maintainable here and preserves the zero-runtime-map-dependency architecture. Physical phone gesture feel remains unverified in this environment.

### 12:04 — Layering, lazy loading, and PWA contract implemented

**Observation**
Even correct source polygons can visually double-stroke if every country owns its own neutral border. Production 1:10m geometry also should not return to the initial flag-learning payload.

**Assessment**
Fill/hit geometry and visible political boundaries should be separate. Africa should be a dynamic continent module cached after use.

**Change**
- Extended map assets with water, shared-boundary, coastline, and initial-focus layers.
- Changed Africa data to cached dynamic `import('./africa.js')`.
- Render order: source ocean → context/active fills → lakes/rivers → shared border/coastline.
- Water/boundary context is `aria-hidden` and `pointer-events: none`.
- Added `map-cartography.css` after the existing map stylesheet instead of refactoring unrelated game styles.
- Bumped PWA shell cache to `flag-atlas-v8`; same-origin dynamic continent assets are cached after first fetch.

**Verification**
Regression coverage checks layer ordering, non-interactivity, lazy import, service-worker compatibility, and runtime size.

**Evaluation**
Startup remains light and previously opened Africa data is offline-cacheable. First-ever offline use before the continent module has ever been fetched is still a documented limitation.

### 12:08 — Red-team: viewport controls were covering geography

**Observation**
The first zoom-control design overlaid buttons on the lower-right map surface.

**Assessment**
At full-Africa fit, that could physically intercept taps around Madagascar/Mauritius—the controls would create a false motor/hit-testing defect even though the underlying geography was correct.

**Change**
Moved all zoom/fit controls into a dedicated toolbar row below the geographic viewport.

**Verification**
The toolbar no longer overlaps the SVG scoring surface in portrait or short landscape layouts.

**Evaluation**
No map control should occupy tappable geography. This remains the production layout.

### 12:10 — Pinned-source generation bootstrapped through observable CI

**Observation**
The execution sandbox could inspect GitHub through the connected API but could not directly download raw Natural Earth inputs with local shell networking.

**Assessment**
Substituting existing coarse geometry would violate Issue #9. GitHub Actions has normal source access and provides observable logs/artifacts.

**Change**
Used temporary PR/branch-only CI scaffolding to run the actual pinned source generator, upload generated assets, and later materialize the exact outputs into the branch. The scaffolding was explicitly temporary.

**Verification**
The source files were fetched at the pinned commit and their SHA-256 values are now committed in the manifest/provenance.

**Evaluation**
Production geometry entered the branch only through the declared source pipeline.

### 12:12 — CI failure: canonical catalog parser was brittle

**Observation**
First observable Issue #9 PR CI failed before Natural Earth processing with `Could not parse canonical country rows`.

**Assessment**
The generator incorrectly assumed `countries.ts` wrapped canonical rows in one specific template-string declaration. The repository source used a different wrapper.

**Change**
Replaced the wrapper-specific regex with line-oriented parsing of canonical `ISO3|ISO2|name|region` rows and retained the exact 54-Africa-row assertion.

**Verification**
The next CI progressed into source normalization.

**Evaluation**
Actual failure cause was repository-format coupling, not geodata or networking. The parser is now robust to harmless catalog wrapper changes.

### 12:16 — CI failure: Bir Tawil triggered the fail-closed political audit

**Observation**
The next source build rejected one unresolved Natural Earth Africa feature: `Bir Tawil`.

**Assessment**
Assigning it to Egypt or Sudan by convenience would be an undocumented political-boundary decision. Natural Earth's de-facto/dispute policy and UN-oriented cartographic treatment were reviewed before changing code.

**Change**
Added explicit policy handling: Bir Tawil is **non-scoring context** and is not merged into `EGY` or `SDN`. Any other unresolved Africa feature still fails generation.

**Verification**
Subsequent source generation passed the Africa feature audit. Provenance and tests lock the Bir Tawil policy.

**Evaluation**
The fail-closed design worked as intended: an unexpected political feature forced review rather than silent assignment.

### 12:20 — Successful source build exposed a real performance defect

**Observation**
Successful source generation retained **40,775 of 56,682** political/context coordinates and produced nine selected lakes/reservoirs plus five major rivers, but the lazy Africa JS module was about **1.68 MB raw / ~555 KB gzip**. The largest avoidable contributor was unsimplified 1:10m physical context, especially the ocean path.

**Assessment**
Lazy loading alone does not make a 1.68 MB continent module a good PWA asset. Relaxing the size assertion would hide architectural debt.

**Change**
Added a deterministic projection-space runtime optimization stage:
- political/context/shared-border/coastline paths: final 0.1-unit coordinate quantization only;
- non-interactive physical RDP: ocean `0.4`, lakes `0.15`, rivers `0.2` projected units;
- final runtime path precision: one decimal digit.

**Verification**
The exact generated artifact became **918,944 bytes raw / 243,511 bytes gzip** while retaining the same 40,775 topology coordinates and all selected water features. Regression budgets are `<1 MB raw` and `<300 KB gzip`.

**Evaluation**
The optimization attacks physical-layer payload cost without independently simplifying neighboring country polygons or compromising truthful hit geometry.

### 12:24 — Full suite green with generated production data

**Observation**
After the policy/performance fixes, CI run #75 completed the legacy map/game suite plus the new cartography verifier successfully.

**Assessment**
A bootstrap-green run is necessary but not a sufficient release gate; generated data must be committed and normal CI must test that exact committed artifact without regeneration magic.

**Change**
Materialized the generated `africa.ts`, source hashes, lockfile, and provenance into the branch. Removed the write-capable/branch-only bootstrap workflow and restored standard read-only CI.

**Verification**
The one-time materializer subsequently reported no generated diff. Standard CI run #79 on committed assets passed and uploaded `flag-atlas-dist`.

**Evaluation**
The branch no longer depends on hidden CI generation. A checkout contains the exact production runtime asset being tested.

### 12:28 — Bootstrap residue removed and current-main drift checked

**Observation**
PR diff review found one temporary `ISSUE_9_GENERATOR_FAILURE.txt` artifact from the Bir Tawil debugging workflow.

**Assessment**
Resolved diagnostic debris should not ship merely because it documents a useful failure; the timestamped worklog is the correct durable record.

**Change**
Deleted the temporary failure file. Temporary generator workflow had already been removed and standard `.github/workflows/ci.yml` restored.

**Verification**
At this checkpoint `compare(main, agent/issue-9-production-cartography)` showed the branch ahead and **0 behind**, with merge base/current `main` still `f71429f81f0b3269303e3a73234418099bc7bfc4`.

**Evaluation**
There was no concurrent-main change to integrate at that moment. This check must be repeated at the final merge gate because another agent may still land work.

### 12:31 — Exact CI artifact visual/cartographic QA

**Observation**
Downloaded the exact standard-CI production artifact from run #79 (artifact digest `sha256:d0246034bbcb1eaf7392865846d7ffdccb0280ab157635650c8fbf0142e13a6d`) and rendered its actual generated Africa paths at representative sizes:
- 390 px portrait full Africa;
- 390 px portrait West Africa regional frame;
- 812 px short-landscape full Africa;
- 812 px short-landscape West Africa regional frame.

**Assessment**
Static geometry/unit tests cannot establish whether borders, water, island locators, regional context, and viewport framing actually read coherently together.

**Change**
No visual design correction was required from this pass. Rivers remain deliberately subtle; lakes read as water cut-ins; the toolbar remains outside geography.

**Verification**
Artifact renders showed:
- full Africa + required island locators visible at continent fit in portrait and short landscape;
- regional frame materially closer while preserving broader context;
- clean single-stroked shared boundaries with no visible double-outline seam artifact;
- major inland water visible without dominating country recognition;
- single island locators rather than locator-plus-callout duplication;
- Gambia/Togo callout targets present;
- no control overlap with scoring geography.

**Evaluation**
Artifact-level cartography is visually coherent at representative mobile dimensions. This is raster/browser-artifact-style QA, **not physical iPhone/Android device gesture testing**.

### 12:34 — Reproducibility audit caught CLI flag forwarding bug

**Observation**
After adding a chained optimizer command to the npm script, `npm run maps:generate -- --update-hashes` appended the flag to the last shell command rather than the source generator.

**Assessment**
Normal regeneration remained hash-safe because committed hashes were already populated, but the documented intentional source-update command was no longer truthful.

**Change**
Added `scripts/generate-map-assets.mjs` as the generation entry point. It forwards CLI source flags to `generate-maps.mjs`, then runs deterministic runtime optimization separately. `package.json` now routes `maps:generate` through that wrapper.

**Verification**
The wrapper has explicit exit-status propagation and no source-update flags are passed to the optimizer. Final CI will test the changed package/build tree; an upstream hash update remains an intentional manual source-review operation rather than a normal CI side effect.

**Evaluation**
Reproduction documentation and executable behavior are aligned again.

## Final release gate still required

Before PR #12 can leave draft status:

1. fetch/compare the then-current `main` again;
2. if it advanced, integrate it and inspect every conflict semantically, preserving both workstreams;
3. run the complete standard repository CI path on the integrated head;
4. download and inspect that exact final `flag-atlas-dist` artifact;
5. repeat artifact visual/red-team checks for geometry, zoom contract, small-country tapping surfaces, water, PWA, and performance;
6. update the issue/PR with final metrics and explicit remaining limitations;
7. do not claim physical-device testing that did not occur.
