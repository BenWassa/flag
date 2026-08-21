# Issue #25 — Europe full four-domain expansion

**Status:** scoped on the shared global expansion foundation; implement after at least one simpler continent has proven the generic onboarding path.

## Goal

Ship Europe to the Africa quality bar across Flags, Locations, Outlines and Neighbours while deliberately hardening the shared architecture for dense borders, microstates, enclaves/exclaves and transcontinental geometry.

See `docs/architecture/continent-expansion.md` for the common completion contract.

## Canonical scored curriculum

Europe currently contains 44 Atlas application countries.

### Northern Europe — 10

- Denmark (`DNK`)
- Estonia (`EST`)
- Finland (`FIN`)
- Iceland (`ISL`)
- Ireland (`IRL`)
- Latvia (`LVA`)
- Lithuania (`LTU`)
- Norway (`NOR`)
- Sweden (`SWE`)
- United Kingdom (`GBR`)

### Western Europe — 9

- Austria (`AUT`)
- Belgium (`BEL`)
- France (`FRA`)
- Germany (`DEU`)
- Liechtenstein (`LIE`)
- Luxembourg (`LUX`)
- Monaco (`MCO`)
- Netherlands (`NLD`)
- Switzerland (`CHE`)

### Eastern Europe — 10

- Belarus (`BLR`)
- Bulgaria (`BGR`)
- Czechia (`CZE`)
- Hungary (`HUN`)
- Moldova (`MDA`)
- Poland (`POL`)
- Romania (`ROU`)
- Russia (`RUS`)
- Slovakia (`SVK`)
- Ukraine (`UKR`)

### Southern Europe — 15

- Albania (`ALB`)
- Andorra (`AND`)
- Bosnia and Herzegovina (`BIH`)
- Croatia (`HRV`)
- Greece (`GRC`)
- Italy (`ITA`)
- Malta (`MLT`)
- Montenegro (`MNE`)
- North Macedonia (`MKD`)
- Portugal (`PRT`)
- San Marino (`SMR`)
- Serbia (`SRB`)
- Slovenia (`SVN`)
- Spain (`ESP`)
- Vatican City (`VAT`)

Do not silently change this 44-country curriculum as part of cartography implementation.

## Four-domain support matrix

| Scope | Flags | Locations | Outlines | Neighbours |
| --- | --- | --- | --- | --- |
| Europe | required | required | required | required |
| Northern Europe | required | required | required | required |
| Western Europe | required | required | required | required |
| Eastern Europe | required | required | required | required |
| Southern Europe | required | required | required | required |

Flags must consume the same shared scope membership as the geography domains.

## Europe/Asia boundary policy

Europe implementation must not independently re-litigate the Middle East/Caucasus taxonomy.

### Russia

Russia remains a canonical Europe-scored country under the current Atlas catalogue.

Required treatment:

- one canonical `RUS` identity and whole-country source geometry;
- Outlines uses the canonical whole-country silhouette, not a hand-cut European-Russia silhouette;
- Neighbours uses the complete global topology-derived land-neighbour set, including relationships outside Europe;
- Europe Locations may frame/crop the rendered whole-country geometry through the continent viewport so Europe remains playable, but must not draw an invented Europe/Asia political boundary through Russia or maintain a second handwritten Russia geometry;
- fit/focus calculations must not allow far-eastern Russia to make the rest of Europe unusably small.

Any scope-specific display clipping must be a deterministic viewport/cartography operation over canonical geometry, never a manually edited replacement polygon.

### Türkiye and Cyprus

Under the current canonical catalogue:

- Türkiye (`TUR`) is Asia-owned and participates in the Middle East learning scope;
- Cyprus (`CYP`) is Asia-owned and participates in the Middle East learning scope.

They may appear as required context on European maps but are not silently added to Europe's 44-country scored curriculum in this issue.

### Caucasus

Armenia (`ARM`), Azerbaijan (`AZE`) and Georgia (`GEO`) are not included in Europe's current scored curriculum. Issue #26 owns their learner-facing Caucasus treatment alongside #28's Middle East decision.

Europe maps may include them as context when needed for truthful framing. Do not classify them into Europe ad hoc during implementation.

## Disputed/special territory policy

Explicitly audit Natural Earth features relevant to the European extent, including at minimum:

- Kosovo;
- Northern Cyprus or source-specific Cyprus/Türkiye dispute features if present;
- other non-application/de-facto/disputed features encountered by the pinned source;
- overseas or dependent territories visible within the selected extent.

Kosovo is not currently an Atlas canonical application country. Do not add it as a scored target in this issue. Record its source/political-context treatment explicitly and align publication/dispute handling with the durable cartography policy.

Unresolved source features must fail generation for policy review rather than being silently assigned.

## Microstates / dense geography

Europe is the strongest stress test for motor precision and border clarity.

Mandatory phone-scale audit targets include:

- Andorra;
- Liechtenstein;
- Luxembourg;
- Monaco;
- San Marino;
- Vatican City;
- Malta.

Also inspect dense clusters such as Benelux, the Alps, the Balkans and the Baltic states.

Do not automatically add callouts to every microstate. Apply the established assistance hierarchy:

1. truthful polygon where usable;
2. larger invisible hit surface where geometry allows;
3. island locator where appropriate;
4. mainland leader-line callout only where actual phone-scale play demonstrates necessity.

