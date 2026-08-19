# Africa map expansion — implementation status

**Date:** 2026-08-19  
**Branch:** `agent/africa-map-expansion`  
**Tracking:** issue #1

## Implemented before CI

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

## Geometry disposition

This expansion deliberately reuses the existing MVP geometry style rather than blocking on the later high-fidelity topology project. The existing pilot projection was reconstructed so new African regions match West Africa visually.

The production-quality Natural Earth 1:10m / topology-aware geometry upgrade remains required before treating the cartography as final.

## CI gate

The expanded verification contract checks:

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

CI result will be appended after the first complete branch run.
