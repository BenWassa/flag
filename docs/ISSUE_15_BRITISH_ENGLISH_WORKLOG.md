# Issue #15 — British English worklog

**Issue:** #15 — Standardise all user-facing copy on British English  
**Branch:** `issue-15-british-english`  
**Started:** 2026-08-19 17:24 America/Toronto  
**Last updated:** 2026-08-19 17:48 America/Toronto

This log records the implementation using **observation → assessment → change → verification → evaluation**. Historical worklogs are intentionally not rewritten for spelling alone.

## 2026-08-19 17:24 — Source-of-truth and concurrency audit

**Observation**  
Issue #15 defines British English as the learner-facing product language while explicitly preserving stable technical identifiers such as `neighbors`, `/#/neighbors/...`, `neighbors.css`, generated adjacency identifiers, and `flag-atlas:neighbor-*` persistence namespaces. Current `main` is at commit `12b8e497b162f49c7f6f6d8561fb8ca531297407` (`Add map-centred visual reveal to Neighbors (#17)`, closing Issue #16). `docs/ISSUE_16_NEIGHBOR_MAP_WORKLOG.md` confirms that Issue #16 deliberately left British-English product-language cleanup to Issue #15.

**Assessment**  
This is a compatibility-sensitive copy standardisation, not a route/storage migration and not a Neighbours gameplay or cartography refactor. Issue #16's map labels, summary text and accessible names are now part of the audit surface.

**Change**  
Created dedicated branch `issue-15-british-english` from current `main`. Read Issue #15, `DESIGN.md`, `docs/COUNTRY_NAMING.md`, `docs/ROUTING.md`, the Issue #3 Neighbours worklog, the Issue #16 map worklog, routing/domain code, and all current learning-domain UI surfaces.

**Verification**  
Confirmed all four domains are shipped on current `main`; the stable Neighbours route remains `/neighbors`; Issue #16 map code and verification are present. The local container cannot resolve `github.com`, so repository mutation and authoritative verification use the connected GitHub surface and GitHub Actions rather than a local clone.

**Evaluation**  
Issue #16 is fully in scope for copy/a11y review, but its geometry, label placement, viewport, adjacency and mastery mechanics remain untouched.

## 2026-08-19 17:30 — Language decisions and ambiguity classification

**Observation**  
The audit found learner-visible American English in Home/domain labels, Neighbours scope/quiz/results copy, live-region announcements, document titles, Issue #16 map ARIA/summary text, and two `prioritized` strings. It also found legitimate technical American spellings and two important `practice` cases.

**Assessment**  
Occurrences were classified as:

1. learner-facing product copy → British English required;
2. technical identifier/API → retain for compatibility or standards compliance;
3. country naming → governed by `docs/COUNTRY_NAMING.md`;
4. historical documentation → normally retain;
5. current normative/product documentation or product-copy assertions → update.

`practice` is a noun in **Adaptive practice** and manifest **focused practice**, so it remains `practice`. Home's **where to practise it** is a verb and was already correct. CSS/manifest/API terms such as `color`, `background_color`, `theme_color`, `currentColor`, and `window.scrollTo({ behavior: ... })` remain technically spelled as their standards require.

**Change**  
Adopted modern British `-ise` style for product prose (`prioritised`, `summarised`, `recognisable`, `normalisation`) and the learner-facing domain name **Neighbours**. Added a small canonical `domainDisplayName()` helper so stable `neighbors` maps to `Neighbours` without a localisation framework.

**Verification**  
Confirmed canonical country labels such as Côte d'Ivoire, Türkiye, Cabo Verde, The Gambia and Eswatini are untouched. Confirmed route parsing/serialisation and storage namespaces remain technically named `neighbors`/`neighbor-*`.

**Evaluation**  
The chosen approach prevents the highest-risk display-label regression while keeping the product single-language and avoiding unnecessary i18n infrastructure.

## 2026-08-19 17:34 — Product-surface implementation

**Observation**  
User-visible `Neighbor/Neighbors` text existed across `src/ui/views/home.ts`, `domain.ts`, `neighbor-home.ts`, `neighbor-quiz.ts`, `neighbor-results.ts`, `src/ui/components/neighbor-map.ts`, `src/routing/routes.ts`, and `src/app.ts`. The new Issue #16 accessible map surface included `Unresolved neighboring country`, solved/revealed neighbour labels, summary counts and a fit-control label.

**Assessment**  
Visible text, accessible names, live-region output and document titles are one product-language surface and must move together.

**Change**  
Updated:

- Home/domain/scope labels to **Neighbours**;
- land-neighbour instructions, counts, zero-neighbour policy copy, storage notices and result copy;
- all Neighbours round live-region announcements and result/document-title copy;
- Issue #16 unresolved/solved/revealed map ARIA labels, map summary and fit-control label;
- `prioritized` → `prioritised` in Flags and Outlines scope copy;
- `results summarized` → `results summarised` in Neighbours Test copy.

Internal names such as `neighborSession`, `neighborProgress`, `data-neighbor-*`, `neighbors.css`, `/neighbors`, adjacency fields/constants and storage keys were intentionally retained.

