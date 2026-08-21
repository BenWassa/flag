# Issue #26 — Asia full four-domain expansion

**Status:** scoped on the shared global expansion foundation and still dependent on Issue #28's exact Middle East scope model.

## Goal

Ship Asia to the Africa quality bar across all four learning domains while preserving one canonical country model, complete global adjacency and explicit conventional learning scopes.

Asia is the most policy-complex expansion. Implement it after the generic onboarding path has already been proven by simpler continents.

See `docs/architecture/continent-expansion.md` for the shared completion contract.

## Canonical continent curriculum

Asia currently contains 48 canonical Atlas application countries.

### Central Asia — 5

- Kazakhstan (`KAZ`)
- Kyrgyzstan (`KGZ`)
- Tajikistan (`TJK`)
- Turkmenistan (`TKM`)
- Uzbekistan (`UZB`)

### East Asia — 5

- China (`CHN`)
- Japan (`JPN`)
- Mongolia (`MNG`)
- North Korea (`PRK`)
- South Korea (`KOR`)

### Southeast Asia — 11

- Brunei (`BRN`)
- Cambodia (`KHM`)
- Indonesia (`IDN`)
- Laos (`LAO`)
- Malaysia (`MYS`)
- Myanmar (`MMR`)
- Philippines (`PHL`)
- Singapore (`SGP`)
- Thailand (`THA`)
- Timor-Leste (`TLS`)
- Vietnam (`VNM`)

### South Asia — 8

- Afghanistan (`AFG`)
- Bangladesh (`BGD`)
- Bhutan (`BTN`)
- India (`IND`)
- Maldives (`MDV`)
- Nepal (`NPL`)
- Pakistan (`PAK`)
- Sri Lanka (`LKA`)

### Current Western-Asia canonical members — 19

The current catalogue's `west-asia` classification contains:

- Armenia (`ARM`)
- Azerbaijan (`AZE`)
- Bahrain (`BHR`)
- Cyprus (`CYP`)
- Georgia (`GEO`)
- Iran (`IRN`)
- Iraq (`IRQ`)
- Israel (`ISR`)
- Jordan (`JOR`)
- Kuwait (`KWT`)
- Lebanon (`LBN`)
- Oman (`OMN`)
- Palestine (`PSE`)
- Qatar (`QAT`)
- Saudi Arabia (`SAU`)
- Syria (`SYR`)
- Türkiye (`TUR`)
- United Arab Emirates (`ARE`)
- Yemen (`YEM`)

This canonical/formal classification must no longer be assumed to equal learner-facing region membership.

## Learner-facing regional model

Issue #28 resolves the learner-facing Western Asia problem. Asia navigation should expose **Middle East**, not a simple relabel of `west-asia`.

### Middle East — 17

Use the exact locked Issue #28 learning scope:

- Bahrain (`BHR`)
- Cyprus (`CYP`)
- Egypt (`EGY`)
- Iran (`IRN`)
- Iraq (`IRQ`)
- Israel (`ISR`)
- Jordan (`JOR`)
- Kuwait (`KWT`)
- Lebanon (`LBN`)
- Oman (`OMN`)
- Palestine (`PSE`)
- Qatar (`QAT`)
- Saudi Arabia (`SAU`)
- Syria (`SYR`)
- Türkiye (`TUR`)
- United Arab Emirates (`ARE`)
- Yemen (`YEM`)

Egypt remains canonically African and remains in North Africa. It participates in the Middle East learning scope without duplicating the country record or progress.

### Caucasus — 3

Resolve the remaining current `west-asia` members as a distinct learner-facing **Caucasus** scope:

- Armenia (`ARM`)
- Azerbaijan (`AZE`)
- Georgia (`GEO`)

Do not silently classify these three as Middle Eastern.

### Resulting Asia learner-facing regions

Asia navigation therefore exposes:

- Central Asia;
- East Asia;
- Southeast Asia;
- South Asia;
- Middle East;
- Caucasus.

`West Asia` may remain as internal/formal taxonomy where compatibility requires it, but should not remain a near-duplicate ordinary learner-facing region.

The regional learning scopes are intentionally not a mutually exclusive partition of the 48-country Asia continent because Middle East includes Egypt. This is the canonical proving case for overlapping learning scopes.

## Four-domain support matrix

| Scope | Flags | Locations | Outlines | Neighbours |
| --- | --- | --- | --- | --- |
| Asia | required | required | required | required |
| Central Asia | required | required | required | required |
| East Asia | required | required | required | required |
| Southeast Asia | required | required | required | required |
| South Asia | required | required | required | required |
| Middle East | required | required | required | required |
| Caucasus | required | required | required | required |

Flags must consume the same learning-scope definitions. Middle East membership must not be hard-coded independently in each domain.

