# Atlas Design System

**Status:** current production design system  
**Mode:** operate  
**Primary surface:** mobile-first Spatial Atlas geography learning

## Design thesis

**Geography is the content; the interface is the instrument.**

Atlas should feel tactile and game-like enough to make repeated retrieval satisfying while remaining visually quiet, information-first and credible as a learning tool. The Earth, map, flag or outline should normally carry more visual weight than surrounding chrome.

Spatial Atlas is the accepted production navigation presentation. It is not decorative 3D placed above a conventional app page.

## Locked principles

1. Mobile portrait is the primary composition; short landscape must remain usable.
2. System sans typography; cool near-white canvas and graphite text form the neutral base.
3. Atlas Blue is ordinary action/selection/progress.
4. Green/red are correctness feedback, not navigation identity.
5. Purple is durable region × domain Mastery.
6. Gold is scarce completion/prestige.
7. State never relies on colour alone.
8. Geography identity comes from shape, name, hierarchy and context — not continent/region colour branding.
9. Use spacing, alignment, rules and proximity before adding cards/containers.
10. Modest radii and controlled depth; no glassmorphism, bento dashboards, decorative gradients or excessive elevation.
11. Tactile press physics communicate activation without springy/toy-like bounce.
12. Progressive disclosure beats explanatory text in routine flows.
13. Achievement treatment stays subordinate to the learning task until something genuinely scarce has been earned.
14. Spatial motion must preserve orientation but remain interruptible and respect reduced motion.
15. A 3D surface never replaces equivalent real DOM controls or answer-safe accessibility semantics.

## Core palette

| Role | Value | Meaning |
| --- | --- | --- |
| Canvas | `#F6F8FB` | cool near-white ground |
| Primary text | `#101318` | graphite text / strongest neutral |
| Atlas Blue | `#2563EB` | ordinary action, selection, focus, progress |
| Pressed blue | `#1749B8` | physical pressed/depth state |
| Action tint | `#EAF0FF` | quiet selected/action background |
| Correct | `#137A55` | correct retrieval feedback |
| Wrong | `#B42318` | incorrect retrieval feedback |
| Mastery | `#6D3FC0` | durable region × domain competency |
| Prestige | `#E0AF2F` | scarce completion/prestige |

Colour is semantic, not geographic branding.

## Shape and depth

Radius tiers:

- compact `8px`;
- controls `12px`;
- tiles/rows `18px`;
- hero/large surface `24px`.

Use the smallest tier that supports the component. Large rounded containers are not the page grammar.

Primary Atlas Blue controls use the established restrained tactile depth and collapse approximately `translateY(3px)` on press. Quiz answers use the shallower ~`2px` treatment. Home may retain the stronger hard-edged arcade exception; that exception does not spread through Spatial navigation or activities.

Reduced motion must preserve semantic correctness and usability; animation may decorate state but may never be the mechanism that restores or determines state.

## Spatial navigation composition

Current production hierarchy:

```text
Home / domain
→ world Earth / continent
→ continent focus
→ optional region focus
→ Play or Learn
→ activity
→ Results / spatial context
```

The persistent Earth is the dominant navigation object. A compact real-DOM command surface is anchored to the geography it names.

At continent/region focus:

- selected geography is the one dominant label;
- domain is visible but secondary;
- **Play {Scope}** is the primary action and immediately available;
- **Learn {Scope}** is secondary where supported;
- parent/sibling geography is quiet lateral navigation;
- tapping geography selects/focuses scope and never starts a round;
- whole-continent Play is available at continent focus;
- region Play follows deliberate region focus;
- primary choices wrap rather than requiring horizontal scrolling.

The command surface is label, proximity, rules and a small control group — not a dashboard/card stack and never glass.

The conventional `Launcher` is renderer-failure fallback only. Do not restore it beneath the globe or document its old full-width rows as the normal product experience.

## Spatial motion and gesture ownership