**Verification**  
Source-level inspection confirms the touched learner-facing strings use British forms while technical selectors and identifiers are unchanged.

**Evaluation**  
The implementation changes language only; it does not alter learning mechanics, answer leakage protections, map interaction, geometry or state transitions.

## 2026-08-19 17:36 — Metadata, PWA and normative documentation

**Observation**  
The document metadata still described `land-border neighbors`, the HTML language was generic `en`, and the PWA manifest had no language declaration. The copy-bearing shell changed, so the existing `flag-atlas-v12` cache would otherwise be able to preserve old strings. README, `PRODUCT.md`, `DESIGN.md`, `docs/ROUTING.md` and `docs/COUNTRY_NAMING.md` contained current product descriptions or language-policy prose that would contradict the shipped British interface.

**Assessment**  
British English should be declared semantically as well as spelled consistently. Normative/current docs should align; historical worklogs do not need retrospective spelling edits. Country-name policy must remain independent of localisation.

**Change**  
Set document and manifest language to `en-GB`; changed HTML description to `land-border neighbours`; retained noun `focused practice`; bumped the service-worker cache to `flag-atlas-v13`. Updated current README/product/design/routing/naming documentation to describe **Neighbours**, British-English product copy and the stable `/neighbors` compatibility boundary. Country display names were not changed.

**Verification**  
The service worker still caches the same shell/runtime files, including technical `neighbors.css` and `neighbor-map-runtime.js`; only the cache version/comment changed. Manifest API keys such as `background_color` and `theme_color` remain standards-compliant.

**Evaluation**  
Installed, offline, visible and assistive-technology language now share one declared `en-GB` product contract without changing web-platform field names.

## 2026-08-19 17:39 — Regression contract

**Observation**  
A repository-wide grep would create false failures on routes, storage, generated adjacency terminology, CSS properties, filenames and Web APIs.

**Assessment**  
The regression gate must test built learner surfaces and known live/document-copy phrases, while explicitly proving compatibility-sensitive technical spellings survive.

**Change**  
Added `scripts/verify-british-english.mjs` to the normal `npm run verify` chain. It:

- renders representative Home, domain, Flags, Outlines, Neighbours scope/quiz and Issue #16 map surfaces from `dist`;
- rejects likely American learner-copy phrases (`Neighbors`, `Neighbor`, `neighbors found`, `neighboring country`, `land-border neighbor`, `zero-neighbor`, `unseen prioritized`, `results summarized`, etc.);
- checks built `app.js` for former live-region/document-title phrases;
- verifies `domainDisplayName('neighbors') === 'Neighbours'`;
- verifies `/neighbors/...` parse/serialise compatibility;
- verifies `practice` noun / `practise` verb decisions;
- verifies `en-GB` HTML/manifest metadata;
- verifies legacy neighbour storage keys, technical `neighbors.css`, manifest colour-property names and DOM `behavior` API spelling remain valid;
- verifies the `flag-atlas-v13` PWA cache contract.

Updated existing routing, Neighbours, Neighbours-map and cross-domain verification assertions that intentionally inspect product copy/cache version.

**Verification**  
The verifier targets rendered/built product phrases rather than blindly scanning all source tokens. The broader source audit also checked `neighbor`, `neighbors`, `color`, `colored`, `center`, `centered`, `behavior`, `organize`, `organization`, `recognize`, `customize`, `prioritize`, `visualize`, `initialize`, `favorite`, `gray`, `license`, `practice`, and `program`; remaining hits outside changed product copy classify as technical standards/identifiers or historical documentation.

**Evaluation**  
This creates a regression contract for the actual localisation boundary: product strings fail on American English while implementation/API identifiers remain legal.

## 2026-08-19 17:41 — CI #144: dependency transcription error

