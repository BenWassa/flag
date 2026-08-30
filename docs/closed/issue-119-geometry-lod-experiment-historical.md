# Issue #119 — Geometry / LOD feasibility evidence

**Status:** historical support-tier feasibility evidence; **PARKED until H1 passes**.  
**Decision authority:** final spherical/LOD contract belongs to principal F3.

This experiment answered one narrow question before any globe architecture was chosen:

> Is canonical Atlas country geometry inherently too large for a lightweight world/continent selection representation?

The answer from the historical four-continent measurement was **no**. It did not define a spherical data contract, renderer representation or final LOD policy.

## Historical baseline

The original measurement used the then-production generated country paths for:

- Africa;
- South America;
- Europe;
- Asia.

North America was not yet part of that historical run. North America now ships in production, and Oceania is being completed under #27. Therefore the old four-continent totals are **not** the final global envelope.

Canonical source truth was and remains:

- pinned Natural Earth 1:10m country polygons;
- Atlas ISO3 reconciliation and geopolitical policy;
- no handwritten country geometry;
- existing generated 2D assets as the measured input to this *envelope* experiment only.

## Method and limitation

The reproducible script is:

```bash
node scripts/experiments/spatial-lod-envelope.mjs
```

It parses current generated 2D country paths and applies Ramer-Douglas-Peucker simplification in projection space.

This is deliberately **not** the spherical pipeline:

- it begins after 2D projection;
- independently simplified SVG paths are not a production topology contract;
- a real spherical output must simplify/reconcile upstream so shared boundaries, antimeridian handling and multipart identity remain correct;
- renderer-specific tessellation/encoding may change payload characteristics.

Use this experiment to reason about feasibility and sensitivity, not to author F3.

## Historical measured envelope

Across the four continents in the original run:

| RDP tolerance (835-unit canvas) | Coordinates | Raw compact JSON | gzip | Approx. max deviation at 390 px continent width |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 269,736 | 3,112,213 B | 840,240 B | 0 px |
| 0.25 | 57,047 | 661,740 B | 227,253 B | 0.12 px |
| 0.5 | 32,313 | 376,282 B | 135,294 B | 0.23 px |
| 1.0 | 18,985 | 222,469 B | 82,014 B | 0.47 px |
| 2.0 | 12,182 | 144,029 B | 53,459 B | 0.93 px |
| 4.0 | 8,946 | 106,665 B | 39,228 B | 1.87 px |

The CSS-pixel conversion used `390 / 835 ≈ 0.467` CSS px per current continent-canvas unit when the full continent canvas occupies phone width. At world scale the same geographic detail is smaller.

### What the historical experiment proves

A selection-oriented low-detail representation does not inherently require the current multi-hundred-kilobyte high-detail runtime map payload per continent.

The old four-continent country-only paths had a plausible envelope around:

- ~82 KB gzip at the 1.0 tolerance;
- ~53 KB gzip at the 2.0 tolerance.

Those are **feasibility figures**, not a six-continent budget and not a promise that a spherical representation will have the same size.

## Critical small-country finding

Uniform simplification cannot be the full policy.

The historical run showed disproportionate damage to very small states even at otherwise conservative tolerances. European microstates were the clearest examples; small Asian states also changed materially.

That finding is more important than the exact old byte totals:

- world-scale display can simplify aggressively where only continent recognition/selection matters;
- more detailed interaction levels may need precision-sensitive preservation;
- visual geometry and picking geometry may not need identical detail;
- Atlas already has honest small-country assistance concepts in its 2D production cartography;
- final simplification belongs upstream in canonical topology/geographic coordinates, not per-country projected SVG cleanup.

None of those observations selects a final LOD architecture.

## Required six-continent refresh — only after H1 PASS

After #27/#137/#138 settle current `main` **and** Ben materially passes the H1 phone comparison, rerun/extend support measurements for all six continents:

1. Africa;
2. South America;
3. Europe;
4. Asia;
5. North America;
6. Oceania.

### Required outputs

For each continent and candidate simplification envelope record:

- scored country count;
- source/reconciled component count;
- coordinate count before/after simplification;
- raw encoded size;
- gzip size;
- representative phone-scale deviation;
- smallest-country/component survivability;
- multipart integrity;
- picking feasibility at the intended selection level;
- provenance/source revision.

### Difficult cases that must be inspected explicitly

**Europe**

- Monaco;
- Liechtenstein;
- San Marino;
- Andorra;
- other microstate/precision-sensitive cases already protected by production cartography.

**North America / Caribbean**

- Bahamas;
- Antigua and Barbuda;
- Saint Kitts and Nevis;
- Saint Vincent and the Grenadines;
- Trinidad and Tobago;
- dense multipart island groups.

**Oceania / Pacific**

- very small island states;
- widely dispersed multipart archipelagos;
- Kiribati and antimeridian-crossing representation;
- cases where display survival and practical picking may require different detail.

**Global antimeridian**

- Russia/Pacific-facing views;
- any canonical components crossing or wrapping around ±180°.

## Evidence this refresh may report

Support may state facts such as:

- a tolerance erases a required visible component;
- a candidate envelope costs N bytes raw/gzip;
- a country’s multipart geometry becomes unsuitable for direct picking;
- an antimeridian transform splits or duplicates geometry incorrectly;
- a precision-sensitive subset is required for faithful interaction.

Support must **not** turn those facts into the final contract.

## F3 decisions explicitly reserved

The principal decides:

- exact spherical output representation;
- LOD boundaries and switching policy;
- whether world view renders country polygons, merged continent surfaces or another composition;
- whether visual and picking representations differ;
- precision-sensitive exception policy;
- antimeridian/multipart encoding contract;
- renderer-specific asset form and lifecycle.

The durable support conclusion remains only:

> **A lightweight global geography representation is plausibly feasible; the difficult problem is preserving interaction truth for tiny/multipart/antimeridian geography, not proving that simplification can reduce bytes.**
