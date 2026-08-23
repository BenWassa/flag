# Issue #25 — Europe full four-domain expansion

**Status:** active implementation on `issue-25-europe-expansion`; draft PR #83 is open and intentionally unmerged. The shared #57 expansion foundation is already merged. Europe generation is working, but the issue is **not complete**: Vatican City still degenerates during shared topology simplification, Europe Neighbours is not yet registered in the runtime, focused verification is incomplete, the runtime-size gate is unresolved, and final production/browser QA has not been performed.

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

---

## Implementation worklog — 22–23 August 2026

This section records the work actually performed on Issue #25. It is deliberately explicit about failed approaches, temporary infrastructure, generated evidence and unresolved gates so a later implementation pass does not have to reconstruct state from chat or commit history.

### Working branch and PR

- Work is isolated on branch `issue-25-europe-expansion`.
- The branch was created from `main` at `431f42e5e86ac3b4cc421f3b4509a71eb8811ac6` (`v0.6.0`, mode-first navigation).
- `main` was rechecked before the first PR was opened and was still at the same SHA, so there was no sync drift to resolve at that point.
- Draft PR **#83 — Add Europe support across all learning domains** is open against `main`.
- PR #83 is intentionally **draft and unmerged**. Do not merge it until the unresolved gates below are closed and the final branch is resynchronised with current `main`.
- The shared prerequisite, Issue #57, was already merged before this Europe implementation started.

### Curriculum and shared scope registration implemented

`src/data/map-scopes.ts` now registers Europe through the same shared continent/scope architecture used by Africa rather than introducing Europe-specific lookup systems.

Implemented scope membership is exactly:

- Northern Europe: 10;
- Western Europe: 9;
- Eastern Europe: 10;
- Southern Europe: 15;
- total scored Europe curriculum: 44.

The Europe continent configuration also keys the following canonical countries as **non-scoring context only**:

- Türkiye (`TUR`);
- Cyprus (`CYP`);
- Armenia (`ARM`);
- Azerbaijan (`AZE`);
- Georgia (`GEO`).

These remain owned by the Asia/Middle East/Caucasus work and are not added to Europe's scored curriculum.

### Lazy map loading implemented

`src/data/maps/index.ts` now includes an `europe` dynamic-import loader alongside Africa.

Important architectural behaviour retained:

- opening an unrelated scope does not eagerly import Europe geometry;
- Europe uses the generic `loadContinentData` / `loadMapAsset` path;
- continent data remains cached after the first successful module load;
- transient chunk-load failures still clear the cache entry so a later retry is possible;
- no second Europe-specific map runtime was created.

Lazy loading still needs an explicit focused verifier before Issue #25 can be considered complete.

### Canonical Natural Earth generation

Europe was added to the shared Natural Earth 1:10m generation configuration and generated through the existing canonical topology pipeline.

The implementation does **not** contain handwritten country polygons or a second Europe geometry source.

The generator produced:

- all 44 scored European countries;
- five keyed context countries (`TUR`, `CYP`, `ARM`, `AZE`, `GEO`);
- shared political-border mesh;
- coastline;
- ocean/background;
- selected lakes;
- Europe continent and region focus bounds;
- global application-country adjacency;
- generated Europe provenance.

Generated outputs currently include:

- `src/data/maps/europe.ts`;
- `src/data/neighbors/europe.ts`;
- updated `src/data/neighbors/global.ts`;
- `docs/architecture/europe-cartography-provenance.json`;
- `docs/open/europe-generation-inspection.txt`.

### Fail-closed special-feature audit

The first Europe generation attempt correctly failed because Natural Earth features were present that had not yet been assigned explicit policy. The unresolved set surfaced by the generator was:

- Gibraltar;
- Jersey;
- Guernsey;
- Isle of Man;
- Åland;
- Faroe Islands.

These were reviewed and explicitly classified as **non-scoring context**, not Atlas application-country targets. Kosovo is likewise retained as non-scoring source context under the existing canonical-country policy.

The resulting Europe generation policy now records explicit treatment for:

- Kosovo;
- Gibraltar;
- Jersey, Guernsey and Isle of Man;
- Åland;
- Faroe Islands;
- Türkiye/Cyprus/Caucasus context;
- overseas/dependent source features generally.

This preserves the fail-closed rule: an unclassified source feature should stop generation for policy review rather than silently becoming a target or being merged into a neighbour.

### Russia and transcontinental policy implemented

Russia remains one canonical `RUS` country and one canonical source geometry.

The implementation deliberately avoids a hand-cut "European Russia" polygon.

For Europe framing:

