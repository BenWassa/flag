# Repository agent instructions

These instructions apply to the whole repository.

## Establish current truth first

Read `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `docs/architecture/spatial-atlas.md`, `docs/architecture/routing.md`, `docs/open/index.md` and the relevant GitHub issue before changing product behaviour.

Use `docs/history.md` and `docs/closed/` when you need rationale or lineage. Closed issue bodies are historical evidence, not automatically current instructions.

## Production baseline

- Atlas is a mobile-first React/Vite PWA across Flags, Locations, Outlines and Neighbours.
- **Spatial Atlas is the default production navigation presentation.** Do not treat it as a preview or rebuild a parallel launcher.
- The typed hash router remains authoritative; the spatial layer interprets it.
- Geography taps select/focus scope; Play/Learn are deliberate separate actions.
- The conventional `Launcher` is the equivalent WebGL/renderer-failure fallback only.
- Domain-native activities retain their own primary learning surfaces.
- All six real continents have intended four-domain curriculum.
- Learner-facing copy uses British English. Stable compatibility identifiers such as `neighbors`, `/neighbors`, `test` and existing `flag-atlas:*` namespaces remain.

## Learning / achievement boundary

- Country-level records are live learning evidence and may change.
- Do not present an individual country as prestigious learner-facing Mastery.
- Region × domain is the first durable Mastery unit.
- Complete region = restrained gold treatment.
- Complete continent = persisted crest/trophy completion state.
- Complete World = singular earned-only Crown; #138 already shipped its Home surface.
- Earned prestige is monotonic under the current model unless a future explicit migration changes that rule.

## Geography

Canonical country identity is ISO3. Projected maps, outlines, neighbours and spherical Spatial assets derive from the pinned Natural Earth 1:10m production pipeline/policy. Never hand-edit generated country geometry, create a second topology source or maintain handwritten neighbour tables.

## Verification

- `npm run check` type-checks the application and is already part of `npm test`; do not run it redundantly in CI before `npm test`.
- `npm test` is the primary full repository gate under Node 22.
- The normal PR/main automation entry point is `.github/workflows/ci.yml`. Its repository gate produces `flag-atlas-dist`, then its reusable exact-production acceptance job tests that same artifact in Chromium/mobile Chromium and through the PWA lifecycle.
- Match additional focused validation to risk: keyboard/accessibility, reduced motion, responsive layout, renderer failure, generated geography and exact artifact inspection where relevant.
- Never claim physical device/manual evidence that was inferred from automated tests.

## GitHub Actions architecture

- `.github/workflows/` is permanent operational infrastructure, not issue history. Keep normal PR/main automation to the canonical `CI` workflow plus the permanent reusable acceptance and deployment workflows.
- Do not add `issue-NNN-*.yml` workflows for ordinary feature work. Put feature regression coverage in the repository test suites; promote durable cross-cutting exact-production checks into `acceptance.yml` when justified.
- A temporary spike workflow may exist only while the spike genuinely requires isolated infrastructure. Remove it before issue closeout unless the workflow has an explicit continuing operational purpose documented in the repository.
- GitHub Pages and Firebase deploy only after a successful `main` push CI run. Their `workflow_run` triggers must filter `main` at event level so PR CI does not manufacture skipped deployment runs.
- Deploy the `flag-atlas-dist` artifact produced by the successful CI run rather than rebuilding a different production artifact. Preserve and verify the exact build SHA at deployment and live-origin acceptance.
- Do not duplicate expensive setup/build/browser gates across parallel issue workflows. Prefer one canonical gate with clearly named jobs and focused tests.

## Issue delivery

1. Fetch current `main` and read the full issue plus related durable/historical docs.
2. Use a focused branch and PR.
3. Keep domain rules separate from presentation and fix root causes rather than adding parallel systems.
4. Run focused checks plus the full required gate; inspect the built artifact where relevant.
5. Sync current `main` before merge and resolve semantically.
6. Require green CI and required deployment acceptance.
7. Put lasting decisions in `PRODUCT.md`, `DESIGN.md`, `docs/product/` or `docs/architecture/`.
8. Move completed working records from `docs/open/` to `docs/closed/` and keep `docs/open/index.md` aligned with GitHub.
9. Close the GitHub issue only when its acceptance criteria and required evidence are genuinely satisfied.

## Repository hygiene

Preserve **issue/document history**, not every implementation branch. Closed issues and `docs/closed/` records explain why the product evolved. Remote feature, spike, verification and agent branches should be deleted once merged/superseded and their useful evidence is captured.

The intentional pre-Spatial archive branch is a historical checkpoint; ordinary merged branches are not.
