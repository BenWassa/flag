# Issue #24 — South America full four-domain expansion

**Status:** preferred second-continent proving ground after the shared global expansion foundation.

## Goal

Ship South America to the Africa quality bar across all four domains and use it to prove that a second continent can be onboarded primarily through shared scope/configuration/policy plus generated assets rather than another core refactor.

See `docs/architecture/continent-expansion.md` for the common completion contract.

## Why South America goes first

South America is the best real proving ground for the generic expansion architecture:

- bounded 12-country curriculum;
- meaningful regional structure without Europe's microstate density;
- one important cross-continent adjacency at Panama/Colombia;
- nearby territory/context cases such as French Guiana and the Falkland Islands/Islas Malvinas;
- multipart/island geometry such as Ecuador/Galápagos;
- useful inland-water context without an island-heavy viewport dominating the entire continent.

If this issue still requires substantial edits to core map loaders, support selectors or generator architecture, the shared global expansion foundation is incomplete.

## Canonical scored curriculum

South America contains 12 application countries.

### Andean — 5

- Bolivia (`BOL`)
- Colombia (`COL`)
- Ecuador (`ECU`)
- Peru (`PER`)
- Venezuela (`VEN`)

### Atlantic — 3

- Brazil (`BRA`)
- Guyana (`GUY`)
- Suriname (`SUR`)

### Southern Cone — 4

- Argentina (`ARG`)
- Chile (`CHL`)
- Paraguay (`PRY`)
- Uruguay (`URY`)

The existing learner-facing region labels remain the implementation baseline unless a separate product decision deliberately changes them. Do not silently repartition the continent while implementing cartography.

## Four-domain support matrix

| Scope | Flags | Locations | Outlines | Neighbours |
| --- | --- | --- | --- | --- |
| South America | required | required | required | required |
| Andean | required | required | required | required |
| Atlantic | required | required | required | required |
| Southern Cone | required | required | required | required |

Flags already contains the countries; verify it consumes the same shared learning-scope membership.

## Territory / context policy

Explicitly audit source features around the continent before generation is declared complete.

### French Guiana

French Guiana is not a separate Atlas application country. It must not become a scored target merely because it is geographically South American.

Treat it according to the shared sovereign/multipart/context policy so the map is geographically truthful and Brazil/Suriname/French Guiana border linework does not create a fake scored country. Record whether its geometry is represented as non-scoring context or as part of canonical French sovereign geometry for the relevant generated topology operation.

### Falkland Islands / Islas Malvinas

Not a canonical Atlas application country. Treat as non-scoring context or exclude from the runtime view based on framing usefulness and the documented dispute/publication policy. Do not make it a scored country and do not invent an Atlas position on sovereignty.

### Trinidad and Tobago / nearby Caribbean

Trinidad and Tobago (`TTO`) remains canonically in the North America → Caribbean learning scope. It may appear as contextual geography in South America framing when useful, but is not added to the South America scored curriculum.

### Other nearby territories

Audit any additional Natural Earth special/territorial features that fall inside the selected continent/context extent. Unresolved source features must trigger explicit policy review rather than being guessed into a scored country.

## Cross-continent adjacency

The build-time global adjacency truth must preserve Colombia (`COL`) ↔ Panama (`PAN`).

This is the proving case for the rule that Neighbours cannot truncate a country's real application-country land-border set at a learner-continent boundary.

South America runtime data may remain continent-local and lazy; its Neighbours target data must still know Panama where required.

## Cartography

Generate one canonical South America asset through the shared production pipeline containing:

- all 12 scored country geometries;
- required non-scoring context geometry;
- topology-derived shared political-border mesh;
- topology-derived coastline;
- ocean/background context;
- selected useful lakes/reservoirs;
- no rivers;
- generated continent + region focus bounds;
- complete build-time land adjacency;
- exceptional locator/callout metadata only if justified after visual QA.

### Inland water

Evaluate a restrained source-derived lake set. Lake Titicaca is the obvious orientation candidate; add other inland-water polygons only when they improve recognition at Atlas scale.

Do not restore river linework such as the Amazon, Paraná or Orinoco. #54's river-free policy is a global invariant.

### Framing

Verify:

