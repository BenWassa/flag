# Issue #27 — Oceania full four-domain expansion

**Status:** scoped on the shared global expansion foundation; #58 has shipped the required zero-land-neighbour learning contract.

## Goal

Ship Oceania to the Africa quality bar across the complete learner-facing continent and all four learning domains while deliberately solving extreme ocean extent, tiny islands, multipart geometry and the pedagogical reality that most Oceania countries have no land borders.

See `docs/architecture/continent-expansion.md` for the common completion contract.

## Canonical scored curriculum

Oceania contains 14 Atlas application countries.

### Australia & New Zealand — 2

- Australia (`AUS`)
- New Zealand (`NZL`)

### Melanesia — 4

- Fiji (`FJI`)
- Papua New Guinea (`PNG`)
- Solomon Islands (`SLB`)
- Vanuatu (`VUT`)

### Micronesia — 5

- Kiribati (`KIR`)
- Marshall Islands (`MHL`)
- Micronesia (`FSM`)
- Nauru (`NRU`)
- Palau (`PLW`)

### Polynesia — 3

- Samoa (`WSM`)
- Tonga (`TON`)
- Tuvalu (`TUV`)

Do not create scored dependent territories merely because they are geographically part of Oceania.

## Four-domain support matrix

| Scope | Flags | Locations | Outlines | Neighbours |
| --- | --- | --- | --- | --- |
| Oceania | required | required | required | required |
| Australia & New Zealand | required | required | required | required |
| Melanesia | required | required | required | required |
| Micronesia | required | required | required | required |
| Polynesia | required | required | required | required |

Issue #58 resolved the former empty-curriculum gap: verified empty adjacency is now a truthful, explicit retrieval answer and contributes through the existing evidence model. Do not invent maritime neighbours or treat absent topology as an empty set.

## Shipped Neighbours prerequisite: zero-land-neighbour learning

Issue #58 established how Atlas teaches countries with zero direct land neighbours while preserving the definition of neighbour.

Required shipped contract:

- keep `direct shared land boundary` as the only neighbour definition;
- make `no land neighbours` a first-class truthful answer/state rather than excluding such countries from learning forever;
- preserve the existing multi-answer set-building mechanic for `n > 0`;
- introduce the smallest domain-appropriate interaction for `n = 0`, such as an explicit **No land neighbours** submission rather than forcing meaningless autocomplete guesses;
- map a clean zero-neighbour retrieval into normal Neighbours country evidence;
- preserve existing records and do not retroactively damage Africa progress;
- verify how regional Neighbours mastery counts zero-neighbour countries once they are genuinely learnable.

#27 must consume this shared contract rather than embedding an Oceania-only exception.

## Cross-continent adjacency

Papua New Guinea (`PNG`) ↔ Indonesia (`IDN`) is the critical proving case.

The complete build-time adjacency graph must retain Indonesia even though Indonesia is in Asia/Southeast Asia. Runtime Oceania data may remain continent-local and lazy.

No maritime adjacency is added for Australia, New Zealand or Pacific island countries.

## Territory / source-feature audit

Explicitly audit non-application/dependent Natural Earth features within Oceania, including representative groups such as:

- New Caledonia;
- French Polynesia;
- Guam;
- Northern Mariana Islands;
- American Samoa;
- Cook Islands / Niue where represented;
- other source territories/dependencies encountered within the generated extent.

These are not automatically Atlas scored countries. Record context/exclusion treatment explicitly and do not silently expand the canonical application-country catalogue.

## Cartography architecture

Generate Oceania through the shared canonical Natural Earth pipeline only.

Required output:

- all 14 scored country geometries;
- required non-scoring/context geography;
- topology-derived shared political borders;
- topology-derived coastlines;
- ocean/background context;
- selected useful lakes/reservoirs only where materially helpful;
- no rivers;
- generated continent + region focus bounds;
- complete global build-time adjacency;
- locator/hit-assist metadata justified by phone-scale visual QA.

## Viewport / extreme extent strategy

Oceania cannot simply fit every scored island into one conventional mainland-style bounding box and call the result usable.

The continent and region views must preserve geographic truth while keeping learnable geography large enough to interact with.

### Full Oceania

Verify a deterministic full-continent fit that represents the curriculum honestly. It may rely on locator treatment for tiny/remote island states, but must not rearrange countries into a schematic fake map.

Do not move islands geographically just to reduce empty ocean.

### Regional framing

Each learner-facing region should have its own generated/verified first view:

- Australia & New Zealand — both countries simultaneously readable;
- Melanesia — PNG through Fiji/Vanuatu/Solomons at practical scale;
- Micronesia — locator-heavy treatment likely required;
- Polynesia — extreme-ocean spacing handled without false repositioning.

Region view must still support a sensible return to the parent continent.

### Dateline handling

Kiribati and other geometries near/across the antimeridian require deliberate projection/path QA.

