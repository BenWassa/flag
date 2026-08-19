# Issue #2 — Country outlines worklog

All timestamps are America/Toronto (EDT), 2026-08-19.

## 14:04 — Scope and dependency audit

**Observation:** Issue #2 is explicitly downstream of Issue #9 production cartography and Issue #10 routing/IA. The issue prefers a strong Africa implementation over an outline-only global geometry workaround.

**Assessment:** The feature should be Africa-first and additive. Creating a separate SVG set or router would violate the issue's architectural gates.

**Change:** Created `issue-2-country-outlines` from current `main` and treated production map geometry + shared typed routes as fixed dependencies.

**Verification:** Read Issue #2, `DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/ROUTING.md`, `docs/MAP_GEOMETRY_SOURCES.md`, `docs/COUNTRY_NAMING.md`, learning/progress code, routing code, map loaders, storage adapters, UI views, and verification scripts.

**Evaluation:** Architecture supports the feature without another navigation or geometry system.

## 14:08 — Geometry design

**Observation:** The Africa production asset exposes canonical ISO3 country polygon paths plus separate map-only locator/hit/callout metadata. The generated paths use the production d3 polygon output.

**Assessment:** Silhouettes can derive directly from canonical paths. Absolute projected size/location must be removed, while aspect ratio and multipart topology must remain.

**Change:** Added `src/domain/outline.ts` and `src/data/outlines.ts`. Each canonical polygon is translated and uniformly scaled into a fixed 100×100 frame with constant padding. Unexpected path command types fail loudly.

**Verification:** Added normalization, ISO3 reconciliation, fixed-frame, source-seam, and island/multipart regression assertions in `scripts/verify-outline.mjs`.

**Evaluation:** No hand-maintained silhouette dataset exists; Outlines consumes the same generated production geography as Locations.

## 14:11 — Distractor strategy

**Observation:** Existing flag quiz generation already supplies adaptive target selection and balanced correct positions, but flag-specific confusion clusters are not appropriate as the complete outline distractor strategy.

**Assessment:** Plausible homogeneous distractors improve recognition testing; a transparent heuristic is preferable to an unvalidated ML similarity model at this scope.

**Change:** Reused existing target selection, then rescored outline distractors using prior outline confusions, same-region/same-continent membership, aspect-ratio proximity, multipart complexity, and deterministic seeded jitter.

**Verification:** Regression coverage checks four unique options, correct-index integrity, supported-scope membership, same-region distractors when sufficient candidates exist, confusion-history priority, and balanced correct positions.

**Evaluation:** The strategy tests recognition rather than inviting elimination by absurd alternatives, while remaining deterministic and inspectable.

## 14:13 — Learning and persistence integration

**Observation:** Flag mastery logic is generic enough to reuse, while location learning correctly keeps a separate competency ledger.

**Assessment:** Outlines should reuse the mastery state machine but never share persisted state with Flags or Locations.

**Change:** Added `src/infrastructure/outline-storage.ts` with `flag-atlas:outline-progress:v1` and `flag-atlas:outline-attempts:v1`. Extended `AppStore` with independent outline progress/session state using the existing `applyAttempt` semantics.

**Verification:** Tests establish three-round mastery in the outline state while the same country's flag state remains unseen; compiled storage is checked for separate keys.

**Evaluation:** Shared learning architecture is reused without contaminating another skill ledger.

## 14:16 — Shared routing and UI integration

**Observation:** Issue #10 already parses Outlines continent/region/activity routes, but the app interpreter deliberately canonicalized scoped Outlines back to the planned domain screen.

**Assessment:** The router itself does not need redesign. Only domain availability and route interpretation need to recognize supported Africa outline scopes.

**Change:** Wired Africa outline domain/scope/quiz/results views through the existing `LearningRoute`, conceptual parent navigation, active-round refresh fallback, review/repeat actions, keyboard controls, and Home domain index.

**Verification:** Extended routing regression to cover `/outlines/africa/west-africa/learn`, parent/stable behavior, result navigation, domain availability, and PWA shell integration.

**Evaluation:** Home → Outlines → continent/region → Learn/Test now uses the same navigation stack as existing learning domains.

## 14:17 — Accessibility and responsive presentation

**Observation:** The answer can leak through SVG titles, labels, filenames, IDs, country-specific viewports, or hidden metadata even when visually concealed.

**Assessment:** The question SVG should expose only the task description and shape. Country names belong exclusively to visible answer choices until Learn feedback/results.

**Change:** Added a reusable silhouette renderer with fixed viewport and generic `Country silhouette to identify` accessible text. Added `outline.css` for a dominant portrait silhouette and short-landscape two-column compatibility with the existing quiz shell.

**Verification:** Regression checks the SVG subtree for absence of country name, ISO3, answer-bearing data attributes, and answer-specific viewport dimensions; it also checks keyboard actions and short-landscape CSS.

**Evaluation:** Screen readers receive a meaningful task object without receiving the answer, while keyboard and focus semantics remain consistent with existing quizzes.

## 14:19 — Verification surface and draft PR

**Observation:** The feature touches geometry derivation, state, persistence, UI, routing interpretation, PWA shell files, and tests.

**Assessment:** A dedicated verification script should sit inside the existing `npm test` gate, and the PR should remain draft until main is resynced, CI is green, and the exact CI artifact is inspected.

**Change:** Added `scripts/verify-outline.mjs`, added it to the full verification chain, versioned the service-worker shell for `outline.css`, documented the outline contract, and opened draft PR #13.

**Verification:** CI execution and artifact inspection are pending later entries after the implementation branch is synchronized with the then-current `main`.

**Evaluation:** Feature-level automated coverage is in place; release readiness is intentionally not yet claimed.
