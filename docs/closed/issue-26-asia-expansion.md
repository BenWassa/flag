# Issue #26 — Asia full four-domain expansion

**Status:** implementation in progress on `issue-26-asia-middle-east-expansion`; PR #82 is open and intentionally unmerged. The shared expansion prerequisites are present on `main`. Issue #28's locked Middle East policy is being consumed inside this issue rather than implemented as a parallel subsystem. Canonical Asia generation now succeeds, but the full Node 22 verification suite is not yet green and final production/browser QA has not been claimed.

## Implementation worklog — 2026-08-22/23

This section records the actual implementation sequence, decisions, failures and verification evidence from the current branch. It is deliberately explicit so later work does not have to reconstruct the reasoning from chat or CI logs.

### Branch / PR / sequencing

- Started from the then-current `main` after checking the expansion foundation and current issue state rather than relying on earlier chat context.
- Confirmed the shared continent expansion prerequisites (#57 and #58) were already completed on `main` before beginning Asia-specific work.
- Created/used the dedicated branch `issue-26-asia-middle-east-expansion`.
- Opened focused PR #82, **Add Asia and Middle East across all learning domains**.
- PR #82 remains open and unmerged.
- Chose Issue #26 as the owning implementation unit for Asia and deliberately consumed Issue #28 inside it. Middle East is therefore not being built on a separate branch with separate geography, routing, progress or mastery semantics.
- The sequencing rule for this branch is: establish shared scope/taxonomy semantics first; wire the four learning domains and progress/achievement consumers to that contract; extend the canonical generator only where the shared architecture is insufficient; then generate geography; then harden verifiers; then run the final production/visual gate.

### Learner-scope and compatibility model implemented

The branch establishes six learner-facing Asia regional scopes:

- Central Asia;
- East Asia;
- Southeast Asia;
- South Asia;
- Middle East;
- Caucasus.

The important distinction is that canonical country ownership and learner-facing scope membership are no longer treated as the same concept.

- Asia retains exactly 48 canonical Atlas countries.
- Middle East is the locked 17-country #28 scope and includes Egypt (`EGY`).
- Egypt remains canonically African and remains part of North Africa. No second Egypt country record, progress record or geometry identity was created.
- Caucasus is exactly Armenia (`ARM`), Azerbaijan (`AZE`) and Georgia (`GEO`). These countries are not silently classified as Middle Eastern.
- The old `west-asia` identifier is retained only as a hidden compatibility/formal scope where existing routes or persisted achievement data require it. It is not retained as an ordinary learner-facing near-duplicate region.
- Previously persisted `west-asia` mastery can remain readable, while hidden legacy West Asia is not intended to earn new completion/mastery awards.
- Middle East is the proving case that regional learning scopes may overlap canonical continent ownership rather than form a strict partition.

### Four-domain integration performed

The Asia/Middle East scope model has been wired through the shared curriculum/runtime path rather than hard-coded independently per game.

Work performed includes:

- Asia support registration for Flags, Locations, Outlines and Neighbours;
- shared learner-scope membership consumption by all four domains;
- Asia and its six learner-facing regions becoming routable domain scopes;
- Flags using the same Middle East/Caucasus scope definitions as the geography domains;
- Locations/Outlines/Neighbours consuming the generated Asia geography through the existing continent runtime/lazy-loading architecture;
- progress and achievement/read-model logic updated so overlapping scopes can be evaluated from canonical country evidence;
- Asia treated as a complete four-domain curriculum for achievement aggregation once its six learner scopes are supported;
- legacy `west-asia` persistence kept readable without making it a new learner-facing completion unit.

No scoring threshold, country-evidence model, mastery storage namespace or canonical country identity was intentionally duplicated for Asia.

### Generator architecture changes

Asia exposed several assumptions in the Africa-first generator that needed to become generic architecture rather than Asia-only exceptions.

The branch extends the shared generation core to support:

1. **Cross-continent render context without corrupting fitted extent**
   - Some context countries are required for truthful geography but should not dominate the learner-continent camera.
   - The generator now supports a configurable fit-context policy so a huge non-scoring context country such as Russia can be rendered where required without forcing the whole Asia projection to fit Russia's full cross-continent extent.

2. **Extra countries needed for complete adjacency**
   - Global topology-derived adjacency may need a canonical country that is outside the continent's 48-country ownership set.
   - The generator can include explicitly configured additional adjacency countries without turning them into ordinary Asia-scored countries.
   - This is required for cross-continent relationships and for the Middle East overlap model.

3. **Explicit learning-scope focus geometry**
   - Region focus bounds are no longer required to be inferred only from each country's formal `region` field.
   - Configured learning scopes can produce their own focus bounds from exact scope membership.
   - This is required for Middle East because it contains African-owned Egypt, and for any future overlapping conventional learning scope.

4. **Projection consistency**
   - The same projection input policy is used for output generation and source comparison so context exclusions do not introduce inconsistent geometry checks.

These are shared generator capabilities. No second Middle East topology source or handwritten geometry system was introduced.

### Geography generation and source-policy audit

The canonical Natural Earth generation workflow is now able to generate Asia successfully from the pinned source data.

During implementation the unresolved-source-feature guard correctly stopped generation until several Natural Earth features inside the Asia extent were explicitly classified. The audit included the already anticipated Taiwan/Northern Cyprus/Kashmir cases and additionally surfaced:

- Cyprus No Mans Area;
- Indian Ocean Territories;
- Scarborough Reef.

These were not silently promoted to learner countries. They were explicitly treated according to the non-scoring/source-context policy so the canonical 195-country application catalogue remains the scoring identity source.

The generator also exposed a physical-context assumption around the Caspian: the pinned Natural Earth lakes source did not expose it under the initially expected lake name/layer path. The implementation did not bypass the source contract or add handwritten water geometry. The generated Asia artifact currently reports two selected lakes/reservoirs, and linear river context remains intentionally excluded.

Observed generation evidence from the Node 22 CI run:

- Asia projected coordinates retained: `114766 / 157545`;
- generated Asia source/runtime asset optimisation: `4,810,463` bytes to `2,842,709` bytes (`59%` of the pre-optimised source size);
- lightweight Asia neighbour fixture: 49 ISO3 entries because the generated support set includes the 48 canonical Asia countries plus the required overlapping/cross-scope country support;
- global adjacency was derived from 202 canonical Natural Earth source features;
- Natural Earth source commit remained `ca96624a56bd078437bca8184e78163e5039ad19`;
- rivers remain excluded.

These generation byte counts are **not** a substitute for the final built production chunk/gzip budget. Exact production bundle/lazy-load size still has to be recorded from the final green build.

### Africa no-regression investigation

The initial regression gate compared regenerated Africa directly with the checked-in Africa production artifacts and failed. Investigation showed this was not sufficient evidence that Asia had changed Africa: clean current `main` itself already regenerates its checked-in Africa map/provenance differently.

The gate was therefore hardened rather than removed:

1. CI checks out clean current `main` in a separate worktree.
2. It runs the canonical map generator there and captures the resulting Africa map, neighbours and provenance outputs.
3. The Asia branch applies the shared generator extensions and runs generation again.
4. The branch-generated Africa outputs are compared byte-for-byte with the **clean-current-main regenerated** Africa outputs.
5. Those outputs are byte-identical.
6. The branch then restores the checked-in Africa production files so Issue #26 does not include unrelated Africa artifact churn.

Result: the shared Asia generator changes have been proven not to alter Africa generation semantics relative to the same current-main generator baseline, while the branch leaves the checked-in Africa production artifacts untouched.

Separate repository finding: current `main` does not presently reproduce all of its checked-in Africa map/provenance bytes when `npm run maps:generate` is run. That pre-existing reproducibility drift should not be falsely attributed to Issue #26.

### Verifier hardening performed

Asia also surfaced old verifier assumptions that encoded the Africa-first product state instead of testing architecture.

Work already performed/identified includes:

- routing verification updated so `/locations/asia` is expected to survive availability normalisation now that Asia Locations is shipped on this branch;
- achievement verification updated so Asia can be a complete four-domain continent;
- hidden legacy `west-asia` no longer receives new mastery awards while previously stored mastery remains readable;
- an Asia-specific expansion verifier was added/registered to cover the high-risk contracts, including exact membership, Middle East/Caucasus separation, Egypt ownership, representative global adjacency, zero-land-neighbour islands, river exclusion, lazy-loading and provenance expectations;
- generator tests now cover overlapping scopes rather than assuming every learner region is a strict partition of a continent.

### Current CI / test state

The canonical generation step succeeds and the strengthened Africa semantic no-regression gate succeeds.

The current full `npm test` run on Node `22.23.2` proceeds through:

- TypeScript `check` successfully;
- production `build` successfully;
- then enters the verifier suite.

It currently stops in the pre-existing general `scripts/verify.mjs` UI assertion:

```text
AssertionError [ERR_ASSERTION]: Locations opens only the continent it has actually shipped.

2 !== 1
```

That assertion hard-codes the old Africa-only product state by requiring exactly one playable Locations continent. On this branch there are correctly two: Africa and Asia. This verifier must be changed to assert the supported-continent contract rather than the historical literal count. Additional stale Africa-only assumptions, if any, can only be discovered after this gate is corrected.

Because `npm test` is not yet fully green:

- generated Asia artifacts have not been declared final;
- the branch is not merge-ready;
- CI is not claimed green;
- final production artifact inspection is not claimed complete;
- browser/device QA is not claimed complete.

### Temporary CI instrumentation

To execute and inspect the expensive canonical generation transaction on the repository's Node 22 runner, the branch temporarily instrumented the PR CI workflow to:

- install dependencies;
- create a clean-main Africa generation baseline;
- apply the shared generator/verifier hardening used by the branch;
- run canonical map generation;
- prove Africa semantic no-regression;
- run the full `npm test` gate;
- only commit/push generated canonical Asia source after all gates succeed;
- restore the normal CI workflow before the generated-source commit.

The current test failure occurs before that final commit step, so the temporary CI transaction has not been represented as final repository CI. The normal workflow must be restored and rerun green before merge readiness is claimed.

### Remaining work before this issue can be called complete

1. Replace the stale hard-coded Africa-only playable-continent assertion in `scripts/verify.mjs` with the correct supported-continent contract.
2. Continue the full Node 22 suite and fix any further stale assumptions exposed behind that assertion without weakening the new Asia contracts.
3. Commit the canonical generated Asia map/neighbour/provenance outputs and the generic generator changes only after the generation/test gates pass.
4. Restore the repository's normal CI workflow if temporary generation instrumentation is still present.
5. Sync the then-current `main` into this branch and resolve conflicts semantically.
6. Rerun the **complete** `npm test` suite on Node 22 after the sync.
7. Inspect the exact final `dist` production artifact and record actual Asia lazy-load/chunk raw+gzip size rather than relying on generator source byte counts.
8. Perform the required production visual QA for full Asia and all six regional scopes, including phone portrait and short landscape, Middle East framing, Caucasus, small Gulf/island targets, Southeast Asian archipelagos and representative Outlines/Neighbours cases.
9. Record any minimum locator/callout/hit-assist decisions from that actual production-scale inspection. Do not invent a blanket small-country callout policy.
10. Confirm direct routes and browser Back/Forward behaviour in the actual built app.
11. Confirm final PR CI is green.
12. Leave PR #82 unmerged for review unless a separate explicit merge instruction is given.

### Verification claims boundary

What has actually been demonstrated so far:

- canonical Asia generation executes successfully on Node 22;
- the exact 48-country canonical Asia model and six-region learner-scope architecture are implemented in the branch;
- the Middle East/Caucasus/legacy-West-Asia compatibility model is represented in shared scope logic;
- the canonical generator can handle overlapping learning scopes and required cross-continent context/adjacency;
- source-policy guards were exercised rather than bypassed;
- branch generator changes produce Africa outputs byte-identical to clean-current-main generation;
- TypeScript checking and production build reach success in the instrumented CI run before the verifier failure.

What has **not** yet been demonstrated and must not be claimed:

- full `npm test` green;
- normal final PR CI green;
- final built Asia gzip/runtime budget;
- completed visual/browser/device QA;
- final locator/callout inventory;
- merge readiness.

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
