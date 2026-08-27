# Issue #22 — North America full four-domain expansion

**Status:** complete and deployed. Implementation shipped through PR #140 at merge/main SHA `c74ba3fac51b1bfe8f1eddab5735df3b07c4b156`; merged-main CI, GitHub Pages deployment and Firebase deployment/live-origin acceptance are green. Issue #22 is ready to close.

## Outcome

North America is implemented through Atlas's existing shared continent-expansion architecture across Flags, Locations, Outlines and Neighbours. The work adds no second topology source, handwritten country geometry, handwritten neighbour table or North-America-specific map runtime.

The continent has one canonical 23-country curriculum and three learner-facing regions:

- **Northern America — 2:** Canada (`CAN`), United States (`USA`).
- **Central America — 8:** Belize (`BLZ`), Costa Rica (`CRI`), El Salvador (`SLV`), Guatemala (`GTM`), Honduras (`HND`), Mexico (`MEX`), Nicaragua (`NIC`), Panama (`PAN`).
- **Caribbean — 13:** Antigua and Barbuda (`ATG`), Bahamas (`BHS`), Barbados (`BRB`), Cuba (`CUB`), Dominica (`DMA`), Dominican Republic (`DOM`), Grenada (`GRD`), Haiti (`HTI`), Jamaica (`JAM`), Saint Kitts and Nevis (`KNA`), Saint Lucia (`LCA`), Saint Vincent and the Grenadines (`VCT`), Trinidad and Tobago (`TTO`).

The same shared scope membership is consumed by all four domains. Central America remains a region of the North America asset; #23 is not a separate topology/runtime subsystem.

## Canonical cartography and source audit

Production geography is generated from the pinned Natural Earth 1:10m pipeline documented in `docs/architecture/north-america-cartography-provenance.json`.

The North America source audit reconciled all 42 relevant Natural Earth source features. The scored curriculum remains the 23 Atlas application countries above. Territories and dependencies are never promoted merely because Natural Earth places them in North America.

Important policy decisions:

- Greenland is non-scoring Danish context and excluded from projection fitting.
- Bermuda is non-scoring British context and excluded from projection fitting.
- Saint Pierre and Miquelon and Puerto Rico remain non-scoring geographic context.
- Anguilla, British Virgin Islands, Cayman Islands, Montserrat, Turks and Caicos Islands, Saint Barthelemy, Saint Martin, Aruba, Curacao and Sint Maarten remain non-scoring dependency/source context.
- Caribbean French and Dutch sovereign geometry is represented through keyed `FRA`/`NLD` non-scoring context where appropriate; metropolitan Europe is explicitly excluded from this viewport.
- `COL` and `VEN` are keyed South America context where useful. Colombia remains available to the global adjacency graph so Panama's land border is truthful.
- remote US Minor Outlying Islands are explicitly excluded from the North America runtime context because Pacific dependency geometry is irrelevant to this learner viewport.
- disputed banks and the Guantanamo Bay lease remain non-scoring Natural Earth context and are not Atlas countries.

The provenance JSON remains strictly generator-owned. QA, browser, CI and deployment evidence belongs in this worklog and was not manually appended to generated provenance.

### Viewport component filtering

Issue #22 generalised the generator so viewport fitting can exclude remote multipart components without mutating canonical scored geometry.

The United States keeps its complete canonical whole-country path for scoring, rendering and Outlines. Remote components west of the documented fit threshold are excluded only from fit/focus calculations. This prevents Aleutian/remote geometry from destroying useful North America and regional framing while preserving country identity.

The same principle applies to explicit context exclusion: omit irrelevant context components from a learner viewport rather than altering the canonical country polygon or building a parallel geometry source.

## Physical context

North America retains restrained orientation context:

- Great Lakes: Erie, Huron, Michigan, Ontario and Superior;
- source-derived ocean/coastline context;
- **no rivers**.

A controlled payload experiment increased simplification only for non-interactive ocean/coast/lake context. It saved roughly 1 kB gzip while reducing physical detail, so it was rejected. Scored country geometry was not degraded to chase an arbitrary round-number budget.

## Adjacency and Neighbours

Adjacency is derived from the global canonical Natural Earth topology, not from continent-local or handwritten tables.

Explicitly verified cases include:

