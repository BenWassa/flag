# Issue #24 — South America full four-domain expansion

**Status:** implementation substantially complete on `issue-24-south-america-expansion-v2`; data, generation and automated verification are green, but release QA identified remaining continent-generic UI/progress cleanup before this issue should be marked ready.

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

- [x] South America is onboarded through the shared global expansion architecture with no new continent-specific parallel system.
- [x] Exact 12-country and 5/3/4 scope membership is test-covered.
- [x] All four domains consume the intended shared scopes.
- [x] Canonical Natural Earth production topology is the sole map/outline/adjacency source.
- [x] French Guiana, Falklands/Islas Malvinas and nearby context have explicit documented policy.
- [x] Trinidad and Tobago remains outside the South America scored curriculum.
- [ ] Locations works for the continent and every region with fully continent-generic learner-facing copy. Data/interaction support is implemented, but final artifact QA found Africa-specific copy in the shared Locations quiz.
- [ ] Outlines derives from canonical whole-country geometry with multipart/framing QA. Automated geometry contracts pass; final production-scale visual inspection remains outstanding.
- [x] Neighbours includes complete cross-continent Colombia ↔ Panama adjacency.
- [x] No rivers are generated or rendered; selected lakes/ocean remain restrained context.
- [ ] Small-country/island assistance is based on production-scale inspection and regression-tested. Current generated inventory is explicitly `none`; production-scale visual confirmation remains outstanding.
- [x] Runtime stays lazy and within an explicitly verified performance budget.
- [ ] Routes, progress and achievement-support boundaries remain coherent. Routing/support and achievement tests pass, but final artifact QA found an Africa-centred Progress first-use/history assumption that should be generalised before release.
- [ ] Exact production artifact passes the shared visual release gate. The exact artifact was inspected and revealed the remaining UI/progress issues documented below; the visual gate is therefore intentionally not marked complete.
- [x] `npm run check` and `npm test` pass under Node 22.
- [x] CI was green on the cleaned implementation commit before this documentation update.

---

# Implementation worklog — 2026-08-22/23

This section records the actual Issue #24 execution rather than only the intended plan. It is deliberately detailed so later continent expansions can distinguish reusable work from temporary bootstrap/debugging steps.

## Branch and integration approach

- Re-read current Issue #24 and the repository state instead of assuming the older South America branch was still current.
- Found that the earlier `issue-24-south-america-expansion` work pre-dated the mode-first v0.6.0 navigation and was materially behind current `main`.
- Started the clean implementation from current `main` on `issue-24-south-america-expansion-v2` rather than trying to ship an obsolete integration.
- Opened draft PR #79, **Add South America across all four learning domains**, targeting `main` and intentionally left it unmerged.
- Verified before final implementation QA that the branch was based on current `main` (`431f42e5e86ac3b4cc421f3b4509a71eb8811ac6`) and was not behind it.

## Architectural finding

The #57 shared expansion foundation was strong enough to support South America without a second continent subsystem.

The existing architecture already allowed:

- geography coverage to be discovered through shared map/Neighbours registries;
- domain indexes to expose newly supported continents automatically through `scopeSupportsDomain` / `countryIdsForSupportedScope`;
- Locations and Outlines to consume canonical generated map geometry;
- Neighbours to consume continent-local fixtures backed by globally derived adjacency;
- continent map data to remain lazy-loaded;
- achievement curriculum completeness to be derived from actual domain support.

As a result, the South America implementation remained primarily configuration + generated data + verification work. No new router, persistence namespace, map renderer, outline source or Neighbours rules engine was introduced.

## Scope/configuration implemented

Added the locked South America curriculum to the shared map scope registry:

- **Andean — 5:** `BOL`, `COL`, `ECU`, `PER`, `VEN`;
- **Atlantic — 3:** `BRA`, `GUY`, `SUR`;
- **Southern Cone — 4:** `ARG`, `CHL`, `PRY`, `URY`;
- **South America total — 12**.

Added shared continent/region configuration and launcher focus anchors rather than hard-coding a separate South America presentation path.

Registered non-scoring keyed context countries:

- `PAN` for the Colombia/Panama northern boundary context;
- `FRA` so French Guiana is represented through canonical French sovereign identity rather than inventing a separate Atlas country.

`TTO` remains outside South America scoring and remains part of the North America/Caribbean curriculum.

## Canonical generator work

Extended the existing Natural Earth 1:10m generation configuration for South America. The canonical upstream commit remains:

`ca96624a56bd078437bca8184e78163e5039ad19`

Generation produced:

