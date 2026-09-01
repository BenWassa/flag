# Issue #137 — Asia Locations hardening

## Post-Spatial reconciliation

The retained pre-Spatial `issue-137-asia-location-hardening` branch was reviewed commit-by-commit as evidence only. Its globe/touch implementation was discarded because Issue #166 already owns Spatial pointer handling, LOD-derived interaction envelopes and tiny-country picking. This implementation was rebuilt from production `main` `459354feeb88fbec010e339efe3dacd9c37749b9`.

## Accepted architecture

- Asia projected Locations owns an evidence-based `8x` zoom ceiling through generic continent metadata; Russia remains rendered context and remains excluded only from Asia fit per #116.
- The question-triggered Eastern Mediterranean inset is removed. Lebanon, Israel and Palestine remain at canonical geography.
- Projected invisible hit assistance is shared generator/runtime machinery. Final Asia inventory: `BHR`, `BRN`, `ISR`, `KWT`, `LBN`, `MDV`, `PSE`, `QAT`, `SGP`. Restrained persistent perceptual markers exist only for `BHR`, `BRN`, `MDV`, `SGP`; they are not hit surfaces.
- Real scoring polygons paint above all assistance, preserving #117 precedence. Newly rendered hit circles are re-normalised to the shared approximately 44 CSS px contract without resetting pan/zoom state.
- Previously answered countries remain selectable against later prompts in Learn and Play. Once the current target resolves, all answer input remains locked during feedback/advance exactly as before.
- Canonical `CYP` is source-reconciled from pinned Natural Earth `CYP` + Northern Cyprus + Cyprus No Mans Area before projected or spherical simplification. Akrotiri and Dhekelia remain British non-scoring context. No handwritten geometry or second source exists.

## Verification

Acceptance evidence is recorded in Issue #137 and PR #173. The technical gate includes deterministic map/globe regeneration, `npm run check`, full `npm test`, focused exact-production browser acceptance at 320x568, 390x844, 844x390, tablet portrait and desktop, shared map regressions for North America/Oceania, and Spatial regressions because canonical globe geography changes. No physical-device testing is claimed; physical mobile validation remains #71.
