# Zero-land-neighbour learning in Neighbours

**Status:** prerequisite for true four-domain parity in Oceania; product/domain extension only.

## Problem

The current Neighbours contract represents countries with zero direct land neighbours accurately as empty adjacency records but excludes them from standard rounds.

That was acceptable for Africa because enough land-connected targets remain. It becomes structurally insufficient for global regional parity:

- Australia & New Zealand has zero standard Neighbours targets;
- Micronesia has zero;
- Polynesia has zero;
- most island-heavy regions would expose only a tiny subset of their countries.

Atlas's global expansion requirement is that each continent and learner-facing region can be learned across the same four domains. Empty curriculum must not be treated as automatic mastery, and maritime neighbours must never be invented.

## Goal

Make `no land neighbours` a truthful, learnable Neighbours outcome while preserving the existing direct-land-border definition and the current multi-answer mechanic for countries that do have neighbours.

## Product contract

### Definition remains unchanged

Two Atlas application countries are neighbours only when their canonical land polygons share a direct land boundary under the documented cartography/boundary policy.

Do not count:

- maritime boundaries;
- near-touching islands;
- cultural/political regional relationships;
- ferry links or causeways that are not represented as canonical shared land boundaries.

### Countries with `n > 0`

Preserve the established Neighbours mechanic:

- name/select all direct land neighbours;
- `n + 2` unique-guess budget;
- duplicates consume no attempt;
- set-progress feedback remains visible;
- complete/exhausted states remain domain evidence inputs.

Do not redesign the ordinary Neighbours game in this issue.

### Countries with `n = 0`

Add the smallest clear retrieval interaction for the fact that the country has no direct land neighbours.

Preferred v1:

- prompt the country/map exactly as a normal Neighbours target;
- present an explicit learner action labelled **No land neighbours**;
- selecting it submits the learner's answer;
- in Learn, incorrect attempts/corrective treatment remain consistent with domain feedback principles;
- in Play, a clean correct assertion produces scored retrieval evidence;
- do not require the learner to type meaningless guesses into an autocomplete to prove an empty set.

If implementation finds a more accessible interaction with the same semantic simplicity, it may be used, but the answer must remain an explicit retrieval decision rather than passive text.

## Evidence / mastery

Integrate through the existing Neighbours outcome/evidence adapter rather than inventing a second evidence ledger.

Requirements:

- clean correct `No land neighbours` can produce qualifying Neighbours evidence;
- incorrect/revealed zero-neighbour outcomes remain weaker/contradictory evidence as appropriate under #29;
- existing stored Neighbours records remain valid;
- zero-neighbour countries can contribute to region × Neighbours mastery once genuinely learned;
- an empty/unimplemented region must never auto-complete simply because there are no standard `n > 0` targets.

Coordinate with #29/#34 contracts rather than hard-coding scheduler thresholds into the UI.

## Scope support

After this lands, a region can support Neighbours even when all of its countries have zero direct land neighbours, provided:

- the canonical adjacency graph contains those countries as verified empty sets;
- the zero-neighbour interaction is available;
- evidence/progress selectors include those countries;
- mastery requirements use the actual region scope membership rather than the old `standard target IDs` subset.

This distinction is important: `playable learning curriculum` becomes broader than the existing `n > 0 standard target list`.

## Africa compatibility

Do not break or reset existing Africa Neighbours progress.

Decide explicitly whether zero-neighbour Africa countries become newly learnable targets immediately or whether target-pool rollout is staged. Preferred long-term state is one global rule, but preserve learner records and avoid changing unrelated earned achievements silently.

Any Africa curriculum expansion must be reflected honestly in support/mastery selectors and regression tests.

## Accessibility / UI

- explicit control has a clear accessible name;
- control meets existing touch-target requirements;
- status is not colour-only;
- keyboard activation works;
- focus remains in the task surface;
- screen-reader output makes the submitted empty-set answer understandable;
- no verbose explanatory copy is required during routine play.

## Verification

Cover at minimum:

- canonical empty adjacency remains `[]` rather than fake neighbours;
- zero-neighbour target can enter a round;
- `No land neighbours` correct path;
- incorrect path does not falsely qualify evidence;
- ordinary `n > 0` gameplay remains unchanged;
- progress/evidence includes zero-neighbour countries after the capability is enabled;
- region mastery cannot auto-complete from an empty standard-target list;
- existing persisted Neighbours records survive;
- Africa regression coverage remains green;
- Oceania regions can eventually expose genuine Neighbours curriculum without maritime inventions;
- full `npm test` passes.

## Out of scope

- changing the definition of a land neighbour;
- adding maritime neighbours;
- redesigning autocomplete for ordinary multi-neighbour targets;
- global cartography expansion itself;
- changing earned-achievement persistence semantics;
- adding an Oceania-only special case.

## Acceptance criteria

- [ ] Countries with zero direct land neighbours are truthfully learnable in the Neighbours domain.
- [ ] `No land neighbours` is an explicit retrieval answer/state, not passive information.
- [ ] Ordinary `n > 0` Neighbours gameplay remains unchanged.
- [ ] No maritime/near-touching relationships are introduced.
- [ ] Zero-neighbour outcomes feed the existing Neighbours evidence model.
- [ ] Zero-neighbour countries can count toward region × Neighbours mastery once learned.
- [ ] Empty/unimplemented curricula cannot auto-complete mastery.
- [ ] Existing Neighbours progress is preserved.
- [ ] Accessibility/touch/keyboard behaviour matches Atlas standards.
- [ ] Full `npm test` passes and exact production artifact is inspected before merge.
