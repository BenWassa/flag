# Open Work

GitHub Issues are the canonical task tracker. This index contains only **genuinely open** Atlas work and sequencing; closed design experiments and completed implementation records belong in `docs/closed/` and are linked through [`../history.md`](../history.md).

## Production baseline

Spatial Atlas is the accepted/default navigation presentation. #104, #118, #119 and #166 are closed history, not concurrent programmes. All new work starts from current `main` and must preserve the typed router, learning/evidence/mastery semantics, canonical geography, PWA behaviour and British English unless the issue explicitly changes one of those contracts.

## Recommended sequencing

### 1. Repository housekeeping — #160

[#160](https://github.com/BenWassa/flag/issues/160) tracks stale remote branch deletion. The classification is complete: preserve issue/document history, but delete merged/superseded implementation, spike, preview, verification and agent branches. The intentional pre-Spatial archive remains the historical checkpoint.

Remote branch deletion is a mechanical repository operation; it must not delete closed issues or closeout/evidence documents.

### 2. Asia Locations/cartography hardening — #137

[#137](https://github.com/BenWassa/flag/issues/137) is the next substantial product-hardening stream.

Its existing branch predates the Spatial production cutover. Reconcile it against current `main` rather than rebasing/merging mechanically. #166 already solved the Spatial globe's shared tiny-geography touch/pointer defect; surviving #137 work includes the projected Locations concerns such as useful Asia zoom, Levant inset policy, canonical Cyprus reconciliation, previously-answered-country selectability, and any still-needed 2D tiny-country presentation/interaction work proven by current evidence.

### 3. Independent focused hardening

These can proceed independently once each is re-read against current Spatial production:

- [#147 — Outlines Play feedback weight and live-score parity](https://github.com/BenWassa/flag/issues/147)
- [#149 — Neighbours suggestion accessibility semantics](https://github.com/BenWassa/flag/issues/149)
- [#151 — retired CSS and duplicate shared-control styles](https://github.com/BenWassa/flag/issues/151)

Do not blindly resume stale pre-Spatial branches; branch from current `main` and port only still-valid work/evidence.

### 4. Dependent hardening

- [#148 — Locations wrong-answer feedback under reduced motion](https://github.com/BenWassa/flag/issues/148) follows #137 because both touch shared Locations map rendering/feedback.
- [#150 — motion-token and control-height scale](https://github.com/BenWassa/flag/issues/150) follows #147 and #148 so tokens codify corrected behaviour rather than existing defects.
- [#146 — Mastery/navigation accessibility semantics](https://github.com/BenWassa/flag/issues/146) must first be re-scoped against Spatial default navigation. Its original launcher-row problem predates #166; preserve the underlying accessibility/Mastery intent but apply it to current Spatial + fallback surfaces.
- [#152 — redundant Home coverage metadata](https://github.com/BenWassa/flag/issues/152) follows the resulting #146 navigation/accessibility semantics.

### 5. Physical-device validation — #71

[#71](https://github.com/BenWassa/flag/issues/71) owns real-device Android Chrome, iPhone/iOS Safari and installed-PWA evidence. The implementation is otherwise shipped. An early Pixel sanity pass on Spatial is useful, but formal closure should use the final hardened production build after the relevant #137 interaction work.

Current durable #71 records remain:

- [`issue-71-mobile-interaction.md`](issue-71-mobile-interaction.md)
- [`issue-71-implementation-notes.md`](issue-71-implementation-notes.md)

Do not claim physical-device evidence from Playwright/emulation.

## Working rules

- Fetch current `main` and read the full GitHub issue before implementation.
- Use focused branches/PRs.
- Closed issues/history may explain constraints but do not override current normative docs.
- Run `npm test` under Node 22 before merge; add the issue-specific browser/PWA/cartography/accessibility gates required by risk.
- Inspect exact production artifacts for production-facing changes.
- Sync current `main` immediately before merge and resolve conflicts semantically.
- Preserve issue/document history; delete spent branches after their useful work is captured.
