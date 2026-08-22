# Issue 71 — Mobile Interaction & Native Feel Upgrade

## Status

Open planning specification.

Issue #71 establishes the mobile interaction foundation for Atlas. The objective is not adding isolated gestures; it is making Atlas feel like a purpose-built touch-first geography application across phones, tablets and installed PWA contexts.

The existing implementation groundwork (`a046c01`) is a starting point only. Completion requires architecture validation, implementation, device testing and the broader interaction audit described below.

---

# Product intent

Atlas is geography-first. The interface should disappear when exploring geography.

Principles:

- direct manipulation over control panels;
- maps are interactive surfaces, not images with controls around them;
- navigation follows platform conventions;
- visual simplicity comes from removing unnecessary chrome;
- interaction polish supports learning rather than distracting from it.

---

# Current architecture review requirements

Before implementation, inspect the existing architecture and confirm ownership boundaries.

## Routing

Inspect:

- `src/app.ts`
- `docs/architecture/routing.md`

Confirm:

- routes remain the source of truth;
- browser Back/Forward remains authoritative;
- hash routing behaviour is unchanged;
- gestures do not create a second navigation system;
- quiz/session state remains ephemeral.

Target flow:

```
Home → Continent → Region → Country → Activity

Swipe back:
Activity → Country → Region → Continent → Home
```

At Home:

- do not exit the app;
- do not perform destructive actions;
- allow the operating system to manage app dismissal.

---

# Repository touch points

Implementation should begin with these areas.

## Application routing

Primary:

- `src/app.ts`

Related documentation:

- `docs/architecture/routing.md`

Review:

- route parsing;
- navigation ownership;
- history integration.

---

## Views and UI components

Inspect:

- `src/ui/views/`
- `src/ui/components/`

Review:

- Home navigation surfaces;
- continent/region selection;
- quiz layouts;
- shared interactive components.

---

## Locations maps

Inspect existing location map implementation and related map runtime files.

Review:

- zoom ownership;
- pan handling;
- geometry loading;
- viewport management;
- touch event conflicts.

---

## Neighbours maps

Inspect:

- `src/ui/views/neighbor-quiz.ts`
- `src/ui/components/neighbor-map.ts`
- `src/neighbor-map-runtime.ts`
- `src/map-viewport.ts`

Coordinate with Issue #19.

---

## Styling and layout

Inspect:

- `atlas-theme.css`
- domain stylesheets;
- shared layout styles.

Review:

- safe-area handling;
- viewport units;
- breakpoints;
- touch targets;
- pressed states.

---

## PWA layer

Inspect:

- manifest;
- service worker;
- shell assets;
- offline behaviour.

---

# Gesture ownership model

Atlas has competing touch behaviours. Ownership must be explicit.

Priority:

1. Interactive controls and inputs.
2. Map gestures (pinch/pan).
3. Scrolling.
4. Navigation gestures.

Navigation gestures must never steal:

- map interaction;
- text input;
- buttons;
- links;
- scrolling containers.

---

# Navigation gesture specification

Implement native-feeling back navigation.

Requirements:

- edge swipe back;
- existing history integration;
- no gesture-specific route state;
- preserved accessibility navigation.

Validate:

- nested routes;
- Home behaviour;
- browser Back/Forward;
- interrupted gestures.

---

# Map interaction model

Locations and Neighbours should use a true touch-map model.

Remove:

- persistent zoom controls;
- unnecessary fit/reset controls;
- toolbar-style region controls inside immersive map surfaces.

Support:

- pinch zoom;
- pan/drag;
- tap country interaction;
- predictable zoom bounds;
- smooth transitions.

Do not create a second map or geometry system.

---

# Screen-by-screen mobile audit

| Surface | Review goal |
|---|---|
| Home | thumb-friendly geographic scope selection |
| Continent | visual exploration without excessive controls |
| Region | direct domain entry and clear hierarchy |
| Flags | preserve flag dominance and answer ergonomics |
| Locations | direct map manipulation |
| Outlines | readable silhouette interaction |
| Neighbours | keyboard-safe map interaction |
| Progress | compact mobile information hierarchy |

---

# Safe-area and viewport audit

Review:

- iPhone notch and Dynamic Island devices;
- Android cutouts;
- gesture navigation areas;
- portrait layouts;
- landscape layouts;
- keyboard-open states.

Verify:

- controls clear safe-area insets;
- bottom actions avoid home indicators;
- top content avoids system UI;
- short landscape remains usable.

---

# Touch ergonomics

Audit every interactive surface.

Requirements:

- comfortable touch targets;
- no critical action dependent on tiny icons;
- visible pressed states;
- clear focus behaviour;
- no accidental gesture conflicts.

Possible enhancements:

- restrained haptic feedback;
- tactile transitions consistent with Atlas design.

---

# PWA behaviour

Audit:

- standalone display mode;
- overscroll behaviour;
- pull-to-refresh conflicts;
- loading states;
- offline states;
- browser zoom behaviour.

The installed PWA should feel like an application, not a wrapped website.

---

# Performance requirements

Review:

- map rendering cost;
- gesture frame rate;
- geometry complexity;
- lazy loading;
- unnecessary redraws.

Requirements:

- smooth interaction as geography expands;
- reuse existing cartography pipeline;
- avoid duplicate assets and systems.

---

# Implementation phases

## Phase 0 — Audit

Map current behaviour and confirm architecture ownership.

## Phase 1 — Navigation

Implement and validate edge gesture behaviour.

## Phase 2 — Maps

Complete direct manipulation map behaviour.

## Phase 3 — Device adaptation

Harden safe areas, keyboard behaviour and layouts.

## Phase 4 — PWA polish

Review standalone behaviour, loading and offline states.

## Phase 5 — Validation

Complete device testing and record evidence.

---

# Verification matrix

Devices:

- Pixel-class Android device;
- iPhone Safari;
- installed iOS PWA;
- tablet viewport.

Scenarios:

- nested route swipe-back;
- Home root behaviour;
- browser Back/Forward;
- map pinch and pan;
- quiz interaction;
- keyboard-open Neighbours flow;
- portrait/landscape safe areas;
- offline startup.

Record evidence in Issue #71 before closing.

---

# Non-goals

Do not:

- create separate navigation architecture;
- replace routing with hidden gesture state;
- add decorative gestures without learning value;
- add heavy animation or gamification effects;
- compromise accessibility for immersion.

---

# Completion criteria

Issue #71 is complete when:

- architecture ownership is validated;
- navigation gestures behave consistently;
- maps work naturally without desktop controls;
- mobile layouts survive device variations;
- Issue #19 keyboard interactions remain correct;
- physical device validation is recorded;
- production build is verified.
