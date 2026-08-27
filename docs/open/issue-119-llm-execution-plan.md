# Issue #119 — LLM Execution Plan

**Issue:** #119 — Continuous spatial Atlas shell with interactive 3D Earth navigation  
**Branch:** `explore/spatial-atlas-moonshot`  
**Companion scope:** [`issue-119-spatial-atlas-moonshot.md`](issue-119-spatial-atlas-moonshot.md)  
**Purpose:** concentrate frontier-model reasoning on the few decisions where additional intelligence materially changes the outcome

## 1. Operating principle

Do **not** assign model tiers according to how many lines of code a task contains.

Assign them according to **decision leverage**.

A task is frontier-reserved only when a weak decision would contaminate the rest of the moonshot, when several architectural/product systems must be reasoned about simultaneously, or when the work requires unusually strong interaction/design judgement.

The target operating model is:

```text
support models gather evidence / implement settled decisions
                         ↓
                prepared handoff packet
                         ↓
              FRONTIER PRINCIPAL SESSION
                         ↓
              explicit durable decision
                         ↓
        support models implement / test / measure
                         ↓
              FRONTIER REVIEW GATE
```

The expensive model should spend as little context as possible on repository archaeology, dependency lookup, repetitive tests, type cleanup, mechanical rollout or documentation maintenance.

It should spend as much of its useful context as possible on the **irreducibly hard part**.

## 2. Model classes

The exact model names will change over time. The work classification should remain stable.

### Tier F — Frontier principal

Examples: current top Opus-class or Sol-class model at its strongest available reasoning setting.

Use only for work marked **FRONTIER RESERVED** in this plan.

Tier F may:

- make or revise architecture decisions;
- make interaction-design decisions;
- reject the current moonshot direction;
- choose between renderer architectures;
- define the prototype's core abstractions;
- integrate multiple systems where no settled pattern exists;
- conduct go/no-go reviews;
- approve a production migration architecture.

Tier F should not routinely be used for:

- file inventory;
- reading every historical issue merely to summarise it;
- dependency installation;
- broad web/library research without a specific decision question;
- deterministic generator plumbing once its contract is settled;
- routine tests;
- lint/type fixes;
- documentation link maintenance;
- repeated rollout of an already-proven pattern.

### Tier S — Strong support

Examples: strong Sonnet/Terra-class coding model.

Use for high-volume engineering and investigation where the architecture is already constrained.

Tier S may:

- inspect the repository and build precise handoff notes;
- investigate existing abstractions;
- research library APIs and known failure modes;
- prototype narrowly scoped alternatives requested by Tier F;
- implement generator changes from an approved contract;
- write tests/benchmarks;
- instrument performance;
- implement settled components;
- diagnose bounded failures;
- prepare diffs for frontier review.

Tier S must **not silently redefine a frontier-owned architectural decision**. If an implementation constraint invalidates a decision, report the conflict and escalate it.

### Tier M — Mechanical support

Any reliable lower-cost model/tooling tier.

Use for deterministic or repetitive work:

- dependency/version bookkeeping;
- fixture generation;
- repetitive test cases;
- straightforward file moves;
- formatting;
- CI/test-log triage;
- documentation indexing;
- mechanical continent rollout after the architecture is proven.

There is no need to optimise heavily between different inexpensive tiers. The important distinction is simply **frontier-owned vs delegated**.

## 3. Frontier reservation test

Before giving a task to Tier F, require at least one of these to be true:

1. **Precedent:** this decision establishes a pattern that later work will copy.
2. **Cross-system reasoning:** the task simultaneously touches several of rendering, routing, interaction, cartography, React lifecycle, mobile gestures, PWA/performance or accessibility.
3. **Product taste:** correctness alone is insufficient; the work must feel excellent.
4. **Irreversible leverage:** a poor decision would cause substantial downstream rework.
5. **Ambiguous trade-off:** there are multiple defensible architectures and the best choice depends on synthesis rather than a lookup.
6. **Go/no-go authority:** the task decides whether the moonshot should continue, change direction or stop.