- `RUS` is excluded from viewport fit/focus calculations so far-eastern Russia does not shrink Europe;
- the rendered SVG viewport may visually crop off-canvas geometry;
- the underlying canonical country geometry remains whole-country;
- global adjacency remains whole-country and cross-continent.

Observed generated Russia adjacency is:

`AZE, BLR, CHN, EST, FIN, GEO, KAZ, LTU, LVA, MNG, NOR, POL, PRK, UKR`.

This confirms that the generator retains Russia's Asian land relationships rather than reducing Neighbours to Europe-only borders.

### France and Norway framing hardening

The first production generation exposed the same class of framing problem for other multipart countries:

- France's canonical geometry includes French Guiana;
- Norway's canonical multipart geometry includes remote northern/island geometry.

Both materially distorted Europe regional focus when treated as ordinary fit inputs.

The current Europe generation policy therefore excludes `FRA` and `NOR`, together with `RUS`, from Europe fit/focus calculations only. Their canonical country geometry is not rewritten or replaced.

Observed generated France adjacency includes:

`AND, BEL, BRA, CHE, DEU, ESP, ITA, LUX, MCO, SUR`.

The Brazil and Suriname relationships confirm that French Guiana remains part of the canonical whole-country topology.

### Selected physical context and no-rivers policy

Europe generation currently includes:

- Lake Ladoga — required;
- Lake Onega — optional and present in the generated output.

No rivers were added. The post-#54 no-rivers policy is preserved.

### Microstate production-scale findings and assistance policy

Initial generated geometry inspection showed that several mainland microstates are extremely small at the shared Europe canvas scale and Vatican City collapses particularly aggressively.

The current Europe-specific assistance inventory is:

- Andorra (`AND`) — mainland callout;
- Liechtenstein (`LIE`) — mainland callout;
- Luxembourg (`LUX`) — mainland callout;
- Monaco (`MCO`) — mainland callout;
- San Marino (`SMR`) — mainland callout;
- Vatican City (`VAT`) — mainland callout metadata;
- Malta (`MLT`) — island locator, no mainland callout.

The branch also marks `AND`, `LIE`, `LUX`, `MCO`, `SMR`, `VAT` and `MLT` as precision-sensitive for runtime path rounding. These IDs retain two decimal places while ordinary runtime geometry continues to use the shared lower-precision optimisation.

The generated QA inspection after hardening recorded the following approximate geometry extents on the Europe canvas:

- Andorra: `2.25 × 1.75` canvas units;
- Liechtenstein: `0.85 × 1.64`;
- Luxembourg: `4.79 × 5.68`;
- Monaco: `0.43 × 0.35`;
- San Marino: `0.65 × 0.72`;
- Vatican City: `0 × 0` — **still degenerate**;
- Malta: `2.57 × 2.19`, with a radius-7 island locator.

The callout targets are therefore grounded in actual generated production-scale geometry rather than country-name heuristics alone. However, physical browser/device play has **not** yet been performed, so the final minimum-assistance inventory remains subject to the issue's required visual/motor QA.

### Vatican City unresolved generator defect

Vatican City is the most important remaining cartography blocker.

The current generated `VAT` path still has zero width and zero height even after the runtime precision-sensitive rounding change. This proves the loss occurs **before runtime rounding**, during the shared topology simplification/quantisation stage.

Consequences:

- a callout can make the Locations target addressable, but it does not repair the canonical silhouette;
- Outlines cannot be considered correct while the canonical generated Vatican path is degenerate;
- simply increasing final SVG decimal precision does not solve the root cause.

The intended next fix is generator-level and must remain inside the canonical pipeline: for an explicitly precision-sensitive country whose simplified geometry degenerates, retain/use the canonical projected pre-simplification geometry for that country's silhouette rather than inventing or hand-editing a polygon. This needs implementation and regression coverage before the Outlines acceptance criterion can be checked.

### Outline source preference changed

`src/domain/outline.ts` was changed so `normalizeOutlineGeometry` prefers `outlinePath` over `path` when both are present.

Purpose:

- a map may eventually retain viewport-oriented render geometry while also retaining a canonical whole-country silhouette;
- Outlines should consume the canonical silhouette rather than accidentally preferring a map-display path.

No alternative polygon source was introduced. Both fields must continue to originate from the shared production generator.

### Global adjacency generation and representative checks

The Europe generator is configured for `adjacencyMode: 'global'`, so Europe Neighbours data is sliced from the global canonical application-country topology rather than from a Europe-only adjacency table.

Representative generated results observed in `docs/open/europe-generation-inspection.txt` include:

