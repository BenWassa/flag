# Issue #119 — Prototype Verification Plan

**Status:** support-stage acceptance/test specification  
**Issue:** #119  
**Scope:** Africa vertical slice only until the go/no-go review

## 1. Purpose

A spinning globe is not a successful prototype.

The Issue #119 Africa spike passes only if it demonstrates a materially better mobile geography-navigation experience **and** preserves Atlas's routing, accessibility, gesture, performance and failure-handling contracts.

This document defines evidence the prototype must produce. It deliberately avoids choosing the renderer or camera implementation.

## 2. Vertical slice under test

Primary path:

```text
Home / mode selection
→ Flags (or one agreed prototype domain)
→ World
→ Africa
→ West Africa
→ Back to Africa
→ Back to World/domain selection
```

Also test direct entry:

```text
/#/flags/africa
/#/flags/africa/west-africa
```

The principal model may choose a different single domain for the spike only if it documents why it provides a cleaner test of the spatial shell. The durable route semantics must remain representative.

## 3. Route and state acceptance

### R1 — URLs remain authoritative

For every durable spatial state:

- URL serialises through the existing typed route model;
- browser refresh returns to the correct stable scope;
- spatial animation is not persisted as application state;
- no camera tween progress appears in the URL.

### R2 — No parallel navigation stack

The spatial renderer must not maintain an independent history that can disagree with the router.

A camera destination may be derived from route state, but Back/Forward remain browser/router concepts.

### R3 — Back ancestry

From West Africa:

- Back returns to Africa;
- another Back returns to the domain/world selection state;
- history does not reintroduce retired select-region-then-Play states.

### R4 — Interrupted transition

If the user navigates Back while the camera is travelling Africa → West Africa:

- obsolete travel is cancelled/redirected;
- route and visible destination converge;
- no queued animation later pulls the learner back to West Africa.

### R5 — Cold deep link

Loading a region URL directly should initialise near the target destination.

Do not replay a long mandatory World → Africa → West Africa cinematic chain on every cold deep link.

## 4. DOM/3D semantic parity

### A1 — Real controls exist

At every continent/region selection state, ordinary DOM controls expose the same selectable scopes as the 3D geography.

At Africa this includes at minimum:

- Africa / whole-continent action;
- North Africa;
- West Africa;
- Central Africa;
- East Africa;
- Southern Africa.

### A2 — Same application action

Selecting West Africa through:

- geographic picking;
- DOM button;
- keyboard activation;

must converge on the same route/application action.

Do not maintain separate business logic for 3D picking.

### A3 — Focus

After durable route changes:

- keyboard focus lands somewhere predictable and useful;
- hidden/transitioning DOM controls are not focusable;
- returning via Back restores a sensible focus target where possible.

### A4 — Announcements

Screen-reader users receive enough semantic context to understand the new scope without relying on camera movement.

Motion is never the sole communication of hierarchy.

## 5. Gesture conflict matrix

The prototype should explicitly record pass/fail for the following combinations.

| Gesture / context | Expected owner | Requirement |
| --- | --- | --- |
| one-finger drag in globe centre | spatial scene | rotate Earth |
| tap without meaningful drag | scope picking | select intended geography/control |
| small pointer jitter | tap | must not suppress ordinary selection unnecessarily |
| two-finger pinch on globe | spatial scene | zoom/dolly |
| two-finger translate during pinch | spatial scene | behaviour must be deliberate and stable |
| left-edge swipe outside interactive controls | Atlas/browser Back contract | must remain available |
| left-edge drag beginning over globe | explicitly resolved | no accidental fight between globe and Back |
| drag over DOM button/overlay | DOM/control | must not rotate Earth through the control |
| scroll inside scrollable DOM overlay | DOM scroll | globe must not steal it |
| Ctrl/meta + wheel | browser/page accessibility | never captured as globe zoom |
| pointer drag then release over country | spatial scene | no accidental country activation |
| quick tap on country | selection | no delayed drag interpretation |
| Back during camera animation | routing | route wins, animation redirects |
| pinch ending with one finger still down | spatial scene | no jump/discontinuous rotation |
| activity-specific Locations map | activity map | background globe must not steal gestures |

### Current Atlas precedent

Current page-level swipe Back begins only within a 28 px left-edge gutter and excludes `[data-map-viewport]` plus interactive controls.

The prototype should reconcile that precedent deliberately rather than silently replacing it.

## 6. Reduced motion

With `prefers-reduced-motion: reduce`:

- all durable states remain understandable;
- long orbital/fly transitions are replaced by short or effectively immediate spatial repositioning;
- selection hierarchy is conveyed through labels/geometry emphasis, not travel distance;
- no functionality depends on observing an animation;
- achievement/result behaviour remains restrained.

Automated coverage should verify reduced-motion branching where practical.

## 7. Renderer failure / fallback contract

### Fallback case 1 — WebGL unavailable at initialisation

Required result:

- application remains usable;
- domain/scope selection remains reachable;
- no blank full-screen Canvas blocks the app;
- failure is not presented as user error.

### Fallback case 2 — Renderer initialisation throws

Required result:

