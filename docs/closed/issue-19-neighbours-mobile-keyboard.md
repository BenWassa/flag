# Issue #19 — Neighbours mobile keyboard stability

GitHub: https://github.com/BenWassa/flag/issues/19

**Status:** Closed 2026-08-21. Implementation shipped in PR #51 (`fix/issue-19-neighbours-keyboard`, merge `f97c8d19`), CI green, deterministic layout/focus contract covered by `scripts/verify-neighbor-keyboard.mjs`.

## Closeout note

The issue's acceptance criteria called for real software-keyboard verification on physical iOS Safari and Android Chromium devices, which this environment cannot perform (no physical hardware). Closed on the strength of the shipped code, the merged CI-verified deterministic contract, and the architectural reasoning in this document (removal of the unstable sticky/`dvh` interaction, zoom-safe `visualViewport` usage, no imperative scroll calls). No emulated or physical browser/device QA beyond what is documented above was performed for this closeout; if real-device testing later surfaces a regression, reopen with reproduction details rather than filing a new issue.

## Status (original)

Implementation prepared on `fix/issue-19-neighbours-keyboard` from current `main`.

## Goal

Keep the Neighbours map/input composition spatially stable when the mobile software keyboard opens, during repeated guesses, and when the keyboard closes/reopens.

## Product invariant

The learner should be able to keep looking at the map while entering consecutive neighbour names without repeated scroll jumps or losing geographic context.

## Root cause

The pre-fix portrait composition mixed several viewport/focus behaviours that all reacted to software-keyboard changes:

- the quiz page used `100dvh` as its minimum height;
- the map height also followed `dvh`;
- the entry form was bottom-sticky;
- the entry carried a large `32dvh` scroll margin;
- autocomplete sizing followed the dynamic viewport;
- every unresolved correct, wrong or duplicate guess rerendered the Neighbours view and deliberately restored focus to the input through the shared application focus path.

That meant a keyboard resize could alter page height, map height and sticky geometry while the browser was also performing native focus scrolling. The map shell itself was not the cause: Issue #16 already preserves/reuses the shell and `map-viewport.ts` persists the pan/zoom box by stable session key.

## Chosen viewport/layout strategy

The fix keeps viewport ownership in layout rather than imperative scrolling:

1. Normal portrait uses a stable `svh` baseline for the page and map instead of making both follow every keyboard-driven `dvh` change.
2. While focus is inside the Neighbours entry surface, a state flag lives on the stable `#app` root so it survives the app's same-route `innerHTML` rerenders.
3. In that focused portrait state, the entry leaves the bottom-sticky coordinate system and the map contracts only from its lower edge within a bounded 140–190 px range. Its top remains in the normal document flow.
4. `window.visualViewport.height` is used only as an optional, feature-detected CSS sizing input. It is ignored while `visualViewport.scale !== 1`, so browser zoom/accessibility is not overridden.
5. A short-portrait media query remains as the CSS-only fallback for browsers that resize the layout viewport or do not expose `visualViewport`.
6. Focus state covers the full entry surface, including Submit and suggestion buttons, so pointer focus transitions inside autocomplete do not briefly drop the compact layout.

No second map viewport, routing path or focus-management subsystem is introduced.

## Why no scroll hack

The runtime does not call `scrollTo()` or `scrollIntoView()` for keyboard handling. Repeated forced offsets would compete with browser focus scrolling, vary across iOS/WebKit and Android/Chromium, and risk cumulative drift. The fix instead removes the unstable sticky/dynamic-height interaction while the keyboard-entry composition is active.

The only existing route-level `window.scrollTo({ top: 0 })` remains in `app.ts` for genuine route changes and is unchanged by this issue.

## Preserved contracts

- topology-derived adjacency and coverage policy;
- `n + 2` attempt budget and duplicate semantics;
- learning evidence/mastery persistence;
- canonical map geometry and solved/revealed state;
- typed routing and storage identifiers;
- Issue #16 map-shell reuse and `map-viewport.ts` pan/zoom state;
- Issue #41 initial-document versus subsequent-SPA restore/autofocus contract.

## Automated regression coverage

`scripts/verify-neighbor-keyboard.mjs` asserts the deterministic parts of the contract without pretending Node emulates a software keyboard:

- stable `svh` baseline and focused portrait layout state;
- bounded focused map sizing;
- focused entry is non-sticky;
- CSS-only short-portrait and short-landscape fallbacks remain present;
- legacy `32dvh` focus scroll margin is removed;
- `visualViewport` is feature-detected and zoom-safe;
- the keyboard-entry state survives synchronous rerenders;
- no imperative keyboard scroll calls are introduced;
- Issue #41's shared focus intent/restore contract is still present.

The verifier is included in the full `npm test` chain. CI also runs `npm run check` explicitly under Node 22 before `npm test`.

## PWA cache

`neighbors.css` and `neighbor-map-runtime.js` are app-shell assets, so the service-worker cache advances from v16 to v17. The v16 line is retained as release-lineage documentation for the existing Issue #16 verifier.

## Verification limitations

The connected execution environment can read/write GitHub but cannot resolve `github.com` from the local shell, so a trustworthy local checkout/browser harness is unavailable. GitHub Actions is therefore the authoritative Node 22 environment for `npm run check`, `npm test` and the production `dist` artifact.

Do not interpret the deterministic verifier as iOS Safari, Android Chromium or physical-device keyboard testing. Those claims require an actual browser/device run and must be recorded separately if performed.

## Scope guard

This is a focused mobile interaction fix. It does not change adjacency, attempt accounting, learning evidence, map geometry, solved/revealed semantics, routing, storage, or the map pan/zoom architecture.