- `CAN ↔ USA`;
- `USA ↔ MEX`;
- Mexico's Central American land connections;
- `PAN ↔ COL` across the North America/South America learner-continent boundary;
- `HTI ↔ DOM` on Hispaniola;
- no invented `CUB ↔ JAM` maritime edge.

The following 11 Caribbean countries correctly have empty land-neighbour sets and remain playable through the #58 explicit **No land neighbours** path: `ATG`, `BHS`, `BRB`, `CUB`, `DMA`, `GRD`, `JAM`, `KNA`, `LCA`, `VCT`, `TTO`.

### Neighbour-map host lifecycle fix

Production browser QA exposed a shared React/runtime lifecycle defect. A zero-neighbour target intentionally left the neighbour-map host in `data-neighbor-map-status="error"`; React reused the same host DOM node for the next target, so the runtime refused to hydrate a later non-zero target such as Haiti because the stale error status survived.

The host is now keyed by `session.id:targetId`, forcing a fresh host between questions while preserving same-question runtime shell updates. Browser-independent `HTI↔DOM` and `PAN↔COL` neighbour models were already correct; canonical adjacency was not changed to fix the runtime issue.

## Small-island interaction assistance

Production-scale QA deliberately started from true geometry and added only the minimum assistance needed.

### Invisible 44 CSS px hit assistance

Seven countries use invisible hit assistance while keeping the real geography visible and authoritative:

- `BHS`
- `BLZ`
- `DOM`
- `HTI`
- `JAM`
- `SLV`
- `TTO`

These hit surfaces are dynamically kept at approximately 44 CSS px.

### True-scale question-specific insets

Three dense Caribbean clusters use generated true-scale insets only when a member is the current target:

- `KNA` + `ATG`
- `DMA` + `LCA`
- `VCT` + `GRD` + `BRB`

Insets reuse canonical geometry, preserve an outlined source window, avoid answer-revealing labels, expose one keyboard/touch target per country, and disappear when not relevant.

No permanent visible locator discs or leader-line callouts are required for North America. Real polygons retain precedence over assistance surfaces, including around Hispaniola and dense island clusters.

## Shared pointer-capture defect and fix

Production mouse QA exposed a pre-existing shared map gesture defect rather than a North America geometry defect.

Before the fix, `map-viewport.ts` called `setPointerCapture` on every initial `pointerdown`. Chromium then retargeted the eventual click from a correct SVG answer surface to `.map-stage__scroll`. In the diagnostic case, `elementFromPoint(...)` correctly identified the Bahamas `BHS` hit target, but the physical mouse click reached the scroll container and did not score; dispatching a click directly on the same SVG circle scored immediately.

The shared fix is deliberately generic:

1. a single initial pointerdown is **not** captured;
2. movement of 4 CSS px or less remains ordinary tap/slight-movement behaviour;
3. once movement exceeds the established 4 px drag threshold, the pointer is captured and the gesture becomes a pan;
4. the dragged click is suppressed so panning cannot answer a country;
5. when a second pointer establishes a pinch, the active pointers are captured for the multi-pointer gesture.

Permanent browser regression coverage proves initial-down and sub-threshold movement are not captured, established drags are captured, panning does not answer, sub-threshold movement on an assisted target still scores, physical polygon clicks score, and the existing #117 real-polygon-over-assistance precedence contract remains green.

During final verifier cleanup, the pointer regression was corrected to target the unique `tabindex="0"` keyboard answer stop for inset countries. An intermediate test-harness reconstruction mistake was also removed, restoring the proven launcher-based setup. No production pointer or inset behaviour changed in that cleanup.

## Outlines

Outlines derives the same canonical country geometry used by Locations.

Browser QA explicitly covers multipart Caribbean silhouettes including Bahamas, Antigua and Barbuda, Saint Kitts and Nevis, Saint Vincent and the Grenadines and Trinidad and Tobago at phone portrait and short landscape. The United States keeps complete canonical multipart geometry for Outlines; fit/focus filtering is not an outline mutation.

## Mastery and completion

North America regions participate in the shipped #108 complete-region qualification rules. Browser QA verifies the Northern America presentation with all four region × domain Masteries present. Ordinary sampled/incomplete rounds cannot award Mastery; existing achievement semantics and storage namespaces were not changed by #22.