If none applies, delegate it.

## 4. Frontier tasks — the protected queue

The following tasks are the core of the premium-model budget. They should be run as distinct, prepared sessions rather than one indefinitely growing conversation.

---

### F1 — Spatial product architecture and interaction contract

**Status:** FRONTIER RESERVED  
**When:** before serious prototype implementation

#### Question

What exactly should continuous Atlas navigation feel like, and what product rules must the implementation preserve?

#### Frontier responsibilities

- challenge the premise rather than assume 3D is automatically correct;
- define the semantic spatial states: mode, world, continent, region, activity, results;
- define the hierarchy and progressive disclosure of continent/region controls;
- define forward/Back spatial behaviour;
- define deep-link initialisation behaviour;
- define gesture ownership at each state;
- define reduced-motion behaviour;
- define the relationship between spatial scene and real DOM controls;
- decide how much geography remains visible during Flags, Outlines and Neighbours activities;
- define what would make the experience materially better than the current launcher;
- produce the first explicit **experience success rubric**.

#### Inputs must already exist

Support work should provide:

- current routing hierarchy;
- current launcher behaviour;
- current gesture rules;
- current semantic colour/mastery rules;
- current availability rules;
- relevant mobile layout constraints;
- #104 conflict/relationship summary.

#### Durable output

A short architecture/design decision section committed to the issue documentation. Avoid leaving critical product decisions only in chat history.

#### Do not spend Tier F time on

- scanning every file in the repository;
- determining which file currently renders a launcher row;
- enumerating all existing CSS selectors.

---

### F2 — Renderer, scene-lifecycle and camera architecture

**Status:** FRONTIER RESERVED  
**When:** after F1, before the Africa build becomes structurally committed

#### Question

What rendering architecture gives Atlas the continuous spatial experience with the lowest long-term complexity and acceptable mobile/PWA risk?

#### Required decisions

- Three.js/R3F vs MapLibre globe vs a narrower alternative;
- whether `three-globe` is prototype-only or acceptable behind an adapter;
- persistent scene ownership and mount lifecycle;
- React/renderer boundary;
- semantic `CameraDirector` contract;
- camera state vs route state boundary;
- interruptible transition strategy;
- picking model;
- DOM label/anchor strategy;
- render-on-demand policy;
- renderer failure/fallback architecture;
- StrictMode/WebGL lifecycle handling;
- bundle/lazy-loading boundary.

#### Inputs must already exist

Tier S should prepare a decision packet containing:

- current React root/StrictMode ownership;
- current route-state lifecycle;
- current map runtime architecture;
- dependency/API findings for candidate renderers;
- known current browser/mobile risks;
- rough bundle costs where measurable;
- small throwaway spikes only where they answer a concrete architecture question.

#### Durable output

One renderer ADR/decision section with rejected alternatives and explicit invariants.

---

### F3 — Canonical spherical geography and LOD contract

**Status:** FRONTIER RESERVED FOR DESIGN; implementation delegated  
**When:** before production-quality spherical asset generation

#### Question

How should the existing canonical Natural Earth pipeline expose spherical geography without creating a second geography system or wasting mobile resources?

#### Frontier responsibilities

- define the generated globe-asset contract;
- decide LOD boundaries and switching semantics;
- decide what remains canonical geographic data vs presentation metadata;
- define region grouping/picking representation;
- define bounds/centroid/camera-fit metadata policy;
- define acceptable authored camera overrides;
- define how unsupported but visible geography is represented;
- preserve geopolitical/source provenance.

#### Delegate after decision

Tier S/M should implement:

- generator plumbing;
- simplification settings;
- generated outputs;
- deterministic verifiers;
- payload measurement;
- fixture updates.

Tier F returns only if generated evidence demonstrates that the approved contract is structurally wrong.

---

### F4 — Africa vertical slice: first integrated build

**Status:** FRONTIER RESERVED  
**When:** after F1–F3 have enough definition to avoid blind experimentation