- all 12 scored South America country geometries;
- non-scoring context geometry required by policy;
- topology-derived shared political borders;
- topology-derived coastline;
- ocean/background context;
- one selected inland-water feature, **Lake Titicaca**;
- **no rivers**;
- generated region/continent focus data;
- global application-country adjacency followed by continent-local Neighbours fixtures.

Generator output reported:

- South America projected coordinates: **38,209 retained from 52,353**;
- selected lakes/reservoirs: **1**;
- river context: **0 / intentionally excluded**;
- global adjacency source features: **202**;
- optimised South America runtime source: approximately **884,699 bytes** before compilation in the generation log.

The compiled production verifier later measured the South America map module at:

- **884,934 bytes raw**;
- **241,960 bytes gzip**.

This stayed within the established continent-local runtime budget, so no performance-budget expansion was made.

## Policy decisions discovered during generation

The generator was kept fail-closed for unresolved geography. This exposed a useful policy case instead of silently absorbing it.

### French Guiana

- Not a separate Atlas target.
- Represented as non-scoring sovereign `FRA` context.
- Brazil and Suriname adjacency retains the real land relationship to sovereign France through French Guiana.
- No fake `GUF` application-country target was introduced.

### Falkland Islands / Islas Malvinas

- Explicitly documented as non-scoring disputed context.
- Not promoted to Atlas country status.
- No Atlas sovereignty position was invented.

### Trinidad and Tobago

- Explicitly kept outside South America scoring.
- Remains North America → Caribbean in the canonical curriculum.

### Southern Patagonian Ice Field

Natural Earth surfaced **Southern Patagonian Ice Field** as a feature inside the generated extent. Generation stopped for explicit review rather than guessing.

Final policy:

- treat it as **non-scoring undemarcated Argentina–Chile boundary context**;
- do not make it a country or learning target;
- preserve canonical Argentina/Chile scoring identity.

The decision is recorded in `docs/architecture/south-america-cartography-provenance.json`.

## Neighbours / global adjacency

Added generated global adjacency output and South America Neighbours registration through the shared registry.

Verified representative relationships, including:

- `COL` → `BRA`, `ECU`, `PAN`, `PER`, `VEN`;
- `BOL` → `ARG`, `BRA`, `CHL`, `PER`, `PRY`;
- `BRA` → `ARG`, `BOL`, `COL`, `FRA`, `GUY`, `PER`, `PRY`, `SUR`, `URY`, `VEN`;
- `SUR` includes sovereign `FRA` through French Guiana;
- Colombia ↔ Panama is retained even though the two targets live in different learner continents.

This proves the #57 rule that learner-continent slicing must not truncate real application-country adjacency.

No handwritten South America neighbour table was added.

## Locations and Outlines integration

- Added South America to the shared lazy map loader.
- Outlines continues to derive silhouettes from the same canonical map geometry; no South America-specific SVG set was created.
- Locations, Outlines and Neighbours support is surfaced through the shared domain-support selectors.
- The domain indexes therefore expose South America automatically once map/Neighbours coverage exists rather than through new UI conditionals.
- Current locator/hit-assist/callout inventory is **none**: generated South America country geometry has no unapproved `locator`, `hitAssist` or `callout` metadata.

The final production-scale decision on whether Guyana, Suriname, Uruguay or multipart/island cases need assistance remains part of the outstanding visual release gate rather than being guessed in advance.

## Verification added/updated

Added `scripts/verify-south-america.mjs` to assert the Issue #24 contract directly. It covers:

- exact 12-country membership;
- exact Andean 5 / Atlantic 3 / Southern Cone 4 membership;
- South America registration in the shared map architecture;
- `PAN` + `FRA` context-country policy;
- `TTO` exclusion from scoring;
- lazy `south-america.ts` loading;
- Lake Titicaca presence;
- no runtime river abstraction/data;
- no unapproved locator/hit/callout assistance;
- Colombia/Panama cross-continent adjacency;
- Brazil and Suriname sovereign-France adjacency;
- French Guiana, Falklands, Southern Patagonian Ice Field, Trinidad and cross-continent-adjacency provenance statements;
- production raw + gzip asset budget through the shared continent contract.

Several older verifiers contained intentionally temporary Africa-only assumptions from before a second generated continent existed. These were updated semantically rather than bypassed:

### `scripts/verify.mjs`

The generic domain-index assertion previously expected Locations to expose exactly one continent. It now derives the number of supported/shipped continents instead of encoding Africa-only state.

### `scripts/verify-continent-foundation.mjs`

