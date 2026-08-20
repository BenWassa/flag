# Africa map expansion — implementation status

**Date:** 2026-08-19  
**Branch:** `agent/africa-map-expansion`  
**Tracking:** issue #1

## Implemented

- Expanded location learning from West Africa to **all 54 catalogued African countries**.
- Added map scopes for:
  - Africa;
  - North Africa;
  - West Africa;
  - Central Africa;
  - East Africa;
  - Southern Africa.
- All regional rounds use the same full-Africa canvas, with the selected region active and the other African countries rendered as context.
- Increased contextual geography contrast by removing the previous blanket 28% opacity and using a readable subordinate tone/border instead.
- Simplified small-country treatment:
  - visible mainland callouts only for **The Gambia** and **Togo**;
  - **Cabo Verde, São Tomé and Príncipe, Comoros, Mauritius, and Seychelles** use one visible island dot plus an enlarged invisible touch surface;
  - Guinea-Bissau, Sierra Leone, and Benin use their true polygon without an extra callout or hidden assist.
- Preserved the existing green-first-try / amber / orange / red feedback contract and inert resolved-country behavior.
- Widened the shared Africa canvas to include Mauritius and Seychelles.
- Preserved the existing location-progress storage key/version while adding default records for the newly enabled African countries, so existing West Africa progress is retained.
- Promoted the home entry from `West Africa · Pilot` to **Africa · 54 countries · 5 regions**.
- Added scoped map-home navigation, regional progress views, same-scope result/review/repeat routing, and all-Africa play.
- Bumped the PWA cache to `flag-atlas-v7` so deployed mobile clients receive the contrast and interaction changes.
- Removed the superseded standalone `west-africa.ts`; `africa.ts` is now the single canonical Africa geometry source.

## Geometry disposition

This expansion deliberately reuses the existing MVP geometry style rather than blocking on the later high-fidelity topology project. The existing pilot projection was reconstructed so new African regions match West Africa visually.

A static rendering of the exact compiled shared geometry was reviewed after CI: the continental silhouette is coherent, the five island locators are on-canvas, and the region/context geometry aligns with the intended MVP presentation.

The production-quality Natural Earth 1:10m / topology-aware geometry upgrade remains required before treating the cartography as final and should be revisited before expanding map learning beyond Africa.

## Verification contract

Automated coverage checks:

- exact 54-country Africa coverage;
- five-region partition and regional active/context coverage;
- shared Africa canvas and per-scope initial focus;
- island dot behavior with no leader-line duplication;
- exact mainland callout set (`GMB`, `TGO`);
- stronger context CSS;
- existing Learn/Test feedback integrity;
- solved-country inertness;
- scoped map home/results behavior;
- all-Africa cross-region session construction;
- `flag-atlas-v7` cache refresh.

## CI / artifact gate

First expansion CI #44 failed because an island test searched the **entire West Africa SVG** for any callout line and therefore saw The Gambia/Togo's valid callouts while checking Cabo Verde. The product implementation was correct; the assertion was narrowed to Cabo Verde's own SVG group and the failure is documented in `AFRICA_EXPANSION_LOG.md`.

After correction:

- **CI #47:** success.
- Dead standalone West Africa geometry was then removed and the cleanup head was verified again.
- **CI #49 (`32267850529`): success.**
- Exact CI artifact `flag-atlas-dist`:
  - artifact ID `9370926802`;
  - size `56,207` bytes;
  - digest `sha256:8063266428204583f679bde2000effae75bc51b27fc710f35e14974cf79014c4`.

Final artifact inspection confirmed:

- shared `data/maps/africa.js` is present;
- superseded `data/maps/west-africa.js` is absent;
- `Africa · 54 countries · 5 regions` UI copy is compiled;
- structured context islands and island locator-hit targets are compiled;
- `flag-atlas-v7` is the deployed cache version.
