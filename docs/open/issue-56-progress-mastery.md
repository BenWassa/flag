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
- `.impeccable/design.json`.

The dedicated `progress.css` keeps the redesign isolated from concurrent cartography work while consuming the existing Tactile Atlas variables. `atlas-theme.css` remains the authoritative token layer.

## Verification contract

Before merge:

- `npm run check` must pass under Node 22;
- full `npm test` must pass;
- deterministic coverage must protect earned/unearned/unavailable competency states, complete-region prestige, crest/Crown gating, earned-but-due behaviour, evidence disclosure/filtering, reset semantics and production shell wiring;
- the exact CI production artifact must be inspected;
- current `main` must be synced and service-worker lineage reconciled semantically;
- CI must be green on the final head.

Interactive browser/device evidence is recorded only if it is actually available and performed.
