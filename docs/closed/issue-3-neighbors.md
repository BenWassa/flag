# Issue #3 — Neighboring countries game worklog

Last updated: 2026-08-19 16:07 EDT (America/Toronto)

## Final release scope

Issue #3 ships an Africa-first **Neighbors** learning domain for Africa and the five existing Africa regions. It builds on the two required foundations rather than duplicating them:

- Issue #9 / PR #12: canonical Natural Earth 1:10m production topology and generated Africa land adjacency;
- Issue #10 / PR #11: typed domain/scope/activity hash routing;
- Issue #2 / PR #13: concurrently completed Outlines domain, integrated semantically before final release.

The canonical geographic source remains `AFRICA_LAND_ADJACENCY` emitted by the Issue #9 map pipeline. `scripts/generate-neighbor-fixture.mjs` mechanically extracts that graph into the lightweight runtime fixture `src/data/neighbors/africa.ts`. The Neighbors runtime does **not** import the heavyweight Africa map module and does not maintain a handwritten border table.

`npm run maps:generate` regenerates production geometry, runtime optimization, and the Neighbor fixture in sequence. Verification checks equality with the topology-derived graph, symmetry, deterministic ordering, self-link absence, representative difficult cases, and byte-stable regeneration.

## Geographic coverage policy

The production topology is currently Africa-only. The raw generated adjacency graph therefore must not be treated as a complete worldwide application-country graph.

### Boundary inheritance

- Somaliland remains dissolved into canonical `SOM` scoring geometry before adjacency is derived.
- Western Sahara remains non-scoring context and is not merged into Morocco.
- Bir Tawil remains non-scoring context and is not assigned to Egypt or Sudan.
- Maritime proximity never creates adjacency.
- Geography corrections belong in the canonical Issue #9 topology pipeline, followed by regeneration. Neighbors does not patch individual country pairs.

### Coverage-deferred targets

Final integration review found that **Egypt (`EGY`) and Morocco (`MAR`) cannot safely be standard Neighbor targets while the topology is Africa-only**, because their complete application-country land-border sets cross the current topology boundary.

The release-safe decision is intentionally conservative:

- keep their generated Africa adjacency records unchanged;
- exclude `EGY` and `MAR` at Neighbor target-scope eligibility;
- expose the exclusion in UI/policy copy;
- restore them only after the canonical topology expands across the relevant boundaries.

This avoids teaching a partial neighbor set and preserves one geographic source of truth.

### Difficult cases retained in regression coverage

- **Enclave:** Lesotho → South Africa only.
- **Enclosed state:** The Gambia → Senegal only.
- **Exclave:** Angola includes Cabinda-derived land adjacency.
- **Multipart country:** Equatorial Guinea does not gain maritime neighbors from island proximity.
- **High-degree cases:** DR Congo and Tanzania.
- **Political-policy inheritance:** Somalia, Western Sahara, and Bir Tawil follow Issue #9.

## Zero-neighbor policy

Cabo Verde, São Tomé and Príncipe, Comoros, Madagascar, Mauritius, and Seychelles remain valid canonical records with empty adjacency arrays.

They are excluded from standard `name all neighbors` rounds because an empty-answer round is not a useful recognition task. The UI distinguishes zero-neighbor exclusions from the separate cross-topology coverage deferrals.

## Gameplay policy

For a target with `n` correct land neighbors, the learner gets exactly **`n + 2` unique guesses**.

- each unique correct or wrong country consumes one guess;
- repeating any previously guessed country consumes nothing;
- correct neighbors accumulate visibly;
- completion occurs when the full set is found;
- exhaustion reveals every still-missing neighbor;
- the learner advances deliberately to the next target.

Autocomplete resolves against canonical country names and aliases from the shared country catalog. Search is case-insensitive, accent-insensitive, punctuation-tolerant, and supports exact alias submission. The interaction uses a native form/Enter flow, preserves input focus after non-terminal guesses, removes already-guessed countries from suggestions, and bounds the suggestion surface for mobile keyboards.

## Learn / Test / mastery policy

Neighbors has an independent `NeighborProgressState` and separate persistence namespace. It does not read or write Flags, Locations, or Outlines mastery.

