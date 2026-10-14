# Open Work

GitHub Issues are the canonical task tracker. This page is an **index and dependency map**, not a second issue tracker. Check issue and PR states and CI before work; historical SHA pins and PR references in older comments are not current authority.

## Production baseline

Spatial Atlas is the default production navigation. Flags, Locations, Outlines and Neighbours cover the intended six-continent curriculum. Preserve the typed hash router, independent progress and Mastery, canonical Natural Earth geometry, automatic PWA update/offline behaviour and British English. Current contracts are in [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md) and [Spatial architecture](../architecture/spatial-atlas.md).

## Active programme — Locations usability (#226)

**Order:** [#227 shared foundation](https://github.com/BenWassa/flag/issues/227) → four region-audit lanes (parallel after foundation merges) → [#226 final 31-scope audit](https://github.com/BenWassa/flag/issues/226) → [#71 physical-device acceptance](https://github.com/BenWassa/flag/issues/71).

| Issue | Lane | Scope and dependency |
| --- | --- | --- |
| [#227](https://github.com/BenWassa/flag/issues/227) | Shared foundation | Initial-fit geography distinct from canonical rendered/scored geometry; reproducible fit, target size and assistance audit. Must precede region implementation. |
| [#228](https://github.com/BenWassa/flag/issues/228) | Europe | Europe and four regions; Southern Europe, Spain/Canary Islands, microstates. After #227. |
| [#137](https://github.com/BenWassa/flag/issues/137) | Asia | Whole Asia and six regions; original Asia fixes **already merged via #174**, issue reused for new #226 audit. After #227. |
| [#229](https://github.com/BenWassa/flag/issues/229) | North America and Oceania | Nine scopes; remote islands, insets, practical hit areas. After #227. |
| [#230](https://github.com/BenWassa/flag/issues/230) | Africa and South America | Ten scopes; mainland calibration and remote island cases. After #227. |
| [#226](https://github.com/BenWassa/flag/issues/226) | Programme | Verify all 31 scopes, production evidence and post-merge regression/deployment. Close after all lanes. |

The #221 question-transition touch lifecycle was delivered through [merged PR #225](https://github.com/BenWassa/flag/pull/225). [PR #231](https://github.com/BenWassa/flag/pull/231) is **still open** for inset edge hit-testing; do not assume it merged or that its failing desktop CI check is cleared. Regional work must consume the final verified contract rather than duplicate it.

## Other outstanding engineering work

- [#212 — broad Playwright reconciliation](https://github.com/BenWassa/flag/issues/212): active successor [PR #222](https://github.com/BenWassa/flag/pull/222); the older draft PR #213 is superseded. #222 retains the stationary edge-tap versus platform Back-gesture repair, but cannot merge without full current CI and exact-production verification.
- [#220 — Germany's 16 Länder](https://github.com/BenWassa/flag/issues/220): planned, additive subnational expansion across four domains. Start after #212 is integrated and deployed; coordinate topology/map ownership with the #226 programme. Do not conflate ISO3 country identity and ISO 3166-2 subdivision identity.

## Final physical-device gate (#71)

[#71](https://github.com/BenWassa/flag/issues/71) remains **open and owner-run**. It needs a re-pinned final production SHA after all releases that affect the evaluated interaction surface (at minimum #212 and #220 if retained, plus the #226 Locations programme). Automated Playwright/mobile emulation does not count as Android/iPhone evidence.

Use [the active physical-device checklist](issue-71-physical-device-gate.md) for real Android Chrome, iPhone Safari, installed-PWA automatic A→B adoption, active-round deferral, offline→online update, gesture/safe-area and domain-specific checks. Log hardware, browser/OS, SHA, orientation and result against #71.

## PR and dependency hygiene

- PR #222 replaces, but does not prove completion of, #213. Do not silently restore outdated Spatial UI assumptions.
- PR #231 requires its failing desktop acceptance to be diagnosed and made green before merge.
- Do not merge PRs on green `npm test` alone. Sync latest `main`, inspect the exact artifact, verify desktop/mobile/PWA gates and required CI.
- Close an issue only once its full acceptance evidence exists. Move its working document to [`../closed/`](../closed/) and update this index at closeout.
- Completed/superseded records belong in [`../closed/`](../closed/) and are contextualised by [`../history.md`](../history.md). Not every open issue requires a duplicate Markdown specification when GitHub has the full authoritative brief.
