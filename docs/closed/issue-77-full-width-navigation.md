# Issue #77 — Full-width geography navigation and Quick Play removal

GitHub issue: [#77](https://github.com/BenWassa/flag/issues/77)  
Implementation branch: `issue-77-full-width-navigation`  
Pull request: [#80](https://github.com/BenWassa/flag/pull/80)  
Status: implementation complete on branch; PR intentionally left unmerged for review.

## Purpose

Issue #77 preserves Atlas's v0.6 mode-first Home while restoring a stronger, full-width geographic selection hierarchy after the learner chooses a mode.

The implemented learner flow is:

`Home mode → continent → region selection → deliberate Play/Learn`

The branch removes the row-level Quick Play shortcut experiment from continent and region selection while retaining the existing typed routes, launchers, progress/evidence semantics, achievement semantics, storage contracts and geography/cartography foundation.

This work supersedes the learner-facing inline Quick Play direction explored in Issues #74/#76. Those issues remain historical records; their implementation history is not rewritten.

## Baseline inspected before changes

Work started from current `main` at commit `431f42e5e86ac3b4cc421f3b4509a71eb8811ac6` (`chore(release): bump version to 0.6.0`). The same `main` commit was rechecked immediately before finalisation, so no semantic rebase/conflict resolution was required.

The implementation was based on the complete Issue #77 specification plus the current repository sources and documentation, including:

- `DESIGN.md`;
- `.impeccable/design.json`;
- `PRODUCT.md`;
- `docs/architecture/routing.md`;
- `src/ui/views/home.ts`;
- `src/ui/views/domain.ts`;
- `src/ui/views/launcher.ts`;
- `src/styles/atlas-theme.css`;
- `src/styles/styles.css`;
- `src/app.ts`;
- `src/routing/routes.ts`;
- shared progress/evidence presentation and verification scripts.

Historical full-width composition from Issue #35 / PR #38 was used only as a visual/compositional reference. The old scope-first `/atlas/*` architecture and retired four-domain region launch row were not restored.

## Implementation notes

### 1. Home deliberately left alone

`src/ui/views/home.ts` was treated as a regression surface only.

The implementation preserves:

- the four Flags / Locations / Outlines / Neighbours mode cards;
- `data-action="open-domain"` behaviour;
- the tactile/arcade Home treatment;
- existing coverage copy and progress strips;
- the v0.6 mode-first information architecture.

No scope-first Home or `/atlas/*` duplicate navigation system was reintroduced.

### 2. Domain continent index restored to full-width rows

`src/ui/views/domain.ts` and `src/styles/atlas-theme.css` were updated so `/{domain}` uses a single-column full-width geography stack instead of the compact two-column phone grid.

Supported continent rows now present:

- continent name;
- country count;
- region count;
- source-derived continent silhouette;
- existing progress strip;
- concise evidence copy (`strong`, `learning`, and `due` where relevant);
- chevron/whole-row navigation affordance.

The whole supported row is now the navigation target. It opens the continent launcher and does not begin a round.

Unsupported continents remain inert `Coming soon` shells. They still use the same full-width vertical rhythm, remain visually quieter than shipped curriculum, and do not gain any action.

Flags retains its deliberate World `Learn world` / `Play world` actions because that is a legitimate Flags-only world scope rather than row-level Quick Play.

### 3. Region selection restored to full-width rows with visible progress

`src/ui/views/launcher.ts` and `src/styles/atlas-theme.css` were updated so region rows are full-width scope-selection surfaces.

Every region row now shows:

- region name;
- country count;
- existing evidence counts (`strong`, `learning`, `unseen`, plus `due` where applicable);
- the shared `progressStrip(...)` presentation from the existing stats model;
- selected state when active;
- one whole-row region-selection affordance.

Selecting a region continues to retarget the existing continent launcher. The large launcher `Play {scope}` and `Learn {scope}` actions then target that selected region. When no region is selected, those same actions target the whole continent.

No new progress calculation, scheduler rule, persistence model or mastery threshold was introduced.

### 4. Learner-facing Quick Play removed end to end

The following learner-facing Quick Play paths were removed:

- `.continent-row__play` controls from `src/ui/views/domain.ts`;
- `.region-row__play` controls from `src/ui/views/launcher.ts`;
- `data-action="quick-play"` dispatch from `src/app.ts`;
- the now-dead `quickPlay(...)` application helper;
- the now-dead `scopeForQuickPlay(...)` routing helper in `src/routing/routes.ts`;
- corresponding CSS for the split trailing Play cells;
- old busy/pulse states tied specifically to those inline controls;
- verifier expectations that treated direct row-level Play as canonical behaviour.

Normal launcher Play/Learn actions were preserved. Existing typed learning/activity routes remain the sole activity-routing model.

### 5. CSS and interaction treatment

The canonical current styles were changed rather than restoring a historical stylesheet.

Key presentation changes include:

- `.page--tile-index .continent-list` forced to one full-width column;
- supported continent rows changed from split body/Play-cell composition to one navigation control;
- supported continent touch target set to a generous 112px minimum height;
- continent silhouette enlarged and moved into a dedicated geography column;
- region list fixed as one full-width column;
- region row minimum height increased to 92px to accommodate evidence and progress without crowding;
- selected region keeps a non-colour text cue (`Selected`) in addition to Atlas Blue treatment;
- progress strips span the row width;
- dead `.continent-row__play` / `.region-row__play` styling removed from both `atlas-theme.css` and the base `styles.css`;
- reduced-motion handling updated to cover the retained deliberate primary launcher action rather than deleted Quick Play controls.

No second component or visual system was added.

### 6. Documentation updated to the resolved product contract

The implementation updates the current normative guidance in:

- `DESIGN.md`;
- `.impeccable/design.json`;
- `PRODUCT.md`;
- `docs/architecture/routing.md`.

The documentation now states that:

- Home remains mode-first;
- post-mode continent and region selection is full-width and vertically scannable;
- continent/region rows select geography rather than starting rounds;
- the active launcher owns deliberate Play/Learn;
- the Home mode cards alone retain the harder arcade-tier treatment;
- the later row-level Quick Play experiment is retired.

### 7. PWA cache lineage corrected and advanced

Because the branch changes learner-facing shell CSS/JS, the service-worker cache version needed to advance under the repository's existing convention.

During final review, an important distinction was caught: several older verification scripts still asserted the historical Issue #16 `v16` marker, while current `main` was actually on active service-worker cache `flag-atlas-v26`.

The final branch therefore correctly:

- preserves the historical `v16` lineage comment;
- advances the active cache from `flag-atlas-v26` to `flag-atlas-v27`;
- adds a `v27` lineage note describing Issue #77;
- updates current cache assertions to target v27 rather than incorrectly treating v16/v17 as the active cache.

This avoided shipping a misleading cache rollback or a false verifier contract.

## Verification changes

Focused repository verification was updated to assert the new interaction contract rather than merely deleting failing checks.

### `scripts/verify-ia.mjs`

Now verifies, among other things:

- no row-level Quick Play controls;
- supported continents expose one deliberate navigation control;
- five Africa region selectors remain available;
- all five regions expose progress strips;
- full-width continent and region CSS contracts;
- generous touch target minimums;
- no dead Quick Play CSS or application dispatch;
- Home and routed-launcher semantics remain intact.

### `scripts/verify-routing.mjs`

Removed obsolete `scopeForQuickPlay(...)` expectations and now verifies:

- no Quick Play application dispatch;
- continent rows open launchers rather than activity routes;
- launcher region rows select scope only;
- region progress remains present;
- existing typed Play/Learn routes and result navigation remain intact;
- active PWA shell cache is v27.

### `scripts/verify-domain-integration.mjs`

Now verifies cross-domain consistency for:

- mode-first Home;
- full-width continent/region selection;
- absence of Quick Play in all four domains;
- five region progress strips on the Africa launchers;
- preserved deliberate Africa launcher actions;
- active v27 shell.

### `scripts/verify-action-feedback.mjs`

The launch-feedback contract was moved from deleted row-level Quick Play buttons to the retained deliberate launcher actions.

It also asserts:

- no `quick-play` dispatch;
- supported continent row remains the whole navigation target;
- no dead continent/region Play-cell CSS;
- reduced-motion behaviour still covers the active primary launcher path.

### Other cache-sensitive verifiers

Cache assertions in the current shell/map/brand/British-English verification path were updated to the active v27 version where appropriate.

## Failures found and corrected during implementation

The work was not treated as green until all repository contracts and production checks passed. Intermediate failures were used to find stale assumptions and implementation mistakes.

### Shared import cleanup mistake

An early cleanup removed `scopeSupportsDomain` from `src/app.ts` together with Quick Play code. The full check showed that the helper is also required by normal route availability logic. The import was restored; no route semantics were changed.

### Stale cross-domain verifier

`verify-domain-integration.mjs` still required a continent-row `aria-label="Play Africa …"`, reflecting the old inline shortcut. It was changed to verify canonical Africa navigation and the absence of row-level Quick Play instead.

### Stale action-feedback verifier

`verify-action-feedback.mjs` still required `withLaunchFeedback(...)` calls from region-card Quick Play. It was updated to test the real retained launcher Play/Learn path instead.

### PWA cache-version correction

A first verifier cleanup incorrectly interpreted a historical v16 marker as the active cache version. Final diff review caught that current `main` was actually v26. The branch was corrected to v27 and the historical lineage marker was restored.

### Temporary QA/patch artefacts

Temporary workflow/patch scaffolding used to run branch verification was removed from the final diff. A transient patch failure log was also removed. The final PR contains no QA-only workflow or patch-runner files.

## Node 22 / repository verification

Final verification was run through the repository's CI environment with Node 22 (`v22.23.2` in the observed run).

Final branch verification passed:

- `npm run check` — pass;
- full `npm test` — pass;
- complete verifier chain — pass;
- production `dist` build — pass;
- GitHub Actions production artifact upload — pass.

The complete verifier chain covered the existing learning evidence, maps, routing, IA, icons, cartography, continent foundation, outlines, Neighbours, mobile gestures, play feedback, Flags study, achievements, progress summary, British English, brand and action-feedback contracts in addition to the Issue #77 changes.

The final normal PR CI run on the corrected branch head was green.

## Exact production-artifact responsive QA

The generated `dist` output was served directly and inspected in headless Chromium using a temporary QA workflow. Screenshots and a machine-readable report were uploaded as the temporary workflow artifact during verification; the QA workflow file itself was then removed from the branch.

The checks asserted actual rendered widths/stacking and DOM contracts rather than source CSS alone.

### States inspected

- Home — 390×844;
- Flags continent index — 320×568;
- Locations continent index — 390×844;
- Locations Africa launcher — 390×844;
- Locations West Africa selected launcher — 390×844;
- Locations Africa launcher — 768×1024;
- Locations Africa launcher — 844×390 short landscape;
- Locations continent index — 390×844 with an emulated 200% page scale.

### Observed production results

- Home still rendered all four mode cards.
- Flags rendered six continent rows at 320px width as one vertical full-width stack.
- Locations rendered six continent rows as a full-width vertical stack.
- Africa launcher rendered five region rows and five progress strips.
- All measured rows matched the width of their containing list.
- No inspected state produced horizontal document overflow.
- No inspected surface contained a `data-action="quick-play"` control.
- West Africa direct route rendered the selected state and retargeted the deliberate controls to `Play West Africa` and `Learn West Africa`.
- The representative emulated 200% page-scale state retained full-width stacking with no horizontal overflow.

This was real headless Chromium rendering of the exact generated `dist`, not a source/template inspection.

### Testing not claimed

No physical Pixel/Android device testing was performed.

No physical iPhone/iPad testing was performed.

No Safari/iOS WebKit device testing was performed.

The 200% check used Chromium page-scale emulation in the production QA runner; it should not be misrepresented as a complete manual accessibility audit in every browser.

## Acceptance result

The implementation satisfies the Issue #77 acceptance intent:

- mode-first Home retained;
- full-width single-column continent selection restored;
- full-width region selection restored;
- continent and region progress visible through existing evidence infrastructure;
- unsupported continent shells remain inert and honest;
- inline Quick Play removed;
- deliberate launcher Play/Learn retained for continent and selected-region scopes;
- typed routes, Back/Forward/direct-link ownership and refresh normalisation preserved;
- evidence, achievement, storage and geography semantics unchanged;
- no `/atlas/*` architecture or duplicate region-detail system restored;
- current product/design/routing documentation updated;
- Node 22 `npm test` and CI green;
- exact production artifact inspected at required responsive states.

## Final branch / PR state

PR #80 is open, mergeable and intentionally left unmerged.

The implementation branch is `issue-77-full-width-navigation`.

The implementation was finalised against `main` commit `431f42e5e86ac3b4cc421f3b4509a71eb8811ac6`; `main` had not moved when the final sync check was performed.

The PR description contains the concise review summary and verification record. This file is the durable repository worklog with the fuller implementation history, corrections and evidence.
