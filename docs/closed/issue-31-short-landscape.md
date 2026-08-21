# Issue #31 — Short-landscape sizing regressions

**Status:** Complete.
**Completed:** 2026-08-20, implemented in `b4d7ff0`/`7f3b932` ("Fix short-landscape mobile layout bugs in Outlines and Neighbours") and merged to `main`.
**Issue:** [#31 — Fix mobile landscape sizing bugs](https://github.com/BenWassa/flag/issues/31) (closed)

## Goal

Fix the confirmed short-landscape usability problems in Outlines and Neighbours without using the bugfix as a vehicle for the wider visual redesign.

## Confirmed problems

- Outlines silhouette can overflow/clamp out of its intended frame.
- Neighbours input can become too narrow for realistic country names.

## Scope guard

Keep this focused on responsive sizing/viewport behaviour. Preserve domain logic, cartography, routing, evidence and the upcoming Atlas design work in #32.
