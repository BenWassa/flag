# Map geometry sources, provenance, and boundary policy

**Status:** Issue #9 production pipeline implemented; final CI/artifact gate pending  
**Reviewed:** 2026-08-19  
**Tracking:** issue #9  
**Generator:** `scripts/generate-maps.mjs`  
**Source manifest:** `scripts/map-sources/natural-earth.json`  
**Machine-readable generated provenance:** `docs/CARTOGRAPHY_PROVENANCE.json`

## Production decision

Flag Atlas uses **Natural Earth 1:10m** as the practical production cartography source and treats **UN Maps / UN Geospatial** as the boundary-policy, disputed-territory, and publication-disclaimer reference.

This replaces the Africa MVP's independently simplified/coarse country paths. Runtime SVG coordinates are generated output and must not be hand-maintained.

The intended flow is:

`pinned source geodata → canonical ISO3 normalization → topology-aware political-area processing → projection → topology-preserving simplification → derived fills/borders/coastline/adjacency → physical-water projection → optimized continent-local runtime asset`

The historical 1:50m recommendation in early Issue #1 planning (`docs/MAPS.md`) is superseded by this Issue #9 production decision.

## Pinned Natural Earth inputs

Natural Earth theme versions are independent: an older theme version means that theme did not require an update in the latest release cycle. Do not describe the entire source bundle as one blanket “5.1.1” dataset.

The source manifest pins the official `nvkelso/natural-earth-vector` repository at commit:

`ca96624a56bd078437bca8184e78163e5039ad19`

Evaluated inputs:

| Theme | Production role | Theme version |
|---|---|---:|
| Admin-0 Countries | canonical country polygon source | 5.1.1 |
| Admin-0 Boundary Lines — land | provenance / disputed-boundary cross-check | 5.1.0 |
| Ocean | runtime water polygon | 5.1.1 |
| Lakes + Reservoirs | runtime major inland-water context | 5.0.0 |
| Rivers + lake centerlines | restrained major-river context | 5.0.0 |
| Minor Islands | evaluated supplemental source; not ownership authority | 4.1.0 |

Official Natural Earth pages:
- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/

The generated provenance file records the exact byte size and SHA-256 of every evaluated upstream file. Regeneration fails when a populated manifest hash does not match the downloaded bytes.

## Why Natural Earth remains the runtime source

Natural Earth fits this PWA because it provides:

- global 1:10m country coverage from a consistent cartographic source;
- public-domain redistribution;
- ISO/Admin-0 identifiers suitable for deterministic normalization;
- companion physical-water themes;
- documented de-facto/de-jure and point-of-view behavior;
- a source tree that can participate in a reproducible offline build pipeline.

The project does **not** add a runtime GIS/slippy-map dependency. D3 Geo and TopoJSON packages are dev-only generation tools; the browser receives compact local SVG path data.

## UN Maps / UN Geospatial role

Official source: https://maps.un.org/

UN products are used to review national-boundary authority/currentness, dispute treatment, and appropriate boundary disclaimers. UN Geodata simplified is useful as an authoritative generalized reference, while UN Clear Map is tied to UN Secretariat/community publication and clearance practices.

For Flag Atlas, that makes UN data a **policy/audit reference**, not a silently substituted runtime geometry dependency. Any later decision to redistribute or directly build from a UN product requires a separate explicit review of its applicable download, licensing, clearance, attribution/disclaimer, and offline-use terms.

## Africa scored-country / dispute policy

The map curriculum scores the application's canonical **54 Africa ISO3 countries**. Dataset point of view never creates or removes scored identities silently.

Current explicit handling:

- Natural Earth's default Admin-0 presentation is de-facto; using it as cartographic source geometry is not an endorsement by Flag Atlas.
- **Somaliland is not a separate scoring target.** Natural Earth's Somaliland de-facto feature is dissolved into the canonical `SOM` geometry before the scoring topology is generated. This preserves the established 54-country curriculum and produces canonical Somalia silhouettes/adjacency from one geometry.
- **Western Sahara is retained as non-scoring context** and is not silently merged into `MAR`.
- No additional disputed/de-facto feature becomes a scored country unless the application catalog and product policy explicitly change.

Global rollout must repeat this policy review for disputed/special territories rather than generalizing the Africa exceptions by analogy.

## Topology and projection

### Political geometry

The generator first normalizes the scored/context political areas, including the explicit Somalia/Somaliland operation. It then builds topology so shared edges are represented once.

Projection:

- `d3.geoNaturalEarth1`
- deterministic Africa canvas: `835 × 723`
- fit padding: `22` projected units
- runtime path precision: `2` decimal digits

Simplification:

- projected topology quantization: `100000`
- `topojson-simplify` presimplification using planar triangle-area weights
- retained simplification threshold chosen at quantile `0.72`

The exact resulting weight threshold and before/after coordinate counts are recorded in `docs/CARTOGRAPHY_PROVENANCE.json`; those measured values are generated data, not documentation constants to hand-copy.

