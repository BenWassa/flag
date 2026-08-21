# Issue #58 — Make zero-land-neighbour countries learnable in Neighbours

GitHub: https://github.com/BenWassa/flag/issues/58

## Status

Implemented on `feat/issue-58-zero-neighbours`.

## The bug this actually fixed

Zero-land-neighbour countries were counted in the Neighbours curriculum but excluded from rounds, so three of Africa's five regions could never complete Neighbours at all:

| Region | Curriculum | Playable before | Unreachable |
| --- | --- | --- | --- |
| West Africa | 16 | 15 | CPV |
| Central Africa | 9 | 8 | STP |
| East Africa | 18 | 14 | COM, MDG, MUS, SYC |

North Africa and Southern Africa were unaffected. This is why the issue is a prerequisite for #27: Oceania would have had whole regions with no reachable curriculum.

## The rule

Eligibility now keys off **known** adjacency rather than **non-empty** adjacency:

- `adjacency[id]` is `undefined` → curriculum does not cover the country; not playable, and it can never contribute to completion;
- `adjacency[id]` is `[]` → playable, and the truthful answer is the empty set;
- `adjacency[id]` is non-empty → unchanged.

One global rule, no Oceania-only special case. `AFRICA_STANDARD_NEIGHBOR_TARGET_IDS` is now every country with known adjacency; only the documented incomplete-topology exclusions (EGY, MAR) are held back.

## The interaction

`NO_LAND_NEIGHBORS_ID` is a reserved answer id — deliberately not ISO3-shaped, so it can never collide with a country, never appears in autocomplete, and is filtered out of confusion counts. The learner submits it through an explicit **No land neighbours** action.

Two consequences worth stating plainly:

**The action is shown for every target, not just islands.** Showing it only where it is correct would announce the answer. For a bordered country it is simply a wrong guess: it costs an attempt, records contradictory evidence, and can be repeated as a free duplicate like any other.

**Naming a country can never complete an empty set.** The old completion check was `foundIds.length === neighborIds.length`, which is `0 === 0` for an island — so the first wrong guess would have resolved the target as complete. A zero-neighbour target now resolves only through the explicit claim.

## Answer leakage

The neighbour total is withheld until the target resolves. It previously rendered as `0 of 3 neighbours found`, which for an island would have read `0 of 0` — handing over the answer before any retrieval happened. During play the line now reads `n neighbours found`; the total appears on resolution.

**Known residual signal:** the attempt budget is `n + 2`, so an island shows `2 attempts left` where a bordered country shows more. Closing that would mean changing the attempt model, which this issue explicitly puts out of scope. `scripts/verify-zero-neighbours.mjs` asserts the residual precisely rather than claiming a leak-free surface: apart from the attempts figure, an island round and a bordered round are textually identical before answering.

## Evidence and mastery

Routed through the existing adapter with no new thresholds:

- clean claim → `clean-retrieval` with credit;
- claim after a wrong guess → `assisted-retrieval`;
- exhausted → `contradictory`, and the reveal lists nothing, because there is nothing to reveal.

No maritime or near-touching relationship is invented anywhere. Canonical adjacency is untouched; the generated fixture changed only in which countries it labels as standard targets.

## Africa compatibility

Existing stored Neighbours records survive — the capability adds targets, it does not reset ledgers. Africa's own regression coverage stays green.

## Verification

`scripts/verify-zero-neighbours.mjs` covers canonical empty adjacency, eligibility for known-vs-absent adjacency, region completability, the clean/recovered/exhausted evidence ladder, the empty-set completion guard, duplicate accounting, unchanged `n > 0` gameplay, the leak contract and its documented residual, and record survival.

Full `npm test` is green. Rendered QA was performed against the built `dist/` artifact in headless Chromium at 390×844.
