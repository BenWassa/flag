# Issue #28 — Middle East conventional cross-continental learning scope

**Status:** policy locked and being implemented inside Issue #26 on `issue-26-asia-middle-east-expansion`; do not create a separate Middle East geography/routing/progress implementation. PR #82 is the active implementation PR and remains unmerged while verification is incomplete.

GitHub: https://github.com/BenWassa/flag/issues/28

## Implementation note — 2026-08-22/23

Issue #28 is being consumed deliberately as part of the Asia expansion rather than developed as a parallel subsystem. This sequencing is important because Middle East is the first learner-facing scope that crosses canonical continent ownership: Egypt remains African while participating in the 17-country Middle East learning scope.

Work already performed on the Issue #26 branch:

- the exact 17-country Middle East membership is represented through shared learning-scope definitions;
- Egypt (`EGY`) remains the same canonical African country/progress identity and also participates in Middle East;
- Armenia, Azerbaijan and Georgia are excluded from Middle East and surfaced as the separate Caucasus learner scope;
- learner-facing Asia navigation is designed around Central Asia, East Asia, Southeast Asia, South Asia, Middle East and Caucasus;
- legacy `west-asia` is retained only for compatibility/formal taxonomy where needed and is not an ordinary learner-facing duplicate;
- Flags, Locations, Outlines and Neighbours are being wired to the same scope membership source rather than maintaining four membership lists;
- progress/mastery evaluation is being hardened to support overlapping scopes from canonical country evidence;
- the shared Natural Earth generator now supports explicit learning-scope focus bounds, cross-continent context and additional canonical adjacency support needed by Middle East without introducing a second topology source;
- canonical Asia generation succeeds with Egypt/cross-scope support and the river-free map policy intact;
- source-policy guards were exercised for special/disputed features rather than bypassed;
- generator changes have been proven to leave Africa generation semantics unchanged relative to clean current-main generation.

Current verification boundary:

- TypeScript checking and the production build succeed in the instrumented Node 22 CI run;
- canonical Asia generation succeeds;
- the strengthened Africa no-regression gate succeeds;
- the full `npm test` suite is **not yet green** because the legacy general verifier still hard-codes Locations as having exactly one shipped continent and fails when Asia correctly becomes the second;
- final production chunk/gzip measurement, full visual QA, browser/device QA and final CI-green state have therefore **not** yet been claimed.

The complete implementation worklog, CI findings, source-feature classifications, generator changes and remaining release steps are recorded in `docs/open/issue-26-asia-expansion.md`. That document is the authoritative execution log for the combined Asia + Middle East implementation.

## Locked learner-facing scope

`Middle East` is a first-class conventional learning scope containing exactly 17 countries:

- Bahrain (`BHR`)
- Cyprus (`CYP`)
- Egypt (`EGY`)
- Iran (`IRN`)
- Iraq (`IRQ`)
- Israel (`ISR`)
- Jordan (`JOR`)
- Kuwait (`KWT`)
- Lebanon (`LBN`)
- Oman (`OMN`)
- Palestine (`PSE`)
- Qatar (`QAT`)
- Saudi Arabia (`SAU`)
- Syria (`SYR`)
- Türkiye (`TUR`)
- United Arab Emirates (`ARE`)
- Yemen (`YEM`)

Egypt remains canonically African and stays in North Africa. Country records/progress are not duplicated.

Armenia, Azerbaijan and Georgia are excluded from the Middle East scope. Issue #26 now scopes them as the learner-facing **Caucasus** region.

## Architecture dependency

Implement this through the shared learning-scope registry introduced by the global expansion foundation. That registry must separate:

- canonical country/continent/formal-region classification;
- learner-facing scopes, which may overlap and cross continent boundaries.

Do not implement Middle East by:

- changing Egypt's continent ownership;
- renaming `west-asia` while preserving its old membership;
- assigning fake second canonical regions;
- duplicating country records;
- hard-coding Middle East membership independently in Flags, Locations, Outlines and Neighbours.

## Asia learner-facing result

Issue #26 consumes this policy and exposes these Asia regional learning scopes:

- Central Asia;
- East Asia;
- Southeast Asia;
- South Asia;
- Middle East;
- Caucasus.

`West Asia` may remain an internal/formal taxonomy identifier where backwards compatibility requires it, but should not remain an ordinary near-duplicate learner-facing choice.

## Four-domain contract

The same exact 17-country scope must be consumable by:

- Flags;
- Locations;
- Outlines;
- Neighbours.

Flags can support it as soon as the shared scope registry exists. The geography domains become supported as Asia/global canonical cartography coverage lands.

## Cartography contract

When geography support lands:

- Egypt is scored despite the learner entering through Asia → Middle East;
- Türkiye, Cyprus and Gulf states fit naturally at phone scale;
- surrounding North Africa, Europe, Caucasus, Central/South Asia may appear as context;
- no duplicate Middle East topology source is created;
- canonical global topology supplies geometry and complete land adjacency;
- post-#54 map policy applies: ocean + useful lakes, no rivers.

## Routing / compatibility

Use a stable `middle-east` learning-scope ID.

If `west-asia` has become a durable route by implementation time, provide a deliberate compatibility/redirect/collapse policy rather than silently breaking direct links.

Browser Back/Forward and direct routes must remain correct.

## Achievement implication

Middle East is a real region × domain mastery unit. Egypt's domain evidence may satisfy both North Africa and Middle East requirements because the evidence belongs to canonical `EGY`; the achievement records remain separate scope achievements.

This is intentional and must not cause duplicate country progress.

## Verification

Cover at minimum:

- exact 17-country membership;
- Egypt included and canonically Africa-owned;
- Armenia/Azerbaijan/Georgia excluded;
- Caucasus scope owns those three learner-facing countries;
- all four domains consume one shared membership source;
- no duplicate country records;
- no accidental learner-facing West Asia duplicate;
- direct route/Back/Forward compatibility;
- support/mastery selectors can handle overlapping scopes;
- full `npm test` passes when implemented.

## Acceptance criteria

- [ ] `Middle East` is a first-class 17-country learner-facing scope.
- [ ] Egypt remains canonically African and is also a Middle East member.
- [ ] Armenia, Azerbaijan and Georgia are excluded and surfaced as Caucasus under #26.
- [ ] Canonical classification and learning-scope membership are separate concepts.
- [ ] Country identity/progress is not duplicated.
- [ ] Flags, Locations, Outlines and Neighbours can consume one shared scope definition.
- [ ] Learner-facing Asia navigation exposes Middle East and Caucasus rather than a misleading West Asia duplicate.
- [ ] Cartography uses canonical global topology and post-#54 river-free physical context.
- [ ] Routing compatibility is deliberate.
- [ ] Overlapping scope achievement behaviour is supported and test-covered.