The #57 foundation verifier previously asserted that the refactor itself did not make a second continent playable (`MAP_CONTINENT_CONFIGS.length === 1`). Issue #24 is the deliberate moment that temporary invariant becomes false. The verifier now checks that Africa remains registered and that the shared expansion architecture remains intact rather than requiring a one-continent product.

### `scripts/verify-domain-integration.mjs`

The cross-domain integration verifier previously expected Locations/Outlines/Neighbours to expose exactly one playable continent. It now derives shipped coverage while retaining the Africa regression checks.

### `scripts/verify-achievements.mjs`

The achievement verifier previously listed South America alongside continents with incomplete four-domain curriculum. Once Issue #24 registered all four domains, that became incorrect. The verifier now checks South America as complete curriculum while still proving that unsupported continents cannot accidentally earn completion.

These changes are not scoring/mastery-semantic changes; they remove stale Africa-only test assumptions so the existing support contracts can describe the expanded curriculum accurately.

## Generator/bootstrap sequence and why it happened

The branch initially registered the new lazy South America modules before their generated source files had been committed. That caused the expected pre-generation TypeScript failure: the imports existed but `south-america.ts` did not yet exist in Git.

I did not mask that with handwritten geometry.

A temporary bootstrap path was used so the repository's own pinned generator could create the exact files under Node 22:

1. temporary declarations allowed the pre-generation TypeScript check to resolve the not-yet-generated modules;
2. CI ran the canonical generator;
3. the generated South America map, Neighbours fixture and provenance were staged into the tested artifact;
4. generation/verification failures were fixed at their real source rather than bypassed;
5. after the complete suite went green, the exact generated source bytes from the green CI checkout were committed back to the branch;
6. the temporary declarations, staging helper, branch-specific generation workflow and temporary write-enabled CI configuration were removed;
7. standard read-only CI and the normal `npm test` contract were restored.

The generated geography commit from the green CI checkout was `d330f434c1bd40eedd2f6aec3fa74b1f95a73d67`.

The later cleaned implementation commit used for final normal CI was `6b525427c300a33d7631ce4ea54ce5e0b4930879`.

The temporary bootstrap machinery is **not** part of the intended final Issue #24 architecture.

## CI/debugging sequence

The implementation was driven through the full suite rather than only the new focused verifier. Notable failures caught and resolved in order:

1. missing generated South America module at pre-generation TypeScript check;
2. Natural Earth `Southern Patagonian Ice Field` feature requiring explicit policy review;
3. stale generic Locations index assertion expecting one shipped continent;
4. stale #57 foundation assertion forbidding a second generated continent;
5. one expected-neighbour test ordering typo in the new South America verifier;
6. stale cross-domain integration assertion expecting one non-Flags continent;
7. stale achievement assertion treating South America as incomplete curriculum.

After those were resolved, the full suite passed under Node 22.

The successful normal CI run on cleaned commit `6b525427c300a33d7631ce4ea54ce5e0b4930879` completed:

- `npm install` — success;
- `npm run check` — success;
- `npm test` — success;
- production `dist` artifact upload — success.

The complete verification pass included the existing routing, learning-evidence, Africa regression, map/cartography, outline, Neighbours, keyboard/mobile gesture, zero-neighbour, feedback, Flags study, domain integration, achievements, progress, British English, brand and action-feedback verifiers in addition to the new South America verifier.

## Exact production artifact evidence

The exact `flag-atlas-dist` artifact from the successful cleaned CI run was downloaded and inspected rather than relying only on source output.

Artifact metadata:

- workflow run: `32615572098`;
- artifact ID: `9486829809`;
- artifact name: `flag-atlas-dist`;
- artifact archive size: `783455` bytes;
- artifact digest: `sha256:489f0f83f8b7f582be4a29c577df788f2a99149049d01b9fb1c4bfb7f602c015`.

The generated South America production module in that artifact matched the previously tested generated output. Its SHA-256 was recorded as:

`ebe206e5316ca6d3b5d17841dc94b7f663125b40a5b9758b0ce22cbdbb3b4ff5`

This confirms the canonical generated bytes survived the cleanup from bootstrap CI back to the normal build path.

## Production artifact QA finding: Africa-specific Locations copy

Final artifact inspection found a genuine second-continent UI defect in the otherwise shared Locations quiz.

`src/ui/views/map-quiz.ts` still contains Africa-specific learner-facing copy inside a generic component, including:

- `Africa country map`;
- `Africa map with ${session.scope.label} active`;
- `swipe or drag to pan Africa`;
- `pinch to zoom · swipe or drag to pan Africa`.

