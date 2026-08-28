# Issue #27 — Oceania full four-domain expansion

**Status:** post-#22 integration accepted on the focused #27 branch; PR/merge/deployment closeout pending.

This is the durable implementation record for Issue #27. The common continent-expansion contract remains in `docs/architecture/continent-expansion.md`; generator-owned provenance remains in `docs/architecture/oceania-cartography-provenance.json` and is not manually augmented with CI or closeout evidence.

## Delivered curriculum

Oceania contains exactly 14 Atlas application countries across four learner regions:

- Australia & New Zealand — 2: Australia (`AUS`), New Zealand (`NZL`)
- Melanesia — 4: Fiji (`FJI`), Papua New Guinea (`PNG`), Solomon Islands (`SLB`), Vanuatu (`VUT`)
- Micronesia — 5: Kiribati (`KIR`), Marshall Islands (`MHL`), Micronesia (`FSM`), Nauru (`NRU`), Palau (`PLW`)
- Polynesia — 3: Samoa (`WSM`), Tonga (`TON`), Tuvalu (`TUV`)

All four regions and the parent Oceania scope are supported in Flags, Locations, Outlines and Neighbours. ISO3 remains canonical identity. Dependent territories and non-application source features are not promoted into scored curriculum.

## Canonical cartography and Pacific projection

Oceania uses the same reproducible Natural Earth 1:10m topology pipeline as the other production continents, pinned to upstream commit `ca96624a56bd078437bca8184e78163e5039ad19`.

The generic generator gained optional projection rotation. Oceania uses Pacific-centred `d3.geoNaturalEarth1` rotation `[-160, 0, 0]`, moving the projection seam away from scored Pacific archipelagos without moving countries, duplicating islands or introducing handwritten paths. Other continents retain their existing projection configuration.

Deterministic topology simplification retains 29,931 of 41,001 projected Oceania coordinates. Rivers remain excluded under the global cartography policy.

### Kiribati / antimeridian integrity

Pinned-source audit records 35 canonical Kiribati components spanning both sides of the antimeridian. The Pacific-centred projection preserves the multipart country without a false world-spanning segment, duplicated scoring geometry or manual antimeridian surgery. Permanent production-browser coverage exercises Kiribati Locations and Outlines framing.

## Territory and dependency policy

Pacific source features remain context unless already canonical Atlas application countries.

- `IDN` is keyed non-scoring context so PNG's true cross-continent land border can be represented while Indonesia remains Asia-owned.
- New Caledonia and French Polynesia remain French non-scoring context.
- Guam, Northern Mariana Islands and American Samoa remain United States non-scoring context.
- Cook Islands and Niue are not promoted into the scored Atlas country catalogue.
- Other dependencies encountered in the canonical extent remain non-scoring context or are excluded when irrelevant to the learner viewport.

No territory treatment creates maritime adjacency.

## Neighbours truth

The complete global canonical topology preserves `PNG ↔ IDN` even though the countries belong to different learner continents.

The other 13 scored Oceania countries have explicit verified empty direct-land-adjacency sets:

`AUS`, `NZL`, `FJI`, `SLB`, `VUT`, `KIR`, `MHL`, `FSM`, `NRU`, `PLW`, `WSM`, `TON`, `TUV`.

They use the shared #58 **No land neighbours** retrieval mechanic and remain genuine Neighbours learning targets. Empty adjacency is never inferred from missing topology and no maritime neighbours are invented. The React Neighbours map host remains isolated by `session.id:targetId`, preserving the zero-neighbour → PNG/map-ready lifecycle.

## Locations assistance inventory

Production-scale evidence supports the minimum truthful assistance inventory:

- real polygon only: `AUS`, `NZL`, `PNG`;
- question-specific invisible ~44 CSS px hit assistance: `FJI`, `SLB`, `VUT`, `KIR`, `MHL`, `FSM`, `NRU`, `PLW`, `WSM`, `TON`, `TUV`;
- visible locators: none;
- leader-line callouts: none;
- inset panels: none.

Assistance never relocates visible geography. It enlarges only the current question's invisible answer surface and yields to real scoring land.

The shared #117 precedence repair remains authoritative: assisted marks paint below real scoring polygons, so real country land wins contested taps by SVG paint/hit order rather than array order. Existing Europe #117 and North America pointer/Caribbean regressions remain covered.

