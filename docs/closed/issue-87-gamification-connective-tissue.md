# Issue 87 — Gamification connective-tissue defects

GitHub issue: [#87 — Fix gamification connective-tissue defects: due-state, Play feedback parity, and Progress evidence coverage](https://github.com/BenWassa/flag/issues/87)

Implementation branch: `issue-87-gamification-connective-tissue` (deleted after merge)

Pull request: [#88 — Fix #87 gamification connective-tissue defects](https://github.com/BenWassa/flag/pull/88) — merged (squash) into `main` at `ee9bb93`.

## Status

Closed. All six defects fixed, verified and merged.

## Origin

Filed from a 2026-08-23 source-level assessment of the gamification/scoring
system on `main` post-v0.7.0. The evidence/achievement architecture (live
country evidence → region × domain Mastery → complete region → continent
crest → World Crown) was judged sound and untouched by this issue. What this
issue fixed was narrower: several values the domain layer already computed
correctly were not reaching the UI faithfully.

## What was fixed

1. **Outlines due-for-review state now surfaces.** `isDue()` in
   `src/domain/progress-summary.ts` checked only the Flags ledger even though
   Outlines shares `applyAttempt()`/`ProgressState` and genuinely accumulates
   `nextReviewAt`. Extended to also read the Outlines ledger. Locations and
   Neighbours still have no `nextReviewAt` field at all — out of scope here,
   real scheduler work.
2. **Outlines Play feedback now matches Flags/Locations.** `outline-quiz.ts`
   moved off the neutral `Answer recorded` state onto the shared
   `answerFeedback`/`answerFeedbackPanel` contract from
   `src/domain/round-feedback.ts`, the same migration #78 did for Locations.
   Along the way, a related bug was fixed: answered Outlines options now mark
   correct/wrong regardless of mode, rather than only in Learn.
3. **Locations Play shows the live score it was already announcing.**
   `map-quiz.ts` now imports and renders `liveScore(...)` during Play,
   matching what `locations-round.ts` already sent to the aria-live region.
4. **Locations no longer hard-codes "Africa".** `map-quiz.ts`'s aria-label and
   pan-guidance copy now derive the continent name from
   `getMapContinentConfigForScope(session.scope.id)` instead of a literal
   string, so South America/Europe/Asia rounds no longer instruct learners to
   pan "Africa".
5. **Neighbours Results no longer exposes internal terminology.** "That is the
   mastery-credit event for this domain" became "Clean completions can make
   countries newly strong," consistent with Flags/Outlines' "newly strong"
   vocabulary.
6. **Progress's history check covers all shipped continents.** `progress.ts`
   replaced the Africa-only `buildScopeProgressSummaries(AFRICA_SCOPE)` check
   with `buildDomainProgressSummary` aggregated across all four domains, so a
   learner with evidence only in South America/Europe/Asia no longer sees
   "Not practised yet" or loses the reset/history footer.

Verifiers were extended to cover all six fixes, including
`scripts/verify-outline.mjs`'s pre-existing assertion that had encoded the
obsolete `Answer recorded` behaviour. `npm run check` and `npm test` passed on
Node 22; CI (`verify`) passed on the PR; the exact CI-produced `dist` artifact
was inspected before merge.

## What was deliberately excluded

- An achievement-milestone event queue/ceremony (surfacing
  `NewlyEarnedAchievement[]`, which every `refreshAchievements()` caller in
  `src/state/store.ts` still discards). Real feature/design work; needs its
  own issue if pursued.
- Giving Locations and Neighbours real spaced-review due dates, and moving
  scheduler priority off lifetime-error accumulation toward recency
  weighting. Learning-behaviour work, not presentation wiring.
- Evidence thresholds and the achievement hierarchy — reviewed and left
  unchanged.

No routing, storage schemas, evidence thresholds, achievement hierarchy or
stable identifiers changed.
