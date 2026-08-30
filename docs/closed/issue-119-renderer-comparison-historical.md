# Issue #119 — Renderer comparison evidence

**Status:** **PARKED UNTIL H1 PASSES; AMBER / not decision-ready.**  
**Owner:** support evidence only.  
**Decision authority:** principal F2.

This document records what the historical R3F/Three and MapLibre spikes established, why that evidence is not apples-to-apples, and the exact repair work required **only if the 2D H1 continuity probe materially wins**.

It does **not** select or recommend a renderer.

Source reports remain available for contested details:

- [`issue-119-r3f-spike-results.md`](issue-119-r3f-spike-results.md)
- [`issue-119-maplibre-spike-results.md`](issue-119-maplibre-spike-results.md)

## Historical common sequence

Both spikes attempted the same semantic route-like sequence:

`World → Africa → West Africa → Back Africa → Back World`

and an interruption case:

`World → Africa (moving) → request West Africa → immediately Back`

That makes lifecycle/camera-state observations useful. It does **not** make the rendering, picking or delivered-cost evidence comparable.

## Why the gate is AMBER

### D1 — different rendering tasks

The R3F spike rendered a minimal centre mesh and included **no real Atlas country geography**.

The MapLibre spike attempted a real local GeoJSON source/layer and feature picking.

Therefore a historical row such as “R3F picking PASS / MapLibre picking FAIL” is not a valid renderer scoreboard: one picked a minimal mesh; the other attempted country polygons.

### D2 — MapLibre failure is environment-confounded

The historical MapLibre local style/source remained blank/unloaded under headless SwiftShader in both development and production-preview runs, with no MapLibre error emitted.

That may be a genuine integration failure or a software-rasterised/headless artefact. The historical evidence cannot distinguish those explanations.

The original runs also used different environments/base revisions, so no F2 decision may cite that blank result as a product constraint until it is reproduced or cleared under a current, comparable headed/hardware-backed run.

### D3 — delivered cost was not comparable

Historical gzip figures were approximately:

- R3F/Three minimal renderer JS: **243,166 B gzip**;
- MapLibre JS: **248,535 B gzip**, plus approximately **10,456 B gzip CSS**.

Those figures are **not near-parity product costs**.

The MapLibre measurement already included its GeoJSON source/layer, projection, camera and feature-picking machinery. The R3F measurement excluded real Atlas geography and Atlas-authored tessellation/picking/label/LOD support.

R3F’s true delivered Atlas cost was not measured.

### D4 — narrow StrictMode observation

The historical R3F run did not reproduce the reported StrictMode context-loss issue during one short observation window. Read that as **not reproduced in that narrow run**, not as a durable PASS on lifecycle risk.

## Historical evidence worth retaining

The prior spikes still established useful objective facts:

| Dimension | R3F / Three historical evidence | MapLibre historical evidence |
| --- | --- | --- |
| React integration | Canvas coexisted with React/DOM in the measured stack | ordinary map lifecycle wrapper coexisted with React/DOM |
| Persistent instance through semantic state changes | observed | observed |
| Idle window | zero measured frames in a stable window | zero measured render events in a stable window, with blank-source caveat |
| Semantic camera destinations | World/Africa/West Africa transitions settled | internal centre/zoom destinations settled, with blank visual caveat |
| Mid-flight retarget / Back | final semantic destination converged | internal destination converged, with blank visual caveat |
| DOM action path | ordinary DOM Africa action worked | ordinary DOM Africa action worked |
| Failure/context hooks | forced loss/restore signal observed | forced loss/restore/fallback signal observed |
| Offline/local dependency path | no external request required in the minimal scene | literal local style/GeoJSON path used, despite blank rendering |
| Physical mobile gestures | **not proven** | **not proven** |
| Integrated Atlas fallback | **not proven** | **not proven** |

These are inputs to a future comparable run, not an architecture decision.

## Repair gate — execute only after H1 PASS

### MapLibre

Re-run on:

- then-current `main`;
- current supported Node 22 environment;
- headed Chromium or hardware/ANGLE-backed rendering where practical;
- real local canonical Atlas Africa geography.

Required evidence:

- source/style visibly loads or the failure reproduces with actionable diagnostics;
- country feature picking dispatches the same application action as a DOM control;
- World/Africa/West Africa camera sequence and interruption;
- idle/render behaviour;
- gesture behaviour in automation, explicitly labelled non-physical;
- failure/context-loss/fallback path;
- exact JS/CSS/geography/support payload.

If the blank source reproduces on headed/hardware-backed current Atlas, record it as a genuine candidate defect. If it clears, retire the SwiftShader FAIL rather than carrying it forward.

### R3F / Three

Re-run on the same current base/environment and render:

- real canonical Africa country polygons;
- real country picking;
- the same World/Africa/West Africa semantic sequence;
- the same interruption/fallback expectations.

Delivered cost must include:

- renderer/runtime JS;
- real geography payload;
- Atlas-authored mesh/tessellation code;
- picking code;
- label/anchor support required by the compared task;
- any LOD/runtime support actually necessary for the compared slice.

A minimal sphere or centre mesh is insufficient.

## Comparable output table required after repair

Populate one table from the matched runs:

| Measure | R3F / Three | MapLibre |
| --- | ---: | ---: |
| renderer JS raw/gzip | PENDING | PENDING |
| CSS raw/gzip | PENDING | PENDING |
| geography raw/gzip | PENDING | PENDING |
| Atlas-authored support raw/gzip | PENDING | PENDING |
| total lazy delivered cost | PENDING | PENDING |
| initial-shell impact | PENDING | PENDING |
| visible initialisation | PENDING | PENDING |
| real country picking | PENDING | PENDING |
| World → Africa → West Africa | PENDING | PENDING |
| interruption / Back convergence | PENDING | PENDING |
| idle/render policy evidence | PENDING | PENDING |
| renderer failure/recovery | PENDING | PENDING |
| physical gesture/device evidence | PENDING | PENDING |

Do not collapse component costs into a single headline number until each row is separately available.

## Gate rule

The comparison becomes **GREEN for principal review** only when:

1. H1 has already materially passed on Ben’s physical-phone comparison;
2. both candidates run on a comparable current Atlas base/environment;
3. both render and pick real Atlas geography;
4. delivered cost is measured on the same functional scope;
5. headless/hardware confounds are explicitly resolved;
6. remaining unknowns are labelled rather than converted to PASS.

GREEN means “the principal can make F2 from fair evidence”. It does **not** mean either renderer is selected, production-ready or approved for the Africa 3D slice.
