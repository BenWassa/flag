# Issue #151 selector audit

Original audit baseline: `f6f6354ffc3661cb8e0d8fa06dfe60e63854db09`  
Closeout baseline after #149: `7949a71c0235cb0f69746b1fe636bd5fd13d4832`

Scope was CSS/markup debt cleanup only: no redesign and no changes to learning rules, scoring, Mastery, persistence or navigation.

## Removed after production-source audit

- `.screen-title__row` and `.launcher-header__badge`; the launcher keeps its labelled, focusable `h1` and subtitle structure.
- `.mini-ledger`, `.mini-ledger__row`, `.ledger-list`, `.ledger-row`, `.ledger-row__country`, `.ledger-note` and `.mastery-list` presentation remnants.
- `.status-chip*` and retired `.status-text*` variants.
- `.filter-tabs` / `.filter-tab*` remnants.
- `.progress-achievement*` remnants.
- `.flag-frame--ledger` remnants.
- `.map-viewport-controls` / `.map-viewport-control*` remnants.
- `.test-advance` remnants.

These families had no current production TS/TSX consumer at closeout outside their style definitions. Test-only references were not treated as production usage.

## Retained intentionally

The conventional launcher remains valid renderer/WebGL fallback infrastructure. Production-used fallback selectors including `.page--launcher`, `.launcher-header__icon`, `.launcher__scope-list` and `.launcher__learn` remain in place.

The merged #149 accessibility work is retained; #151 does not alter the Neighbours suggestion interaction or semantics.

## Shared control ownership

Exact duplicate `.text-icon-button` base/state/responsive/reduced-motion rules now have one owner in `src/styles/styles.css`; duplicate Atlas-theme ownership is removed. `.icon-button` remains separately owned where its geometry differs.

## Closeout verification

Acceptance run `33589961796` on the post-#149 branch state passed:

- synced-baseline and selector-ownership checks;
- `npm run check`;
- full `npm test`;
- representative exact-production Playwright regressions for Spatial, launcher/fallback, quiz and Profile on Chromium and mobile Chromium;
- exact generated `dist/` inspection confirming retired selectors/hooks are absent, required fallback styling remains, and `.text-icon-button` emits from one consolidated stylesheet owner.

Temporary #151 execution workflows/scripts used to perform the audit and acceptance are deliberately excluded from the shipped repository.
