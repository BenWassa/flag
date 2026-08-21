# Issue #43 — Replace the app icon with a source-derived Atlas globe mark

GitHub: https://github.com/BenWassa/flag/issues/43

## Status

Implemented on `brand/issue-43-atlas-globe`.

## Architecture

- `scripts/lib/pinned-natural-earth.mjs` — reads the source manifest, fetches one pinned source and refuses to return it unless the SHA-256 matches. `generate-continent-icons.mjs` now uses it too, so there is one copy of the fetch/hash logic rather than one per icon generator.
- `scripts/lib/atlas-globe.mjs` — pure globe geometry. Builds borderless land, projects it, and thins it. It takes rotation as input and touches no files, so a future splash generator can reproject the same source at many rotations and get geographically valid frames rather than spinning a flat disc.
- `scripts/generate-brand-icons.mjs` — owns the locked `ATLAS_GLOBE` config and writes every asset. Run with `npm run icons:brand:generate`.

The gameplay map pipeline is untouched: no brand-only source was added to the manifest, and borderless land is derived from the existing `countries` entry by merging polygons, so political boundaries dissolve while the coastline stays source-derived.

## A correctness finding worth recording

`topojson-simplify`'s `quantile(topology, p)` returns the weight that retains fraction `p` of source points — so a **smaller** `p` simplifies more, and `p = 1.0` is a no-op.

The existing comment in `generate-continent-icons.mjs` read this backwards ("retain the highest-weight 0.5% of topology points" for `0.995`). Measured against the real source: `p = 0.995` retains 99.5% of 480,217 points. Continent-icon simplification was therefore effectively inert; their smallness comes from the projected-space decimation, not the topology pass. The comment is corrected and the constant renamed to `RETAINED_POINT_FRACTION`. The generated continent icons are byte-identical, so no visual change ships with that fix.

The globe uses `0.05` — genuinely coarse — plus screen-space thinning, because level of detail for an icon belongs in the unit the reader actually sees.

## Projection

`geoOrthographic` at a **fixed** radius (74% of a 1024 canvas), never `fitExtent`, so the disc is the same size at every rotation — the property a rotating splash depends on.

Centre selected by generating A (15, 10), B (15, 15) and C (20, 12) from identical settings and comparing each at 1024, 512, 192, 64, 32 and 24 px against an unsimplified projection of the same source:

- **A (15°E, 10°N) — selected.** Africa centred with margin from the limb; Madagascar, the Horn, the Gulf of Guinea, the Mediterranean, Iberia/Italy and Arabia all clearly retained.
- B (15, 15) pushed Africa low and brought Southern Africa close to the limb.
- C (20, 12) shifted Africa left and brought the west coast close to the limb.

## One judgement call for review

The globe shows a thin white arc at the bottom: the far limb of **Antarctica**, which is genuinely visible from 10°N. At large sizes it can read as a scratch.

It is kept. Removing it would mean deleting a real continent to tidy the logo, which is the kind of geographic distortion the issue guards against, and it is invisible at 24–32 px. Ring areas are Madagascar 1546, Antarctica 723, Great Britain 985 — so if the call goes the other way, raising `minimumRingArea` from 8 to ~800 drops Antarctica while keeping both. That is a one-line config change, not path surgery.

## Assets

| File | Purpose |
| --- | --- |
| `atlas-globe.svg` | canonical transparent mark, land only, for brand and future splash use |
| `app-icon.svg` | regular icon: graphite squircle field, white globe |
| `app-icon-maskable.svg` | full-bleed source for the maskable raster |
| `app-icon-192/512/1024.png` | regular rasters |
| `app-icon-maskable-512.png` | maskable, opaque full-bleed `#101318` |
| `apple-touch-icon.png` | 180×180, opaque |

Regular and maskable are separate assets with separate manifest purposes; nothing claims `"any maskable"`. The globe occupies 74% of the canvas, inside the 80% maskable minimum safe circle, verified numerically and previewed under circle and squircle masks.

Regeneration from the same source and config produces byte-identical output.

## Verification

`scripts/verify-icons.mjs` gained the brand contract: canonical viewBox, recorded pinned-source provenance, no text/image/filter/gradient/external-href/embedded-raster, no boundary strokes, graphite-and-white only, transparent canonical mark, squircle-vs-full-bleed split, regular ≠ maskable, real coastline geometry, fixed-radius containment (land reaches the limb but never escapes it), safe-zone containment, PNG dimensions, separate manifest purposes, manifest targets exist, Apple touch link, and service-worker shell coverage.

CI stays offline: it validates the committed outputs and their provenance, and never fetches Natural Earth. Generation is the explicit pre-merge step.

Service-worker cache advanced to `flag-atlas-v22` and the new shell icons are cached.

Rendered inspection was performed at 1024, 512, 192, 64, 32 and 24 px and under circle/squircle maskable previews in headless Chromium. No installed-PWA or physical iOS/Android inspection was performed and none is claimed.
