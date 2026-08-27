# Issue #116: Fit-exclude Russia from the Asia canvas

**Status:** Complete — shipped on `main` in `046bd93`
**GitHub:** [#116](https://github.com/BenWassa/flag/issues/116)

## Outcome

Russia is excluded from the Asia canvas fit while remaining visible context and
retaining canonical whole-country geometry and adjacency. Every measured Asian
country becomes approximately 2.30 times larger at maximum zoom, and every
Asian region's opening frame improves or remains larger.

## Verification and closeout

Asia generation assertions protect Russia's fit-only exclusion and measured
small-country extents. The shared cartography and Asia verifiers passed under
Node 22, as did merged CI and the GitHub Pages deployment. Shipped through PR
#121.
