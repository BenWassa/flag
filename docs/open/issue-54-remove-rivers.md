# Issue #54 — Remove rivers from Atlas maps

**Status:** implemented on branch; final PR CI/artifact closeout pending  
**Tracking:** GitHub Issue #54 / PR #55

## Decision

Atlas runtime maps intentionally exclude river centre-lines. At phone scale the thin linear river treatment competes with topology-derived political borders and can be read as a country boundary.

Retained physical context:

- source-derived ocean;
- selected major lakes/reservoirs.

Political geography remains unchanged: canonical country geometry, topology-derived shared borders/coastline, land adjacency, disputed-territory policy, island locators and mainland callouts all continue to use the existing Natural Earth 1:10m pipeline.

## Implementation contract

The change is made at the shared cartography-data boundary, not by hiding a CSS layer. The active Natural Earth manifest, `MapWaterLayers`, map generator, runtime optimiser, generated Africa asset, map-asset adapter, launcher/Locations/Neighbours renderers, shared palette, forced-colours rules, verification and durable cartography documentation all agree that rivers are absent.

`src/data/maps/africa.ts` and `docs/architecture/cartography-provenance.json` remain generated outputs and were regenerated through `npm run maps:generate` rather than hand-edited.

The shell cache advances to `flag-atlas-v18` because shared shell-cached cartography CSS changed. The lazy continent-module loading contract is unchanged.

## Verification evidence

A Node 22.23.2 regeneration/verification run completed successfully on the implemented tree:

- `npm run check` — passed;
- full `npm test` — passed;
- generated political/context topology remained 40,775 / 56,682 coordinates after simplification;
- Africa retained 54 canonical country geometries and the existing topology-derived adjacency/boundary contracts;
- runtime physical context retained nine selected lakes/reservoirs and no rivers;
- `dist/data/maps/africa.js` measured 921,370 bytes raw / 243,737 bytes gzip, within the existing budget;
- production inspection found no `map-water--rivers`, `launcher-map-water--rivers`, or `runtime-major-rivers` markers;
- built `sw.js` contained the v18 cache version.

Before merge, final PR CI must still be green on the exact final commit and its uploaded production artifact must be inspected. Issue #20 should be reconciled only after #54 lands on `main`, so its closeout no longer asks reviewers to inspect river contrast.

No physical-device, iOS Safari, Android Chromium or Windows High Contrast testing is claimed.
