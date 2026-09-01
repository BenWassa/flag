# Atlas — Product Requirements

**Status:** current production baseline  
**Normative overview:** `../../PRODUCT.md`

## 1. Product thesis

Atlas is a mobile-first geography-learning PWA across Flags, Locations, Outlines and Neighbours. It provides direct geographic practice, domain-appropriate Learn experiences, scored Play, persistent learning evidence and scarce higher-order achievement without an XP/currency/reward economy.

## 2. Identity and language

- Learner-facing product name: **Atlas**.
- Language: modern British English (`en-GB`).
- Use **Neighbours, colour, centre, behaviour, practise** as the verb / **practice** as the noun.
- Stable compatibility identifiers may retain `flag`, `flag-atlas`, `neighbors` and `test`.
- Canonical country identity is ISO3.

## 3. Navigation

Spatial Atlas is the default production navigation presentation.

```text
choose domain
→ select continent on Earth
→ continent focus: Play continent or select region
→ region focus: Play/Learn region
→ activity
```

Requirements:

- typed hash routes remain authoritative;
- geography taps select/focus scope and never implicitly start a round;
- focused scope exposes Play immediately and Learn secondarily where supported;
- equivalent DOM controls exist for spatial choices;
- Back/Forward and cold deep links remain native/durable;
- WebGL failure uses the equivalent conventional launcher fallback;
- no second map/router/navigation truth may be introduced.

## 4. Geography and coverage

Core curriculum is 195 sovereign states (193 UN members + Palestine + Vatican City/Holy See).

| Domain | Coverage |
| --- | --- |
| Flags | all 195 countries; World/all six continents/learner regions |
| Locations | all six continents plus supported regions |
| Outlines | all six continents plus supported regions |
| Neighbours | all six continents, limited to complete canonical land-neighbour truth and explicit verified zero-neighbour targets |

Projected learning assets and spherical Spatial assets derive from the same pinned Natural Earth 1:10m source/policy. No parallel geography system.

## 5. Domain requirements

### Flags
- preserve true aspect ratios;
- prevent answer leakage;
- Play is scored recognition;
- Learn is the complete-scope browse/reveal gallery and passive browsing writes no evidence.

### Locations
- canonical generated projected cartography;
- geography dominant/mobile-usable;
- Learn distinguishes clean, assisted and revealed outcomes;
- Play gives one scored selection per target under current semantics;
- preserve pan/zoom/context and truthful geography.

### Outlines
- canonical geometry only;
- preserve shape/aspect ratio while removing avoidable absolute scale/location cues;
- answer-safe accessible metadata;
- Learn gives corrective feedback; Play is scored recognition.

### Neighbours
- topology-derived adjacency only;
- never teach known incomplete land-neighbour sets;
- preserve complete-set building and explicit zero-neighbour answers where supported;
- input/suggestions remain mobile-usable, keyboard-usable and answer-safe;
- no maritime adjacency invention.

## 6. Spatial activity boundary

Locations, Outlines, Neighbours and Flags Learn yield the globe when their own learning surface should dominate. Flags Play may retain quiet inert context only if it cannot hint an answer. Results may reframe the completed scope.

## 7. Learning evidence

Country records are scheduler/evidence state, not learner-facing prestige. Preserve clean vs assisted/revealed evidence, contradictions/lapses, useful confusion history and due state where supported. Do not expose internal country `mastered` compatibility state as a prestigious achievement.

## 8. Perfect round and Mastery

A Perfect round is transient miss-free Play feedback.

Region × domain Mastery is persistent and currently requires two consecutive perfect **complete-region** Play results with exact supported-target coverage validation (#108). Non-qualifying sampled/review rounds do not advance/reset the streak; earned Mastery is not revoked.

## 9. Completion

- Complete region: all four domain Masteries plus genuine four-domain curriculum; restrained gold, no separate Crown.
- Complete continent: all required regions complete; persisted crest/trophy completion state.
- Complete World: all six continent-completion achievements earned; singular World Crown. #138 shipped the earned-only Home surface. No tier above it.

## 10. Persistence

Domain ledgers stay independent; achievements/streaks persist separately; schema changes require deterministic migration; stable namespaces are not renamed casually; active round internals remain ephemeral.

## 11. Progress

The dedicated Progress screen is retired. Ordinary progress is a quiet blue successful-retrieval strip disclosed in current navigation/activity/results surfaces. Mastery/completion remains distinct and scarce.

## 12. Visual requirements

`DESIGN.md` is authoritative. Atlas Blue `#2563EB` = ordinary action/progress; green `#137A55` = correct; red `#B42318` = wrong; purple `#6D3FC0` = durable Mastery; gold `#E0AF2F` = scarce prestige. State is never colour-only. Geography is normally the richest object. No glassmorphism, bento dashboard or decorative overload.

## 13. Cartography

One reproducible Natural Earth 1:10m source/policy; no handwritten country geometry, second topology source or handwritten neighbour tables. Projection/spherical generation remains deterministic/shared and preserves documented geopolitical policy.

## 14. Accessibility and mobile

Preserve real DOM equivalents for spatial controls, keyboard operation where applicable, visible focus, reduced motion, safe areas, text zoom/reflow, answer-safe labels, stable transition focus, portrait + short-landscape usability, platform edge gestures and honest renderer/unavailable states.

## 15. History and supersession

#104's separate map-first launcher idea is historical and superseded by the accepted Spatial path. #119 established Spatial; #166 made it production. #118 is closed audit evidence whose surviving follow-ups are #146–#152. See `../history.md` rather than reopening those historical briefs as current requirements.