Record the final locator/callout inventory and test it exactly.

## Cartography

Generate one canonical Europe asset through the shared production pipeline containing:

- all 44 scored country geometries;
- required non-scoring/context geometry;
- topology-derived shared political borders;
- topology-derived coastline;
- ocean/background context;
- selected useful lakes/reservoirs only;
- no rivers;
- region focus bounds;
- complete global build-time adjacency;
- reviewed locator/callout metadata.

### Inland water

Use only source-derived lakes that materially improve orientation at the chosen map scale. Do not add rivers such as the Danube/Rhine as linework; the post-#54 no-rivers contract is global.

### Border rendering

Dense Europe makes topology correctness especially visible. Shared borders must render once from the canonical simplified topology; do not stroke every country independently.

Inspect Benelux, Alpine borders, Balkans and microstate surroundings for double-strokes, gaps or accidental context seams.

## Framing

Verify:

- full Europe fit remains useful despite Russia and Iceland;
- Northern Europe includes Iceland without making mainland countries too small;
- Western Europe makes Benelux/microstates practical;
- Eastern Europe remains useful without far-eastern Russia controlling scale;
- Southern Europe includes island states and Mediterranean context without excessive empty water;
- region views can return to the full continent;
- short landscape remains usable.

Generated focus bounds are defaults; any deterministic configuration override must be documented rather than manually tuned in rendering code.

## Outlines

All silhouettes derive from canonical country geometry.

Audit especially:

- Russia whole-country silhouette;
- Norway's coastline/island complexity;
- Greece/multipart geometry;
- Denmark;
- United Kingdom;
- Italy;
- Croatia;
- Malta and microstates;
- distractor quality among similarly shaped/sized Central European states.

Normalisation must preserve aspect ratio while preventing raw country scale from becoming an answer cue.

## Neighbours

Europe requires broad adjacency verification because of density and enclaves.

At minimum verify:

- Germany/France/Central Europe high-degree relationships;
- Benelux;
- Balkans;
- Baltic states;
- Russia's complete cross-Asia adjacency;
- Spain/Portugal/France/Andorra;
- Italy/France/Switzerland/Austria/Slovenia plus San Marino/Vatican where canonical topology supports the direct boundaries;
- Liechtenstein;
- microstate/enclave relationships represented by the canonical production topology;
- zero-land-neighbour island states such as Iceland and Malta remain accurate empty sets and use the explicit #58 retrieval path.

Do not invent maritime neighbours.

## Routing / progress / achievements

Use shared typed scope definitions and existing domain-specific storage.

Requirements:

- continent + four regions expose all four supported domains;
- direct routes and browser Back/Forward remain stable;
- existing Flags evidence survives;
- geography-domain ledgers remain independent;
- support/completion selectors use explicit curriculum, not missing-record inference;
- unsupported/context countries do not count toward mastery;
- #34 continent completion waits for every required Europe region/domain achievement.

## Performance

Europe's 1:10m coastline and dense political topology may be heavier than South America.

Record exact production raw + gzip asset size and coordinate counts. Optimisation changes must preserve topology/shared-edge correctness. Do not respond to size pressure by independently simplifying neighbouring country polygons.

## Verification

In addition to the common playbook gates, assert:

- exact 44-country membership;
- exact 10/9/10/15 regional membership;
- Russia transcontinental policy;
- Türkiye/Cyprus/Caucasus remain context rather than Europe scored targets under current policy;
- Kosovo/non-application policy;
- complete cross-continent Russia adjacency;
- microstate adjacency and zero-neighbour cases;
- no rivers;
- selected lake contract;
- exact locator/callout inventory;
- lazy Europe module loading;
- runtime size budget.

Visual QA must inspect at minimum:

- full Europe;
- all four regions;
- Benelux;
- Alpine microstates;
- Balkans;
- Vatican/San Marino/Monaco/Andorra/Liechtenstein handling;
- Iceland/Malta;
- Russia framing;
- representative Outlines and high-degree Neighbours;
- phone portrait and short landscape.

## Acceptance criteria

- [ ] Europe uses the shared global expansion architecture with no Europe-only map/adjacency system.
- [ ] Exact 44-country and 10/9/10/15 scope membership is test-covered.
- [ ] All four domains consume the intended shared scopes.
- [ ] Russia uses one canonical identity/geometry source with explicit viewport/framing and global-adjacency treatment.
- [ ] Türkiye, Cyprus and Caucasus handling remains consistent with #28/#26 and is not silently reclassified.
- [ ] Kosovo/special-territory policy is explicit and documented.
- [ ] Locations works for continent + every region at realistic phone scale.
- [ ] Outlines uses canonical geometry including multipart/transcontinental cases.
- [ ] Neighbours uses complete global topology-derived adjacency and accurately handles microstates/islands.
- [ ] River-free map policy is preserved; lakes/ocean remain restrained context.
- [ ] Microstate assistance is the minimum justified by actual production-scale review and is regression-tested.
- [ ] Dense political borders remain topology-coherent with no material double-strokes/gaps.
- [ ] Runtime stays lazy and within an explicitly verified performance budget.
- [ ] Exact production artifact passes the shared visual release gate.
- [ ] `npm run check` and `npm test` pass under Node 22.
- [ ] CI is green on the final commit before merge.
