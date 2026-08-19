# Map geometry sources and fidelity

**Status:** Africa MVP geometry accepted; production-fidelity upgrade backlog  
**Reviewed:** 2026-08-19  
**Tracking:** issue #1

## Current MVP

Africa location learning currently uses one shared coarse Natural Earth Admin-0-derived geometry catalog covering all 54 application countries. It extends the original West Africa pilot projection across North, Central, East, and Southern Africa so regional drills and the all-Africa round use the same cartographic frame.

Five island countries that disappear or become impractical at the coarse source scale are represented by explicit point locators: Cabo Verde, São Tomé and Príncipe, Comoros, Mauritius, and Seychelles. Western Sahara is retained as non-scoring contextual geography rather than being silently removed from the continental silhouette.

This geometry is adequate for validating the learning loop, continent context, panning, scoring, small-country treatment, regional navigation, and mobile interaction model. It is **not the final geometry standard**.

Known MVP limitations:

- coarse simplification can visibly distort narrow countries and coastlines;
- independently rendered neighboring polygons can expose tiny overlaps/gaps or doubled-looking seams at shared borders;
- very small island nations can disappear from coarse country polygon sets and require explicit locators;
- political/disputed-boundary presentation needs a deliberate product policy rather than an accidental dataset default.

The UI may reduce seam visibility, but styling must not be treated as a substitute for better topology.

## Recommended production upgrade

### Near-term default: Natural Earth 1:10m Admin-0

Use the current **Natural Earth 1:10m Admin-0 Countries** data as the practical high-detail global source for the next geometry pipeline. Natural Earth publishes 1:10m, 1:50m, and 1:110m cultural vectors; its current Admin-0 Countries 1:10m release is version 5.1.1.

Why it is a strong product fit:

- global coverage from one consistent dataset;
- public-domain cartographic data;
- materially more detail than the MVP geometry;
- ISO-coded country attributes;
- companion Admin-0 boundary-line data;
- explicit documentation of de facto/de jure and point-of-view variants.

Official source:
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/

### Authoritative-source evaluation: UN Maps

UN Maps describes its boundary layer as authoritative and up to date. Before a final global rollout, evaluate whether its boundary products can be used directly within Flag Atlas's licensing, download, offline, and build-pipeline requirements.

Official source:
https://maps.un.org/

This is an evaluation item, not a current dependency.

## Geometry pipeline rules

The production pipeline should make shared borders a **topology problem**, not a CSS problem.

1. Source active countries and surrounding continent context from the **same dataset/release**.
2. Preserve shared edges through the generation step where possible (for example, a topology-aware intermediate representation) rather than independently simplifying each country.
3. Project once, then derive:
   - country fill polygons;
   - shared boundary lines;
   - continent context;
   - locator/callout metadata.
4. Render fills and boundary lines as separate conceptual layers so a border is not visually doubled merely because two countries share it.
5. Reconcile every scored feature to the canonical ISO3 catalog.
6. Keep explicit treatment for islands/narrow states even when the production source contains their polygons; physical tap size and cartographic size are different concerns.
7. Document disputed-boundary / point-of-view policy before global rollout.

## Acceptance criteria for the high-fidelity upgrade

- no visually obvious polygon overlap/gap along shared borders at normal phone scale or a reasonable zoom level;
- narrow-state shapes remain recognizable without falsifying country area;
- major islands are retained at the chosen map scale;
- active-region and faded-context boundaries align exactly because they come from the same topology;
- all enabled countries map to the intended ISO3 IDs;
- generated assets remain small enough for lazy loading and offline PWA use;
- border-policy decisions are documented for disputed territories;
- representative Pixel/iPhone portrait and landscape screenshots are visually reviewed before release.

## Decision for the current Africa release

Do **not** block the Africa MVP on replacing the entire geometry pipeline now. The interaction model has reached the point where broader real-device play is more valuable than manually polishing coarse SVG borders.

Keep the current shared Africa geometry explicitly labeled MVP-grade, fix material gameplay defects and obvious seam rendering problems, and replace it later through one dedicated topology-aware data-pipeline change rather than accumulating manual per-border SVG edits.

Before expanding map learning beyond Africa, revisit this decision: the higher-fidelity geometry pipeline should be treated as a release-quality gate, not indefinitely deferred polish.
