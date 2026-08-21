# Map geometry sources, provenance, and boundary policy

**Status:** Production pipeline shipped via PR #12
**Reviewed:** 2026-08-19  
**Tracking:** issue #9  
**Generation entry point:** `npm run maps:generate`  
**Source manifest:** `scripts/map-sources/natural-earth.json`  
**Generated provenance:** `docs/architecture/cartography-provenance.json`

## Production decision

Atlas uses **Natural Earth 1:10m** as the practical production cartography source and treats **UN Maps / UN Geospatial** as the boundary-policy, disputed-territory, and publication-disclaimer reference.

Runtime SVG coordinates are generated output. Do not hand-edit country paths.

The production flow is:

`pinned source geodata → canonical ISO3 normalization → topology-aware political processing → projection → topology-preserving simplification → derived fills/borders/coastline/adjacency → retained ocean/lake projection → scale-aware runtime optimization → continent-local asset`

The historical 1:50m recommendation in the archived [Issue #1 plan](../closed/issue-1-map-plan.md) is superseded by this Issue #9 production decision.

## Pinned Natural Earth inputs

Natural Earth themes are versioned independently. The source manifest therefore pins one upstream repository commit **and** the actual version/hash of each evaluated theme instead of calling the whole bundle “5.1.1”.

Pinned official upstream commit:

`ca96624a56bd078437bca8184e78163e5039ad19`

| Theme | Production role | Theme version |
|---|---|---:|
| Admin-0 Countries | canonical country polygon source | 5.1.1 |
| Admin-0 Boundary Lines — land | provenance / disputed-boundary cross-check | 5.1.0 |
| Ocean | runtime ocean geometry | 5.1.1 |
| Lakes + Reservoirs | runtime major inland-water context | 5.0.0 |
| Minor Islands | evaluated supplemental source; not ownership authority | 4.1.0 |

Official Natural Earth download families:
- https://www.naturalearthdata.com/downloads/10m-cultural-vectors/
- https://www.naturalearthdata.com/downloads/10m-physical-vectors/

`docs/architecture/cartography-provenance.json` records the exact source byte sizes and SHA-256 values. A normal regeneration refuses a source whose populated manifest hash changes.

## Why Natural Earth remains the runtime source

Natural Earth fits this PWA because it provides:

- global 1:10m country coverage from a consistent cartographic source;
- public-domain redistribution;
- ISO/Admin-0 identifiers suitable for deterministic normalization;
- companion physical-water themes, from which Atlas retains ocean and major lakes;
- documented de-facto/de-jure and point-of-view behavior;
- source files suitable for a reproducible offline application build.

The app does **not** add a runtime GIS/slippy-map dependency. D3 Geo and TopoJSON packages are dev-only generation dependencies; the browser receives local SVG path data.

## UN Maps / UN Geospatial role

Official source: https://maps.un.org/

UN products are used to review national-boundary authority/currentness, dispute treatment, and boundary/disclaimer practice. UN generalized geodata is useful as an authoritative comparison source; UN Clear Map is tied to UN publication/clearance practices.

For Atlas, UN material is therefore a **policy/audit reference**, not a silently substituted runtime geometry dependency. Any future decision to redistribute or directly build from a UN product requires a separate review of the applicable download, licensing, clearance, attribution/disclaimer, and offline-use terms.

## Africa scored-country and dispute policy

The curriculum scores the application's canonical **54 Africa ISO3 countries**. Dataset point of view never creates or removes scoring identities silently.

Current explicit handling:

- Natural Earth's default Admin-0 presentation is de-facto; using it as source geometry is not an endorsement by Atlas.
- **Somaliland is not a separate scoring target.** Natural Earth's Somaliland feature is dissolved into canonical `SOM` before the scoring topology is generated.
- **Western Sahara remains non-scoring context** and is not silently merged into `MAR`.
- **Bir Tawil remains non-scoring context** and is not silently assigned to either `EGY` or `SDN`.
- Any other unresolved Africa source feature causes generation to fail for policy review rather than being guessed into a neighboring country.

Global rollout must repeat this review for disputed/special territories instead of generalizing the Africa exceptions by analogy.

## Topology and projection

### Political geometry

The generator normalizes the scored/context political areas first, including the explicit Somalia/Somaliland operation. It then builds topology so a shared edge is represented once.

Projection:

- `d3.geoNaturalEarth1`
- deterministic Africa canvas: `835 × 723`
- fit padding: `22` projected units
- intermediate generated path precision: `2` decimal digits

Topology simplification:

- projected topology quantization: `100000`
- `topojson-simplify` presimplification using planar triangle-area weights
- simplification quantile: `0.72`
- measured political/context coordinates: **56,682 before → 40,775 after**

The exact calculated simplification threshold is recorded in generated provenance.

### Runtime path optimization

The first production source build was too heavy for the PWA contract: the lazy Africa module was about 1.68 MB raw, with the unsimplified 1:10m physical context—especially ocean geometry—the main cost.

A deterministic second stage now:

- rounds final political/context/shared-border/coastline path coordinates to **0.1 projected canvas unit** without independently re-simplifying neighboring country topology;
- applies projection-space Ramer-Douglas-Peucker only to **non-interactive retained physical context**:
  - ocean: `0.4` canvas unit;
  - lakes: `0.15`;
- emits final runtime path precision of **1 decimal digit**.

The committed generated TypeScript source is **918,944 bytes**. Standard CI run #84 built `dist/data/maps/africa.js` at **920,449 bytes raw / 243,286 bytes gzip**, within the `<1 MB raw` / `<300 KB gzip` production budget.

### Why the pinned boundary-line theme is not the rendered shared-border mesh

Natural Earth's Admin-0 Boundary Lines are pinned/evaluated because they carry useful political/dispute context. The ordinary shared border painted by the app is derived from the **same simplified topology as the country fills**.

That guarantees fill edges and visible boundary strokes share geometry. Rendering an independently simplified boundary-line theme could reintroduce the overlap/gap problem Issue #9 is intended to remove.

The renderer therefore paints:

1. source-derived ocean/background;
2. country/context fills;
3. selected inland lakes/reservoirs;
4. one topology-derived shared political-border mesh;
5. one topology-derived exterior coastline mesh.

Neutral country polygons are not independently stroked. Water and boundary layers are non-interactive and cannot intercept country hit testing.

## Derived reusable outputs

The Africa generated module emits:

- all 54 canonical country geometries;
- non-scoring context geometry;
- shared political-border mesh;
- coastline mesh;
- source-derived ocean/lake paths;
- regional first-view focus boxes;
- land-border adjacency graph;
- island locator metadata;
- the two approved mainland callouts.

The same normalized topology is intentionally reusable for:

- **Issue #2 country silhouettes:** emit a normalized canonical country geometry without another geography source;
- **Issue #3 neighboring-country game:** consume the topology-neighbor graph rather than maintaining manual adjacency.
- **Home continent marks:** `npm run icons:continents:generate` produces six simplified, outline-only navigation SVG paths from the pinned countries source without creating a second runtime cartography dependency.

## Water-context policy

Physical context exists for geographic recognition, not decoration.

Atlas deliberately excludes linear rivers from runtime maps because they can be confused with political borders. Ocean and major lakes/reservoirs remain because their filled water areas provide orientation without creating competing border-like linework.

Required lakes/reservoirs in regression coverage:

- Lake Victoria
- Lake Tanganyika
- Lake Malawi / Nyasa source naming
- Lake Chad

The generated Africa asset currently retains nine selected lakes/reservoirs when present/useful at this scale, including additional features such as Turkana, Albert, Kivu, Tana, and Nasser.

Linear river features are intentionally excluded from runtime cartography. At Atlas phone scale, river centre-lines can read like political borders and therefore compete with the boundary-recognition task. This is a product-level clarity decision rather than a data-source limitation.

Ocean and retained lakes use the **same projection/canvas** as political geography. They are `aria-hidden` cartographic context and `pointer-events: none`.

## Small-country interaction contract

Issue #9 preserves the proven gameplay policy rather than deriving tap behavior mechanically from polygon area.

- Mainland leader-line callouts remain exceptional.
- Current Africa mainland callouts: **The Gambia (`GMB`) and Togo (`TGO`) only**.
- Island scoring targets **Cabo Verde, São Tomé and Príncipe, Comoros, Mauritius, and Seychelles** use one visible locator/dot with a larger invisible touch surface.
- Island targets do not render a redundant dot plus leader-line callout.
- Zoom-time hit normalization keeps invisible locator/callout touch surfaces approximately 44 CSS px across while visible geography remains unchanged.

Do not add new callouts solely because a polygon is small. Actual phone play is the decision criterion.

## Viewport contract

The production map uses native SVG `viewBox` handling rather than a runtime pan/zoom library.

- minimum view fits the complete parent continent including island locators;
- region rounds initially use generated regional focus bounds;
- users can always fit Africa again and can restore the regional frame;
- max map zoom is 5.5×;
- Pointer Events provide drag/pinch behavior;
- wheel/trackpad zoom is supported;
- Ctrl/Meta-modified wheel is left to browser/page zoom behavior;
- viewport state is stored by map session and restored across answer-feedback rerenders;
- pan/zoom controls occupy a dedicated toolbar row outside scoring geography.

The toolbar placement is intentional: an earlier overlay design was rejected because it could cover Madagascar/Mauritius-area targets.

## Runtime loading and PWA behavior

`src/data/maps/index.ts` dynamically imports `./africa.js` when an Africa map scope first opens. Flag-learning startup therefore does not eagerly ship the production continent geometry.

The service worker caches same-origin dynamic modules after first fetch:

- initial shell stays light;
- a previously opened continent can be revisited offline;
- first-ever offline use of a continent that has never been fetched is not guaranteed.

That limitation is intentional under the current lazy-loading architecture.

## Reproduction

Normal regeneration against the pinned source hashes:

```sh
npm install
npm run maps:generate
npm test
```

After an intentional, reviewed upstream source/version change, initialize/update hashes with:

```sh
npm run maps:generate -- --update-hashes
npm test
```

The `maps:generate` wrapper forwards source-control flags to the geodata generator before running deterministic runtime optimization. An automated regression protects that ordering/flag-forwarding contract. `--update-hashes` must never be used merely to suppress an unexplained upstream change.

## Verification and release criteria

Automated Issue #9 verification covers:

- exact 54-country ID reconciliation;
- source commit/theme versions and SHA-256 provenance;
- topology simplification and representative symmetric adjacency;
- separate shared-border/coastline meshes;
- required ocean/lake context and explicit river exclusion;
- Western Sahara/Bir Tawil context and canonical Somalia handling;
- GMB/TGO-only mainland-callout policy;
- five locator-only island targets;
- regional focus plus full-Africa-fit controls;
- viewport persistence, max zoom, pointer gestures, and browser zoom-modifier preservation;
- non-interactive water/boundary CSS;
- continent-lazy loading and PWA shell compatibility;
- generation-entrypoint source-flag forwarding;
- Africa runtime budget `< 1 MB raw` and `< 300 KB gzip`.

Artifact visual QA additionally checks portrait and short-landscape full-continent/regional renders for extent, seam quality, retained water restraint, border clarity, islands/callouts, and unobstructed geography.

Before merge recommendation the branch must still be compared/integrated with the then-current `main`, the complete standard CI path rerun, and the exact final CI artifact inspected. Static/browser-emulated or raster artifact review is **not** claimed as physical iPhone/Android device testing.