## Outlines

Whole-country canonical multipart identity remains the default. Oceania archipelagos are not reduced to a convenient largest island.

Marshall Islands retains all 22 generated canonical components/subpaths. Kiribati likewise preserves its full multipart identity across the antimeridian. Exact-production browser acceptance compares rendered multipart count to canonical `subpathCount` and verifies complete framing on phone portrait and short landscape.

## Stacked implementation and post-#22 reconciliation

#27 was deliberately developed on the preserved North America #22 lineage so it could inherit generic generator, viewport, pointer, lifecycle and small-island work rather than duplicate it.

The parked implementation was:

- parked branch head: `c2777a525961645f4adbbb58619eab0a9d104726`;
- exact clean-tested implementation: `c2ad60160d409f93d2aa9bcf33f938906dd2abe9`;
- stacked clean acceptance: Actions run `33116494936`.

After #22 merged and deployed, the noisy stacked history was discarded semantically rather than presented as new #27 work. The focused branch was rebuilt directly on post-#22 `main` `c0015974ada0c23e99ae7bce82ab120062b9c5d8`.

The accepted post-sync technical candidate is:

`24d3e3a4f476ec5a20be198c0aec5e194a5a40f9`

At acceptance it was exactly one commit ahead / zero behind that main SHA. The focused technical diff contained only Oceania plus genuinely necessary generic corrections; shipped #22 North America provenance and Firebase/account configuration remained owned by current main.

## Final post-#22 integrated acceptance

Actions run `33137730483` is the clean post-#22 integrated acceptance gate. Its temporary verifier workflow checks out the exact technical candidate `24d3e3a4f476ec5a20be198c0aec5e194a5a40f9` under Node `22.23.2` and Java 21.

The run completed successfully with:

- clean-tree guard before installation;
- `npm ci`;
- complete deterministic `npm run maps:generate` for all six production continents;
- post-generation `git diff --exit-code` / clean generated provenance;
- `npm run check`;
- complete `npm test`, including **54/54 Vitest tests** and **12/12 Firestore rules tests**;
- permanent Chromium production suite;
- explicit #117 hit-precedence regression;
- focused North America pointer/Caribbean regressions;
- focused permanent Oceania production suite;
- PWA runtime verification;
- exact production build;
- exact `dist/` artifact inspection;
- permanent-acceptance inventory proving no #27 diagnostic workflow/script/spec exists in the product candidate;
- final repository cleanliness after removing only Firebase/Playwright runtime residue;
- production artifact upload as `flag-atlas-dist-issue-27-post22-acceptance` (artifact `9672775203`).

The Firebase rules harness writes `tests/firebase/firestore-debug.log` and `tests/firebase/package-lock.json` as untracked runtime residue because its existing command performs a nested install. The final acceptance harness removes only those test outputs before the clean-tree assertion; the product candidate itself is unchanged.

No physical-device testing was performed or is claimed.

## Final production payload

The exact post-sync production build contains exactly one lazy Oceania geography JavaScript chunk:

- `oceania-w4m38Wch.js` — **860,081 B raw / 184,421 B `gzipSync`**.

The same build confirms:

- Oceania remains continent-lazy;
- the Oceania geography chunk is absent from the service-worker precache;
- `dist/` contains no verifier-only output;
- generator-owned provenance remains generator-owned.

The old stacked chunk hash happened to remain stable after semantic reconciliation, but this measurement is recorded from the post-#22 accepted candidate rather than assumed from the parked branch.

## World Crown consequence

Issue #27 does not change achievement qualification, persistence, scoring or presentation semantics.

With Oceania added, `worldHasCompleteCurriculum()` is true: all six real continents now have complete four-domain curriculum. Existing achievement logic still requires every continent completion before `worldCompletionEligible()` can award the persistent `worldCrown`, and #108 complete-region qualification remains unchanged.

Learner-facing World Crown presentation/acceptance is deliberately outside #27 and tracked by **#138 — Surface and accept the now-reachable World Crown state**.

## Closeout boundary

Before merge, the focused PR must remain current with `main` and CI-green. After merge, verify merged-main CI, GitHub Pages and Firebase Hosting/deployment acceptance, then move this record to `docs/closed/`, reconcile `docs/open/index.md`, record PR/merge/deployment IDs and close #27.

Do not implement #137, #138 or #119 as part of this issue.
