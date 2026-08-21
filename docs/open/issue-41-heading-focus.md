# Issue #41 — Prevent heading focus on refresh

GitHub: https://github.com/BenWassa/flag/issues/41

## Status

In progress.

## Problem

The application currently treats initial document boot like client-side
navigation. Its first render programmatically focuses the destination's
`data-autofocus` element, which is the `Atlas` heading on Home. Browser
`:focus-visible` heuristics can therefore draw the shared Atlas Blue keyboard
focus ring after a keyboard-triggered refresh.

## Focus contract

- Initial document render leaves focus under browser control.
- Later client-side navigation moves focus to the destination's
  `data-autofocus` element when no prior control can be restored.
- Same-route rerenders first restore the relevant prior enabled control,
  including quiz answers and the Neighbours input.
- Genuine keyboard focus keeps the shared visible focus treatment. This issue
  must not introduce a Home-only CSS exception or globally suppress outlines.

## Acceptance and verification

- Add a focused plain-Node assertion for initial render versus later renders.
- Run `npm run check` and `npm test`.
- Manually confirm `document.activeElement` after pointer- and
  keyboard-triggered refreshes and in-app navigation in Chromium and at least
  one WebKit or Firefox browser.

Manual browser evidence must be recorded explicitly; automated source checks
do not substitute for browser-specific `:focus-visible` behaviour.

## Implementation evidence — 2026-08-21

- Focus intent is decided before the render marker is advanced: initial boot
  performs no scripted focus, while later renders retain the existing
  restore-or-autofocus path.
- `npm run check` passed.
- `npm test` passed, including focused assertions for both focus intents.
- Opera (Chromium), local production build: `document.activeElement` was
  `BODY` after an ordinary reload of the Africa route and after a
  keyboard-triggered reload of Home. Pointer navigation from Home to Africa
  focused the Africa `H1`; keyboard navigation to Progress focused the
  Progress `H1`.
- Keyboard Tab focus on the Home progress button retained a computed 3px solid
  Atlas Blue outline.
- A Firefox or WebKit runtime was not available in this environment, so that
  required cross-engine manual gate remains open and must not be inferred from
  the Chromium evidence.
