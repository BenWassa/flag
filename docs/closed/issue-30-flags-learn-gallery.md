# Issue #30 — Replace the Flags Learn quiz with a browse-and-reveal study surface

GitHub: https://github.com/BenWassa/flag/issues/30

## Status

Complete.

## What Learn is now

`/flags/<scope>/learn` renders `src/ui/views/flags-study.ts`: the complete flag set for the scope as a scan-friendly gallery with country names hidden until the learner asks for them. Play keeps the scored retrieval loop unchanged.

Because Learn is no longer a round, the route resolves to a `flags-study` view without an active session. `normalizeRoute` exempts it from the strip-the-activity rule that bounces sessionless round routes back to the launcher, so the surface is directly addressable and Back/Forward keep working.

## Questions the issue asked us to resolve

**2 vs 3 columns.** Neither, fixed. `repeat(auto-fill, minmax(148px, 1fr))` gives two columns at 390 px and more as width allows, with no horizontal scrolling and no breakpoint list to maintain.

**Independent reveals or one selected item.** Independent. Comparing several revealed flags against their neighbours is the study, and a single-selection model would fight that.

**Does Reveal all help.** Kept. It turns the gallery into a reference sheet in one tap, and the same control hides names again for self-testing.

**Grouping for large scopes.** One heading level from the existing taxonomy: a continent groups by region, World groups by continent, a single region needs no headings at all.

## Evidence semantics

Viewing or revealing a flag creates no country evidence and touches no ledger — the view has no access to progress state at all. Scored retrieval remains Play's job, per #29.

## Answer leakage

A hidden card carries the country name nowhere: not in visible text, not in the image `alt`, not in the accessible name. The card is labelled `Flag n of 54. Reveal the country.` and the name is written into the DOM only on reveal. Hiding it again removes it.

This is why reveal is a direct DOM toggle in `toggleFlagReveal` rather than a re-render: it also keeps a 195-card World gallery from rebuilding on every tap. Reveal state lives in an ephemeral module-level set so a genuine re-render (Reveal all, Back/Forward) can restore it, and it clears when the learner leaves the study surface.

## One integration fix

`FlagsRound.repeat()` previously re-derived its activity from the session mode. With Learn no longer a round, repeating a review round would have produced a `learn` activity, navigated to the study gallery and silently discarded the session. `begin()` now records the activity that actually ran and `repeat()` restores it.

## Verification

`scripts/verify-flags-study.mjs` covers full-scope browsing, the absence of scored answer controls, evidence isolation, hidden/revealed leakage in text, `alt` and accessible name, single-card reveal isolation, the Reveal all toggle, geographic grouping, lazy World loading and unchanged Learn/Play/review routing.

Full `npm test` is green. Rendered QA in headless Chromium at 390×844 confirmed: the deep link lands on the gallery, hidden cards expose only the placeholder label, keyboard `Enter` reveals without moving focus, Play entry and Back both work, and World scope renders 195 lazily-loaded cards with no horizontal overflow.

## Closeout

Merged through PR #66 in `c2e04c83c3a8b808b7c565b78cfd3029809b8be5`. The rebased head and merged queue passed full `npm test`; GitHub CI passed on the exact rebased head. No physical-device or assistive-technology session is claimed.
