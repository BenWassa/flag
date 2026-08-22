# Issue 71 — Mobile Interaction & Native Feel Upgrade

## Status

Open planning specification.

Issue #71 establishes the mobile interaction foundation for Atlas. The objective is not adding isolated gestures; it is making Atlas feel like a purpose-built touch-first geography application across phones, tablets and installed PWA contexts.

The existing implementation groundwork (`a046c01`) is a starting point only. Completion requires design validation, device testing and the broader interaction audit described below.

---

## Product intent

Atlas is geography-first. The interface should disappear when exploring geography.

Principles:

- direct manipulation over control panels;
- maps are interactive surfaces, not images with controls around them;
- navigation follows platform conventions;
- visual simplicity should come from removing unnecessary chrome;
- interaction polish should support learning rather than distract from it.

---

## Current implementation review

### Router / navigation

Issue 71 should extend the existing routing model rather than create a gesture-specific navigation layer.

Requirements:

- edge swipe back must resolve through existing route history;
- browser Back/Forward must remain authoritative;
- hash routing behaviour must remain unchanged;
- Home is the navigation root.

Desired behaviour:

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

## Map interaction model

Locations and Neighbours should use a true touch-map model.

Remove desktop interaction patterns:

- persistent zoom controls;
- region shortcut buttons inside the map surface;
- unnecessary fit/reset chrome.

Support:

- pinch zoom;
- pan/drag;
- tap country interaction;
- predictable zoom bounds;
- smooth transitions.

The map itself should communicate scale and exploration.

---

## Geographic navigation

Avoid replacing exploration with menus.

Preferred hierarchy:

```
World
 ↓
Continent
 ↓
Region
 ↓
Country
 ↓
Learning activity
```

Continent and region selectors may exist where required for accessibility or fallback navigation, but they should not dominate the learner experience.

---

## Safe-area and viewport audit

Review all primary surfaces against:

- iPhone notch and Dynamic Island devices;
- Android cutouts;
- gesture navigation areas;
- portrait and landscape orientations;
- keyboard-open states.

Verify:

- controls clear safe-area insets;
- bottom actions do not collide with home indicators;
- top content does not collide with system UI;
- short landscape layouts remain usable.

---

## Touch ergonomics

Audit every interactive surface.

Requirements:

- comfortable touch targets;
- no critical action dependent on small icons;
- visible pressed states;
- clear focus behaviour;
- no accidental gesture conflicts.

Potential enhancements:

- restrained haptic feedback;
- tactile transitions consistent with the Atlas design system.

---

## Learning surfaces

Review each domain separately:

### Flags

Confirm flag recognition remains the dominant object.

### Locations

Confirm map interaction remains natural without toolbar controls.

### Outlines

Confirm country silhouette interaction works on small screens.

### Neighbours

Coordinate with Issue #19 keyboard and viewport work. Ensure:

- map remains usable when typing;
- focus changes do not break layout;
- keyboard opening does not cover required actions.

---

## PWA behaviour

Audit installed-app behaviour:

- standalone display mode;
- overscroll behaviour;
- pull-to-refresh conflicts;
- loading transitions;
- offline states;
- browser zoom behaviour.

Avoid behaviours that make the PWA feel like a wrapped website.

---

## Performance requirements

Mobile interaction must remain smooth as geography expands.

Review:

- map rendering cost;
- gesture frame rate;
- geometry complexity;
- lazy loading behaviour;
- unnecessary redraws.

Do not introduce a second map or geometry system.

---

## Verification plan

Manual validation should cover:

### Devices

- Pixel-class Android device;
- iPhone with Safari;
- installed iOS PWA;
- tablet viewport.

### Scenarios

- nested route swipe-back flow;
- Home root behaviour;
- browser Back/Forward;
- map pinch and pan;
- quiz interaction;
- keyboard-open Neighbours flow;
- portrait/landscape safe areas;
- offline/PWA startup.

Record evidence in Issue #71 before closing.

---

## Non-goals

Do not:

- create a separate navigation architecture;
- add decorative gestures without learning value;
- replace routing with hidden gesture state;
- add heavy animation or gamification effects;
- compromise accessibility for immersion.

---

## Implementation sequence

1. Audit existing gesture, routing and map behaviour.
2. Validate architecture against existing routing and state ownership.
3. Complete navigation gesture layer.
4. Complete map direct-manipulation behaviour.
5. Perform safe-area/device audit.
6. Optimise touch ergonomics and PWA details.
7. Run device validation and record evidence.
