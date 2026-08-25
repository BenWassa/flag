# Issue #86: Clip continent context layers to the viewport

**Status:** Scoped  
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

- [ ] Ocean, coastline and shared-boundary context is clipped to the generated
      continent viewport by the shared generator.
- [ ] All four production continent modules are regenerated through the
      documented workflow.
- [ ] Country geometry, IDs, curriculum membership and adjacency are unchanged.
- [ ] Europe and Asia no longer ship substantial context that cannot appear in
      their runtime viewBox.
- [ ] Africa and South America are byte-stable, or measured changes are
      explained and accepted as consequences of the shared method.
- [ ] Before/after raw and gzip sizes are recorded and verifier budgets tightened.
- [ ] Continent and region maps have no coastline gaps, ocean seams, missing
      borders or clipping artefacts.
- [ ] Lazy loading and the runtime asset contract remain intact.
- [ ] `npm run check` and `npm test` pass under Node 22.
- [ ] The exact production artifact is inspected before merge.

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