This means the South America Locations data, routing and map asset are available, but the shared learner-facing instructions/ARIA labels are not yet continent-generic.

The required fix is a root-cause genericisation of the shared map quiz using the current scope/continent identity, plus a regression assertion that South America rendering cannot contain Africa-specific copy. It should **not** be fixed with South America-only conditionals.

This was identified during final production-artifact QA and was not claimed as complete.

## Production artifact QA finding: Africa-centred Progress assumptions

The Progress surface also still contains an Africa-first assumption unrelated to geography generation:

- `renderProgress` builds its studied/history summary using a constant `AFRICA_SCOPE`;
- first-use copy says `Practise any Africa domain to begin building regional mastery.`

Now that South America is a complete four-domain curriculum, those assumptions can under-report South America-only study activity and present misleading Africa-only first-use text.

Achievement read models already understand South America curriculum completeness; this is a presentation/history aggregation issue, not a mastery-rule change.

The required fix is to aggregate studied/history state across shipped curriculum using the existing shared progress/support infrastructure and make the learner-facing copy continent-neutral. Do not alter evidence qualification, mastery thresholds, persistence namespaces or earned-achievement semantics as part of that cleanup.

## Browser/device QA evidence and limitation

The exact production artifact was downloaded and inspected. A Chromium binary was available in the execution environment, but organisational browser policy blocked local/file URL navigation for the extracted artifact. Therefore:

- no claim is made that phone/device/browser interaction testing was completed;
- no claim is made that portrait + short-landscape visual QA is complete;
- the required visual release gate remains open;
- the artifact inspection itself was still valuable because it exposed the Africa-specific Locations and Progress assumptions above.

The next implementation pass should fix those shared UI assumptions, rerun the complete Node 22 suite, inspect a newly built exact artifact, and perform the required responsive/browser visual gate in an environment that can load the production build.

## Current state at handoff

### Implemented and automated-green

- locked 12-country South America curriculum;
- locked 5/3/4 regional membership;
- shared continent/map registration;
- lazy South America map loading;
- canonical Natural Earth generated map geometry;
- canonical Outlines consumption of that geometry;
- generated global adjacency + South America Neighbours fixture;
- complete Colombia ↔ Panama relationship;
- French Guiana as non-scoring sovereign France context;
- explicit Falklands/Trinidad/Southern Patagonian Ice Field policy;
- Lake Titicaca-only selected inland water;
- no rivers;
- no predeclared locator/hit/callout assistance;
- four-domain support/achievement curriculum recognition;
- focused South America verifier;
- full Node 22 `npm run check` + `npm test` pass;
- standard read-only CI restored and green;
- exact final `dist` artifact produced and inspected.

### Still required before PR #79 should be marked ready

1. Generalise Africa-specific learner-facing copy in the shared Locations quiz and add a South America regression assertion.
2. Generalise Africa-centred Progress first-use/history aggregation without changing evidence/mastery semantics.
3. Rerun full Node 22 `npm run check` and `npm test` after those fixes.
4. Reconfirm the branch against current `main` immediately before finalisation and resolve any intervening conflicts semantically.
5. Inspect the newly generated exact production artifact.
6. Complete the issue's required production-scale visual QA: South America + all three regions, Guianas/northern edge, Ecuador multipart Outline, Chile Outline, Bolivia/Brazil Neighbours, Colombia/Panama, phone portrait and short landscape.
7. Re-evaluate the `none` locator/callout inventory only from that production-scale inspection; do not add assistance speculatively.
8. Confirm final CI is green.
9. Keep PR #79 unmerged until all of the above release gates are satisfied.

## Reusable lessons for later continent expansions

- The shared #57 architecture is sufficient for a second continent; future expansion should continue through registry/configuration + generated assets rather than new continent-specific systems.
- Fail-closed generator policy review is useful. The Southern Patagonian Ice Field case proved unresolved Natural Earth features should stop generation for an explicit decision.
- Global adjacency must be derived before learner-continent slicing. Colombia/Panama and French Guiana/France prove why.
- Old verifiers can encode temporary product state. When expansion deliberately changes that state, update assertions to the architectural invariant rather than deleting the tests.
- A green data/contract suite does not prove shared UI text is continent-generic. Each new continent should include a learner-facing copy regression pass.
- Progress/history aggregation must follow shipped curriculum rather than an Africa constant now that more than one complete geography curriculum exists.
- Commit generated geography from the canonical generator; never manually recreate large geometry when bootstrapping a new generated module.
- Keep exact-artifact inspection as a release gate even when all source and domain tests are green.
