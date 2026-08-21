# Issue 57 — Global expansion foundation

Implementation notes for the shared prerequisite to continent rollout.

- Learner scope membership is separated from canonical country classification through `src/data/learning-scopes.ts`.
- Generated geography is registered by continent/scope instead of being hard-wired to Africa.
- Runtime map loading remains lazy by continent and retries failed chunk loads.
- Neighbours resolves adjacency through the same continent registry; global canonical country names remain valid guesses for cross-continent borders.
- The map generator is configuration-driven and derives application-country adjacency globally before emitting continent-local runtime assets.
- Outlines continue to consume canonical generated map geometry rather than owning a second geometry source.
- Africa remains the regression fixture and retains its existing Neighbours coverage exclusions.
- `docs/architecture/continent-expansion.md` defines the reusable onboarding and QA contract.
- Legacy source-level Outlines and Neighbours verifiers now assert the shared generator/configuration contracts rather than Africa-only implementation details.

The foundation intentionally adds no second playable continent. Issue #24 is the proving-ground consumer.
