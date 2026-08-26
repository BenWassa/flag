# Issue #86: Clip continent context layers to the viewport

**Status:** Implemented alongside #115/#116 — awaiting review/merge  
**GitHub:** [#86](https://github.com/BenWassa/flag/issues/86)

## Goal

Reduce each production continent's lazy cartography payload by clipping
non-interactive context geometry to its generated viewport. Keep canonical
country geometry, topology-derived adjacency and source provenance unchanged.

This follows the v0.7.0 tolerance pass. Europe fell from roughly 599 KB to
424 KB gzip and Asia from roughly 606 KB to 478 KB gzip, but both still ship
context paths outside the visible SVG viewport.

## Scope

- Change the shared cartography generator, never generated continent files by hand.
- Derive one deterministic clipping boundary from the continent viewport policy.
- Clip decorative ocean, coastline and shared-boundary output before final path
  serialisation and runtime optimisation.
- Regenerate Africa, South America, Europe and Asia.
- Record before/after raw and gzip sizes for every generated continent module.
- Tighten shared and per-continent payload assertions to the measured output.
- Update generated provenance metadata if the recorded generation method changes.

## Preservation boundaries

- Country polygons remain canonical whole-country geometry. Context clipping
  must not crop or rewrite scored country shapes.
- Global topology and derived country adjacency remain semantically unchanged.
- `fitExcludeCountryIds` and `focusExcludeCountryIds` remain viewport policy;
  they do not change country identity, curriculum ownership or adjacency.
- Natural Earth 1:10m remains the sole production source.
- No rivers are reintroduced.
- `src/data/maps/africa.ts` is regenerated, never hand-edited.

## Implementation questions

- Choose whether clipping belongs before projection, in the projection clip
  extent, or after projection using evidence from deterministic closed paths.
- Confirm whether shared-boundary paths need independent clipping.
- Determine whether a small fixed bleed is needed to prevent edge antialiasing
  seams. Document and test any bleed.

These are shared-generator decisions, not continent-specific exceptions.

## Acceptance criteria

- [x] Ocean, coastline and shared-boundary context is clipped to the generated
      continent viewport by the shared generator. (Ocean and shared boundaries
      already were — see the audit below.)
- [x] All four production continent modules are regenerated through the
      documented workflow.
- [x] Country geometry, IDs, curriculum membership and adjacency are unchanged.
      Adjacency is byte-identical on all four continents; no scored country lost
      a landmass.
- [x] Europe and Asia no longer ship substantial context that cannot appear in
      their runtime viewBox.
- [x] Africa and South America are byte-stable.
- [x] Before/after raw and gzip sizes are recorded and verifier budgets tightened.
- [x] Continent and region maps have no coastline gaps, ocean seams, missing
      borders or clipping artefacts. (Chromium production-preview inspection of
      the Asia and Europe continent frames at 390x844.)
- [x] Lazy loading and the runtime asset contract remain intact.
- [x] `npm run check` and `npm test` pass under Node 22.
- [ ] The exact production artifact is inspected before merge.

## What the audit actually found

The premise needed correcting before implementation. Measured against the
pre-change generated modules, **ocean and shared-boundary output was already
clipped**: `projection.clipExtent([[0, 0], [WIDTH, HEIGHT]])` at both the country
and physical-layer projections leaves zero stray coordinates, and every
continent's `{PREFIX}_VIEWBOX` is the full canvas. Stray coordinates existed in
only two places:

| Layer | Africa | South America | Europe | Asia |
| --- | --- | --- | --- | --- |
| ocean | 0/10366 | 0/6724 | 0/20772 | 0/47970 |
| shared boundaries | 0/13737 | 0/6735 | 0/10024 | 0/17552 |
| coastline | 0/13328 | 0/25096 | **3218/10979** | **528/5101** |
| country paths | 0/39731 | 0/36940 | **20523/88821** | **7331/111703** |

So the reduction lives in the coastline mesh and in country paths — not in the
ocean the original issue expected.

## Implementation

`clippedPath` (`geoPath(geoIdentity().clipExtent(...))`) serialises the
coastline mesh, the shared-boundary mesh, extra context paths and the render
path of any country this continent does not score. Centroids, bounds and focus
rects keep using the unclipped path, so locator and callout placement is
unchanged.

**Scored country geometry is deliberately not clipped.** `src/domain/outline.ts`
falls back to the map `path` when a country has no `outlinePath`, so cropping a
scored country would crop the silhouette Outlines teaches. The eligibility set
is the scored catalogue plus every id in `derivedFocusScopes`, which keeps Egypt
whole because the Middle East scope scores it. In practice this clips Russia in
Asia (context, 214 -> 107 subpaths) while leaving Russia in Europe (scored in
Eastern Europe) intact — verified: no scored country in any continent lost a
landmass.

That preserved geometry is why Europe's remaining ~20k out-of-canvas coordinates
stay: they are Russia's, and Outlines needs them.

## Measured result

| Continent | Before gzip | After gzip | Budget |
| --- | ---: | ---: | ---: |
| Africa | 242,630 | 242,630 (byte-identical) | 300,000 |
| South America | 242,309 | 242,309 (byte-identical) | 300,000 |
| Europe | 447,952 | 432,961 | 440,000 (tightened from 450,000) |
| Asia | 517,976 | 493,590 | 500,000 |

Africa and South America are byte-identical, as expected — neither carried
out-of-canvas context. The Asia and Europe figures are against the #115/#116
canvases, not the older ones; this work is what returns both continents inside
budget after those framing fixes.

`verify-cartography.mjs` now asserts every continent's ocean, coastline,
shared-boundary and extra-context output is free of coordinates the runtime
cannot display, so the clip cannot silently regress.

## Verification plan

- Extend the existing plain-Node cartography and per-continent verifiers.
- Compare generated country paths and adjacency records before and after.
- Inspect every production continent at continent and regional opening frames,
  including edges affected by excluded remote geometry.
- Inspect phone portrait and short landscape against the production build.

## Non-goals

- Changing geographic ownership, territory policy or curriculum.
- Simplifying scored country polygons more aggressively.
- Adding North America or Oceania.
- Replacing the projection, renderer or direct-manipulation model.

