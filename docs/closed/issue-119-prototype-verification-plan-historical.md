# Issue #119 — Prototype verification plan

**Status:** support-stage acceptance specification.  
**Scope:** Stage 0 production baseline + Stage 1 2D continuity probe first; renderer-specific acceptance only after H1 passes and F1–F3 authorise it.

A spatial prototype succeeds only if it is materially better on a real phone **and** preserves Atlas routing, accessibility, gesture, performance, PWA and learning contracts.

The invariant-to-test mapping lives in [`issue-119-invariant-harness.md`](issue-119-invariant-harness.md). This file defines the evidence expected from the prototype itself.

## 1. Comparison traversal

Primary H1 path:

`Home/mode → Flags → World/continent selection → Africa → West Africa → Play → Back Africa → Back world/domain`

Also verify stable direct entry:

- `/#/flags/africa`
- `/#/flags/africa/west-africa`

The final Stage 1 probe uses existing 2D geography. Do not introduce a renderer merely to satisfy this verification plan.

## 2. Route/state acceptance

### R1 — URL authority

For every durable spatial state:

- URL serialises through the existing typed route model;
- refresh returns to the correct stable scope;
- motion/tween progress is not persisted as application state.

### R2 — no parallel navigation stack

Spatial presentation derives a destination from existing route/store state. It must not maintain an independent history that can disagree with browser/router history.

### R3 — Back/Forward ancestry

From West Africa:

- Back returns to Africa;
- another Back returns to the domain/world state;
- Forward replays browser history correctly;
- no retired intermediate selection state is invented solely for animation.

### R4 — interruption

If route state changes while spatial motion is running:

- obsolete motion cancels/retargets;
- visible destination converges on the newest route;
- no queued stale motion later pulls the learner back.

### R5 — cold/deep link

A stable region link initialises directly at that scope. Do not require World → Africa → West Africa cinematic replay on cold entry.

Active-round cold entry keeps the existing ephemeral-session fallback semantics.

## 3. DOM/geography semantic parity

### A1 — real controls

Every durable continent/region state exposes ordinary HTML controls for the same actions offered by geography.

### A2 — same action

Geography pick, DOM activation and keyboard activation converge on the same route/application action. Do not create renderer-specific business logic.

### A3 — focus

After durable route changes:

- focus lands predictably/usefully;
- hidden/transitioning controls are not focusable;
- returning via Back restores sensible focus where practical.

### A4 — announcements

Meaningful scope changes are understandable without observing motion. Screen-reader semantics must not leak active quiz answers.

## 4. Gesture acceptance

Record explicit evidence for:

| Context | Expected owner |
| --- | --- |
| centre drag on future world scene | spatial scene if F1 authorises it |
| tap without meaningful drag | scope selection |
| small pointer jitter | tap, not accidental drag |
| pinch on future world scene | spatial scene if F1 authorises it |
| left-edge system/browser Back | platform/browser routing |
| DOM button/overlay gesture | DOM control/scroll |
| Ctrl/meta + wheel | browser/page accessibility; never stolen |
| drag release over geography | no accidental activation |
| Back during spatial motion | router wins |
| active Locations map | Locations map owns its gestures |
| Neighbours input/software keyboard | DOM/input owns interaction |

Current Atlas uses a 28 CSS px page-level Back gesture precedent and yields around map viewports/interactive controls. A future spatial layer must reconcile platform ownership deliberately.

**Physical edge-gesture evidence cannot come from Playwright.** #71 owns the current production device baseline; spatial interaction needs physical retesting if introduced.

## 5. Reduced motion

With `prefers-reduced-motion: reduce`:

- every durable state remains understandable;
- long travel is replaced by immediate/short repositioning;
- hierarchy remains visible through geography/labels/controls;
- no functionality depends on watching motion;
- focus remains stable.

Stage 1 must prove this before a renderer is involved.

## 6. Failure/fallback

