# Issue #22 — North America full four-domain expansion

**Status:** implementation and production-scale verification complete on `issue-22-north-america-expansion`; final integrated branch gate, PR CI and deployment closeout remain before the issue can be closed.

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

During browser QA a real shared React/runtime lifecycle defect was found. A zero-neighbour target intentionally left the neighbour-map host in `data-neighbor-map-status="error"`; React reused that same host DOM node for the next target, so the runtime refused to hydrate a later non-zero target such as Haiti because the stale error status survived. The host is now keyed by `session.id:targetId`, forcing a fresh host between questions while preserving same-question runtime shell updates. Browser-independent `HTI↔DOM` and `PAN↔COL` neighbour models were already correct; canonical adjacency was not changed to fix the runtime issue.

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

These hit surfaces are dynamically kept at approximately 44 CSS px. A diagnostic measured Bahamas at approximately 45.9 × 46.0 CSS px in the failing pre-fix interaction case.

### True-scale question-specific insets

Three dense Caribbean clusters use generated true-scale insets only when a member is the current target:

- `KNA` + `ATG`
- `DMA` + `LCA`
- `VCT` + `GRD` + `BRB`

Insets reuse canonical geometry, preserve an outlined source window, avoid answer-revealing labels, expose one keyboard/touch target per country, and disappear when not relevant.

### Not required

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

Permanent browser regression coverage now proves:

- no capture on initial single-pointer down;
- no capture after 3 px movement;
- capture after a movement beyond the drag threshold;
- drag changes the map viewBox without answering;
- sub-threshold movement on an assisted target still scores;
- a physical click on a real country polygon still scores;
- the existing #117 real-polygon-over-assistance precedence tests remain green.

## Outlines

Outlines derives the same canonical country geometry used by Locations.

Browser QA explicitly covers multipart Caribbean silhouettes including Bahamas, Antigua and Barbuda, Saint Kitts and Nevis, Saint Vincent and the Grenadines and Trinidad and Tobago at phone portrait and short landscape. The United States keeps complete canonical multipart geometry for Outlines; fit/focus filtering is not an outline mutation.

## Mastery and completion

North America regions participate in the shipped #108 complete-region qualification rules. Browser QA verifies the Northern America presentation with all four region × domain Masteries present. Ordinary sampled/incomplete rounds cannot award Mastery; the existing achievement semantics and storage namespaces were not changed by #22.

## Payload and lazy-loading evidence

The original provisional North America verifier ceiling was 400,000 gzip bytes. The deterministic verifier produced **1,875,784 raw / 412,240 gzip bytes**, so the old ceiling failed despite valid cartography. The controlled physical-context experiment saved only about 1 kB and was rejected. The verifier ceiling is therefore an evidence-based **425,000 gzip bytes**.

Final deterministic evidence run `33096069045` measured the exact tracked/generated and production artifacts after regeneration:

| Measure | Bytes |
| --- | ---: |
| tracked `src/data/maps/north-america.ts` | 1,874,879 raw |
| tracked source via Node `gzipSync` | 411,137 gzip |
| verifier model | 1,875,784 raw / 412,240 gzip |
| production `north-america-DT6OqdvP.js` | 1,872,522 raw |
| production chunk via Node `gzipSync` | 410,389 gzip |
| Vite reporter | 1,872.52 kB / 435.28 kB gzip |

The differing gzip figures are measurement/reporting paths; the verifier budget remains tied to the verifier's own deterministic 412,240-byte measurement.

The final artifact inspection also proves:

- exactly one North America JS geography chunk is emitted;
- the chunk remains dynamically/lazily referenced through the manifest;
- `assets/north-america-*.js` is explicitly excluded from the service-worker precache;
- the emitted `dist/sw.js` does not contain the North America chunk filename;
- no verifier-only output appears in `dist/`.

## Shared generator regression evidence

Evidence run `33096069045` ran `npm run maps:generate` from a clean checkout and then `git diff --exit-code`. Regeneration of Africa, South America, Europe, Asia and North America produced **zero tracked diff**. This is the bytewise regression proof that viewport-only component filtering/context exclusion did not silently alter the already-shipped continent artifacts.

The same run then passed the continent/shared cartography verifiers:

- Africa: 54-country coverage; 40,775/56,682 retained coordinates; 9 lakes; no rivers; 920,120 raw / 242,362 gzip verifier bytes.
- South America: 12 countries; 5/3/4 regions; 885,033 raw / 242,006 gzip verifier bytes.
- Europe: 44 countries; existing microstate assistance and framing retained; 1,510,289 raw / 432,961 gzip verifier bytes.
- Asia: 48 canonical countries, six learner regions; 2,029,054 raw / 493,590 gzip verifier bytes.
- shared inset, adjacency, neighbour-map and zero-neighbour contracts all green.

Because regeneration is byte-clean, existing country IDs/membership, canonical scored geometry, adjacency, focus/framing, assistance inventories and physical-context policy for the four previously shipped continents are unchanged.

## Production browser QA

Focused production-build browser gate `33095555689` passed after the pointer and neighbour-host fixes.

The matrix covers:

- 320 × 568 narrow phone portrait;
- 390 × 844 modern phone portrait;
- 768 × 1024 tablet portrait;
- 844 × 390 short landscape;
- 1280 × 800 desktop.

Across those viewports the suite verifies North America, Northern America, Central America and Caribbean framing; all 13 Caribbean learner targets; all seven invisible assisted-hit targets; all three inset groups; clipping and overlap; real polygon precedence; Central America density; real mouse answer interaction; correct/wrong Play feedback; wheel zoom and pointer pan; multipart Outlines; `PAN↔COL`; `HTI↔DOM`; all 11 zero-neighbour Caribbean states and the #58 map-unavailable path; typed navigation; lazy loading; and complete-region Mastery presentation.

Existing #117 Germany/Liechtenstein and France/Luxembourg precedence tests stayed green, so the pointer fix did not weaken the shared real-polygon-first interaction contract.

No physical-device testing is claimed. Browser QA was automated Chromium against the production build in GitHub Actions.

## Lessons for Oceania

Issue #27 should reuse these findings before adding new interaction machinery.

1. **Dense small-island assistance:** start with canonical polygons at realistic phone scale. Use invisible ~44 CSS px hit assistance when a small target merely needs a larger practical touch surface. Use a true-scale question-specific inset when several nearby islands would otherwise produce overlapping/ambiguous hit areas. Do not add permanent locator discs or callouts unless production QA proves they are necessary.
2. **Pointer interaction:** never capture the first pointer merely because it landed on a pannable map. Capture only after movement establishes a drag, and capture active pointers once a real multi-pointer pinch exists. Otherwise the browser can retarget the final click away from the tiny answer surface—the exact failure mode most damaging in Oceania.
3. **Hit precedence:** canonical real polygons must beat invisible assistance surfaces wherever they overlap. Assisted surfaces should win only where no real co-active polygon claims the point. Keep the #117 precedence tests active when adding dense Pacific assistance.
4. **Viewport fitting:** preserve complete canonical scored country geometry. When remote components destroy useful framing, filter those components only for viewport fit/focus calculations rather than deleting them from the country geometry.
5. **Multipart Outlines:** preserve the full canonical country identity and all meaningful subpaths. Do not simplify an archipelago into a handwritten single-island silhouette merely to make an Outline easier to display.
6. **Context optimisation:** optimise non-scoring physical context first—ocean, coastline and lakes—while protecting scored geometry. Stop when measured byte savings are too small to justify visible degradation.
7. **Payload budgets:** set verifier ceilings from measured final output plus a deliberate regression margin, not an arbitrary round number. Record both deterministic verifier bytes and the exact production lazy-chunk impact.
8. **Generator reuse:** reuse the shared viewport-component filtering, explicit context exclusion, global adjacency derivation, keyed non-scoring context, dynamic 44 px hits and canonical true-scale inset machinery. Do not create an Oceania-specific topology or island interaction subsystem.

## Remaining closeout gates

Before #22 is closed:

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
- [x] focused production browser matrix green;
- [ ] temporary implementation scaffolding removed;
- [ ] final `npm run check`, complete `npm test`, PWA runtime and integrated browser gate green on the cleaned/current branch;
- [ ] one focused PR green in normal CI and current with `main`;
- [ ] merged `main`, Pages and Firebase deployment health verified;
- [ ] durable record moved to `docs/closed/` and GitHub Issue #22 closed with final PR/SHA/run evidence.