- Russia → `AZE, BLR, CHN, EST, FIN, GEO, KAZ, LTU, LVA, MNG, NOR, POL, PRK, UKR`;
- France → `AND, BEL, BRA, CHE, DEU, ESP, ITA, LUX, MCO, SUR`;
- Spain → `AND, FRA, MAR, PRT`;
- Liechtenstein → `AUT, CHE`;
- San Marino → `ITA`;
- Vatican City → `ITA`;
- Iceland → `[]`;
- Malta → `[]`.

These observations are useful evidence, but they are not a substitute for the focused Issue #25 verifier that still needs to assert the complete policy contract.

### Europe Neighbours runtime integration is not finished

`src/data/neighbors/europe.ts` has been generated, but `src/data/neighbors/index.ts` still registers only Africa in `NEIGHBOR_CONTINENT_DATA`.

Therefore Europe Neighbours is **not yet learner-facing/runtime-complete** even though canonical Europe adjacency exists on the branch.

Required follow-up:

- import/register the Europe adjacency fixture through the existing generic neighbour registry;
- define the Europe coverage-exclusion policy explicitly rather than copying Africa's exclusions;
- preserve truthful zero-neighbour states such as Iceland and Malta;
- verify all Europe continent/region neighbour scopes;
- do not introduce a parallel Europe neighbour system.

### Generated focus hardening results

Before hardening, Europe focus calculations were visibly dominated by transcontinental/overseas multipart geometry. The regenerated focus data after excluding `RUS`, `FRA` and `NOR` from fit/focus calculations is materially more continent-scale.

Current generated focus records include approximately:

- Europe: full `835 × 723` canvas;
- Eastern Europe: `223.45 × 170` focus window;
- Northern Europe: `359.19 × 198.54`;
- Southern Europe: `434.30 × 207.23`;
- Western Europe: `625.96 × 393.91`.

These values are generated evidence only. The required portrait/short-landscape visual inspection is still outstanding.

### Runtime-size evidence and unresolved performance gate

The hardened generated Europe runtime asset currently measures:

- raw: **2,378,481 bytes**;
- gzip level 9: **599,393 bytes**.

This is recorded in `docs/open/europe-generation-inspection.txt`.

The size is materially heavy and the Issue #25 runtime-budget acceptance criterion is **not yet satisfied**. No claim is being made that this is an acceptable production budget.

The next optimisation pass must preserve:

- topology/shared edges;
- canonical country identity;
- required microstate geometry;
- complete global adjacency;
- lazy module loading.

Do not solve size pressure by independently simplifying neighbouring country polygons or creating a lower-quality Europe-only source.

### Generator / GitHub Actions execution history

Several temporary branch-only workflow approaches were used while trying to execute the canonical generator remotely under Node 22. These attempts are recorded here because they explain otherwise confusing intermediate commits and should not be repeated blindly.

1. A temporary generator workflow was added to execute the existing Natural Earth generator and commit generated outputs.
2. One trigger commit accidentally matched its own skip guard, so the workflow did not run. The guard issue was identified before treating any output as valid.
3. A later generation attempt correctly failed closed on unclassified European source features. This produced the Gibraltar/Jersey/Guernsey/Isle of Man/Åland/Faroe policy work above.
4. Additional temporary `harden-europe` / `apply-europe-seams` workflows were tried to patch generator hardening seams. New branch-only workflow creation/update behaviour proved inconsistent as an execution route, including cases where the workflow file existed but was not scheduled as intended.
5. The implementation was therefore moved back to normal reviewable repository-file changes rather than relying on workflow scripts as the source of truth.
6. A draft PR was opened so the repository's normal `pull_request` Actions path could be used as the supported CI entry point.
7. CI was temporarily routed so PR #83's Europe job checked out the feature branch, ran the canonical generator on Node 22, ran `npm run check`, ran `npm run build`, wrote the inspection evidence, committed deterministic generated outputs, and restored the normal CI workflow from `main` in the resulting branch commit.
8. GitHub Actions run **32615753796**, job `regenerate-europe`, completed successfully. Its generation, check, build, inspection and generated-output commit steps all completed successfully.
9. The resulting bot commit is `1f148022b22a5784c16e9a4af41ca3447cf4bdb0` — `Regenerate Europe geography after QA hardening`.
10. The stale experimental `.github/workflows/harden-europe.yml` file was subsequently found still present on the branch and was explicitly deleted in commit `b0cac0e61a3cd4f88e9be3a47e0627e8aa19d913` before this worklog was committed. Temporary Europe workflow helpers must not ship.

