# Issue #119 — Spatial Atlas plan of record

**Status:** support preparation active; **principal work is not authorised yet**.  
**Issue:** #119 — continuous spatial Atlas shell with interactive 3D Earth navigation  
**Branch:** `explore/spatial-atlas-moonshot`  
**Scope:** [`issue-119-spatial-atlas-moonshot.md`](issue-119-spatial-atlas-moonshot.md)  
**Acceptance map:** [`issue-119-invariant-harness.md`](issue-119-invariant-harness.md)  
**Principal packet:** [`issue-119-principal-packet.md`](issue-119-principal-packet.md)

This is the single canonical execution plan. Archived #119 handoffs in `docs/closed/` are historical tracing material, not required principal reading.

The task is intentionally split so cheap support work falsifies the idea before a frontier/principal model spends judgement on architecture.

---

## 1. What #119 is testing

The product thesis is not “Atlas should have a globe”. It is:

> Moving through Atlas as a continuous geographic space is materially easier to understand and more pleasant to use on a real phone than replacing launcher screens.

That contains two separable hypotheses:

| Hypothesis | Question | Cheapest honest test |
| --- | --- | --- |
| **H1 — continuity** | Does continuous spatial navigation beat discrete launcher replacement? | Existing production 2D geography; no renderer. |
| **H2 — sphere** | If H1 wins, does a rotatable Earth add enough orientation/product value to justify a persistent renderer and spherical asset architecture? | Principal-owned 3D work after evidence gates. |

**H1 is load-bearing.** If continuity is neutral or worse, stop #119. A more expensive renderer is not permitted to rescue a failed navigation hypothesis.

---

## 2. Current repository truth

Support reconciliation checkpoint: **27 August 2026**.

- `main` is post-#22 North America and its closeout/deploy documentation.
- #22 is production-complete across Flags, Locations, Outlines and Neighbours.
- #27 Oceania is still active at this checkpoint.
- #137 Asia hardening is sequenced after #27 and is not part of the settled baseline yet.
- #138 World Crown presentation/acceptance is still open and depends on the world-complete post-#27 curriculum.
- #104 is **closed**. Its former map-first launcher design space is now historical input to H1, not an independently open dependency.
- #34 is **closed**. Current learner-facing World Crown work belongs to #138.
- #71 remains open for physical Pixel/iPhone/installed-PWA validation.
- #118 remains open and has not yet produced a reusable motion/mobile-ergonomics baseline.

Current `CLAUDE.md`, `PRODUCT.md` and `DESIGN.md` correctly describe the post-#22 production shape but still contain pre-#27/pre-#138 statements about Oceania/Crown reachability. Those statements must be re-read after #27/#137/#138 merge; do not freeze them into #119’s final baseline.

### Dependency gate

Prefer final Stage 0 and Stage 1 execution only after **#27, #137 and #138 have merged into current `main`**.

If any remain unmerged:

- documentation/reconnaissance may proceed;
- reusable harnesses may be prepared and smoke-tested;
- historical evidence may be labelled and retained;
- **do not** capture a supposedly final production comparison baseline;
- **do not** build the final phone-judgeable H1 probe against knowingly transitional Atlas.

At this checkpoint the dependency gate is **BLOCKED**, so the branch must stop before final Stage 0/Stage 1 execution.

---

## 3. Preservation boundaries

Support and principal work alike must preserve unless an explicitly separate product decision says otherwise:

- React/Vite production ownership;
- typed hash routing and URL authority;
- native browser Back/Forward;
- ephemeral active-round/session state;
- ISO3 country identity;
- one pinned Natural Earth 1:10m production geography source;
- existing learner region membership rather than a renderer-owned taxonomy;
- learning evidence, scoring, Mastery and achievement qualification semantics;
- persistence/storage namespaces and Firebase behaviour;
- British English learner-facing copy;
- Atlas semantic colours and no colour-only state;
- real DOM controls, keyboard access, visible focus and reduced motion;
- current PWA/offline guarantees;
- answer-safe accessibility metadata.

Spatial presentation may interpret route state. It must not become a second application/router/state engine.

---

## 4. Stage 0 — production baseline

**Owner:** support automation + Ben physical-device judgement.  
**Execute final capture only after the dependency gate clears.**

### Automated evidence

Use the exact then-current production build and the isolated harness in `experiments/spatial-continuity/` to capture what automation can truthfully measure:

- route/action count for the comparison traversal;
- typed route transitions;
- Back/Forward;
- cold/deep-link behaviour;
- active-round refresh fallback;
- browser focus behaviour;
- reduced-motion branch;
- browser navigation/resource timing;
- screenshots/video/trace for side-by-side inspection;
- exact `dist/` raw/gzip measurements;
- relevant PWA/offline acceptance through the existing PWA suite.

Historical hard-coded payload numbers are not the final baseline. Re-measure the exact production artifact after #27/#137/#138.

Where #118 eventually supplies directly relevant motion/ergonomics evidence against the same production build, consume it instead of duplicating the audit.

### Human device script — fixed

**Judge:** Ben on a physical phone. An agent, screenshot or Playwright mobile viewport cannot decide H1.

Run production Atlas first, then the Stage 1 probe, in the same session:

1. Cold-open. Choose Flags.
2. Reach West Africa Play-ready/activity state. Count taps and note hesitation.
3. Start a round, answer three, leave mid-round.
4. Back out to Africa. Back out to world/domain level.
5. Switch to Outlines. Reach Southern Africa.
6. Repeat step 2 four more times, as a returning learner would.
7. One-handed throughout, thumb only, standing.

Record for **each** side:

- faster / same / slower;
- clearer / same / less clear;
- would-use-daily: yes / no;
- single worst moment.

Step 6 carries the most weight. Choreography that delights once but becomes friction through repetition is a failure.

Do not claim device evidence unless the device session actually happened.

---

## 5. Stage 1 — cheap 2D continuity probe

**Owner:** support.  
**Principal sessions:** zero.  
**Execute final probe only after the dependency gate clears.**

Test exactly this vertical slice:

`Mode/domain → World/continent selection → Africa → West Africa → Play-ready/activity → Back to Africa → Back to world/domain`

Use only:

- existing production 2D `MapRegionAsset` geography;
- existing fit/focus metadata;
- existing typed router and browser history;
- real DOM controls;
- current design tokens and semantic colours.

Required behaviour:

- motion/camera-like 2D transitions are interruptible;
- route state wins if motion is interrupted;
- deep links initialise at the stable target rather than replaying a long ancestor sequence;
- reduced motion provides an immediate/short equivalent;
- the prototype is judgeable on a phone;
- DOM controls remain available and dispatch the same application action as geography selection.

Do **not** use:

- Three.js;
- React Three Fiber;
- MapLibre;
- spherical/new globe geometry;
- a second navigation state machine;
- colour-only region progress;
- scoring/Mastery/storage changes;
- broad production navigation replacement.

The probe is deliberately disposable. If it requires principal architecture work to exist, that is evidence that H1 is not cheap enough to test cleanly.

---

## 6. H1 stop gate

Ben runs the fixed Stage 0/Stage 1 device comparison.

| Verdict | Action |
| --- | --- |
| **Continuity materially wins** | H1 passes. Continue to support-tier evidence repair below. |
| **Continuity is neutral or worse** | Record the negative result and **STOP #119**. No renderer rescue attempt. |
| **Mixed: selection better, repetition worse** | Narrow/reject rather than automatically escalating to 3D. |
| **No physical verdict yet** | Park the branch at a clean device-judgeable checkpoint and stop. |

The builder may report technical facts. The builder does not self-award H1 PASS.

---

## 7. Stage 2 — renderer evidence repair, only after H1 PASS

**Owner:** support evidence.  
**Decision authority:** principal F2 only.

The current renderer comparison is **AMBER** because the historical spikes were not apples-to-apples.

### MapLibre repair

- current Node/current Atlas base;
- headed or hardware-backed Chromium where practical;
- real local Atlas geography;
- distinguish genuine renderer/source failures from headless SwiftShader artefacts;
- verify picking, camera interaction, idle behaviour and failure/recovery.

### R3F repair

- current Node/current Atlas base;
- real canonical Africa geography rather than a minimal sphere/mesh;
- real country polygon picking;
- delivered cost includes geography plus required Atlas-authored tessellation/picking/label/LOD support.

### Comparable measures

Record separately:

- renderer JS;
- CSS;
- geography;
- Atlas-authored support code;
- total lazy chunk cost;
- startup impact;
- idle/render behaviour;
- picking;
- camera/gesture interaction;
- renderer failure/recovery.

Do not mark the comparison GREEN until both candidates attempt materially comparable Atlas tasks. Support may reconcile facts; it may not choose the renderer.

---

## 8. Stage 3 — six-continent geography/LOD evidence, only after H1 PASS