Stage 1 should preserve the current production navigation as a safe escape because it adds no renderer dependency.

If H1 later passes and a renderer is authorised, acceptance must cover:

1. renderer/WebGL unavailable at initialisation;
2. renderer initialisation exception;
3. context loss after successful mount;
4. repeated context loss / bounded recovery;
5. capability/performance rejection based on an explicit measured rule.

Required outcome: Atlas remains usable, routing/state remains intact, and a known 2D/current navigation path is available. Blank full-screen geography and infinite recovery loops fail.

## 7. Performance evidence

### P1 — exact startup baseline

Do not copy historical bundle figures into the gate. Rebuild then-current production and use:

```bash
npm run measure:spatial-artifact
```

Record:

- initial entry JS/CSS;
- all lazy geography chunks;
- service-worker/runtime files;
- total exact artifact size;
- raw + gzip values.

### P2 — spatial/prototype readiness

For Stage 1, measure route/action timing to an interactive 2D target state. For a future authorised renderer, separately measure visibly ready and interactively ready.

### P3 — manipulation/motion

Where meaningful, record frame/long-task/layout evidence without pretending desktop/headless results are physical phone performance.

### P4 — idle behaviour

A future renderer must demonstrate the approved idle policy rather than assuming demand rendering from library documentation.

### P5 — repetition/leaks

Repeat World ↔ Africa ↔ West Africa and inspect for stale transitions, duplicate listeners/resources, unwanted remounts and memory/resource growth where tooling permits.

## 8. Geography acceptance

For any future spherical assets:

- every selectable country resolves to canonical Atlas ISO3;
- one pinned Natural Earth source/policy remains authoritative;
- region membership comes from existing learner-facing scopes;
- no handwritten region polygons;
- antimeridian cases are inspected explicitly;
- multipart countries/archipelagos remain truthful;
- simplification does not shift political ownership or break picking;
- existing production 2D assets are not casually mutated by the experiment.

Stage 1 uses current 2D production assets and therefore should not add generator work.

## 9. Product Gate G — human judgement

Automated technical gates do not decide whether spatial continuity feels better.

**Ben decides H1 on a physical phone**, using the fixed script in [`issue-119-plan.md`](issue-119-plan.md), production first and Stage 1 second.

Record per side:

- faster / same / slower;
- clearer / same / less clear;
- would-use-daily yes/no;
- single worst moment.

Repeated traversal is deliberately weighted heavily. A first-run delight that becomes fifth-run friction fails the product hypothesis.

If H1 is neutral or worse, stop #119 before renderer repair/F1–F3.

## 10. Evidence classes

Label every result as one of:

- unit/component;
- invariant verifier;
- Playwright desktop;
- Playwright mobile viewport;
- production artifact measurement;
- Android physical;
- iPhone/iOS physical;
- installed PWA physical;
- manual product judgement.

Never report Playwright mobile emulation as physical-device evidence.

## 11. Stage 1 checkpoint packet

Before asking Ben for H1 judgement, collect only what is needed to compare Stage 1 with production:

1. exact base SHA and prototype branch SHA;
2. complete traversal video/screenshots;
3. route/action count and browser timing attachments;
4. Back/Forward/deep-link/refresh results;
5. focus/reduced-motion results;
6. exact artifact delta;
7. known prototype compromises;
8. explicit statement that no renderer/learning/storage architecture changed.

If Ben has not yet supplied a physical verdict, park at this clean device-judgeable checkpoint.

## 12. Principal packet after H1 PASS

Only after H1 materially passes, repair renderer evidence and refresh six-continent LOD evidence, then update [`issue-119-principal-packet.md`](issue-119-principal-packet.md) with:

- Stage 0 baseline;
- H1 result;
- apples-to-apples renderer evidence;
- six-continent geometry/LOD envelope;
- hard invariants/kill criteria;
- unresolved F1/F2/F3 decisions.

Do not begin the Africa 3D vertical slice before the principal decisions authorise it.
