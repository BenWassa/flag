# Global expansion foundation

**Status:** planned; architecture-enabling work before continent implementation

## Goal

Generalise Atlas's Africa-specific geography onboarding seams so later continent issues can add policy/configuration/generated data without repeatedly refactoring the generator, loaders, support selectors or verifier architecture.

Africa must remain the golden regression fixture: this foundation should not alter its curriculum, canonical geometry, gameplay, routing, progress, or visual treatment except for independently merged work such as #54.

See `docs/architecture/continent-expansion.md` for the shared continent completion contract.

## Current root cause

Current `main` is intentionally Africa-first in several central seams:

- `scripts/generate-maps.mjs` emits one Africa module and contains Africa-specific catalog/policy/configuration;
- `src/data/map-scopes.ts` owns Africa-only map-scope configuration;
- `src/data/maps/index.ts` resolves only Africa scopes and lazy-loads only `./africa.js`;
- `src/data/neighbors/index.ts` wraps Africa-specific adjacency and exclusions;
- `src/domain/scope-support.ts` decides Locations/Outlines/Neighbours support through Africa-specific selectors;
- cartography verification assumes one production continent.

Copying these seams for every continent would duplicate architecture and create merge-heavy parallel work.

## Required architecture

### 1. Shared learning-scope registry

Introduce a single typed source of truth for learner-facing scopes that can represent:

- world;
- continents;
- ordinary continent regions;
- overlapping/cross-continent scopes.

A scope must carry/resolve stable identity, learner-facing label, navigation placement and canonical country membership without duplicating country records.

The model must support Issue #28's `Middle East` contract, where Egypt remains canonically African while also participating in an Asia-discoverable learning scope.

Do not force every learnable scope back into one mutually exclusive `Country.regionId` relationship.

Stable existing IDs/routes/storage contracts should remain compatible where practical.

### 2. Generic continent cartography configuration

Refactor the production generator around a continent configuration/policy seam rather than hard-coded Africa constants.

The shared engine should own:

- source loading/hash validation/provenance;
- ISO3 normalisation mechanics;
- topology build/simplification;
- projection/path generation;
- shared-border/coastline derivation;
- ocean/lake processing;
- scope focus derivation;
- adjacency derivation;
- deterministic output/optimisation.

Continent-specific configuration/policy should own only what genuinely differs, such as:

- canonical scored membership;
- special Natural Earth feature handling;
- selected useful lakes;
- region/scope definitions;
- exceptional locator/callout metadata;
- any reviewed projection/framing parameters.

Do not create a second map engine or per-continent copy of the full generator.

### 3. Post-#54 physical-context contract

The generic pipeline must assume the river-free Atlas contract:

- ocean/background;
- selected useful lakes/reservoirs;
- political geography;
- no river runtime source/data/rendering/token/verifier contract.

If this foundation lands before #54, avoid creating new river abstractions that #54 would immediately remove; integrate against then-current `main` semantically.

### 4. Global-complete adjacency generation

Remove the architectural cause of Africa's current Egypt/Morocco coverage exclusions for future global rollout.

Generation must evaluate land adjacency against sufficient canonical global topology to know the complete application-country neighbour set even when a border crosses learner-continent boundaries.

Runtime output may remain continent-local and lazy-loaded. The build-time truth must not truncate adjacency at a continent boundary.

Preserve established Neighbours semantics:

- direct shared land boundary only;
- symmetric adjacency;
- no maritime neighbours;
- zero-land-neighbour countries retained as empty records but excluded from standard rounds;
- no handwritten neighbour table.

### 5. Generic lazy map registry

Replace Africa-only map loading with a registry/adapter capable of resolving a supported scope to its parent continent asset and dynamically importing only that continent module.

Requirements:

- no global eager geography bundle;
- transient chunk-load failures do not permanently poison later attempts;
- same-origin dynamic assets continue to work with current PWA caching behaviour;
- existing Africa routes continue to resolve identically.

### 6. Outlines remain a consumer

Keep `Outlines` deriving silhouettes from the canonical map/cartography asset.

Do not add per-continent outline fixtures or independent SVG sources.

### 7. Generic support selectors

Refactor `scopeSupportsDomain`, `countryIdsForSupportedScope` and related support/completion selectors so support derives from the shared scope/generated-coverage registry rather than Africa-specific function calls.

Flags stays globally supported; geography domains become supported as generated curriculum lands.

Unsupported curriculum must remain honestly unavailable and must never auto-complete achievements.

### 8. Parameterised verification

Refactor the verifier architecture so common cartography/domain assertions can run against multiple continent definitions without copying one large script per continent.