- one-finger drag rotates the Earth after the drag threshold;
- a tap resolves where the press began and must not be retargeted by finger jitter;
- pinch zooms/dollies;
- platform/browser edge-back gestures keep ownership of the edge gutter;
- camera travel is a visual interpretation of authoritative route changes, not application state;
- cold deep links initialise directly at the target spatial state rather than replaying a cinematic ancestry;
- reduced-motion users receive direct/shortened transitions with the same destination and focus semantics.

Tiny geography may use invisible source-derived interaction envelopes. Display geography remains truthful; giant visible hit circles are not the interaction model.

## Learning surfaces

### Flags

Preserve true flag aspect ratios. The flag is the primary recognition object. Hidden Flags Learn items must not leak names through visible or accessible metadata. Flags Play may retain quiet inert globe context only when it cannot hint the answer.

### Locations

The canonical projected map owns the activity screen. Pan/zoom and feedback must not compete visually with the geography. Spatial navigation yields rather than placing a second competing map behind the question.

### Outlines

The silhouette is dominant. Normalisation may remove absolute scale/location cues but must preserve canonical shape/aspect ratio. Spatial navigation yields during live questions.

### Neighbours

Target geography and complete land-neighbour context remain primary. Input/suggestions are retrieval instruments, not the visual centre. Spatial navigation yields during live questions.

## Progress and achievement presentation

Ordinary progress is low-prestige: the quiet Atlas Blue successful-retrieval strip. Individual countries remain learning evidence, not purple prestige objects.

Hierarchy:

`country evidence → region × domain Mastery → complete region → complete continent → World Crown`

- **Perfect round:** transient miss-free Results feedback, not persistent Mastery.
- **Region × domain Mastery:** purple plus explicit non-colour wording/mark.
- **Complete region:** restrained brushed-metal gold treatment; no separate Crown.
- **Complete continent:** persisted completion with dedicated crest/trophy artwork and explicit semantics wherever current navigation surfaces it.
- **World Crown:** singular highest tier. #138 shipped an earned-only Home surface; do not show locked/decorative Crowns or add a higher tier.

Spatial and fallback presentations consume the same achievement read model. Presentation must not invent qualification logic.

## Results and feedback

Results answer what happened and what to do next rather than becoming reward dashboards.

- green = correct;
- red = wrong;
- domain-specific assisted/reveal states remain restrained;
- live score/feedback should be consistent where mechanics are equivalent;
- Perfect round is the one-result gold acknowledgement;
- repeat and mistake review remain practical next actions.

Avoid confetti or repeated celebration for ordinary correct answers.

## Accessibility

- real DOM equivalents for spatial choices;
- visible focus;
- keyboard operation where mechanics permit it;
- no colour-only state;
- reduced-motion support;
- mobile safe-area awareness;
- readable zoomed text and reflow;
- no horizontal scrolling for primary selection;
- answer-safe accessible labels;
- stable focus/announcement after durable transitions;
- honest unavailable, loading and renderer-failure states.

Spatial geography has inherent non-visual limits; do not “solve” them by leaking a quiz answer in accessibility metadata.

## Product language

Learner-facing copy uses modern British English: **Neighbours, colour, centre, behaviour, practise** as the verb / **practice** as the noun. Stable technical identifiers may retain legacy American spelling where compatibility requires it.

## Intentionally excluded aesthetics

No default glassmorphism, bento/dashboard grids, ornamental structural gradients, decorative illustration competing with geography, fantasy ranks, XP/coin economies, constant crowns/medals/confetti, continent/region colour branding, large floating-card stacks, or exaggerated spring motion.

## Historical design work

#104's map-first exploration is historical input, not an active alternative product direction. #119 proved the continuous spatial interaction; #166 made it the default. The #118 audit remains valuable historical evidence and its surviving concrete follow-ups are #146–#152. See [`docs/history.md`](docs/history.md).