This is the highest-value implementation session.

#### Mission

Build the smallest **real** experience capable of testing the product thesis:

```text
Mode
→ World
→ Africa
→ West Africa
→ Back to Africa
→ Back to World
```

#### Why this remains frontier work

The hard part is not drawing a globe. It is integrating:

- scene lifecycle;
- generated geography;
- camera choreography;
- route interpretation;
- pointer selection;
- real DOM controls;
- mobile gestures;
- interruption;
- reduced motion;
- Atlas visual hierarchy;
- graceful fallback;

into one interaction that actually feels coherent.

That integration establishes the pattern that every later spatial surface would inherit.

#### Frontier authority

The principal model may refactor prototype-only code aggressively, discard failed approaches and revise F1/F2 decisions where direct implementation evidence justifies it.

It may **not** casually alter:

- learning/scoring semantics;
- persistence namespaces;
- achievement rules;
- canonical geography policy;
- production routing contracts.

#### Support around this session

Tier S can prepare before the session:

- dependencies installed on the exploration branch;
- initial generated globe fixture;
- test harness;
- benchmark harness;
- exact relevant-file map;
- existing route/action adapters;
- clean baseline test results.

Tier S can clean up after the session:

- types;
- narrow regressions;
- deterministic tests;
- bundle reporting;
- code comments/docs.

Do not let support cleanup quietly redesign the spatial architecture.

---

### F5 — Interaction/design refinement pass

**Status:** FRONTIER RESERVED  
**When:** after the first traversal works end-to-end

A functional prototype is not yet a successful prototype.

#### Question

Does the interaction actually feel like one spatial instrument, or merely like ordinary screens attached to a spinning globe?

#### Frontier responsibilities

Refine:

- camera duration/easing/distance;
- globe inertia;
- selected-continent emphasis;
- region-control placement/hierarchy;
- relationship between DOM controls and geography;
- progressive disclosure;
- visual quietness;
- transition into/out of activity mode;
- mobile thumb reach and obstruction;
- interruption behaviour;
- reduced-motion equivalence;
- perceptual continuity of Back.

This session should prefer deletion and simplification over accumulating effects.

#### Evidence required first

Support models should provide:

- screenshots/video captures where available;
- measured frame/render timings;
- interaction test results;
- bundle/payload results;
- known glitches;
- concise implementation map.

Do not spend the frontier session discovering basic failures that support models could have catalogued first.

---

### F6 — Independent prototype review and go/no-go decision

**Status:** FRONTIER RESERVED — fresh context strongly preferred  
**When:** after F5 and support validation

This should not simply be the original builder congratulating its own work.

Use a fresh frontier session/model context where practical.

#### Review question

Is the spatial architecture genuinely better Atlas, or is it an impressive technical demo that adds friction/cost?

#### Judge against

- geographic coherence;
- navigation clarity;
- delight without spectacle;
- one-handed mobile usability;
- speed;
- accessibility;
- Back/Forward behaviour;
- startup/bundle burden;
- renderer stability;
- maintainability;
- compatibility with existing learning mechanics;
- whether a simpler 2D continuous-map solution would capture most of the value.

#### Allowed outcomes

1. **PASS — pursue persistent 3D spatial shell.**
2. **NARROW — retain continuous spatial IA but use a simpler renderer/2D implementation.**
3. **PARTIAL — use the globe for world/continent navigation only.**
4. **REJECT — current launcher remains preferable.**

A rejection is a successful experiment if the evidence is good.

#### Durable output

Commit a go/no-go decision and rationale before any production migration begins.

---

### F7 — Production migration architecture

**Status:** FRONTIER RESERVED, conditional on F6 PASS/PARTIAL/NARROW  
**When:** only after prototype decision

#### Question

What is the smallest safe production architecture that preserves the successful prototype qualities without turning experimental code into permanent debt?

#### Frontier responsibilities