- full South America fit retains the complete scored continent;
- Andean focus makes the long north-western chain usable without awkward clipping;
- Atlantic focus makes Brazil/Guyanas readable without excessive dead canvas;
- Southern Cone handles the long Chile/Argentina geometry cleanly;
- any required nearby context remains subordinate;
- region view can fit back to the parent continent;
- short landscape remains deliberately usable.

## Small-country / island QA

Do not predeclare mainland callouts.

Inspect Guyana, Suriname, Uruguay and any small visible island components at realistic phone scale. Add hit assistance only where actual interaction requires it.

Ecuador's Galápagos and other remote/multipart geometry require explicit review so:

- Locations remains geographically truthful;
- Outlines uses a consistent whole-country/multipart policy;
- framing does not leak the answer through wildly inconsistent treatment.

Record and verify the final locator/callout inventory, including an explicit `none` decision if no assistance is needed.

## Outlines

All silhouettes derive from the canonical production geometry.

Audit especially:

- Chile's extreme aspect ratio;
- Argentina/Chile similarity and framing;
- Ecuador + Galápagos multipart treatment;
- Brazil's size normalisation;
- Guyana/Suriname distractor quality;
- preservation of shape/aspect ratio without country-scale answer leakage.

Do not create South-America-specific hand-authored SVGs.

## Neighbours

Validate representative complete relationships, including:

- Colombia ↔ Panama cross-continent;
- Colombia/Venezuela/Brazil/Peru/Ecuador cluster;
- Bolivia's high-degree adjacency;
- Brazil's high-degree adjacency;
- Chile/Argentina;
- Paraguay/Bolivia/Brazil/Argentina;
- Uruguay/Argentina/Brazil;
- Guyana/Suriname/Brazil and any canonical source/dispute policy interaction with French Guiana context.

Only direct shared land boundaries count.

## Routing / progress / achievements

Use shared typed routes/scopes and existing domain-specific persistence.

Requirements:

- South America and all three regions appear consistently across supported domain surfaces;
- Back/Forward/direct links work;
- no duplicate continent router;
- existing Flags evidence remains intact;
- Locations/Outlines/Neighbours ledgers remain independent;
- support selectors report true curriculum availability;
- #34 cannot award South America completion until every required regional/domain curriculum is genuinely available and earned.

## Performance

Record exact production module raw + gzip size and compare with the current continent-asset budget.

If South America cannot fit the established budget, investigate the asset before changing the budget. Any budget adjustment must be explicit, evidence-based and preserve continent-local lazy loading.

## Verification

In addition to the shared playbook gates, assert:

- exact 12-country membership;
- exact 5/3/4 regional membership;
- French Guiana non-scoring policy;
- Falklands/Islas Malvinas policy;
- Trinidad and Tobago remains outside South America scoring;
- complete Colombia ↔ Panama adjacency;
- no river source/runtime data;
- selected lake contract;
- final locator/callout inventory;
- lazy South America runtime loading;
- runtime asset size.

Visual release QA must inspect at minimum:

- full South America;
- all three regional views;
- Andean/Chile small-width geography at phone scale;
- Locations around the Guianas and northern continent edge;
- Ecuador multipart Outline;
- Chile Outline;
- Bolivia/Brazil high-degree Neighbours;
- Colombia Neighbours showing Panama correctly;
- portrait + short landscape.

## Acceptance criteria

- [ ] South America is onboarded through the shared global expansion architecture with no new continent-specific parallel system.
- [ ] Exact 12-country and 5/3/4 scope membership is test-covered.
- [ ] All four domains consume the intended shared scopes.
- [ ] Canonical Natural Earth production topology is the sole map/outline/adjacency source.
- [ ] French Guiana, Falklands/Islas Malvinas and nearby context have explicit documented policy.
- [ ] Trinidad and Tobago remains outside the South America scored curriculum.
- [ ] Locations works for the continent and every region.
- [ ] Outlines derives from canonical whole-country geometry with multipart/framing QA.
- [ ] Neighbours includes complete cross-continent Colombia ↔ Panama adjacency.
- [ ] No rivers are generated or rendered; selected lakes/ocean remain restrained context.
- [ ] Small-country/island assistance is based on production-scale inspection and regression-tested.
- [ ] Runtime stays lazy and within an explicitly verified performance budget.
- [ ] Routes, progress and achievement-support boundaries remain coherent.
- [ ] Exact production artifact passes the shared visual release gate.
- [ ] `npm run check` and `npm test` pass under Node 22.
- [ ] CI is green on the final commit before merge.
