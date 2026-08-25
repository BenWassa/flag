# Issue #111 — Launcher polish

**Status:** In progress

## Decision

The whole-continent Play action and its region Play actions form one continuous
scope list. Each remains a separate full-width row, but the launcher does not
insert a second Regions section heading between them. Counts align at the
trailing edge and chevrons are omitted because the row label and full-row button
already communicate the action.

Earned region × domain Mastery remains available to assistive technology as
Mastered wording, without a purple star in the compact launcher. Complete-region
and complete-continent edges use a restrained multi-tone gold treatment intended
to suggest brushed metal, with a plain system-colour border under forced colours.

Development sandbox presets that represent completion also seed matching
successful-retrieval evidence. This keeps the ordinary blue progress layer and
the persistent achievement layer semantically separate while making the visual
difference between presets obvious.

## Acceptance gates

- TypeScript checks and focused unit tests.
- Full production build and verifier suite.
- Mobile portrait browser inspection at 390 × 844.
- Keyboard/focus semantics inferred only from automated markup assertions unless
  separately recorded as manually exercised.
