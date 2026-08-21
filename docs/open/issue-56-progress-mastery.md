# Issue #56 — Progress mastery experience

GitHub: https://github.com/BenWassa/flag/issues/56

## Design diagnosis

Issue #42 made Progress technically correct across all four domains, but the shipped hierarchy still read like an operational ledger. Live evidence and reset utilities appeared before plain-row achievement output, and continent/world achievement was expressed mainly through locked text labels.

That presentation underweighted the product's established gamification hierarchy:

**region × domain Mastery → complete region → continent crest → World Crown**

The redesign therefore treats Progress as the one Atlas surface where accumulated competence may carry stronger visual weight without spreading reward chrome into ordinary practice.

## Impeccable / Tactile Atlas direction

Mode: **Operate**.

Process: **critique → clarify → simplify → distil → adapt → harden → polish**.

Locked principles retained:

- geography remains the richest visual material;
- system sans and existing Tactile Atlas spacing/radius/depth remain unchanged;
- Atlas Blue remains ordinary action;
- purple remains durable region × domain Mastery;
- gold remains scarce completion/prestige;
- no XP, coins, streaks, fantasy ranks, decorative Crown or dashboard KPI cards;
- mobile portrait remains primary and primary content never requires horizontal scrolling.

## Information hierarchy

The Progress reading order is now:

1. `Progress` orientation;
2. geographic Mastery by continent and region;
3. one compact `Practise next` row per domain;
4. progressively disclosed country learning evidence;
5. storage/reset utility.

Africa expands by default because it is the current complete four-domain proving ground. Other continents remain present as honest curriculum shells so the structure scales with future expansion without making unavailable material look like learner failure.

## Achievement composition

### Region × domain

Each region exposes the four shared domain glyphs as one competency set.

- supported + unearned: neutral outlined glyph;
- earned: purple filled glyph plus a check cue so colour is not the only signal;
- unsupported: muted dashed/slashed treatment distinct from unearned.

### Complete region

A canonical complete-region state adds restrained gold border/background emphasis only. It does not gain a medal, crest or Crown.

### Continent

Routine continent identity reuses the generated Natural Earth silhouette from `src/ui/components/continent-icons.ts`.

Only canonical `crestEarned` upgrades that source-derived mark into the purple/gold crest treatment. Incomplete continents retain neutral geography rather than showing a repeated locked crest.

### World

The World context remains quiet while global curriculum is incomplete. The custom Atlas Crown SVG is rendered only when canonical `crownEarned` is true; there is no routine locked-Crown decoration.

## Live evidence boundary

The redesign consumes #29/#34/#42 rather than redefining them.

Country evidence remains live and revisable. A country can be due for review while a previously earned regional competency remains visibly earned. Detailed evidence remains available through the Progress disclosure with domain/evidence filtering and real region grouping.

No scheduler thresholds, storage semantics, typed routes or achievement qualification rules are duplicated in UI code.

## Implementation boundary

Focused branch: `design/issue-56-progress-mastery`.

Primary implementation files:

- `src/ui/views/progress.ts`;
- `src/ui/components/achievement-art.ts`;
- `progress.css`;
- production shell/build/PWA wiring;
- `scripts/verify-progress-summary.mjs`;
- `DESIGN.md` and `.impeccable/design.json`.

The dedicated `progress.css` keeps the redesign isolated from concurrent cartography work while consuming the existing Tactile Atlas variables. `atlas-theme.css` remains the authoritative token layer.

## Verification evidence

### Automated gates

GitHub Actions run #246 (`32515399374`) on head `0da13f516e7640017eed10d2c686f6cf0af10490` used Node `22.23.2` and passed:

- standalone `npm run check`;
- full `npm test`, including build plus every existing verifier;
- the expanded Progress summary/presentation verifier;
- British-English verification;
- production artifact upload.

Two earlier diagnostic runs failed for legitimate compatibility reasons and were fixed without weakening their contracts:

1. run #241 caught the established storage-denied copy sentinel after the redesign inserted an extra word; the UI was corrected to preserve `not allowing storage`;
2. run #242 reached the final British-English suite and caught removal of its `Not practised yet` spelling sentinel; the stronger new first-use headline was retained and the supporting copy restored that British wording.

### Exact production artifact

CI artifact `flag-atlas-dist` from run #246:

- artifact ID: `9458578765`;
- GitHub digest: `sha256:9861e5099ba042e9ab4fe217ec8f80c871db942e430a817c178712eca0d37ea3`;
- downloaded ZIP independently matched that SHA-256;
- 76 production files / 1,356,941 bytes unpacked.

Direct inspection of the compiled artifact confirmed:

- `progress.css` is shipped, linked by `index.html`, and included in the service-worker shell;
- fresh Progress renders six continent marks, zero earned badges, zero crests and zero Crowns;
- West Africa Flags Mastery remains visibly earned while Ghana's live Flags evidence is due for review;
- complete-region state maps to the gold completion treatment;
- canonical continent completion maps to exactly one crest in the exercised Africa state;
- canonical world completion maps to exactly one Crown in the exercised renderer state;
- cross-domain evidence filtering preserves both selected domain and selected evidence state;
- `Crest locked`, `Crown locked`, and the superseded `Earned achievements` ledger label are absent from the compiled Progress modules.

### Integration state

Immediately after the final artifact inspection, `main` remained `fcdd46d59496857c8a2c74a6191eef65a05cbbc7`; the branch was 0 commits behind it. Concurrent PR #55 remains separate and owns river removal/cartography changes, including its own service-worker cache-line update; no #55 code is duplicated into this focused Progress branch.

### QA limitation

No interactive browser, physical-device, iOS Safari, Android Chromium, screen-reader, or Windows High Contrast session was available in this execution path, so none is claimed. Responsive, reduced-motion, focus, non-colour state and production-shell requirements are covered by the existing structural/CSS contracts and focused verifier additions; interactive visual QA remains a separate manual confidence check rather than fabricated evidence.