### Why boundary-line source data is not the rendered shared-border mesh

Natural Earth's Admin-0 Boundary Lines are still pinned and evaluated because they carry useful political-boundary/dispute context. The actual neutral shared border painted by the app is derived from the **same simplified topology as the country fills**.

That guarantees that a fill edge and its visible boundary stroke use identical geometry. Rendering an independently simplified boundary-line theme could reintroduce the very sub-pixel disagreement Issue #9 is intended to remove.

Country fill shapes therefore have no ordinary neutral border stroke. The renderer separately paints:

1. country/context fills;
2. selected inland water context;
3. one topology-derived shared political-border mesh;
4. one topology-derived exterior coastline mesh.

Water and boundary layers are non-interactive and cannot intercept country hit testing.

## Derived reusable outputs

The Africa generated module emits:

- all 54 canonical country geometries;
- non-scoring context geometry;
- shared political-border mesh;
- coastline mesh;
- source-derived ocean/lake/river paths;
- regional first-view focus boxes;
- land-border adjacency graph;
- island locator metadata;
- the two approved mainland callouts.

The same normalized topology is intentionally reusable for:

- **Issue #2 country silhouettes:** select/merge the canonical country geometry and emit a normalized silhouette without another geography source;
- **Issue #3 neighboring-country game:** use the generated topology-neighbor graph rather than manually maintained adjacency.

## Water-context policy

The physical map layer exists for recognition, not decoration.

Required Africa lakes/reservoirs in generation tests:

- Lake Victoria
- Lake Tanganyika
- Lake Malawi / Nyasa source naming
- Lake Chad

Additional named lakes/reservoirs are retained only when present and useful at this scale (for example Turkana, Albert, Kivu, Tana, Nasser).

Required major river context:

- Nile
- Congo
- Niger
- Zambezi

The Orange River may also be retained when present. Minor drainage is deliberately excluded to avoid turning a location drill into a physical-map-reading task.

Ocean, lakes, and rivers are projected through the **same Natural Earth projection/canvas** as political geography. Water is `aria-hidden` cartographic context and `pointer-events: none`.

## Small-country interaction contract

Issue #9 preserves the proven gameplay policy rather than deriving tap behavior mechanically from polygon area.

- Mainland leader-line callouts remain exceptional.
- Current Africa mainland callouts: **The Gambia (`GMB`) and Togo (`TGO`) only**.
- Island scoring targets **Cabo Verde, São Tomé and Príncipe, Comoros, Mauritius, and Seychelles** use one visible locator/dot with a larger invisible touch surface.
- Island targets do not render a redundant country dot plus leader-line callout.
- Zoom-time hit normalization keeps invisible locator/callout touch surfaces approximately 44 CSS px across while leaving visible geography unchanged.

Do not add new callouts solely because a polygon is small. Actual phone play is the decision criterion.

## Runtime, loading, and PWA behavior

`src/data/maps/index.ts` dynamically imports `./africa.js` when an Africa map scope is first opened. The flag-learning startup path therefore does not eagerly ship the production continent geometry.

The service worker caches same-origin dynamic modules after first fetch. Consequences:

- initial PWA shell stays small;
- previously opened continent data can be revisited offline;
- first-ever offline use of a continent that has never been fetched is not guaranteed.

That limitation is intentional in the current lazy-loading architecture and should be revisited only if product requirements demand preinstalled offline map data.

## Reproduction

Normal regeneration:

```sh
npm install
npm run maps:generate
npm test
```

For intentional upstream-hash initialization/update after source review:

```sh
npm run maps:generate -- --update-hashes
npm test
```

`--update-hashes` must not be used as a way to suppress an unexplained upstream change. Review the source revision/theme release first, then update the pinned commit/version and hashes together.

## Verification / release criteria

Automated Issue #9 verification covers:

- all 54 country IDs reconcile exactly;
- source commit/theme versions and SHA-256 provenance;
- topology simplification actually reduces coordinates without becoming aggressively coarse;
- shared-border and coastline meshes exist as separate layers;
- adjacency is symmetric and includes representative known relationships;
- required water features exist;
- GMB/TGO-only mainland-callout policy;
- five locator-only island targets;
- regional focus boxes plus full-Africa fit contract;
- lazy continent import;
- browser-page zoom modifier preservation;
- non-interactive water/boundary CSS;
- PWA cache version/shell compatibility;
- runtime Africa-module size ceiling.

Before merge recommendation, additionally:

1. integrate the then-current `main` and review concurrent-work conflicts semantically;
2. run the complete repository CI path;
3. inspect the exact CI-built production artifact;
4. render representative portrait and short-landscape artifact views for visual QA;
5. red-team small-country tapping, zoom limits, water legibility, PWA behavior, and performance;
6. record the fact that static/browser-emulated review is **not** physical iPhone/Android device testing unless such testing actually occurred.