## Final integrated acceptance — authoritative

GitHub Actions run `33117435601` established and tested accepted candidate:

`00cf20c4f132403e91325a4e8c90fa7032e92b05`

Environment:

- Node `22.23.2`;
- Java `21`.

The clean integrated gate passed:

- complete deterministic `npm run maps:generate`;
- `git diff --exit-code` after generation — byte-clean;
- `npm run check`;
- complete `npm test`;
- **54/54 Vitest tests**;
- **12/12 Firebase Emulator / Firestore rules tests**;
- all shared and continent cartography verifiers;
- deterministic North America verifier;
- **56/56 Chromium production-browser tests**;
- #117 polygon-precedence regressions;
- pointer-capture regressions;
- complete North America browser matrix;
- PWA runtime verification;
- exact final production build/artifact inspection.

The temporary final-verifier workflow removed itself before establishing the accepted candidate. No temporary Issue #22 workflow or verifier scaffolding remains in the tested tree.

No physical-device testing is claimed. Browser evidence is automated Chromium against the production build in GitHub Actions.

## Final payload and lazy-loading evidence

The final accepted run recorded three distinct measurement paths. They intentionally differ because they measure different artefacts/reporting implementations.

| Measure | Raw | gzip |
| --- | ---: | ---: |
| generator/runtime source `src/data/maps/north-america.ts` | **1,874,879 B** | **411,137 B** via Node `gzipSync` |
| deterministic North America verifier model | **1,875,784 B** | **412,240 B** |
| production lazy chunk `north-america-DT6OqdvP.js` | **1,872,522 B** | **410,389 B** via Node `gzipSync` |
| Vite reporter | **1,872.52 kB** | **435.28 kB** |

The deterministic verifier ceiling remains an evidence-based **425,000 gzip bytes** and is tied to the verifier's own 412,240-byte measurement.

Final artifact inspection proves:

- exactly one North America JS geography chunk is emitted;
- `north-america-DT6OqdvP.js` remains dynamically/lazily loaded;
- the North America chunk is **not** referenced by the service-worker precache;
- `assets/north-america-*.js` remains explicitly excluded from precache generation;
- no verifier-only output leaked into `dist/`.

## Shared generator regression evidence

The accepted gate regenerated Africa, South America, Europe, Asia and North America from the canonical source pipeline and then passed `git diff --exit-code`. The tracked geography therefore remained byte-clean after complete regeneration.

The same integrated verifier chain confirmed:

- Africa: 54-country coverage, nine lakes, no rivers;
- South America: 12 countries and the established 5/3/4 split;
- Europe: 44 countries with existing microstate assistance/framing intact;
- Asia: existing canonical membership, learner regions and framing intact;
- North America: 23 countries and 2/8/13 regional split;
- shared inset, adjacency, neighbour-map, zero-neighbour, routing, outline, achievement and British-English contracts all green.

Because regeneration is byte-clean, existing country IDs/membership, canonical scored geometry, adjacency, focus/framing, assistance inventories and physical-context policy for the four previously shipped continents are unaffected.

## Production browser QA

The accepted integrated gate passed the complete Chromium suite, **56/56**, against the production build.

The North America matrix covers:

- 320 × 568 narrow phone portrait;
- 390 × 844 modern phone portrait;
- 768 × 1024 tablet portrait;
- 844 × 390 short landscape;
- 1280 × 800 desktop.

Across those viewports it verifies North America, Northern America, Central America and Caribbean framing; all 13 Caribbean learner targets; all seven invisible assisted-hit targets; all three inset groups; clipping and overlap; real polygon precedence; Central America density; real mouse answer interaction; correct/wrong Play feedback; wheel zoom and pointer pan; multipart Outlines; `PAN↔COL`; `HTI↔DOM`; all 11 zero-neighbour Caribbean states and the #58 map-unavailable path; typed navigation; lazy loading; PWA runtime; and complete-region Mastery presentation.

Existing #117 Germany/Liechtenstein and France/Luxembourg precedence tests stayed green, so the shared pointer fix did not weaken the real-polygon-first interaction contract.

## Delivery closeout

The final delivery sequence completed without further production changes after the accepted technical candidate; the only pre-PR change was the durable worklog evidence update.