- determine what prototype code survives vs is rewritten;
- define production `SpatialAtlas` interfaces;
- define rollout sequence;
- define route transition compatibility;
- define fallback ownership;
- define activity integration boundaries;
- define test/verification strategy;
- identify which current screens can be retired and when;
- define PWA/offline asset policy;
- define rollback boundaries.

After this decision, much of implementation becomes Tier S work.

---

### F8 — Exceptional cross-system failures / final architecture review

**Status:** FRONTIER ON DEMAND

Do not reserve a frontier model for every bug.

Escalate only failures that expose a likely architecture defect, for example:

- renderer lifecycle and React routing cannot coexist cleanly;
- mobile gesture ownership produces unavoidable conflicts;
- LOD switching undermines picking/visual continuity;
- WebGL fallback requires a different scene ownership model;
- deep links and camera transitions create conflicting state semantics;
- production integration produces widespread architectural leakage.

Routine implementation bugs remain Tier S/M.

## 5. Delegated workstreams

The following work is important, but its importance does not make it frontier work.

### S1 — Repository reconnaissance

Produce concise, cited maps of:

- routing files;
- launcher actions;
- React ownership;
- map generator/runtime;
- gesture code;
- PWA/service worker;
- relevant tests;
- current bundle/chunk structure.

Output should be a handoff packet, not an essay.

### S2 — Candidate renderer research

Answer concrete questions for F2:

- supported React version;
- camera APIs;
- touch behaviour;
- on-demand rendering;
- context recovery;
- bundle characteristics;
- documented limitations;
- relevant current issues.

Do not decide the architecture unless explicitly delegated.

### S3 — Baseline measurements

Capture before the prototype:

- production bundle sizes;
- lazy geography payload sizes;
- startup behaviour;
- current launcher interaction baseline;
- existing mobile/browser tests.

These become comparison evidence for F6.

### S4 — Globe generator implementation

After F3:

- extend canonical generation;
- produce LOD assets;
- preserve ISO3/provenance;
- add deterministic tests;
- report payload sizes.

### S5 — Test harness and instrumentation

Create:

- route-transition tests;
- camera-destination unit tests where sensible;
- Playwright interaction tests where WebGL permits reliable assertions;
- reduced-motion coverage;
- renderer-failure fallback coverage;
- performance instrumentation/reporting.

### S6 — Support implementation around F4/F5

Examples:

- typed adapters;
- DOM controls;
- fixture cleanup;
- test stabilization;
- build/PWA wiring;
- error handling;
- debug overlays that do not ship.

### S7 — Validation and evidence collection

Run:

- `npm test`;
- production build inspection;
- bundle comparison;
- browser smoke tests;
- offline behaviour checks;
- accessibility checks possible in automation.

Never claim physical-device testing unless it was actually performed.

### S8 — Mechanical expansion

Only after architecture is accepted:

- additional continents;
- region metadata generation;
- repeated camera-fit fixtures;
- documentation/index updates;
- repeated regression coverage.

Do not spend frontier sessions copying Africa's approved pattern to six continents.

## 6. Frontier session handoff standard

A frontier session should begin with a **small, high-signal packet**, not an unfiltered repository dump.

Each packet must contain:

### Mission

One sentence describing the decision/build the session owns.

### Authority

What the model is allowed to redesign.

### Invariants

What it must preserve.

### Current truth

Only the relevant architecture/product facts.

### Evidence

Support research, measurements and failed experiments condensed to decision-relevant form.

### Relevant files

A precise file list, preferably fewer than ~15 primary files to read first. The model may inspect more as needed.

### Open questions

The small number of questions the session must resolve.

### Required durable outputs

The code/docs/tests/ADR expected before the session is considered complete.

### Stop conditions

Conditions under which the model should reject the planned approach rather than force implementation.

## 7. Context-budget rules

### Rule 1 — start fresh at architectural boundaries

Do not carry an enormous prototype-debugging conversation into the independent review or production-architecture phase.

Recommended clean-session boundaries:

```text
F1 + F2           principal architecture
F4                integrated Africa build
F5                refinement (may continue F4 if context remains clean)
F6                fresh independent review
F7                fresh production architecture
```

### Rule 2 — summarise failed experiments durably

When an experiment fails, record:

- what was tried;
- why it failed;
- evidence;
- whether the path is rejected or merely deferred.

Do not make future frontier sessions reread pages of raw debug history.

### Rule 3 — support models return evidence, not sprawling prose

Prefer:

```text
Finding
Evidence
Implication
Open question
```

over giant narrative reports.

### Rule 4 — no architecture drift during delegation

Every support task should name the architectural contract it is implementing.

If the task cannot be completed without changing that contract, stop and escalate.

### Rule 5 — frontier output becomes repository truth

Once a frontier decision is accepted, commit it to the relevant `docs/open`/architecture document. Do not rely on remembering which chat contained the decision.

## 8. Suggested execution order

```text
S1  Repo reconnaissance ──────────────┐
S2  Renderer research ────────────────┤
S3  Baseline measurements ────────────┤
                                      ↓
                              F1  Product/UX contract
                                      ↓
                              F2  Renderer/camera ADR
                                      ↓
                              F3  Spherical-data contract
                                      ↓
S4  Generator implementation ────────┐
S5  Harness/instrumentation ─────────┤
                                      ↓
                              F4  Africa integrated build
                                      ↓
S6  Support cleanup/testing ─────────┐
S7  Evidence collection ─────────────┤
                                      ↓
                              F5  Interaction refinement
                                      ↓
S7  Final prototype evidence ────────┐
                                      ↓
                              F6  Independent go/no-go
                                      ↓
                            if approved
                                      ↓
                              F7  Production architecture
                                      ↓
                         Tier S/M implementation rollout
                                      ↓
                              F8 only when necessary
```

## 9. Frontier budget summary

If premium usage is constrained, spend it in this order:

| Priority | Frontier task | Why it deserves premium reasoning |
| --- | --- | --- |
| 1 | **F4 Africa integrated build** | establishes whether the core interaction can actually work |
| 2 | **F1 spatial product/interaction contract** | prevents technically impressive but product-wrong implementation |
| 3 | **F2 renderer/camera architecture** | foundational technical decision copied by everything downstream |
| 4 | **F6 independent go/no-go** | prevents sunk-cost production migration |
| 5 | **F5 interaction refinement** | turns a functioning demo into a credible product test |
| 6 | **F7 production architecture** | high leverage only if the prototype succeeds |
| 7 | **F3 geography/LOD design** | important design decision; implementation itself should be delegated |
| 8 | **F8 exceptional failures** | use only when evidence suggests a foundational problem |

If only a handful of maximum-intelligence sessions are available, protect **F1/F2, F4, F6 and F7** first.

## 10. Anti-patterns

Avoid:

- assigning Opus/Sol to every task because the project is important;
- giving a frontier model an unprepared repository and paying it to rediscover known facts;
- allowing support models to invent parallel architectures for convenience;
- having multiple agents independently implement competing foundations without a specific comparison question;
- spending a whole premium context on test cleanup after the principal design is settled;
- confusing code volume with reasoning difficulty;
- keeping crucial design decisions only in chat history;
- forcing a frontier model to continue an approach after prototype evidence says it is wrong;
- using the same long context for builder and supposedly independent reviewer.

## 11. Immediate next step

Do **not** start F4 yet.

First prepare the handoff for **F1/F2** using delegated work:

1. exact repository architecture map relevant to the spatial shell;
2. current launcher/routing/gesture contracts;
3. renderer candidate research with current versions/risks;
4. canonical geography generator entry points and constraints;
5. current build/bundle/mobile baseline;
6. a short list of unresolved decisions requiring principal judgement.

Once that packet is committed, a frontier principal should be able to begin by reading the issue, the two #119 documents and a small set of authoritative repo files — and spend its context designing Atlas rather than rediscovering Atlas.
