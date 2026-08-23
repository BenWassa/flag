# Issue 78 — Locations Play feedback and initial map framing

GitHub issue: [#78 — Make Locations Play feedback explicit and tune initial map framing](https://github.com/BenWassa/flag/issues/78)

Implementation branch: `issue-78-locations-play-feedback`

Pull request: [#81 — Issue #78: explicit Locations Play feedback](https://github.com/BenWassa/flag/pull/81)

## Status

Implemented end to end on the dedicated branch and left unmerged for review.

The learner-facing feedback defect is fixed. The scope-framing audit found that the existing generated `initialFocus` data and viewport controller already satisfy the issue's anti-leak and scope-based framing requirements across the required Africa scope/viewport matrix, so no cartography regeneration or geometry edit was justified.

The implementation was verified in GitHub Actions on Node 22 and against the exact uploaded production `dist` artifact. No manual browser or physical-device testing was performed, and none is claimed here.

---

## Starting point and issue constraints

Work started from `main` at:

`431f42e5e86ac3b4cc421f3b4509a71eb8811ac6`

Issue #78 was treated as the authoritative specification. The relevant map, feedback, design and mobile-interaction code/docs were inspected before implementation, including the shared Play feedback work from #60/#64, the Locations map renderer/controller, the map viewport controller, map CSS/cartography ownership and the canonical map-generation path.

The implementation deliberately preserved these boundaries:

- Locations scoring remains owned by the existing map-game engine;
- learning evidence and mastery semantics are unchanged;
- location progress/storage schemas and persistence are unchanged;
- Learn's three-attempt/reveal behaviour is unchanged;
- routes and active-round semantics are unchanged;
- pinch/pan and bounded zoom remain owned by `src/map-viewport.ts`;
- saved viewport state remains keyed per session and wins over initial scope focus after interaction;
- generated map geometry was not hand-edited;
- no second topology/cartography system was introduced;
- initial framing never depends on the current target country.

---

## Confirmed root cause

The issue's pre-implementation diagnosis was correct.

Locations Play was not merely using feedback that was visually too subtle. The implementation explicitly suppressed correctness in Play:

- `src/ui/views/map-quiz.ts` only enabled map feedback in Learn;
- Play rendered the neutral `Answer recorded` message;
- `src/ui/components/map.ts` presented a neutral `.map-country--recorded` state rather than semantic correct/wrong outcome states;
- `src/state/locations-round.ts` announced `Location recorded.` for Play;
- resolved Play answers auto-advanced after only **180 ms**.

That combination meant the learner was intentionally denied clear correctness information until the results screen, and the neutral acknowledgement was visible for too little time to function as useful feedback.

---

## Implementation

### 1. Reused the shared #60/#64 feedback architecture

Locations now adopts the existing cross-domain Play outcome vocabulary instead of creating a Locations-specific feedback system.

`src/ui/views/map-quiz.ts` imports and uses:

- `answerFeedback(...)` from `src/domain/round-feedback.ts`;
- `answerFeedbackPanel(...)` from `src/ui/components/round-feedback.ts`.

This gives Locations the same learner-facing semantic contract already used by Flags:

- correct answer: `Correct`;
- wrong answer: `Not quite`;
- wrong answer detail: `Answer: {country}`.

The shared helper remains presentation-only. The Locations map engine still determines whether an attempt is correct, which country was selected, whether the target is resolved and what evidence is recorded.

No second score or answer-feedback model was added.

### 2. Immediate correct feedback in Play

After a correct map tap, the same resolved render now shows both:

- explicit textual `Correct` feedback through the shared panel;
- the existing high-salience semantic correct map treatment on the target country.

The correct geography uses the existing semantic correct-green family rather than mastery purple or prestige gold.

The outcome is therefore understandable in words and geography, not colour alone.

### 3. Immediate wrong feedback in Play

After a wrong map tap, the same resolved render now shows:

- explicit `Not quite` copy;
- `Answer: {target country}`;
- a persistent semantic wrong state on the country the learner selected;
- a restrained semantic correct indication on the actual target, but only after the answer has been resolved.

A dedicated `.map-country--current-wrong` presentation was introduced for the resolved Play dwell. It uses the existing wrong colour system plus a dashed stroke cue so the meaning is not colour-only.

This is intentionally separate from the existing transient Learn wrong pulse. Learn keeps its current retry/reveal behaviour; Play gets a stable resolved wrong state long enough to study the correction.

### 4. Removed the ambiguous neutral acknowledgement

The learner-facing `Answer recorded` state is no longer used for Locations Play.

The former Play-only neutral `.map-country--recorded` path was removed from the active Locations feedback flow. Correctness is now explicit immediately after scoring.

The old spoken `Location recorded.` announcement was also replaced by outcome-aware feedback.

### 5. Replaced the 180 ms advance with outcome-aware dwell

`src/state/locations-round.ts` now uses separate Play dwell constants:

- **620 ms** for a correct Play answer;
- **1500 ms** for a wrong Play answer.

The values were chosen to preserve rapid Play while giving the map state and corrective text enough time to register. Wrong answers receive materially longer orientation time than correct answers.

Learn's existing timing remains unchanged.

### 6. Locked further answer taps during the resolved dwell

Once the current Play target has been resolved, map answer controls are no longer emitted until the round advances.

This prevents accidental double input during the new, longer feedback dwell without adding a permanent `Next` button or changing the recorded result.

### 7. Preserved the anti-leak rule

Before submission, Play still renders no target-specific correctness cue.

The implementation verifies that an unanswered Play round contains neither semantic correct nor wrong outcome states.

The correct target is only highlighted after the learner has committed the one scored Play tap.

### 8. Preserved accessibility and reduced-motion behaviour

The semantic outcome is present in text (`Correct` / `Not quite`) and not only in colour.

Wrong-map feedback also uses a non-colour dashed-stroke distinction.

Existing reduced-motion handling remains in force; the semantic states remain visible when animation is disabled.

The existing persistent live-region architecture remains the announcement owner rather than adding another competing live region inside the re-rendered feedback component.

### 9. Audited initial scope framing rather than forcing more zoom

The current framing path was traced through:

- generated `initialFocus` values on map assets;
- `src/map-viewport.ts` `continentBox(...)` / `regionBox(...)` behaviour;
- actual viewport-aspect fitting and clamping;
- per-session saved viewport restoration.

The key result is that the existing architecture is already correctly scope-driven:

- continent scope opens from the continent extent;
- region scope opens from the generated region `initialFocus`;
- focus is fitted to the actual viewport aspect;
- the opening box is clamped to the parent continent extent;
- once the learner pans/zooms, saved session state is restored on subsequent renders;
- current target country is not an input to the initial framing calculation.

The audit covered all six current Africa Locations scopes:

- Africa;
- North Africa;
- West Africa;
- Central Africa;
- East Africa;
- Southern Africa.

Each was exercised against the required viewport matrix:

- 320×568;
- 390×844;
- 768×1024;
- 844×390.

The current generated focus boxes remained valid and target-independent across this matrix. No concrete production-framing defect justified changing the canonical generator or regenerating map data, so the branch intentionally leaves geometry and generated focus data untouched.

This avoids solving a perceived zoom problem with arbitrary CSS scaling or target-centred framing that could leak answers.

### 10. Preserved map interaction state

The focused verifier now explicitly guards the existing session-state precedence in `src/map-viewport.ts`:

1. if saved viewport state exists for the current session, restore it;
2. otherwise use the scope-derived initial fit.

The production controller still contains:

- pointer-driven pan;
- pinch zoom;
- wheel zoom for appropriate desktop input;
- bounded maximum zoom;
- dynamic hit-target scaling;
- per-session viewport state.

No zoom toolbar was reintroduced.

### 11. Advanced the service-worker cache version

Because `map.css` changed, the existing shell-cache version convention was followed.

`public/sw.js` advanced from:

`flag-atlas-v26`

to:

`flag-atlas-v27`

The shell asset list itself remains consistent with the existing PWA architecture.

---

## Files changed

### `src/state/locations-round.ts`

- replaced neutral Play announcement semantics with explicit correct/wrong outcome feedback;
- removed the fixed 180 ms resolved Play advance;
- added 620 ms correct / 1500 ms wrong Play dwell;
- left Learn dwell and Learn resolution behaviour unchanged;
- kept store/map-game output authoritative.

### `src/ui/views/map-quiz.ts`

- imports the shared `answerFeedback(...)` helper;
- imports the shared `answerFeedbackPanel(...)` renderer;
- renders the shared feedback panel for resolved Play answers;
- removes the `Answer recorded` Play branch;
- leaves unanswered Play prompts and Learn feedback behaviour intact.

### `src/ui/components/map.ts`

- derives the current resolved Play attempt from the existing session attempt record;
- renders the true target with semantic correct state after resolution;
- renders a wrong selected country with a dedicated resolved wrong class;
- prevents additional map-answer controls once the current target is resolved;
- does not expose these states before submission;
- leaves generated geography/hit assistance untouched.

### `src/styles/map.css`

- replaces the active neutral recorded-answer presentation with explicit resolved wrong-country presentation;
- keeps the established correct-green state;
- adds a non-colour dashed cue for the wrong selected country;
- keeps forced-colours and reduced-motion coverage;
- does not add decorative UI or persistent map controls.

### `scripts/verify-play-feedback.mjs`

Extended the shared feedback verifier so Locations and Flags are checked against the same outcome vocabulary and presentation contract.

Coverage includes:

- immediate correct feedback;
- immediate wrong feedback;
- correct-answer identity after a miss;
- no neutral `Answer recorded` state;
- non-colour distinction;
- quiet Learn behaviour;
- outcome-aware Play dwell.

### `scripts/verify-map.mjs`

Updated the core Africa map verifier from the former neutral Test-feedback expectations to the new explicit Play contract while retaining all existing geography, storage, interaction and Learn regressions.

### `scripts/verify-map-v4-edge.mjs`

Expanded the focused edge verifier to cover:

- no pre-answer correctness leakage;
- immediate correct/wrong Play feedback;
- wrong selected country + true target after resolution;
- answer-locking during feedback dwell;
- no state leakage into the next target;
- six Africa scopes across the four required viewport sizes;
- generated focus staying inside the continent extent;
- target-independent initial framing;
- saved viewport state taking precedence over initial focus;
- pan/pinch/bounded zoom controller presence;
- production wrong-state CSS contract;
- service-worker cache version.

### `public/sw.js`

- advances the PWA cache to `flag-atlas-v27` because a shell stylesheet changed.

### `docs/open/issue-78-locations-play-feedback.md`

- this durable implementation/verification record.

### `docs/open/index.md`

- links Issue #78 and this implementation record while the PR remains open.

---

## Deliberately unchanged

The following were intentionally not modified as part of #78:

- `src/domain/map-game.ts` scoring rules;
- country evidence qualification;
- mastery rules;
- location progress record structure;
- location storage keys/versioning;
- active-round route semantics;
- Learn's multi-attempt/reveal scoring;
- canonical country IDs/naming;
- generated Africa path geometry;
- map topology/provenance;
- neighbour derivation;
- map-generation source data;
- current pinch/pan ownership;
- maximum zoom policy;
- persistent +/- zoom controls remain absent.

There was no migration because no persistent semantics changed.

---

## Verification evidence

### GitHub Actions

CI run: **32615382124**

Environment:

- Ubuntu 24.04 GitHub-hosted runner;
- Node **22.23.2**;
- npm 10.9.8.

Results:

- `npm install` — pass, 0 reported vulnerabilities;
- `npm run check` — pass;
- full `npm test` — pass;
- production build — pass;
- full verifier suite — pass;
- artifact upload — pass.

Relevant verifier output included:

- `Africa map verification passed: ... explicit feedback ...`;
- `Locations edge verification passed: small-country targets, explicit Play feedback, target-independent scope framing, viewport matrix, session pan/zoom persistence, and shell cache version.`;
- `Play feedback verification passed: shared Flags/Locations outcome model, immediate correct/wrong states, non-colour cues, quiet Learn, reduced motion, and outcome-aware dwell.`

The full suite also passed cartography, routing, IA, outline, neighbours, mobile gesture, learning-evidence, achievements, storage, British-English and action-feedback regressions.

### Exact production artifact

CI artifact:

- name: `flag-atlas-dist`;
- artifact ID: **9486772578**;
- archive size: 540235 bytes;
- SHA-256: `38306ae32b2d230cc715e1da62c24de784b19ba7291de4d5d5ffdfbe62cb02d0`.

That exact CI artifact was downloaded and inspected rather than relying on source-only output.

Inspection confirmed the production artifact contains:

- shared `answerFeedback` use in Locations;
- explicit `Correct` / `Not quite` feedback;
- no learner-facing `Answer recorded` path;
- no 180 ms Play advance path;
- 620 ms correct dwell;
- 1500 ms wrong dwell;
- semantic correct/wrong map states;
- the non-colour wrong-state cue;
- unchanged per-session viewport restoration;
- pinch/pan controller logic;
- bounded zoom;
- shell cache `flag-atlas-v27`.

The deterministic framing inspection was also run against the production code/data contract for all six Africa scopes at 320×568, 390×844, 768×1024 and 844×390. Initial scope focus remained identical when the current target country was changed, proving that framing is scope-based rather than target-based.

---

## Browser/device verification boundary

No manual browser/device validation was performed for this implementation.

In particular, this work does **not** claim:

- physical Pixel testing;
- physical iPhone testing;
- Android Chrome manual interaction testing;
- iOS Safari manual interaction testing;
- installed-PWA physical-device testing;
- screenshot-based responsive QA.

The viewport matrix described above is deterministic production-artifact/controller verification, not a substitute claim for manual browser/device testing.

Issue #71 remains the broader owner of physical mobile gesture/safe-area validation.

---

## Final branch sync and PR state

At the original implementation closeout, `main` was still:

`431f42e5e86ac3b4cc421f3b4509a71eb8811ac6`

which was exactly the commit this branch started from. The implementation branch was therefore ahead of `main` with no missing mainline commits and required no semantic sync merge at that point.

PR #81 is intentionally left open and unmerged.

Before merge, repeat the repository's normal finalisation rules if `main` has moved:

1. sync current `main` into the branch;
2. resolve conflicts semantically;
3. run the complete Node 22 test suite again;
4. inspect the exact new production artifact;
5. confirm CI is green;
6. move this record from `docs/open/` to `docs/closed/` as part of closeout if Issue #78 is closed.
