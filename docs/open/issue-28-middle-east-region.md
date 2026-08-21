# Issue #28 — Middle East conventional cross-continental learning scope

**Status:** policy locked; implementation should use the shared global expansion learning-scope model.

GitHub: https://github.com/BenWassa/flag/issues/28

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