- `AppErrorBoundary` or a spatial-specific boundary prevents total-app loss;
- fallback UI is available;
- routing/state remain intact.

### Fallback case 3 — Context lost after successful mount

Prototype must record the chosen behaviour.

Acceptable directions include:

- recover renderer in place;
- remount renderer safely;
- degrade to 2D/current launcher after bounded recovery attempts.

Infinite retry loops and permanently blank geography are failures.

### Fallback case 4 — capability/performance rejection

If a device fails an explicit graphics capability/performance gate, Atlas should select a documented fallback rather than provide a severely degraded interactive globe.

Do not create capability discrimination heuristics without evidence; define what is actually measured.

## 8. Performance evidence

### P1 — Startup preservation

Mode selection must remain usable without waiting for the full globe stack.

Measure:

- current initial shell;
- prototype initial shell;
- lazy renderer chunk;
- lazy world-LOD chunk;
- time until first meaningful control activation.

Current exact production explicit-shell baseline recorded in the support dossier is about **138 KB gzip** before lazy Firebase and lazy continent map chunks.

### P2 — Spatial load

Measure from mode selection or preloading trigger until:

- Earth is visibly ready;
- Earth is interactively ready.

Do not combine those timestamps if interaction is blocked after first paint.

### P3 — Active manipulation

During sustained globe rotation/pinch record:

- frame time distribution where tooling permits;
- dropped frames/jank observations;
- long tasks;
- layout work caused by DOM overlay repositioning.

### P4 — Idle behaviour

After all camera motion stops:

- verify whether the renderer continues producing frames;
- record idle CPU/GPU behaviour where tooling permits;
- if R3F is used, verify demand-rendering behaviour rather than assuming it.

### P5 — repeated navigation/memory

Repeat at least:

```text
World ↔ Africa ↔ West Africa
```

multiple times.

Check for:

- renderer remounts;
- growing geometry/material counts;
- WebGL contexts accumulating;
- obvious memory growth;
- event-listener duplication;
- stale camera transitions.

## 9. Geometry acceptance

### G1 — canonical identity

Every selectable country mesh/polygon must reconcile to canonical Atlas ISO3.

### G2 — same source policy

Generated globe assets must come from the same pinned Natural Earth source and normalisation/political policy as current production cartography.

### G3 — no handwritten region polygons

Regions are derived from existing learner-facing ISO3 membership.

### G4 — antimeridian

Explicitly inspect Russia/Pacific-facing world views and any geometry crossing ±180°.

### G5 — MultiPolygon integrity

Check island/fragmented countries relevant to world and Africa presentation.

### G6 — LOD honesty

Simplification may remove visual detail for world navigation but must not:

- merge countries;
- erase recognisable major islands where relevant to selection;
- create self-intersections that break picking;
- shift political ownership.

### G7 — current 2D assets remain intact

The prototype must not regenerate/change production 2D assets merely to create spherical experiment outputs unless a separate reviewed generator change requires it.

## 10. Visual/product acceptance

This is intentionally not reducible to automated tests.

The principal review should answer:

- Is the Earth immediately legible as Atlas rather than an embedded map product?
- Does selecting Africa explain hierarchy through movement rather than spectacle?
- Are region labels obvious without becoming a cluttered map annotation layer?
- Does the continent action remain the strongest control?
- Can a learner reach West Africa faster or more naturally than through the current launcher?
- Does free globe rotation help orientation, or add friction before a simple selection?
- Does Back feel like reversing a spatial journey?
- Does the interaction remain quiet/information-first?
- Is there any point where the user thinks a conventional screen just loaded behind an animation?
- Would the experience still be worth the complexity if achievement animation were removed entirely?

A prototype can pass technical gates and still fail this product review.

## 11. Automated test targets

Do not overfit tests to implementation details before F2.

Once architecture is chosen, add tests for semantic invariants such as:

- route → destination mapping;
- destination → accessible DOM controls;
- 3D selection dispatches the same action as DOM selection;
- Back changes route ancestry correctly;
- deep link resolves correct initial destination;
- reduced-motion variant exists;
- unsupported scope remains unavailable;
- renderer failure reveals fallback;
- active activity prevents background globe gesture theft.

Avoid brittle assertions like exact camera floating-point coordinates unless a documented camera contract requires them.

## 12. Evidence classes

Use explicit labels in the worklog:

- **unit/component**;
- **Playwright desktop**;
- **Playwright mobile viewport**;
- **Android physical**;
- **iPhone/iOS physical**;
- **installed PWA physical**;
- **manual visual review**;
- **bundle/artifact measurement**.

Do not claim physical-device success from a Playwright mobile viewport.

## 13. Prototype go/no-go packet

Before F6, collect one concise packet containing:

1. video/screen capture or equivalent visual evidence of the complete path;
2. renderer/package versions;
3. route/history results;
4. accessibility/reduced-motion results;
5. gesture matrix;
6. payload comparison;
7. runtime/performance observations;
8. failure/fallback results;
9. known compromises/hacks;
10. code architecture summary;
11. current branch diff against then-current `main`;
12. explicit recommendation from the builder, separated from the independent reviewer's final judgement.

F6 should be able to reject the moonshot cleanly without requiring sunk-cost justification.