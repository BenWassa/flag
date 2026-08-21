# Issue #31 — Short-landscape sizing regressions

GitHub: https://github.com/BenWassa/flag/issues/31

## Goal

Fix the confirmed short-landscape usability problems in Outlines and Neighbours without using the bugfix as a vehicle for the wider visual redesign.

## Confirmed problems

- Outlines silhouette can overflow/clamp out of its intended frame.
- Neighbours input can become too narrow for realistic country names.

## Scope guard

Keep this focused on responsive sizing/viewport behaviour. Preserve domain logic, cartography, routing, evidence and the upcoming Atlas design work in #32.