Africa must remain fully covered.

The shared harness should be capable of asserting:

- exact country reconciliation;
- exact region/scope membership;
- generated provenance;
- topology/shared borders/coastlines;
- river absence and retained lake policy;
- adjacency completeness/symmetry;
- locator/callout inventories;
- domain support consistency;
- lazy-loading boundaries;
- runtime artifact budgets.

Continent-specific policy assertions may remain small focused configuration/tests.

## Boundaries

Do not use this issue to:

- add a new playable continent;
- redesign quiz mechanics;
- alter learning-evidence/mastery semantics;
- redesign IA or visual styling;
- rename stable internal routes/storage identifiers for cosmetic reasons;
- introduce handwritten geometry/adjacency;
- change Africa political policy merely for genericity.

A tiny generated fixture or non-routed test configuration is acceptable if needed to prove generic machinery, but South America (#24) is the intended real second-continent proving ground.

## Implementation sequence

### Phase 0 — integrate source of truth

1. Fetch current `main` and check active geography/cartography PRs.
2. Read `DESIGN.md`, `docs/architecture/cartography.md`, `docs/architecture/continent-expansion.md`, routing/country-naming docs, #28 and #54.
3. Inspect the final current Africa generator, optimiser, map loader, neighbour loader, scope-support selectors and verification scripts.
4. Create a dedicated branch from then-current `main`.

### Phase 1 — scope model

1. Introduce the typed learning-scope registry/model.
2. Preserve current Africa/Flags route behaviour.
3. Establish the seam needed by #28 for overlapping country sets without implementing a competing Middle East definition.
4. Add deterministic membership/support tests.

### Phase 2 — generator/config separation

1. Extract shared generation mechanics from Africa policy/configuration.
2. Represent Africa through the new configuration seam.
3. Regenerate Africa and compare semantically/byte-wise where appropriate.
4. Any unexpected political geometry/adjacency change is a regression requiring investigation.

### Phase 3 — global adjacency truth

1. Derive complete application-country land adjacency from canonical source topology at build time.
2. Slice/emit runtime fixtures without losing cross-continent relationships.
3. Keep Africa's currently shipped target policy stable unless complete global knowledge safely makes an existing coverage exclusion obsolete; any such change should be explicit and separately reviewed rather than smuggled into refactoring.

### Phase 4 — runtime registries

1. Generalise map-scope lookup.
2. Generalise dynamic continent module loading.
3. Generalise Neighbours scope/fixture lookup.
4. Keep Outlines as a map-asset consumer.
5. Generalise domain-support selectors.

### Phase 5 — verifier architecture

1. Parameterise shared cartography/scope/domain verification.
2. Prove the same Africa contracts still pass through the generic path.
3. Add architecture guards against reintroducing continent-specific parallel loaders/generators where practical.

### Phase 6 — integration verification

1. Sync current `main` and resolve conflicts semantically.
2. Run `npm run check` and full `npm test` under Node 22.
3. Build and inspect the exact production artifact.
4. Verify Africa routes, Locations, Outlines and Neighbours against the production build.
5. Confirm startup does not eagerly load continent geometry.
6. Confirm service-worker/offline dynamic-module behaviour remains intact.
7. Confirm CI is green on the exact final commit before merge.

## Acceptance criteria

- [ ] One shared typed learning-scope model can represent ordinary and overlapping/cross-continent scopes.
- [ ] Africa remains represented through the shared model with unchanged learner-facing membership.
- [ ] #28 can add Middle East without duplicating countries or hard-coding membership separately in each domain.
- [ ] One configurable production cartography engine replaces Africa-only generation mechanics without introducing per-continent copies.
- [ ] The generic map contract follows the post-#54 no-rivers policy.
- [ ] Global build-time adjacency can represent complete cross-continent land-neighbour sets while runtime assets remain lazy/sliced.
- [ ] Map loading resolves supported scopes through a generic continent registry and dynamically imports only the required continent asset.
- [ ] Outlines continue deriving from canonical map geometry.
- [ ] Neighbours continues using topology-derived adjacency only.
- [ ] Domain-support/country-membership selectors no longer depend on Africa-specific lookup functions.
- [ ] Shared verification can run common contracts by continent/configuration.
- [ ] Africa's country geometry, region membership, map framing, locator/callout policy, gameplay, routes and stored progress are not regressed.
- [ ] No new playable continent is bundled into this architectural issue.
- [ ] `npm run check` and full `npm test` pass under Node 22.
- [ ] Exact production artifact is inspected.
- [ ] CI is green before merge.