The workflow history is implementation scaffolding only. The production solution remains ordinary shared generator/config/runtime code.

### Verification actually performed so far

Confirmed through the successful Node 22 regeneration job:

- canonical `npm run maps:generate` completed;
- `npm run check` completed successfully at the regeneration commit;
- production `npm run build` completed successfully at the regeneration commit;
- Europe generated asset inspection completed;
- all 44 scored IDs were present in generated geometry;
- all five keyed context countries were present;
- selected lakes were present;
- representative global adjacency was inspected;
- microstate generated bounds and assistance metadata were inspected;
- raw/gzip Europe runtime size was recorded;
- generated region focus values were recorded.

Not yet sufficient / not yet performed:

- full final `npm test` on the eventual final branch head;
- focused Issue #25 verifier for membership, policy, adjacency, assistance, lazy loading and runtime budget;
- final CI on the eventual final commit after all remaining implementation changes;
- exact final production artifact inspection after those changes;
- browser visual QA of the full Europe continent and all four regions;
- phone portrait QA;
- short-landscape QA;
- physical-device motor testing of microstates;
- representative Europe Outlines play after the Vatican fix;
- representative Europe Neighbours play after runtime registration.

No browser/device testing should be inferred from the generator inspection. None has been claimed.

### Files materially changed/created by the Europe implementation to date

The branch currently contains material Issue #25 changes in or generated from:

- `scripts/map-continent-configs.mjs` — Europe generation scope, context policy, fit/focus exclusions, lakes, microstate assistance and precision-sensitive IDs;
- `scripts/optimize-map-runtime.mjs` — per-country precision retention for configured precision-sensitive geometry;
- `src/data/map-scopes.ts` — Europe continent and 10/9/10/15 regional shared scope registration;
- `src/data/maps/index.ts` — lazy Europe map-module registration through the shared loader;
- `src/data/maps/europe.ts` — generated Europe production map asset;
- `src/data/neighbors/europe.ts` — generated Europe adjacency fixture;
- `src/data/neighbors/global.ts` — generated global adjacency data;
- `src/domain/outline.ts` — canonical `outlinePath` preference when a retained silhouette exists;
- `docs/architecture/europe-cartography-provenance.json` — generated Europe source/projection/topology provenance;
- `docs/open/europe-generation-inspection.txt` — raw generated QA evidence;
- this issue worklog.

Some generated shared files such as Africa provenance/map output may appear changed because `maps:generate` regenerates all configured continents. Before finalising the PR, review those diffs semantically and avoid retaining unrelated generated churn that is not required by the shared generator change.

### Current blockers / required next implementation sequence

Do not merge PR #83 yet. The recommended continuation order is:

1. **Fix Vatican City at the generator stage.** Detect degeneracy after shared simplification for explicitly precision-sensitive IDs and retain a canonical pre-simplification projected silhouette where required. Add regression coverage; do not hand-draw Vatican geometry.
2. **Regenerate and inspect again.** Confirm Vatican has non-zero canonical outline geometry, microstate assistance remains correct, and whole-country/transcontinental policy still holds.
3. **Register Europe Neighbours in `src/data/neighbors/index.ts`.** Reuse the existing generic continent registry and define any Europe exclusions explicitly.
4. **Add a focused Europe verifier.** Assert exact 44 and 10/9/10/15 membership, context-only countries, special territories, Russia/France global adjacency, microstate adjacency, islands, lakes/no-rivers, exact assistance inventory, lazy loading and runtime size.
5. **Resolve the performance budget.** Set/confirm the acceptable lazy Europe asset budget and optimise only through topology-safe shared mechanisms.
6. **Run the complete Node 22 verification path.** `npm run check` plus full `npm test`, not only the build/check subset used during generation.
7. **Sync current `main` before finalising.** Resolve any conflicts semantically and rerun all verification on the rebased/merged final branch state.
8. **Inspect the exact production artifact.** Do not rely only on source files or intermediate generated data.
9. **Perform the required visual/browser QA.** Full Europe, each region, dense clusters, all microstates, Iceland/Malta, Russia framing, representative Outlines and Neighbours, portrait and short landscape. Record exactly what environments were actually tested.
10. **Require green final CI.** Only after the final commit is green should the PR be considered ready for review/merge.

### Current merge status

**PR #83 must remain unmerged.**

The branch has a functioning canonical Europe foundation and useful hardening evidence, but Issue #25 is not complete until the Vatican silhouette, Europe Neighbours runtime registration, focused verification, runtime budget, full test suite, production-artifact inspection and required visual QA are all closed on the final synced branch.
