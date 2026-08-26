# Issue #119 — Geometry / LOD feasibility experiment

**Status:** support-tier evidence; does not choose the production spherical asset architecture  
**Branch:** `explore/spatial-atlas-moonshot`  
**Production baseline:** `main` at `046bd935d9be08f4ab561b8f060c66da5b3cecad`

## Purpose

Resolve one objective question before a frontier-model architecture session:

> Is Atlas's canonical country geometry inherently too large for a lightweight persistent world/continent spatial interface, or is a dedicated low-detail representation plausibly small enough for a mobile PWA?

This experiment deliberately does **not** answer how the spherical data should ultimately be encoded, triangulated or rendered. That remains part of the principal architecture decision.

## Inputs

The experiment uses the exact generated country paths from the tested/deployed production artifact corresponding to current `main`.

Canonical source truth remains unchanged:

- Natural Earth 1:10m country polygons;
- upstream commit `ca96624a56bd078437bca8184e78163e5039ad19`;
- canonical Atlas ISO3 reconciliation and geopolitical policy;
- no handwritten country geometry.

The current generator's recorded topology counts are:

| Continent | Scored countries | Coordinates before current topology simplification | After current topology simplification |
| --- | ---: | ---: | ---: |
| Africa | 54 | 56,682 | 40,775 |
| South America | 12 | 52,353 | 38,209 |
| Europe | 44 | 125,770 | 90,578 |
| Asia | 48 | 157,545 | 114,766 |
| **Total** | **158** | **392,350** | **284,328** |

The exact deployed lazy geography chunks are currently approximately:

| Chunk | Raw JS | gzip |
| --- | ---: | ---: |
| Africa | 915,705 B | 241,683 B |
| South America | 883,434 B | 241,443 B |
| Europe | 1,506,355 B | 432,021 B |
| Asia | 2,024,655 B | 493,043 B |

Those production chunks include substantially more than the country polygon strings: physical context, focus metadata, adjacency, insets/callouts and module overhead. They are therefore not sensible world-LOD payload targets.

## Method

A disposable analysis parsed only the canonical generated country `path` strings from the deployed artifact and applied Ramer-Douglas-Peucker simplification at several projection-space tolerances.

The same calculation is now reproducible from the repository with:

```bash
node scripts/experiments/spatial-lod-envelope.mjs
```

Important limitation:

- this operates on the already projected runtime paths;
- it is a **payload and shape-complexity envelope**, not the proposed spherical pipeline;
- a real implementation must simplify shared topology / geographic coordinates upstream so common borders do not develop seams;
- a real spherical representation may have different encoding/triangulation overhead.

## Measured payload envelope

Across all four currently shipped continents' country paths:

| RDP tolerance (835-unit canvas) | Coordinates | Raw compact JSON | gzip | Approx. max deviation at 390 px continent width |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 269,736 | 3,112,213 B | 840,240 B | 0 px |
| 0.25 | 57,047 | 661,740 B | 227,253 B | 0.12 px |
| 0.5 | 32,313 | 376,282 B | 135,294 B | 0.23 px |
| 1.0 | 18,985 | 222,469 B | 82,014 B | 0.47 px |
| 2.0 | 12,182 | 144,029 B | 53,459 B | 0.93 px |
| 4.0 | 8,946 | 106,665 B | 39,228 B | 1.87 px |

The CSS-pixel conversion is deliberately conservative: `390 / 835 ≈ 0.467` CSS px per current continent-canvas unit when the entire continent canvas occupies the full phone width. At world scale the same geographic detail is visually smaller still.

### What this proves

A low-detail global selection representation does **not** need anything close to the present multi-hundred-kilobyte-per-continent production map payloads.

Even without designing a purpose-built spherical encoding, the currently shipped four-continent country geometry has a plausible country-only envelope around:

- ~82 KB gzip at ≤0.47 CSS px equivalent deviation;
- ~53 KB gzip at ≤0.93 CSS px equivalent deviation.

North America and Oceania are not yet production map assets, so this experiment deliberately does not fabricate a 195-country final number. The measured result is sufficient to reject the assumption that canonical 1:10m provenance inherently makes the world view too heavy.

## Critical small-country finding

Uniform simplification cannot be the entire LOD policy.

Approximate projected-area comparisons show that tiny states are disproportionately damaged even at otherwise conservative tolerances. At tolerance 1.0, examples include Monaco, Liechtenstein, San Marino and Andorra; Palestine and some small Asian states also change materially. At tolerance 2.0 the problem expands.

This is expected and useful evidence, not a blocker.

The production cartography already has the concept Atlas needs: **precision-sensitive exceptions and alternative honest interaction surfaces for tiny countries**.

The likely architectural implication to present to the principal model is:

1. **World LOD** is primarily for continent recognition/selection; it does not need every microstate to remain a truthful tappable target.
2. **Continent LOD** can preserve a precision-sensitive subset or swap to a more detailed level before region/country interaction matters.
3. Visual geometry and picking geometry need not be identical. Tiny targets can retain canonical geometry / explicit locators without forcing the entire world mesh to remain high-detail.
4. The final generator should simplify topology upstream, not independently simplify country SVG paths as this measurement experiment does.

## Strongest current hypothesis, not a locked decision

The evidence favours a hierarchical asset strategy conceptually resembling:

```text
canonical reconciled Natural Earth geography
        │
        ├── world display/pick LOD
        │     aggressive topology simplification
        │     continent-level interaction truth
        │
        ├── continent LOD
        │     more detail
        │     precision-sensitive exceptions
        │     region interaction truth
        │
        └── existing high-detail 2D/runtime assets
              domain-specific map/outlines behaviour
```

Whether those globe levels are GeoJSON, TopoJSON, pre-triangulated buffers, Three.js geometry, MapLibre sources or another representation remains deliberately undecided.

## Principal-model decision still reserved

Opus/Sol should decide, using this evidence plus the renderer spikes:

- where the LOD boundaries belong;
- whether the world renders individual country polygons, merged continent surfaces plus boundaries, or another composition;
- whether visual and picking meshes separate;
- what exact upstream spherical output contract the generator should expose;
- whether R3F/Three or MapLibre changes the optimal encoding.

The support conclusion is only:

> **Geometry payload is feasible. Do not spend frontier context debating whether a lightweight world asset is possible; spend it deciding the best representation and interaction architecture.**
