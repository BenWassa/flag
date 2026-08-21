# Continent expansion playbook

This is the shared implementation contract for adding generated geography beyond Africa. Continent issues own curriculum and geopolitical policy; shared infrastructure owns mechanics.

## Source-of-truth model

Keep these concepts separate:

1. **Country identity** — canonical ISO3 from `src/data/countries.ts`.
2. **Canonical whole-country geometry** — derived from the pinned Natural Earth 1:10m source pipeline.
3. **Scope display geometry** — the local projection/fragments needed for one learner-facing continent without changing country identity.
4. **Learning-scope membership** — the countries that are playable in a continent or region; overlapping scopes may cross canonical continent boundaries.
5. **Non-scoring context** — territory or neighbouring-country geometry shown for geographic truth but never promoted to a target by that scope.

Do not encode all five concepts into `continentId` / `regionId`, and do not create handwritten geometry or adjacency tables.

## Shared onboarding sequence

For each new continent:

1. Lock the exact ISO3 curriculum and region membership in the issue.
2. Record territory, dispute, multipart-country and cross-continent-neighbour policy explicitly.
3. Add one configuration to `scripts/map-continent-configs.mjs`; extend the existing generator instead of creating a second pipeline.
4. Generate topology from the pinned Natural Earth sources. Global application-country land adjacency is derived before continent slicing; runtime map assets remain lazy by continent.
5. Register the generated continent and its regions in the shared map/Neighbours loaders and learner-scope registry.
6. Reuse the canonical map geometry for Locations and Outlines. Neighbours consumes topology-derived adjacency; Flags consumes the same learner-scope membership.
7. Harden phone-scale framing, small-country interaction, regional focus and cross-continent context only where the generated geography demonstrates a need.
8. Add the continent to the reusable verification contract and document any deliberate exceptions.

## Cartographic contract

- Natural Earth 1:10m is the production topology source.
- Ocean, country/context fills, selected useful lakes, political borders and coastline are allowed layers.
- Rivers are excluded from runtime maps.
- Non-scoring context must not become an interactive Locations target.
- Cross-continent Neighbours answers must remain complete even when the neighbouring country is outside the learner scope.
- Multipart sovereign geometry may be clipped for local **display context** when required to avoid distorting the continent viewport; canonical identity and adjacency remain global.
- Territory/dispute handling is reviewed per continent rather than copied from Africa by analogy.

## Four-domain completion contract

A continent or region is complete only when the learner-facing matrix is explicit and supported:

| Domain | Requirement |
| --- | --- |
| Flags | Exact shared learner-scope membership |
| Locations | Canonical generated map targets and usable framing |
| Outlines | Derived from the same canonical generated country geometry |
| Neighbours | Complete topology-derived land-neighbour sets; zero-neighbour countries handled by the existing eligibility rule |

Do not rebuild Flags data for each continent. Verify that Flags and generated geography resolve the same scope membership.

## Verification gate

Before an expansion PR is considered ready:

- exact continent and region ISO3 membership is deterministic;
- regions partition the intended continent curriculum unless the issue explicitly defines overlap;
- all four domains resolve through shared support selectors;
- territory/context policy is asserted;
- representative cross-border and cross-continent adjacency is asserted;
- no river runtime data or rendering contract is reintroduced;
- selected lake/context policy is asserted;
- locator/callout inventory is deterministic;
- continent assets remain lazy-loaded and within the issue's raw/gzip budget;
- existing Africa behaviour remains a golden regression fixture;
- `npm run check` and full `npm test` pass on Node 22;
- the exact production `dist/` artifact is inspected;
- phone-scale browser QA is recorded without claiming physical-device testing unless it was actually performed.

The objective is that later expansions are primarily configuration, policy and visual hardening—not parallel implementations of geography infrastructure.
