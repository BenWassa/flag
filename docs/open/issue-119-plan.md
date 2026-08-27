# Issue #119 — Spatial Atlas: plan of record

**Status:** exploration active. No renderer selected. No production commitment.
**Issue:** [#119](https://github.com/BenWassa/flag/issues/119)
**Branch:** `explore/spatial-atlas-moonshot`
**Scope of record:** [`issue-119-spatial-atlas-moonshot.md`](issue-119-spatial-atlas-moonshot.md)
**Acceptance criteria:** [`issue-119-prototype-verification-plan.md`](issue-119-prototype-verification-plan.md)

This document is the single canonical plan for #119. It replaces three
overlapping planning documents now archived in `docs/closed/`:
`issue-119-llm-execution-plan.md`, `issue-119-pre-opus-handoff.md` and
`issue-119-principal-handoff.md`. Where this document and an archived one
disagree, this one wins.

It exists because the previous planning set had grown to roughly 2,600 lines of
prose whose stated purpose was to *save* a principal session's context. That is
self-defeating: the handoff packet became larger than the repository
archaeology it was written to replace, and one of the archived documents
already told its reader that two of the others need not be read.

---

## 1. The hypothesis, stated so it can fail

Everything in #119 tests one claim:

> Moving through Atlas as a continuous geographic space is materially easier
> to understand and more pleasant to use, on a real phone, than tapping
> through discrete launcher rows — and that gain is worth a persistent
> renderer, a second geography output and a new presentation architecture.

That claim contains **two separable propositions**, and the previous plan
tested them only as a bundle:

| | Proposition | Cheapest honest test |
| --- | --- | --- |
| **H1** | *Continuity* wins — navigation that moves through geography beats navigation that replaces screens. | 2D, existing production assets, no renderer. |
| **H2** | *The sphere* wins — a rotatable Earth adds orientation value that a continuous 2D hierarchy cannot. | Requires a globe. |

H1 is the load-bearing claim. If H1 is false, H2 cannot rescue it — a globe
that navigates badly is still bad navigation. If H1 is true, H2 becomes a
genuine question worth spending a renderer on, and the answer might still be
Outcome C (2D spatial shell) rather than Outcome A.

**The previous plan sequenced these backwards.** It built the expensive H2
apparatus first and asked the F6 reviewer, at the very end, "would a simpler 2D
continuous-map solution have captured most of the value?" That question is
cheap to answer *first* and expensive to answer *last*. See §4, Stage 1.

---

## 2. Who decides, and how

This is the largest gap in the previous plan and the reason it could have run
indefinitely.

The success criterion has always been written as *"materially better on an
actual phone-sized experience"*. Every gate, spike, verification table and
evidence class was then specified in detail — but **no document named the
judge, the device, or the script**. A fresh frontier review session (F6) cannot
supply this: it will see the prototype through screenshots and CI logs, which
is precisely the evidence class the verification plan forbids treating as
physical-device proof.

### The judgement protocol

**Judge:** Ben, holding a physical phone. Not an agent, not a screenshot, not a
Playwright mobile viewport. Agents produce the technical gates; the product
gate (Gate G) is a human taste judgement and is recorded as one.

**Device:** the same physical Android/iOS handsets already blocking [#71](https://github.com/BenWassa/flag/issues/71),
including the installed PWA. #71 and #119 should share one device session
rather than each waiting on its own.

**Script — run against production Atlas first, then the prototype, in that order:**

1. Cold-open. Choose Flags.
2. Reach West Africa Play-ready state. Count taps, note hesitation.
3. Start a round, answer three, leave mid-round.
4. Back out to Africa. Back out to world/domain level.
5. Switch to Outlines. Reach Southern Africa.
6. Repeat step 2 four more times, as a returning learner would.
7. One-handed throughout, thumb only, standing.

**Recorded verdict, per side:** faster / same / slower; clearer / same / less
clear; would-use-daily yes/no; and the single worst moment.

Step 6 matters most and is easy to skip. Camera choreography that delights on
the first traversal is the classic thing that becomes friction on the
fifteenth. A prototype that wins step 2 and loses step 6 has failed.

### What this changes about F6

F6 remains a useful independent architecture and evidence review, but it is
**no longer the go/no-go authority for Gate G**. It reviews everything except
whether the thing feels better; that verdict comes from the device session and
is recorded before F6 runs, so F6 cannot rationalise around it.

---

## 3. Correction to the evidence position

The renderer comparison gate was marked **GREEN** for the principal review. On
inspection, the evidence underneath it is not decision-ready, and the gate has
been downgraded to **AMBER** in
[`issue-119-renderer-comparison.md`](issue-119-renderer-comparison.md). Three
problems, in order of severity.

### 3.1 The two spikes did not attempt the same task

The R3F spike rendered **one centre mesh and no geography at all** — its own
report states "no geography dataset was included in this renderer
measurement". The MapLibre spike attempted **real local GeoJSON through a real
style**. The comparison table then scores them side by side:

- *"Feature/geography picking → same action"*: R3F **PASS (minimal mesh)**,
  MapLibre **FAIL**.

R3F passed a picking test on a sphere. MapLibre failed a picking test on
country polygons. Those are not the same test, and the table's own qualifier —
"(minimal mesh)" — is doing more work than a reader will give it. A principal
model reading the summary table sees R3F with zero FAIL rows and MapLibre with
four, and that framing is unearned.

### 3.2 MapLibre's central failure is environment-confounded and known to be

Both MapLibre FAIL rows trace to one cause: the local source and style stayed
unloaded under headless SwiftShader, in both dev and preview, **with no
MapLibre error emitted**. The spike report says so plainly and instructs that
it be reproduced "in a headed desktop browser and physical Android/iOS
hardware before treating it as a MapLibre product constraint rather than a
SwiftShader/headless limitation."

That instruction was correct and was then not followed — the reconciliation
declared GREEN with the caveat recorded rather than resolved. A silent blank
canvas in software-rasterised headless Chromium is a routine headless artifact,
not evidence about MapLibre. The two candidates also ran on different Node
versions (22.23.2 vs 24.11.1), different runners (GitHub Actions vs local) and
different base SHAs.

**Required before F2:** re-run the MapLibre spike headed — a real Chromium
window, or headless with hardware/ANGLE GL — and either reproduce the blank
source or clear it. This is a support task of perhaps an hour. Until it lands,
no F2 renderer decision may cite the MapLibre FAIL rows.

### 3.3 The bundle comparison flatters R3F

243,166 vs 248,535 gzip bytes reads as parity. It is not a like-for-like
figure:

- MapLibre's 248 KB **includes** a complete GeoJSON source/layer pipeline,
  feature picking, projection and camera system.
- R3F's 243 KB **excludes** all of that. Atlas would still need to add the
  spherical geometry payload (measured envelope ~53–82 KB gzip for four
  continents, per [`issue-119-geometry-lod-experiment.md`](issue-119-geometry-lod-experiment.md))
  *plus* Atlas-authored tessellation, picking, label anchoring and LOD-switching
  code that MapLibre supplies.
- MapLibre additionally carries 10,456 gzip bytes of CSS that R3F does not.

The principal handoff correctly warned "do not compare a new renderer's lazy
chunk to an invented zero-cost baseline." The same discipline was not applied
between candidates. The honest statement is that **R3F's true delivered cost is
not yet measured**, and the gap is not 5 KB.

### 3.4 One smaller over-read

R3F issue [#3863](https://github.com/pmndrs/react-three-fiber/issues/3863)
(StrictMode Canvas context loss) is scored **PASS** on the strength of a single
1.4-second headless observation window. The spike report itself is appropriately
hedged; the comparison table is not. Treat this as *did not reproduce in one
narrow observation*, which is weaker than PASS, and keep the architectural
preference for avoiding ordinary Canvas remounts regardless.

---

## 4. Revised sequence

The stage numbering is new. F-numbers are kept where they map cleanly onto the
archived plan so existing issue comments stay readable.

### Stage 0 — Baseline capture *(support + device session)*

Capture what the prototype must beat, **before** anything is built to beat it.

- Run the §2 script against production Atlas on physical hardware. Record it.
- Capture video of the current launcher traversal for later side-by-side.
- Pull the interaction/motion baseline from [#118](https://github.com/BenWassa/flag/issues/118)
  if that audit runs first; #118's mobile-ergonomics and motion-timing lenses
  produce exactly this artifact and the two issues should not duplicate it.

Without Stage 0 there is no honest comparison later, only memory.

### Stage 1 — Continuity probe, no renderer *(H1 gate)*

**This stage is new and is the highest-value change to the plan.**

Build a throwaway continuous-navigation prototype using **existing production
2D geography** — the projected `MapRegionAsset` paths, the existing viewport
maths and the camera-fit/focus metadata already shipped through #112/#115/#116.
No globe, no new renderer, no generator work, no spherical assets.

It must do exactly one thing: make domain → continent → region → Play → back
feel like continuous movement through one geographic surface rather than screen
replacement.

Then run the §2 script on a phone.

| Outcome | Action |
| --- | --- |
| **Continuity clearly wins** | H1 holds. Proceed to Stage 2 and ask whether the sphere adds enough on top. Outcome C is now a live, cheap fallback with a working prototype behind it. |
| **Continuity feels neutral or worse** | H1 fails. Stop. Close #119 as Outcome E with real evidence, and reconsider [#104](https://github.com/BenWassa/flag/issues/104) on its own merits. No renderer was spent. |
| **Mixed — better for selection, worse in repetition** | Outcome B/D territory. Narrow scope before spending a renderer. |

The cost of Stage 1 is small because Atlas already owns every asset it needs.
The cost of skipping it is the entire renderer, geometry-pipeline and
integration budget spent before learning something a week of 2D work would have
told you.

### Stage 2 — Repair the renderer evidence *(support)*

Only if Stage 1 passes.

1. Headed MapLibre re-run (§3.2). Blocking.
2. R3F spike extended to load real Africa geography and pick a real country
   polygon, so the picking and payload rows compare like with like (§3.1, §3.3).
3. Update `issue-119-renderer-comparison.md`; move AMBER → GREEN only when both
   land.

### Stage 3 — F1 + F2, principal *(architecture decision)*

Spatial interaction contract and renderer/scene/camera architecture, as scoped
in the archived plan. Entry packet in §6. Durable ADR committed before any
broad implementation.

**Added to F1's required scope** — see §5.

### Stage 4 — F3 contract, delegated implementation

Spherical geography/LOD contract designed by the principal; generator plumbing,
verifiers and payload measurement delegated.

### Stage 5 — F4 Africa vertical slice *(principal)*

`Mode → World → Africa → West Africa → back`, built deeply enough to judge.

### Stage 6 — F5 refinement, then device verdict, then F6 review

Refine, **then run the §2 device script**, then F6 reviews architecture and
evidence against a verdict it did not produce.

### Stage 7 — F7 production architecture

Only on PASS / NARROW / PARTIAL.

---

## 5. First-order questions the previous plan deferred too late

### 5.1 Locations vs the globe — belongs in F1, not "Phase 9"

The archived plan defers "Locations engine decision" to Phase 9, after the
whole shell is built. That is too late, because Locations is the one domain
whose *own* dominant learning object is already a map.

A persistent globe behind a Locations map is two maps at once. Either:

- Locations eventually **merges into** the globe — in which case the globe
  needs country-accurate picking and precision at region scale, which the
  world/continent LOD policy explicitly disclaims ("world LOD does not need
  every microstate to remain a truthful tappable target"); or
- Locations **stays separate** — in which case the shell must define how it
  visually recedes for one domain out of four, and the "continuous" claim has a
  permanent seam in it.

Both answers change the LOD contract and the scene architecture. F1 must pick
one, at least provisionally, before F3 fixes the geometry contract.

### 5.2 #104's status must resolve at Stage 1, not at F6

[#104](https://github.com/BenWassa/flag/issues/104) is deferred and open, and
#119 says it would "likely become a child/subset". Stage 1 answers this
directly: a continuous 2D prototype *is* substantially the #104 design space.
Whichever way Stage 1 goes, #104 stops being indefinitely deferred.

Note that #104's blocker is a **locked product decision**, not effort: it
encodes progress in region colour alone, which
[`../product/colour-system.md`](../product/colour-system.md) forbids. Stage 1
must not quietly reintroduce colour-only state to make geography look
informative.

### 5.3 Achievement ceremony overlaps #34

The scope doc gives the spatial shell a role in region/continent/world
completion ceremony. #34's remaining open art work owns the same surface. Name
the boundary before either is built, or they will collide.

---

## 6. Budget and kill criteria

The previous plan had seven quality gates, five allowed outcomes and ten stop
conditions — and no cost ceiling and no expiry. Quality gates alone cannot stop
a project; they can only be re-attempted.

**Assumption, stated for correction:** the constraint is principal-session
count, not calendar time.

| Stage | Principal sessions budgeted | On exhaustion |
| --- | ---: | --- |
| Stage 1 continuity probe | 0 (support-buildable) | If it needs a principal session, that is itself a signal the idea is not simple enough. |
| Stage 3 (F1 + F2) | 1 | Split into two only if the renderer evidence is genuinely balanced after Stage 2. |
| Stage 5 (F4 Africa slice) | 2 | If no device-judgeable artifact exists after 2, default to **NARROW or REJECT**. Do not extend by default. |
| Stage 6 (F5 + F6) | 1 + 1 fresh | — |
| Stage 7 (F7) | 1 | — |

**Default outcome on budget exhaustion is Outcome E (retain current
launcher).** Not "pause", not "carry over" — the exploration returns a
negative result, which the scope doc already and correctly calls a successful
outcome.

Adjust the numbers freely; the thing that matters is that a number exists.

### Hard stops, unchanged from the scope doc

Stop and report rather than scaling the pattern if: renderer cost makes the
mobile PWA materially worse; native Back and globe manipulation cannot coexist;
accessibility needs a parallel interface so dominant the globe becomes
decoration; route truth starts being duplicated into an animation state
machine; canonical geography needs a second source; the best Africa interaction
is still slower than the v1 launcher after real refinement; or the architecture
needs unrelated scoring/storage/mastery changes to justify itself.

---

## 7. Model tiering, condensed

The archived execution plan's tiering was sound and is kept in compressed form.
Assign by **decision leverage**, never by code volume.

**Frontier (principal):** F1 interaction contract · F2 renderer/scene/camera
architecture · F3 geometry contract *design only* · F4 Africa slice · F5
refinement · F6 independent review · F7 production architecture. A task
qualifies only if it sets a precedent others copy, spans several of
rendering/routing/cartography/React lifecycle/gestures/PWA/accessibility,
requires product taste, is expensive to reverse, or holds go/no-go authority.

**Support:** repository reconnaissance · library research · runtime spikes ·
generator implementation from an approved contract · tests, harnesses and
instrumentation · measurement · continent rollout after the pattern is proven.

**The one rule that must not bend:** support may report that a frontier
decision is unimplementable, and must escalate it. Support may **not** quietly
redesign it, and may not convert preliminary evidence into architecture. §3 of
this document is what that failure looks like in practice — a support-tier
reconciliation that turned an environment artifact into a scored FAIL against
one candidate and marked the gate green.

---

## 8. Principal entry packet

A principal session should open with this and little else:

**Read, in order:** live issue #119 · `CLAUDE.md` · `DESIGN.md` ·
`.impeccable/design.json` · this document ·
[`issue-119-spatial-atlas-moonshot.md`](issue-119-spatial-atlas-moonshot.md) ·
[`issue-119-renderer-comparison.md`](issue-119-renderer-comparison.md) ·
[`issue-119-geometry-lod-experiment.md`](issue-119-geometry-lod-experiment.md) ·
[`issue-119-prototype-verification-plan.md`](issue-119-prototype-verification-plan.md).
The two spike reports are linked from the comparison; read them only where the
comparison is contested. Archived material in `docs/closed/` is for tracing a
fact, not for reading through.

**Facts not to rediscover:** React 19 + Vite on `main`; ISO3 country identity;
hash history is authoritative and Back/Forward stays native; quiz internals are
ephemeral session state; `AtlasApp` is the presentation/orchestration seam;
canonical cartography is pinned Natural Earth 1:10m and the generator reconciles
Atlas identity *before* projection, so a spherical branch needs no second
dataset; existing `MapRegionAsset` SVG paths are projected outputs, not
spherical source; North America and Oceania are honest shells; the left-edge
Back gesture starts only within a 28 CSS px gutter and yields to map viewports;
deployed baseline is ~98 KB gzip core `app.js` with lazy continent geography at
242/241/432/493 KB gzip for Africa/South America/Europe/Asia.

**Do not casually reopen:** ISO3 identity · Natural Earth provenance and
geopolitical policy · storage namespaces · learning/evidence/scoring semantics ·
earned Mastery semantics · Firebase behaviour · stable route compatibility ·
Back/Forward ownership · British English · semantic colour roles · existing
domain-native quiz mechanics. Escalate a genuine conflict; do not smuggle an
unrelated migration into the prototype.

**Required durable output before broad implementation:** an ADR recording the
chosen renderer and the evidence that decided it, the rejected renderer and
what outweighed its advantages, scene lifecycle, route → spatial destination
model, camera interruption and reduced-motion model, DOM accessibility and
picking model, globe asset/LOD model, mobile gesture ownership, fallback
strategy, and the smallest Africa slice that can falsify the hypothesis.

---

## 9. What is genuinely strong in this plan and should be preserved

So the corrections above are not mistaken for a verdict on the whole:

- **Preservation boundaries are correctly and completely identified.** Routing,
  identity, cartography provenance, storage, learning semantics, colour roles,
  British English. Very little moonshot scoping gets this right.
- **Accessibility is first-class, not an afterthought.** DOM-first semantics,
  keyboard operability, reduced motion, non-colour state cues, focus
  restoration — specified before implementation rather than retrofitted.
- **Gesture ownership is specified against a real existing contract**, including
  the 28 px Back gutter, rather than assumed.
- **The refusal to let support tiers select the renderer** is exactly right,
  even though §3 shows the boundary leaked in practice.
- **The LOD experiment is real, reproducible evidence** (`scripts/experiments/spatial-lod-envelope.mjs`)
  that settled a genuine question and found the microstate distortion problem
  before it could become a late surprise.
- **Five graded outcomes with rejection named as success.** Most exploration
  plans have one outcome and a hope.
- **"A technically functioning spinning globe is not sufficient"** is stated
  early and repeatedly. The plan never confused the demo with the product.