## Achievement implication

Because Middle East is a first-class learner-facing region under the Asia flow, region × domain mastery for Middle East uses the same 17-country scope in every domain.

Country evidence remains keyed to canonical country identity, so Egypt evidence can contribute to both North Africa and Middle East achievements without duplication.

The achievement implementation must consume the shared scope registry rather than assuming continent regions are disjoint subsets of `Country.continentId`.

## Europe/Asia / transcontinental policy

### Türkiye

Türkiye remains one canonical application country and one canonical geometry source.

- Asia continent scope includes Türkiye under current canonical ownership;
- Middle East includes Türkiye;
- Europe may show Türkiye as context but does not add it to Europe's current scored curriculum;
- Outlines uses canonical whole-country geometry;
- Neighbours uses its complete global land-neighbour set;
- map framing must not crop its European/Asian pieces in a misleading way in Middle East or Asia regional views.

### Cyprus

Cyprus remains canonically Asia-owned under the current application catalogue and is in Middle East. Europe may show it as context. Do not duplicate the country or maintain a Europe-only alternative record.

### Russia

Russia remains canonically Europe-owned in the current catalogue but must appear as context where required in Asia maps and contribute its complete cross-continental adjacency relationships. Do not create a separate Asian Russia scoring identity.

### Kazakhstan

Kazakhstan remains canonically Asia-owned under the current Atlas catalogue. Use one whole-country identity/geometry source and complete adjacency.

## Political/disputed/source-feature audit

Asia requires an explicit source audit before release. At minimum inspect/document:

- Taiwan/source representation relative to the canonical Atlas application-country catalogue;
- Kashmir-related disputed boundary/source features;
- Palestine/Israel source geometry and boundary presentation under the existing application-country policy;
- Northern Cyprus/source-specific features if present;
- Russian/transcontinental source geometry;
- any other de-facto/disputed features Natural Earth exposes within the generated extents.

Do not create new scored identities as a side effect of source data. Unresolved features block generation for policy review.

This issue is implementation/cartography work, not a venue to invent a new geopolitical catalogue casually.

## Cartography

Generate one canonical Asia parent asset through the shared production pipeline and support the cross-continent Middle East scope through shared scope/context machinery.

Required outputs:

- all 48 canonical Asia scored country geometries;
- Egypt geometry available as a scored member of Middle East through the shared canonical source;
- required non-scoring/context geometry;
- topology-derived shared political borders;
- topology-derived coastlines;
- ocean/background context;
- selected useful lakes/reservoirs only;
- no rivers;
- focus bounds for continent + every learner-facing region;
- complete global build-time land adjacency;
- reviewed locator/callout metadata.

Do not create a second Middle East map/topology source.

### Middle East framing

The Middle East region view must be framed around the actual 17-country learning scope rather than blindly inheriting an Asia-only crop.

It must:

- include Egypt as playable geography;
- include Türkiye and Cyprus without awkward clipping;
- include the Gulf states at usable phone scale;
- provide appropriate surrounding North Africa/Europe/Caucasus/Central/South Asia context;
- allow return to a sensible parent/continent view without implying Egypt's canonical continent changed.

### Caucasus framing

Armenia, Azerbaijan and Georgia must be simultaneously usable at phone scale with surrounding Türkiye/Russia/Iran context subordinate but geographically coherent.

### Other region framing

Audit:

- Central Asia's broad inland extent;
- East Asia including Japan/Korean peninsula;
- Southeast Asia's mainland + archipelagic split;
- South Asia including Maldives/Sri Lanka and Himalayan states;
- full Asia scale without making small countries impossible.

## Physical context

Post-#54 map policy applies globally:

- ocean;
- selected major lakes/reservoirs;
- no rivers.

Do not add Yangtze, Mekong, Ganges, Indus, Tigris/Euphrates or other river linework as regional ornament. Political borders must remain visually dominant.

Select lakes only where they genuinely improve orientation at the relevant scale.

## Island / small-country QA

Mandatory stress cases include:

- Bahrain;
- Singapore;
- Maldives;
- Brunei;
- Timor-Leste;
- Cyprus;
- Japan;
- Philippines;
- Indonesia;
- Sri Lanka.

Do not create a blanket island-callout policy. Inspect production maps at realistic phone scale and record the minimum truthful locator/hit-assist inventory.

Archipelagic countries must preserve canonical multipart geography in Outlines while avoiding unusable presentation or answer leakage.

## Outlines

All silhouettes derive from canonical geometry.

Audit especially:

- Indonesia;
- Philippines;
- Japan;
- Malaysia multipart geometry;
- Brunei;
- Singapore;
- Maldives;
- Türkiye;
- Cyprus;
- Azerbaijan and Georgia;
- long/large shapes such as China/Kazakhstan;
- whole-country transcontinental geometry where applicable.

