# Issue 71 Implementation Notes

This document tracks implementation decisions after the Issue 71 mobile interaction specification.

## Status

Implementation branch planning.

## Repository touch points

Primary areas to inspect before implementation:

- `src/app.ts` — application routing and event ownership.
- `docs/architecture/routing.md` — route/history contracts.
- `src/ui/` — mobile surfaces and interaction components.
- `src/map-viewport.ts` — shared viewport behaviour.
- `src/neighbor-map-runtime.ts` — Neighbours map runtime.
- `src/ui/components/neighbor-map.ts` — Neighbours map rendering.
- `src/ui/views/neighbor-quiz.ts` — keyboard/map interaction surface.
- `atlas-theme.css` and related styles — safe areas, touch targets, responsive rules.

## Implementation order

1. Audit existing gesture, routing and map ownership.
2. Implement navigation gestures through existing history.
3. Resolve gesture conflicts between navigation, maps, scrolling and input.
4. Harden Locations and Neighbours direct map interaction.
5. Audit all mobile layouts for safe areas and touch ergonomics.
6. Validate PWA behaviour and production build.

## Gesture ownership

Priority:

1. Active controls and text input.
2. Map gestures.
3. Scroll containers.
4. Navigation gestures.

Navigation gestures must never steal an intentional map, input or control interaction.

## Verification

Required before closing Issue 71:

- npm test passes.
- Production artifact inspected.
- Physical Android validation.
- Physical iOS Safari/PWA validation.
- Evidence recorded in Issue 71.