The existing projected-path experiment is useful **historical feasibility evidence**, not the final six-continent spherical contract.

Refresh measurements against final curriculum coverage for:

- Africa;
- South America;
- Europe;
- Asia;
- North America;
- Oceania.

Explicit difficult cases:

- European microstates;
- Caribbean small islands;
- Pacific small islands;
- Kiribati / antimeridian;
- multipart archipelagos.

Record:

- coordinate counts;
- component counts;
- raw/gzip payload;
- microstate survivability;
- antimeridian integrity;
- picking feasibility;
- source/provenance.

**Do not define final LOD boundaries, spherical encoding, visual/picking mesh policy or renderer-specific asset contracts.** Those are F3 decisions.

---

## 9. Invariant acceptance harness

Use [`issue-119-invariant-harness.md`](issue-119-invariant-harness.md) as the map from #119 requirements to existing Atlas tests/verifiers and future spatial-specific coverage.

The architecture does not pass by weakening these invariants:

- URLs remain durable authority;
- Back/Forward remains native;
- deep links initialise directly;
- active quiz state remains ephemeral;
- no second router/history stack;
- one Natural Earth source;
- ISO3 preserved;
- equivalent real DOM controls;
- keyboard/focus accessibility;
- reduced motion;
- OS-edge gesture compatibility;
- renderer fallback/recovery;
- spatial stack lazy-loading;
- PWA/offline behaviour;
- evidence/scoring/storage unchanged;
- no answer leakage.

#71 owns current physical OS-edge/PWA evidence; a future spatial gesture layer still requires its own physical retest.

---

## 10. Principal entry gate

A principal session starts only when all applicable items below are true:

1. #27, #137 and #138 are merged into current `main`.
2. Stage 0 exact-production automated baseline is captured.
3. Ben’s physical production baseline is recorded.
4. Stage 1 2D continuity probe is phone-judgeable.
5. Ben has supplied the H1 verdict.
6. H1 is a material PASS.
7. Renderer comparison has been repaired to genuine apples-to-apples evidence.
8. Six-continent geometry/LOD evidence is refreshed.
9. The branch is synced to then-current `main`.
10. [`issue-119-principal-packet.md`](issue-119-principal-packet.md) is current and concise.

The principal should not need archived handoffs or thousands of lines of historical planning.

### Principal reads

Start with:

1. live #119;
2. `CLAUDE.md`;
3. `DESIGN.md`;
4. `.impeccable/design.json`;
5. this plan;
6. `issue-119-principal-packet.md`.

Read `issue-119-renderer-comparison.md` and the refreshed geometry report only for the evidence behind F2/F3. Read archived documents only to trace a contested historical fact.

---

## 11. Decisions explicitly reserved for the principal

### F1 — spatial interaction contract

Includes:

- route → spatial presentation semantics;
- progressive disclosure;
- gesture ownership;
- interruption grammar;
- reduced-motion grammar;
- **Locations-vs-globe decision**.

### F2 — renderer / scene / camera architecture

Choose or reject candidates from repaired evidence. Define renderer lifecycle, camera abstraction, picking/DOM parity, failure fallback and lazy-loading boundary.

### F3 — spherical geography / LOD contract

Define the generated spherical representation, LOD boundaries, picking/display relationship, antimeridian/multipart handling and asset lifecycle using the six-continent evidence.

**STOP before making F1, F2 or F3. Do not begin the Africa 3D vertical slice until those decisions authorise it.**

---

## 12. Kill criteria and principal budget

Default to **retain/narrow the current launcher**, not indefinite continuation, if:

- H1 fails;
- repeated spatial travel is slower or more annoying than current navigation;
- native Back and spatial manipulation cannot coexist cleanly;
- accessibility requires a parallel interface so dominant that spatial presentation becomes decoration;
- route truth starts duplicating into an animation/state machine;
- canonical geography requires a second source;
- renderer cost materially worsens mobile startup/PWA behaviour;
- renderer failure cannot degrade safely;
- the design needs unrelated scoring/storage/Mastery changes to justify itself.

Principal sessions are scarce and reserved for high-leverage decisions:

- F1 + F2: target one principal session, split only if repaired evidence is genuinely balanced;
- F3: principal contract design, implementation delegated;
- Africa 3D vertical slice/refinement: only after F1–F3, with an explicit finite budget;
- independent go/no-go review: fresh principal after Ben’s device verdict, not instead of it.

Rejection is a valid successful exploration outcome.