Normalise framing consistently without cropping away identity-defining multipart geometry merely to make every silhouette compact.

## Neighbours

Asia is the strongest proof of global-complete adjacency.

Validate at minimum:

- China high-degree relationships;
- Russia relationships to Asia countries despite Russia's Europe ownership;
- Türkiye cross-Europe/Middle-East relationships;
- Caucasus triangle + surrounding Türkiye/Russia/Iran relationships;
- Kazakhstan/Russia/China/Central Asia;
- Afghanistan's full adjacency;
- India/Pakistan/China/Nepal/Bhutan/Bangladesh/Myanmar relationships under the canonical source/policy;
- Thailand/Laos/Cambodia/Vietnam/Myanmar/Malaysia mainland Southeast Asia;
- Indonesia ↔ Timor-Leste;
- island states retain accurate zero-land-neighbour records where applicable.

No maritime adjacency is invented.

## Routing / compatibility

Issue #28 requires a stable Middle East scope ID and deliberate handling of any existing `west-asia` route/state.

Requirements:

- direct Middle East and Caucasus routes;
- browser Back/Forward;
- legacy `west-asia` route compatibility/redirect/collapse policy documented if it exists in shipped URLs when this lands;
- no storage-key migration solely for learner-facing spelling/taxonomy;
- progress remains attached to canonical countries/domain ledgers;
- Asia continent and region surfaces use shared scope definitions.

## Performance

Asia may be the largest continent runtime asset. Preserve continent-local lazy loading and record exact production raw/gzip size.

Do not lower cartographic correctness or introduce independently simplified country seams merely to hit a size target. Any size-budget adjustment requires explicit evidence and review.

Consider whether the Middle East can reuse the Asia parent module plus required Egypt/context efficiently without duplicating large geometry payloads. Prefer one canonical generated geography source with shared/lazy composition over copied paths.

## Verification

In addition to the common playbook gates, assert:

- exact 48-country Asia canonical membership;
- exact Central Asia 5 / East Asia 5 / Southeast Asia 11 / South Asia 8 membership;
- exact Middle East 17 membership including Egypt;
- exact Caucasus 3 membership;
- Armenia/Azerbaijan/Georgia excluded from Middle East;
- Egypt remains canonically Africa-owned;
- learner-facing `West Asia` is not retained as an accidental near-duplicate scope;
- transcontinental/source-feature policy;
- complete global adjacency representative cases;
- no rivers;
- selected lake contract;
- final locator/callout inventory;
- lazy Asia asset loading and any cross-scope composition strategy;
- runtime size budget.

Visual QA must inspect at minimum:

- full Asia;
- all six learner-facing regional views;
- Middle East with Egypt/Türkiye/Gulf usable;
- Caucasus;
- Southeast Asian archipelagos;
- Maldives/Singapore/Bahrain small targets;
- representative multipart Outlines;
- high-degree China and transcontinental Neighbours;
- phone portrait + short landscape.

## Acceptance criteria

- [ ] Asia uses the shared global expansion architecture with no Asia/Middle-East parallel geography system.
- [ ] Exact 48-country canonical continent membership is test-covered.
- [ ] Learner-facing regions are Central Asia, East Asia, Southeast Asia, South Asia, Middle East and Caucasus.
- [ ] Middle East uses the exact #28 17-country scope including Egypt.
- [ ] Caucasus is exactly Armenia, Azerbaijan and Georgia and those countries are not silently classified as Middle Eastern.
- [ ] Canonical country classification and overlapping learning scopes remain separate concepts.
- [ ] All four domains consume the same shared scope definitions.
- [ ] Egypt remains canonically African and can contribute evidence to Middle East without duplicate records.
- [ ] Türkiye/Cyprus/Russia/transcontinental display and adjacency policy is explicit and source-derived.
- [ ] Relevant disputed/special source features are explicitly audited and documented.
- [ ] Locations works for Asia + every learner-facing region with usable phone framing.
- [ ] Outlines derives all silhouettes from canonical geometry including multipart/archipelagic cases.
- [ ] Neighbours uses complete global topology-derived land adjacency.
- [ ] River-free cartography policy is preserved; lakes/ocean remain restrained context.
- [ ] Locator/callout assistance is based on actual production-scale inspection and regression-tested.
- [ ] Legacy `west-asia` route/state compatibility is deliberate if applicable.
- [ ] Runtime remains lazy and within an explicitly verified performance budget.
- [ ] Exact production artifact passes the shared visual release gate.
- [ ] `npm run check` and `npm test` pass under Node 22.
- [ ] CI is green on the final commit before merge.