- Focused implementation PR: **#140 — `feat(#22): add North America across all four learning domains`**.
- PR head after the documentation-only evidence commit: `ce34f044fc49b8cce2abb7150e6e8e62a9ef2450`.
- Normal PR CI: run **`33118301435`**, green (`npm run check`, complete `npm test`, artifact upload).
- Merge SHA: **`c74ba3fac51b1bfe8f1eddab5735df3b07c4b156`**.
- Resulting production `main` SHA: **`c74ba3fac51b1bfe8f1eddab5735df3b07c4b156`**.
- Merged-main CI: run **`33118469841`**, green.
- GitHub Pages deployment: run **`33118578586`**, green; production build, Pages artifact upload and deployment all succeeded from the merge SHA.
- Firebase deployment/Hosting: run **`33118578613`**, green; production build, Firebase Hosting live-channel deploy, Firestore rules deploy and live Firebase-origin Chromium acceptance all succeeded from the merge SHA.

The deployed production tree is the accepted North America implementation plus documentation evidence only. The final technical gate already proved the exact lazy chunk, no service-worker precache reference, no verifier-only output, #117 precedence, pointer interactions and cross-continent generator regressions. Normal PR/main CI and both deployment workflows stayed green, so no integration change invalidated those results.

No physical-device testing is claimed as part of #22 closeout.

## Lessons for Oceania

Issue #27 should reuse these findings before adding new interaction machinery.

1. **Dense small-island assistance:** start with canonical polygons at realistic phone scale. Use invisible ~44 CSS px hit assistance when a small target merely needs a larger practical touch surface. Use a true-scale question-specific inset when nearby islands would otherwise create ambiguous overlap. Do not add permanent locator discs or callouts unless production QA proves they are necessary.
2. **Pointer interaction:** never capture the first pointer merely because it landed on a pannable map. Capture only after movement establishes a drag, and capture active pointers once a real multi-pointer pinch exists.
3. **Hit precedence:** canonical real polygons must beat invisible assistance surfaces wherever they overlap. Keep the #117 precedence regressions active when adding dense Pacific assistance.
4. **Viewport fitting:** preserve complete canonical scored country geometry. Filter remote components only for fit/focus calculations when they destroy useful framing.
5. **Multipart Outlines:** preserve full canonical country identity and meaningful subpaths rather than replacing archipelagos with handwritten silhouettes.
6. **Context optimisation:** optimise non-scoring physical context first while protecting scored geometry; stop when measured savings do not justify visible degradation.
7. **Payload budgets:** set verifier ceilings from measured final output plus deliberate regression margin. Record deterministic verifier bytes and exact production lazy-chunk impact separately.
8. **Generator reuse:** reuse shared viewport-component filtering, explicit context exclusion, global adjacency derivation, keyed non-scoring context, dynamic 44 px hits and canonical true-scale inset machinery. Do not create an Oceania-specific topology or island interaction subsystem.

## Closeout gates

- [x] exact 23-country / 2+8+13 curriculum verified;
- [x] all four domains consume shared scopes;
- [x] canonical Natural Earth geometry is the sole geography source;
- [x] Locations and Outlines production coverage verified;
- [x] global topology-derived Neighbours including `PAN↔COL` and `HTI↔DOM` verified;
- [x] 11 zero-land-neighbour Caribbean targets verified;
- [x] territory/context and USA fit/focus policy documented;
- [x] five Great Lakes / no-rivers policy verified;
- [x] assistance/inset inventory production-tested;
- [x] pointer-capture root cause fixed and permanent regression tests added;
- [x] shared generator regeneration is byte-clean for existing continents;
- [x] exact production artifact and lazy/precache behaviour inspected;
- [x] complete integrated Node 22 / Java 21 acceptance green on `00cf20c4f132403e91325a4e8c90fa7032e92b05` in run `33117435601`;
- [x] complete Chromium browser matrix green, 56/56;
- [x] PWA runtime verification green;
- [x] temporary Issue #22 verifier scaffolding removed before final candidate acceptance;
- [x] focused PR #140 green in normal CI and current with `main` before merge;
- [x] merged-main CI, GitHub Pages and Firebase deployment/live-origin health verified;
- [x] durable record archived to `docs/closed/` and open-work truth reconciled.