Do not allow longitude wrapping to create split artefacts, false long lines across the map, duplicated scoring geometry or misleading outline framing.

Any projection/wrap handling must be deterministic and shared, not hand-edited per path.

## Small-island / locator policy

Oceania is the strongest stress test of the existing locator policy.

Likely review targets include nearly every Micronesian/Polynesian state plus Fiji/Vanuatu/Solomon Islands, but do not predeclare locators solely from country size.

For each scope:

1. generate canonical geometry;
2. inspect the exact production map at realistic phone scale;
3. identify targets whose truthful polygon is not practically tappable/visible;
4. add one visible locator with a larger invisible hit surface where justified;
5. avoid redundant locator + callout treatment;
6. use mainland leader-line callouts only if a mainland geometry genuinely requires them.

Record the exact final inventory by ISO3 and test it.

## Outlines

Outlines must remain canonical and geographically recognisable despite archipelagic geometry.

Audit especially:

- Australia;
- New Zealand;
- Papua New Guinea;
- Fiji;
- Solomon Islands;
- Vanuatu;
- Kiribati antimeridian/multipart geometry;
- Micronesia (`FSM`);
- Marshall Islands;
- Tuvalu.

Do not reduce archipelagic countries to arbitrary single-island silhouettes merely for convenience unless Atlas establishes a general, documented canonical-display policy. Whole-country/multipart geometry remains the default source truth.

Normalised silhouette framing must not turn tiny archipelagos into noisy illegible dots or leak identity through inconsistent treatment.

## Physical context

Ocean is essential orientation context in Oceania. Keep the visual hierarchy quiet so it does not become a giant decorative blue field competing with countries/locators.

Selected inland lakes are likely minimal and should be included only where they materially aid recognition. Rivers remain excluded globally after #54.

## Routing / progress / achievements

Requirements:

- Oceania + all four regions use shared typed scope definitions;
- all four domains appear honestly according to the resolved zero-neighbour contract;
- no empty Neighbours curriculum is treated as earned mastery;
- existing Flags evidence remains intact;
- new geography-domain evidence remains independently persisted;
- browser Back/Forward/direct routes remain stable;
- #34 region/continent completion uses explicit supported curriculum and cannot auto-complete missing Neighbours work.

## Performance

Oceania has relatively few countries but potentially expensive multipart/coastline/ocean geometry.

Record exact production raw + gzip size and coordinate counts. Preserve lazy continent loading. Do not keep enormous ocean path detail that contributes no phone-scale information; physical-context optimisation may be more aggressive than interactive political topology as long as it is deterministic and source-derived.

## Verification

In addition to the common playbook gates, assert:

- exact 14-country membership;
- exact 2/4/5/3 regional membership;
- explicit territory/dependency exclusions;
- complete PNG ↔ Indonesia cross-continent adjacency;
- truthful zero-land-neighbour records;
- resolved zero-neighbour learning/mastery contract before four-domain completion;
- antimeridian/Kiribati geometry integrity;
- no rivers;
- exact locator/hit-assist inventory;
- lazy Oceania module loading;
- runtime asset size.

Visual QA must inspect at minimum:

- full Oceania;
- all four regions;
- Micronesia and Polynesia at realistic phone scale;
- PNG/Indonesia Neighbours behaviour;
- zero-land-neighbour Neighbours interaction through the shipped #58 path;
- Kiribati map + Outline behaviour;
- representative locator-heavy Locations round;
- phone portrait + short landscape.

## Acceptance criteria

- [ ] Oceania uses the shared global expansion architecture with no Oceania-only map/topology system.
- [ ] Exact 14-country and 2/4/5/3 regional membership is test-covered.
- [ ] All four learner-facing domains are genuinely teachable for every region under a resolved zero-land-neighbour contract.
- [ ] Empty/zero-neighbour curriculum is never treated as automatic mastery/completion.
- [ ] Canonical Natural Earth geometry is the sole production map/outline/adjacency source.
- [ ] PNG ↔ Indonesia is preserved through complete global topology-derived adjacency.
- [ ] No maritime neighbours are invented.
- [ ] Dependent/non-application Pacific territories have explicit context/exclusion policy.
- [ ] Locations remains geographically truthful across extreme ocean extents without schematic repositioning.
- [ ] Kiribati/antimeridian behaviour is deterministic and visually correct.
- [ ] Outlines preserves canonical multipart geography under a consistent display policy.
- [ ] River-free cartography policy is preserved.
- [ ] Locator/hit-assist decisions are production-scale tested and regression-protected.
- [ ] Runtime remains lazy and within an explicitly verified performance budget.
- [ ] Routes, progress and achievement eligibility remain coherent.
- [ ] Exact production artifact passes the shared visual release gate.
- [ ] `npm run check` and `npm test` pass under Node 22.
- [ ] CI is green on the final commit before merge.
