# Issue #22 — North America full four-domain expansion

**Status:** scoped behind the shared global expansion foundation; implementation-ready only after that foundation lands.

## Goal

Ship North America to the Africa quality bar across the complete learner-facing continent and all of its regions, using the shared continent-expansion architecture and canonical Natural Earth topology.

This issue owns the full North America parent asset and its three current learner-facing regions:

- Northern America;
- Central America;
- Caribbean.

Issue #23's former standalone Central America cartography work is superseded by this parent-continent expansion. Central America remains a first-class learner-facing region, not a separate topology/map implementation.

See `docs/architecture/continent-expansion.md` for the shared completion contract.

## Canonical scored curriculum

North America currently contains 23 application countries.

### Northern America — 2

- Canada (`CAN`)
- United States (`USA`)

### Central America — 8

- Belize (`BLZ`)
- Costa Rica (`CRI`)
- El Salvador (`SLV`)
- Guatemala (`GTM`)
- Honduras (`HND`)
- Mexico (`MEX`)
- Nicaragua (`NIC`)
- Panama (`PAN`)

### Caribbean — 13

- Antigua and Barbuda (`ATG`)
- Bahamas (`BHS`)
- Barbados (`BRB`)
- Cuba (`CUB`)
- Dominica (`DMA`)
- Dominican Republic (`DOM`)
- Grenada (`GRD`)
- Haiti (`HTI`)
- Jamaica (`JAM`)
- Saint Kitts and Nevis (`KNA`)
- Saint Lucia (`LCA`)
- Saint Vincent and the Grenadines (`VCT`)
- Trinidad and Tobago (`TTO`)

Do not add non-application territories as scored targets merely because Natural Earth classifies them geographically within North America.

## Four-domain support matrix

| Scope | Flags | Locations | Outlines | Neighbours |
| --- | --- | --- | --- | --- |
| North America | required | required | required | required |
| Northern America | required | required | required | required |
| Central America | required | required | required | required |
| Caribbean | required | required | required | required |

Flags already has country coverage; this issue must verify that Flags consumes the same shared scope memberships rather than maintaining an independent region list.

For Neighbours, zero-land-neighbour island countries remain accurate but are excluded from standard rounds under the established gameplay contract. This does not make the Caribbean an unsupported domain.

## Required policy decisions

### Greenland and nearby territories

Greenland is not one of Atlas's canonical application countries. Treat it as non-scoring geographic context unless a separate future product decision changes the application-country catalogue.

Explicitly audit at minimum:

- Greenland;
- Bermuda;
- Saint Pierre and Miquelon;
- Puerto Rico;
- other Natural Earth-administered Caribbean territories relevant to map context.

For each, record the source feature, owning sovereign geometry relationship where relevant, and whether it is context or excluded from the runtime asset. Do not silently convert territories into scored targets.

### Cross-continent adjacency

The full build-time adjacency graph must preserve at minimum:

- Mexico ↔ United States;
- Panama ↔ Colombia.

Panama's Colombia relationship must not disappear merely because Colombia belongs to the South America learner continent.

### Multipart sovereign geometry

Audit application-country geometry that includes remote/non-contiguous pieces. Locations, Outlines and Neighbours must follow the shared transcontinental/multipart policy from the expansion playbook rather than inventing North-America-only exceptions.

## Cartography

Use the generic canonical production generator only.

Required North America asset output:

- all 23 scored country geometries;
- required non-scoring context geometry;
- one topology-derived shared political-border mesh;
- one coastline mesh;
- source-derived ocean context;
- selected useful lakes/reservoirs only;
- no rivers;
- generated focus bounds for North America and each region;
- complete build-time land adjacency;
- locator/callout metadata justified by visual QA.

### Inland water

Determine a restrained set of major lakes/reservoirs that materially help orientation, especially where the US/Canada boundary and regional recognition benefit. Do not treat every Natural Earth lake as mandatory.

### Framing

Verify:

- full continent fits with all required island locators;
- Northern America framing remains useful despite Canada/US scale;
- Central America is large enough to play accurately on phone portrait;
- Caribbean framing does not reduce small islands to unusable specks;
- region views can return to full North America;
- short landscape remains usable.

## Small-country / island QA

The Caribbean is the primary stress case.

Do not pre-author a large locator/callout table. Generate canonical geometry first, inspect at realistic phone scale, then record the minimum assistance required.

Apply the shared policy:

- island locator when the actual polygon cannot provide a practical target at ordinary framing;
- larger invisible hit area;
- mainland callouts exceptional only;
- no redundant locator + callout treatment.

The final locator/callout inventory must be documented and regression-tested.

## Outlines

All 23 country silhouettes must derive from the same canonical production geometry.

Audit especially:

- archipelagic/multipart Caribbean states;
- Bahamas;
- Antigua and Barbuda;
- Saint Kitts and Nevis;
- Saint Vincent and the Grenadines;
- Trinidad and Tobago;
- large Canada/US/Mexico normalisation so scale is not an answer cue.

## Neighbours

Validate representative complete adjacency including:

- Canada / United States;
- United States / Mexico;
- Mexico's Central American connections;
- Guatemala/Belize/Honduras density;
- Panama / Colombia cross-continent edge;
- Haiti / Dominican Republic;
- zero-land-neighbour island states.

Do not add maritime adjacency for island countries.

## Routing / progress / achievements

Use shared typed scopes and stable route architecture.

Requirements:

- North America and each region appear in the existing continent/region surfaces;
- browser Back/Forward and direct routes work;
- no duplicate North-America-specific router;
- existing Flags progress is preserved;
- new geography-domain progress remains domain-specific;
- support selectors recognise all four domains honestly;
- #34 completion logic can eventually treat North America as complete only when all required supported regional domain mastery exists.

## Verification

In addition to the common playbook gates, add focused assertions for:

- exact 23-country continent membership;
- exact 2/8/13 region membership;
- territory/context exclusions;
- complete Panama ↔ Colombia adjacency;
- Haiti ↔ Dominican Republic adjacency;
- zero-neighbour Caribbean targets;
- no rivers;
- final locator/callout inventory;
- lazy `north-america` runtime asset loading;
- runtime asset size.

Visual QA must inspect at minimum:

- full North America;
- Northern America;
- dense Central America;
- the Caribbean at usable phone scale;
- representative island Locations targets;
- multipart Outlines;
- Panama and Hispaniola Neighbours cases;
- phone portrait and short landscape.

## Acceptance criteria

- [ ] North America uses the shared global expansion architecture, not copied Africa-only infrastructure.
- [ ] The 23-country curriculum and 2/8/13 region split above are exact and test-covered.
- [ ] #23 is not implemented as a separate Central America topology/runtime subsystem.
- [ ] All four domains consume the intended shared scopes.
- [ ] Canonical Natural Earth geometry is the sole production geography source.
- [ ] Locations works for continent + all three regions.
- [ ] Outlines derives every supported country from canonical geometry.
- [ ] Neighbours uses complete topology-derived adjacency including Panama ↔ Colombia.
- [ ] Zero-land-neighbour island countries remain accurate and standard-round-ineligible rather than receiving invented maritime neighbours.
- [ ] Territory/context policy is explicit and documented.
- [ ] River-free map policy is preserved; useful lakes/ocean remain subordinate context.
- [ ] Small-island locator/callout inventory is based on actual phone-scale review and regression-tested.
- [ ] Routes, persistence, support selectors and achievement eligibility remain coherent.
- [ ] Exact production artifact passes the common visual release gate.
- [ ] `npm run check` and `npm test` pass under Node 22.
- [ ] CI is green on the final commit before merge.
