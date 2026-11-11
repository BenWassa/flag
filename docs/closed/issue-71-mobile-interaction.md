# Issue 71 — Mobile Interaction & Native Feel Upgrade

## Current status (2026-08-25) — read this before delegating

**Everything below this section is the original planning specification. It
predates the React/Vite migration (#89) and the removal of the Progress
screen (2026-08-23), so it references source paths and surfaces that no
longer exist in production** (`src/app.ts`, `src/ui/views/`,
`src/ui/components/neighbor-map.ts`, a standalone "Progress" screen). Keep it
for product-intent/architecture-principle context only — do not hand a
subagent a task derived from its "Implementation phases" or "Repository
touch points" sections; those describe unstarted work that has since shipped.

**What has already shipped and been browser-verified** (see
[`issue-71-implementation-notes.md`](issue-71-implementation-notes.md) for
full evidence): edge-swipe back navigation with correct gesture-ownership
priority (controls → maps → scroll → navigation), direct-manipulation
Locations/Neighbours map interaction, safe-area/viewport/PWA behaviour
(`overscroll-behavior-y: contain`, `viewport-fit=cover`), and a
screen-by-screen no-horizontal-overflow audit across four viewports. This has
been re-verified three times as `main` moved (2026-08-22, 2026-08-23, and
after South America/Europe/Asia shipped) with zero regressions.

**The only remaining scope for #71 is physical-device validation**:

- physical Pixel-class Android device, Chrome;
- physical iPhone, Safari and the installed PWA;
- real notch/Dynamic Island/gesture-bar safe-area behaviour;
- real software-keyboard interaction with Neighbours (coordinate with #19,
  already closed).

Chromium DevTools Protocol touch emulation is **not** equivalent to this and
has already been used as far as it can go. **This cannot be delegated to a
coding subagent** — it requires a person with the actual hardware running the
production build and recording what happens. If you're assigning #71 out,
assign it as a manual QA pass with the exact scenario list from
`issue-71-implementation-notes.md`'s verification tables, not as an
implementation task.

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