**Observation**  
PR-head CI run `32305129390` (#144) failed during `npm install` before build or tests with `ETARGET: No matching version found for topojson-server@3.0.3`.

**Assessment**  
Comparison with current `main` and `package-lock.json` showed this was introduced by the Issue #15 branch while editing `package.json`: two unrelated existing pins had been transcribed incorrectly (`topojson-client 3.1.0 → 3.0.1` and `topojson-server 3.0.1 → 3.0.3`). Main itself was not broken.

**Change**  
Restored the exact existing dependency pins from `main`: `topojson-client@3.1.0` and `topojson-server@3.0.1`. No dependency upgrade or lockfile change was made.

**Verification**  
CI #145 installed all dependencies successfully with zero reported vulnerabilities and proceeded through build and the verification chain.

**Evaluation**  
The failure was an accidental branch-only manifest edit and is fully reverted; dependency ownership remains outside Issue #15.

## 2026-08-19 17:43 — CI #145: brittle integration assertion

**Observation**  
PR-head CI run `32305332976` (#145) built successfully and passed the 195-country base verification, Locations/map checks, routing, production cartography, Outlines, Neighbours, and Issue #16 neighbour-map verification. It then failed `verify-domain-integration.mjs` because the updated assertion searched compiled Home for literal `Outlines` even though Home now obtains that label from `domainDisplayName('outlines')`.

**Assessment**  
Production behaviour was correct; the test was coupled to the old hard-coded-label implementation and contradicted the new canonical display-name design.

**Change**  
Changed the integration assertion to require `domainDisplayName('outlines')` and `domainDisplayName('neighbors')`, keeping the test focused on the shared display-name contract rather than literal implementation output.

**Verification**  
CI #146 passed the complete repository `npm test` chain, including the new British-English verifier.

**Evaluation**  
The corrected test now protects the intended abstraction rather than penalising it.

## 2026-08-19 17:45 — CI #146 and exact production artifact

**Observation**  
PR-head CI run `32305454667` (#146), head `8f2771ee51beab58aa5c0fa891260038c6b65690`, completed successfully. The exact `flag-atlas-dist` artifact has ID `9384522163`, size 342,299 bytes, and GitHub digest `sha256:bb0344d5f507a5ba455b7fe100d7fcf75363d34ea9bd8664c1a03ce26538a45c`.

**Assessment**  
Source tests are necessary but insufficient for this issue: the built shell, compiled live-region strings, metadata and Issue #16 accessible map strings must be inspected because those are what the learner actually receives.

**Change**  
Downloaded the exact CI ZIP, independently SHA-256 hashed it, unpacked all 61 production files (~1.4 MB), and searched the product-bearing artifact for the target American-English vocabulary and required British forms.

**Verification**  
The downloaded ZIP independently hashed to `bb0344d5f507a5ba455b7fe100d7fcf75363d34ea9bd8664c1a03ce26538a45c`, exactly matching GitHub's digest. Artifact inspection confirmed:

- `index.html` and the manifest declare `en-GB`;
- HTML metadata uses `land-border neighbours`;
- Home uses the verb `practise`;
- Flags/Outlines use `prioritised` while retaining noun `Adaptive practice`;
- Neighbours quiz/results/policies use `neighbour/neighbours` and `summarised`;
- compiled live announcements include `land-neighbour targets`, `Remaining neighbours`, and `Neighbour round complete`;
- Issue #16 map output uses `neighbours found`, `neighbouring countries`, and `Fit target and all neighbours`;
- `domain/display.js` maps stable `neighbors` to `Neighbours`;
- legacy `flag-atlas:neighbor-progress:v1` remains intact;
- PWA cache is `flag-atlas-v13`;
- no built product-bearing hit remains for `neighbors found`, `neighboring country`, `land-border neighbor`, `land neighbor`, `zero-neighbor`, `prioritized`, `summarized`, `organize`, `organization`, `recognize`, `recognized`, `customize`, `prioritize`, `visualize`, `initialize`, `favorite`, `colored`, `center map`, or `centered`.

Remaining American-spelled artifact tokens were intentionally technical: internal `neighbor*` symbols/routes/files, `window.scrollTo({ behavior: 'instant' })`, manifest `background_color`/`theme_color`, HTML `theme-color`, SVG `currentColor`, and noun `practice`.

**Evaluation**  
The exact production artifact satisfies the language contract while preserving browser standards and backwards-compatible internal APIs.

## 2026-08-19 17:47 — Concurrent-main and review gate

**Observation**  
Current `main` remains `12b8e497b162f49c7f6f6d8561fb8ca531297407`, exactly the branch base containing Issue #16. PR #18 has no inline review threads, submitted reviews, or conversation comments.

**Assessment**  
There are no concurrent-main changes to integrate and no review feedback to resolve. The branch already contains the Issue #16 map work that this issue was required to audit.

**Change**  
No merge/rebase conflict action is required. A final documentation-only commit records verification evidence and intentionally triggers one final PR-head CI/artifact refresh.

**Verification**  
Compared latest `main` history with the branch base and queried PR #18 review threads/reviews/comments: all are unchanged/empty.

**Evaluation**  
The remaining release gate is final CI/artifact equivalence on the documentation head. Final run identifiers are posted to the PR/Issue after that run so recording them does not mutate the tested commit in a loop.

## Verification history

- CI #144 / run `32305129390`: **failed before tests** — branch-only TopoJSON dependency transcription error; exact main pins restored.
- CI #145 / run `32305332976`: **failed after all pre-existing domain checks** — new integration assertion expected an obsolete hard-coded Home label; corrected to the canonical display-name contract.
- CI #146 / run `32305454667`: **passed** — complete `npm test`; exact artifact ID `9384522163` downloaded, digest-matched and inspected.

## Final release gate

Status at this documentation commit:

1. current `main` integrated: **yes — unchanged from branch base `12b8e497…`**;
2. all user-facing surfaces audited: **yes, including Issue #16 map accessibility/live output**;
3. stable internal routes/storage retained: **yes**;
4. complete `npm test`: **green on code head CI #146**;
5. exact CI artifact: **CI #146 digest-matched and inspected**;
6. review threads/reviews: **none**;
7. gameplay/cartography changes: **none**;
8. final documentation head: **must receive one fresh green CI run and artifact-equivalence check before PR readiness**.
