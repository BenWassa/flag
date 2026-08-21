# Issue #60 — Add immediate Play feedback and live score tracking

GitHub: https://github.com/BenWassa/flag/issues/60

## Status

Proposed.

## Goal

Make Play rounds feel more responsive and game-like by:

- showing immediate correctness feedback after each answer;
- keeping a visible live score during the round;
- preserving existing learning evidence and mastery semantics.

Flags is the first target surface because this pain is currently most obvious there. The interaction model should be reusable for Locations, Outlines and Neighbours where it fits their input mode.

## Problem

Current Play flow can feel delayed and low-feedback during a round:

- learners do not always get a clear instant signal after each submission;
- round progress and score momentum are harder to feel in real time;
- motivation loop is weaker than expected for rapid practice.

This is a UX feedback problem, not a rules-model problem.

## Scope

### In

- Immediate per-answer feedback state in Play:
  - Correct (clear positive state).
  - Wrong (clear corrective state).
  - Duplicate/invalid where relevant (clear neutral guidance state).
- Real-time score block visible throughout a round:
  - current score;
  - attempts used / remaining;
  - optional streak indicator if already derivable without model changes.
- Lightweight transition/motion for state change, with reduced-motion support.
- Shared UI contract and state shape that can be applied across domains.
- Flags implementation as the proving ground.

### Out

- Any change to evidence persistence semantics.
- Any change to mastery/completion hierarchy or prestige treatments.
- Any economy layer (XP, coins, loot, reward shop).
- Any routing or storage key migration.

## Product and design constraints

- Keep Atlas semantic colours and achievement scarcity hierarchy intact.
- Preserve modern British English copy and Play terminology.
- Maintain keyboard-first and screen-reader clarity:
  - `aria-live` feedback summary;
  - no focus theft from active answer control;
  - clear announced score/progress changes.
- Preserve typed routing and current domain scoring invariants.

## Acceptance criteria

- In Flags Play, each submitted answer shows immediate visible feedback in under one interaction cycle (same render turn).
- Score/progress panel updates on every scored submission without requiring navigation or refresh.
- Feedback states are distinguishable by more than colour alone.
- Keyboard flow remains uninterrupted for rapid consecutive answers.
- Reduced-motion users receive no essential information only through animation.
- Existing verification suite remains green with added focused assertions for feedback and live scoring state transitions.

## Verification

- Automated:
  - add focused assertions in the existing plain-Node verifier family for per-answer feedback state and score updates.
  - run `npm run check` and `npm test`.
- Manual:
  - verify rapid answer loop in desktop and mobile viewport sizes;
  - verify keyboard-only play path for consecutive answers;
  - verify screen-reader announcements for feedback and score updates.

## Implementation notes

- Prefer introducing a small, explicit round-feedback state contract in the app/state layer rather than inferring from scattered UI conditions.
- Keep domain rule engines authoritative; UI feedback should reflect outcomes already computed by domain logic.
- Keep copy concise and repeatable to avoid announcement fatigue in assistive technology.

## Risks and mitigations

- Risk: visual noise or over-animation harms fast play.
  - Mitigation: restrained motion and concise, consistent feedback copy.
- Risk: divergence across domains.
  - Mitigation: define one shared feedback/score presentation contract, then adopt per domain.
- Risk: accidental coupling to mastery semantics.
  - Mitigation: keep score round-local and separate from persistent achievement state.

## Proposed delivery slices

1. Flags Play immediate feedback + live score (foundation slice).
2. Shared contract extraction and reuse points.
3. Follow-on adoption in Locations, Outlines and Neighbours where interaction parity is valid.
