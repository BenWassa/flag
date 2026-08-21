# Issue #54 — Remove rivers from Atlas maps

**Status:** implementation branch in progress  
**Tracking:** GitHub Issue #54

## Decision

Atlas runtime maps intentionally exclude river centre-lines. At phone scale the thin linear river treatment competes with topology-derived political borders and can be read as a country boundary.

Retained physical context:

- source-derived ocean;
- selected major lakes/reservoirs.

Political geography remains unchanged: canonical country geometry, topology-derived shared borders/coastline, land adjacency, disputed-territory policy, island locators and mainland callouts all continue to use the existing Natural Earth 1:10m pipeline.

## Implementation contract

The change is made at the shared cartography-data boundary, not by hiding a CSS layer. The active Natural Earth manifest, `MapWaterLayers`, map generator, runtime optimiser, generated Africa asset, launcher/Locations/Neighbours renderers, shared palette, forced-colours rules, verification and durable cartography documentation must all agree that rivers are absent.

`src/data/maps/africa.ts` and `docs/architecture/cartography-provenance.json` remain generated outputs and must be regenerated with `npm run maps:generate` rather than hand-edited.

## Verification

Before merge:

1. sync current `main`;
2. run `npm run check` and full `npm test` under Node 22;
3. confirm generated/runtime assets contain no river source, paths or river-layer markup;
4. confirm topology-derived borders, coastlines and adjacency remain intact;
5. inspect the exact production `dist` artifact;
6. verify service-worker cache invalidation for changed shell CSS;
7. confirm final CI is green.

Manual phone/browser/device claims must only be recorded if actually performed.