A mastery-credit event is a **clean full-set completion**: all correct neighbors found with zero wrong guesses. A country earns at most one credit per session. Three distinct clean sessions master a country; a mastered miss lapses it, after which two clean sessions are required to remaster.

Learn and Test use the same multi-answer task. Immediate set-building feedback remains in both because the learner must know which members of the set have already been found. Test emphasizes the end-of-round clean/completed/exhausted summary rather than hiding intermediate set state. No XP, lives, streak UI, or parallel score model is introduced.

## Concurrent Outlines integration

PR #13 merged first as `0d6395dc9985b7245a415fe5dfad5d47655202f6`.

PR #14 originally overlapped with Outlines in eight shared shell/orchestration files. The final branch integrated PR #13 as a real merge parent and resolved those overlaps semantically rather than choosing one feature wholesale.

The combined release preserves both domains in:

- `src/app.ts`: routes, active-round refresh fallback, Back, review/repeat, reset, keyboard/form behavior, storage flush;
- `src/state/store.ts`: independent session/progress/result state for all four domains;
- Home/domain IA: Flags, Locations, Outlines, and Neighbors all shown as available;
- build shell: both `outline.css` and `neighbors.css`;
- PWA shell: active cache `flag-atlas-v11` with both new styles;
- test chain: standalone Outlines + Neighbors suites plus `verify-domain-integration.mjs`.

## Verification history

### 2026-08-19 14:04–14:23 EDT — initial implementation

The agent inspected Issue #3, design and naming policy, #9 topology/provenance, #10 routing, mastery/storage conventions, and UI architecture. It implemented the lightweight generated adjacency fixture, gameplay state machine, mastery isolation, autocomplete, persistence, Africa/region views, and automated verification.

Early CI failures were regression-test maintenance issues rather than gameplay failures: first an old service-worker lineage assertion, then an ambiguous substring assertion around `0 of 3 neighbors found`. Both were corrected without weakening the product contracts. The agent's standalone final CI was green before concurrent integration.

### 2026-08-19 15:44–16:07 EDT — integration review and closeout

**Observation:** PR #13 Outlines had already merged, making PR #14 non-mergeable because both features independently extended the shared app/store/Home/domain/build/PWA shell.

**Change:** Integrated current `main` into PR #14 as a true merge parent and composed both features across all shared files.

**Red-team finding:** The Africa-only adjacency graph would allow incomplete target sets for Egypt and Morocco.

**Change:** Added coverage eligibility that defers `EGY` and `MAR` without modifying the generated adjacency fixture. Added a dedicated cross-domain verifier for this policy and the combined shell.

**CI #134:** failed after base app + map suites passed because `verify-routing.mjs` still expected the old `3 available · 1 planned` Home copy from the Outlines-only release.

**Change:** Updated routing verification to require all four shipped domains, Neighbor routes/results/review paths, and the combined `v11` PWA shell.

**CI #135 (`32296390361`): GREEN** on final head `3a719a5e986ae67a891efd6dff06a4a2e81198eb`.

The full repository path passed:

- 195-country base application verification;
- Africa location-map verification and small-country/Test edge regressions;
- typed routing/deep-link/Back-Forward contracts;
- production cartography/topology/water/viewport checks;
- map-generation integrity;
- Outlines verification;
- Neighbors verification;
- cross-domain integration verification.

Exact CI artifact:

- name: `flag-atlas-dist`;
- artifact ID: `9381351135`;
- uploaded size: `332,632` bytes;
- SHA-256: `9287794c242927fbfacae465457f650d07c49d45dbeae9b80c24f3eb0fbe991c`.

The downloaded artifact hash matched GitHub exactly. Artifact inspection confirmed both new styles, `flag-atlas-v11`, four-domain Home/app orchestration, compiled Egypt/Morocco coverage deferral, and no direct heavyweight map-module dependency in Neighbor data/game/UI.

## Remaining limitation

No physical iPhone/Android device was available in this environment. Mobile autocomplete/keyboard and responsive behavior are covered by implementation and automated structural contracts; real-device play remains useful follow-up QA, but no unverified device claim is made.
