# Issue #3 — Neighboring countries game worklog

Last updated: 2026-08-19 (America/Toronto)

## Release scope and data model

Issue #9 deliberately established an Africa-first production topology. Issue #3 therefore ships the Neighbors domain for Africa and its five existing regions without inventing a second global geopolitical model.

The canonical source of adjacency remains `AFRICA_LAND_ADJACENCY` emitted by `scripts/generate-maps.mjs`. `scripts/generate-neighbor-fixture.mjs` mechanically extracts that generated ISO3 graph into the lightweight runtime fixture `src/data/neighbors/africa.ts`. `npm run maps:generate` regenerates geometry, runtime optimization, and the neighbor fixture in sequence. The verification suite asserts byte-independent data equality between the lightweight fixture and the Issue #9 map output plus symmetry, sort order, no self-links, and representative border cases.

This release does **not** hand-author or correct country pairs. Any geography correction must be made in the canonical Issue #9 source/topology normalization and regenerated.

### Political-boundary inheritance

- Somaliland remains dissolved into canonical `SOM` scoring geometry before adjacency is derived.
- Western Sahara remains non-scoring context and is not silently merged into Morocco.
- Bir Tawil remains non-scoring context and is not assigned to Egypt or Sudan.
- The 54-country Africa application catalog is the scoring topology used by this release.
- Global/cross-topology rollout remains a future Issue #9 pipeline extension. The Africa fixture must not be treated as a complete worldwide border graph for app countries outside that production topology.

### Difficult cases covered

- **Enclave:** Lesotho has `ZAF` as its sole land neighbor.
- **Enclosed state:** The Gambia has `SEN` as its sole land neighbor.
- **Exclave:** Angola's topology includes the Cabinda border with the Republic of the Congo (`COG`).
- **Multipart country:** Equatorial Guinea keeps Cameroon and Gabon only; island proximity adds no maritime neighbor.
- **High-degree cases:** DR Congo and Tanzania are regression-tested.
- **De-facto/disputed geometry:** Somalia, Western Sahara, and Bir Tawil inherit Issue #9 handling exactly.
- **Zero-neighbor countries in Africa:** Cabo Verde, São Tomé and Príncipe, Comoros, Madagascar, Mauritius, and Seychelles are stored with empty adjacency arrays.

## Zero-neighbor policy

Zero-land-neighbor countries remain valid records in the canonical fixture, but standard Neighbors rounds filter them out. An empty response is not a useful standalone recognition exercise and would make completion ambiguous. Scope totals shown for mastery therefore count standard targets, while region ledgers explicitly identify zero-neighbor exclusions.

## Gameplay policy

For a target with `n` correct land neighbors, the starting budget is exactly `n + 2` total unique country guesses. Each correct or wrong unique country consumes one guess. Repeating **any** previously guessed country is a duplicate and consumes nothing. Because all `n` correct neighbors are required, `n + 2` gives the learner two recoverable wrong guesses; a third extra wrong guess exhausts the round.

Correct neighbors collect visibly. Guessed countries are removed from autocomplete suggestions. Exhaustion reveals every still-missing neighbor. Completion and exhaustion are explicit terminal states; the learner advances deliberately to the next target.

Country entry reuses `COUNTRIES` canonical display names and aliases. Search is case-insensitive, accent-insensitive, punctuation-tolerant, prefix/substring forgiving, and supports exact alias submission. The input is a native form for Enter-to-submit, stays focused after non-terminal guesses, clears after submission, uses 50px controls/suggestion rows, and bounds the suggestion list by viewport height so the mobile keyboard does not bury the round status.

## Learn / Test / mastery policy

Neighbors has an independent `NeighborProgressState` and separate `flag-atlas:neighbor-progress:v1` persistence namespace. Flags and Locations records are never read or written for Neighbors mastery.

A mastery-credit event is a **clean full-set completion**: every correct neighbor found with zero wrong guesses. As with existing learning domains, a target earns at most one mastery credit per session. Three clean sessions master a country. A wrong guess resets the current mastery streak; a lapse from mastered increments `lapseCount`, after which two clean sessions are required to remaster. Completed rounds with one or more wrong guesses are useful practice but do not award mastery credit. Exhausted/revealed rounds never award mastery credit.

Learn and Test use the same underlying multi-answer task and mastery semantics. Learn provides immediate correctness feedback; Test remains in the shared route/activity hierarchy and summarizes the round at the end rather than creating a separate scoring system.

## Timestamped implementation log

### 2026-08-19 14:04 EDT

**Observation:** Issue #3 requires adjacency from production topology, and `main` already contains Issue #9's topology-derived Africa graph plus Issue #10's typed `neighbors` routes.

**Assessment:** Rebuilding adjacency or navigation would violate both prerequisites. Africa is the natural release boundary because Issue #9 explicitly made that topology production-ready first.

**Change:** Created `agent/issue-3-neighbors` from then-current `main` (`af31a8390d9265b11f5fda825dca3c73318e6212`).

**Verification:** Inspected Issue #3, `DESIGN.md`, country naming policy, map source/provenance documentation, generator, cartography verification, routing docs/code, progress models, location mastery, persistence, and UI architecture.

**Evaluation:** Proceed with an Africa-first Neighbors domain and no second geometry/navigation source.

### 2026-08-19 14:30 EDT

**Observation:** The production adjacency graph was embedded in the heavyweight Africa map module even though Neighbors itself does not need map geometry.

**Assessment:** Importing the full map module for a text-entry exercise would create an unnecessary ~map-sized runtime dependency.

**Change:** Added a generated lightweight adjacency fixture and regeneration step sourced mechanically from Issue #9 output. No pair is curated in gameplay code.

**Verification:** Added equality, symmetry, deterministic-order, known-case, and zero-neighbor assertions to `scripts/verify-neighbors.mjs`.

**Evaluation:** Neighbors can load a cheap graph while the canonical topology remains the single geographic source of truth.

### 2026-08-19 15:00 EDT

**Observation:** Existing location mastery already provides the closest multi-attempt learning precedent: clean performance receives mastery credit; mistakes reset learning progress; persistence is domain-specific.

**Assessment:** A multi-answer neighbor task needs one outcome per target country, not one mastery event per individual guessed neighbor.

**Change:** Implemented clean full-set mastery, `n + 2` unique-guess accounting, free duplicates, exhaustion reveal, separate storage, alias-aware search, and mobile sequential-entry state.

**Verification:** Added automated cases for aliases, duplicate correct/wrong guesses, wrong accounting, budget, clean completion, reveal, lapse/remastery goal, storage namespace, mobile autocomplete structure, and shared route parsing.

**Evaluation:** Gameplay uses the app's learning semantics without adding XP, streak rewards, lives, or unrelated game chrome.

## Verification gate

Before merge readiness:

1. Sync current `main` into the feature branch and resolve conflicts semantically, especially shared `app.ts`, home/domain views, build shell, and any Issue #2 changes.
2. Run the exact repository CI command (`npm test`) on the integrated head.
3. Require the GitHub Actions `CI / verify` job to be green.
4. Download and inspect the `flag-atlas-dist` artifact produced by that exact CI run, including neighbor JS/data modules, `index.html`, `neighbors.css`, and service worker shell references.
5. Update Issue #3 with the finalized data model, zero-neighbor policy, gameplay/mastery behavior, and geopolitical coverage limits.
