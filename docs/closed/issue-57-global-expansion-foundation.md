# Issue 57 — Global expansion foundation

**Status:** Complete

Implementation notes for the shared prerequisite to continent rollout.

- Learner scope membership is separated from canonical country classification through `src/data/learning-scopes.ts`.
- Generated geography is registered by continent/scope instead of being hard-wired to Africa.
- Runtime map loading remains lazy by continent and retries failed chunk loads.
- Neighbours resolves adjacency through the same continent registry; global canonical country names remain valid guesses for cross-continent borders.
- The map generator is configuration-driven and derives application-country adjacency globally before emitting continent-local runtime assets.
- Outlines continue to consume canonical generated map geometry rather than owning a second geometry source.
- Africa remains the regression fixture and retains its existing Neighbours coverage exclusions.
- `docs/architecture/continent-expansion.md` defines the reusable onboarding and QA contract.
- Legacy source-level Outlines and Neighbours verifiers now assert the shared generator/configuration contracts rather than Africa-only implementation details, including the generic per-continent adjacency symmetry guard.
- Neighbours map geometry remains lazy and memoised by active scope, with failed scope loads retryable instead of relying on one Africa-only promise.

The foundation intentionally adds no second playable continent. Issue #24 is the proving-ground consumer.

## Closeout

The original PR #63 became unreopenable when its temporary base branch was merged and removed. The same rebased branch was reviewed and merged to `main` through replacement PR #68 in `d92c1fc959b9c980729314e18ea882a535e68778`. Full `npm test`, the parameterised foundation verifier, and fresh GitHub CI passed on the exact rebased head. No new continent was bundled.
