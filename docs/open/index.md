# Open Work

GitHub Issues are the canonical task tracker. This page is an **index and dependency map**, not a second issue tracker. Check issue and PR states and CI before work; historical SHA pins and PR references in older comments are not current authority.

## Production baseline

Spatial Atlas is the default production navigation. Flags, Locations, Outlines and Neighbours cover the intended six-continent curriculum. Preserve the typed hash router, independent progress and Mastery, canonical Natural Earth geometry, automatic PWA update/offline behaviour and British English. Current contracts are in [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md) and [Spatial architecture](../architecture/spatial-atlas.md).

## Execution priority after the 10 November issue review

1. [#235](https://github.com/BenWassa/flag/issues/235) is resolved: PR #236 merged on 13 November 2026 and main's CI and deploys are green. #212 (PR #222) and PR #231 are also merged, so the mobile functional gate is open again.
2. Deployed main is `b90d089`. Start the regional audits below.
3. Complete #226's regional lanes with **#228 Europe first**, then #137 Asia, #229 North America/Oceania and #230 Africa/South America. #227 is already delivered; do not rebuild its shared foundation.
4. Start #220 German states now that #212 is integrated and deployed, coordinating shared geography with #226.
5. Complete #234's final mobile UI/UX critique and remediation against the integrated functional build, then re-pin #71 for owner-run Android/iPhone/PWA acceptance.

Mobile touchscreen is the product-optimisation target throughout. Existing desktop/accessibility and PWA gates remain required compatibility checks. Read-only audit/screenshot collection may proceed before the dependencies above finish.

The #235 cause was a browser-harness artefact: page content was rasterised through SwiftShader, so Locations map repaints blocked main-thread commits and delayed feedback timers. PR #236 carries a harness-only repair; see [the closed investigation](../closed/issue-235-investigation.md). One desktop one-miss recovery test failed once on the #222 merge commit's CI and passed on every re-run and 125 of 125 local repeats; treat it as an unreproduced flake and record any recurrence on a new issue.

## Active programme — Locations usability (#226)

**Order:** completed [#227 shared foundation](https://github.com/BenWassa/flag/issues/227) → four region-audit lanes (now unblocked; may run in parallel) → [#226 final 31-scope audit](https://github.com/BenWassa/flag/issues/226) → [#71 physical-device acceptance](https://github.com/BenWassa/flag/issues/71).

| Issue | Lane | Scope and dependency |
| --- | --- | --- |
| [#227](https://github.com/BenWassa/flag/issues/227) | **Completed foundation** | Delivered via merged [PR #233](https://github.com/BenWassa/flag/pull/233), verified on deployed main (`ae9bfb6`). Initial-fit geometry is separate from canonical scoring geometry; regional implementation is unblocked. |
| [#228](https://github.com/BenWassa/flag/issues/228) | Europe | Europe and four regions; Southern Europe, Spain/Canary Islands, microstates. After #227. |
| [#137](https://github.com/BenWassa/flag/issues/137) | Asia | Whole Asia and six regions; original Asia fixes **already merged via #174**, issue reused for new #226 audit. After #227. |
| [#229](https://github.com/BenWassa/flag/issues/229) | North America and Oceania | Nine scopes; remote islands, insets, practical hit areas. After #227. |
| [#230](https://github.com/BenWassa/flag/issues/230) | Africa and South America | Ten scopes; mainland calibration and remote island cases. After #227. |
| [#226](https://github.com/BenWassa/flag/issues/226) | Programme | Verify all 31 scopes, production evidence and post-merge regression/deployment. Close after all lanes. |

The #221 question-transition touch lifecycle was delivered through [merged PR #225](https://github.com/BenWassa/flag/pull/225) and the inset edge hit-testing through [merged PR #231](https://github.com/BenWassa/flag/pull/231). Regional work must consume that final verified contract rather than duplicate it.

## Other outstanding engineering work

- [#220 — Germany's 16 Länder](https://github.com/BenWassa/flag/issues/220): planned, additive subnational expansion across four domains. #212 is now integrated and deployed; coordinate topology/map ownership with the #226 programme. Do not conflate ISO3 country identity and ISO 3166-2 subdivision identity.
- [#234 — full mobile-first UI/UX critique and polish](https://github.com/BenWassa/flag/issues/234): a separate product-quality gate after functional/Locations changes, before final #71 physical-device sign-off. Review screenshots and actual interactions across all domains, routes, viewports and accessibility modes; CI success alone does not constitute design acceptance.

## Final physical-device gate (#71)

[#71](https://github.com/BenWassa/flag/issues/71) remains **open and owner-run**. It needs a re-pinned final production SHA after all releases that affect the evaluated interaction surface (at minimum #212, #220 if retained, and the #226 Locations programme, plus any subsequent #234 UI/UX changes). Automated Playwright/mobile emulation does not count as Android/iPhone evidence.

Use [the active physical-device checklist](issue-71-physical-device-gate.md) for real Android Chrome, iPhone Safari, installed-PWA automatic A→B adoption, active-round deferral, offline→online update, gesture/safe-area and domain-specific checks. Log hardware, browser/OS, SHA, orientation and result against #71.

## PR and dependency hygiene

- Do not merge PRs on green `npm test` alone. Sync latest `main`, inspect the exact artifact, verify desktop/mobile/PWA gates and required CI.
- Close an issue only once its full acceptance evidence exists. Move its working document to [`../closed/`](../closed/) and update this index at closeout.
- Completed/superseded records belong in [`../closed/`](../closed/) and are contextualised by [`../history.md`](../history.md). Not every open issue requires a duplicate Markdown specification when GitHub has the full authoritative brief.
