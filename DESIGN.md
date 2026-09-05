# Atlas Design System

**Status:** current production design system  
**Mode:** operate  
**Primary surface:** mobile-first Spatial Atlas geography learning

## Design thesis

**Geography is the content; the interface is the instrument.**

Atlas should feel tactile and game-like enough to make repeated retrieval satisfying while remaining visually quiet, information-first and credible as a learning tool. The Earth, map, flag or outline should normally carry more visual weight than surrounding chrome.

**The geography carries the colour; the chrome stays quiet.** Land is green, water is blue and the space around the planet is night. This replaces the neutral-cartography direction that preceded it, in which ocean, land and page canvas were three near-identical light greys and the dominant object in the product had no colour at all. Saturated colour belongs to the thing the product is about; it does not spread into panels, cards or backgrounds.

Spatial Atlas is the accepted production navigation presentation. It is not decorative 3D placed above a conventional app page.

## Locked principles

1. Mobile portrait is the primary composition; short landscape must remain usable.
2. System sans typography; cool near-white canvas and graphite text form the neutral base for chrome.
3. Cartography is the one saturated surface: land green, water blue, space night.
4. Atlas Blue is ordinary action/selection/progress.
5. Green/red are correctness feedback, not navigation identity. Correctness green is deeper and more saturated than any land green, and outranks it wherever the two meet.
6. Purple is durable region × domain Mastery.
7. Gold is scarce completion/prestige.
8. State never relies on colour alone.
9. Each learning domain has one accent, on its own icon and its own meter. Mode identity is not geography identity.
10. Geography identity comes from shape, name, hierarchy and context — not continent/region colour branding.
11. Use spacing, alignment, rules and proximity before adding cards/containers.
12. Modest radii and controlled depth; no default glassmorphism, bento dashboards, decorative gradients or excessive elevation. The Spatial Home chooser is the one documented neutral translucent exception.
13. Tactile press physics communicate activation without springy/toy-like bounce.
14. Momentum and arrival may be felt, not only read. Every gesture that carries them decorates a state the DOM already states, and removing the whole layer must leave the round correct.
15. Progressive disclosure beats explanatory text in routine flows.
16. Achievement treatment stays subordinate to the learning task until something genuinely scarce has been earned.
17. Spatial motion must preserve orientation but remain interruptible and respect reduced motion.
18. A 3D surface never replaces equivalent real DOM controls or answer-safe accessibility semantics.

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

### Cartography

Defined once in `atlas-theme.css` and consumed by the globe, Locations and Neighbours alike. No consumer sheet forks these.

| Role | Value | Meaning |
| --- | --- | --- |
| Ocean | `#1F5C80` | sea on the projected maps |
| Deep ocean | `#164964` | sea seen from orbit |
| Inland water | `#35789C` | lakes, cut into land |
| Context land | `#9FBF98` | land outside the current scope |
| Context border | `#4A6B4F` | its coastlines and borders |
| Active land | `#E8F0C8` | land the learner can act on |
| Active border | `#5C6E3A` | its coastlines and borders |
| Label halo | `#F4F8E6` | the plate a map label sits on |
| Space | `#0A1725` | night behind the planet |
| Atmosphere | `#4FA3D1` | the lit limb |
| Map mastery | `#A98CE0` | Mastery, deepened to survive green land |
| Map prestige | `#E3BE64` | completion, deepened to survive green land |

Figure and ground inside the green: what can be acted on is light, what is only context is deeper, and ocean clears context land by roughly 3:1 so a coastline reads without depending on its stroke. On the globe the same two greens run one step more saturated, because they sit on deep ocean against night rather than on a light page.

Evidence fills geography in. A cleared country takes a deep correctness green that clears both the pale in-scope land and the sage context land by value, so a board visibly fills as a round is played. Immediate answer feedback still outranks all stored evidence through stronger interior semantic fill and the one arrival animation; correctness never relies on a widened exterior stroke, and topology-derived coastlines/shared borders keep ownership of the visible boundary.

### Mode identity

| Domain | Value |
| --- | --- |
| Flags | `#1D4ED8` |
| Locations | `#0E7490` |
| Outlines | `#B45309` |
| Neighbours | `#BE123C` |

An accent reaches a domain's own icon and its own progress meter and stops there. No continent, region or hemisphere ever takes an identity colour, and no state anywhere is carried by one.

### Streak tiers

| Tier | Value | From |
| --- | --- | --- |
| Warm | `#B45309` | 3 correct |
| Hot | `#C2410C` | 6 correct |
| Ember | `#7C2D12` | 10 correct |

Each tier also carries its own count of marks. The ramp deliberately borrows neither prestige gold nor correctness green nor wrong red.

Colour is semantic or cartographic, never geographic branding.

## Shape and depth

Radius tiers:

- compact `8px`;
- controls `12px`;
- tiles/rows `18px`;
- hero/large surface `24px`.

Use the smallest tier that supports the component. Large rounded containers are not the page grammar.

Primary Atlas Blue controls use the established restrained tactile depth and collapse approximately `translateY(3px)` on press. Quiz answers use the shallower ~`2px` treatment. Home may retain the stronger hard-edged arcade exception; that exception does not spread through Spatial navigation or activities.

Reduced motion must preserve semantic correctness and usability; animation may decorate state but may never be the mechanism that restores or determines state.

## Motion and control geometry

Keep this scale deliberately small:

- compact controls use a `44px` minimum height for icon buttons and quiet lateral choices;
- standard controls use a `52px` minimum height for primary actions, answer controls and text-entry actions;
- press response uses `--motion-press: 100ms` with `--ease-press: ease-out`;
- ordinary colour, border and opacity changes use `--motion-ui: 160ms` with `--ease-ui: ease-out`;
- `--motion-feedback-emphasis: 520ms` / `--ease-feedback: ease-out` is the accepted Locations transient wrong-answer emphasis from #148, not a universal feedback duration.

The shared Play reading dwells remain `620ms` correct / `1500ms` wrong in `src/state/play-feedback-timing.ts`; they are application-state timing rather than CSS motion. Globe/camera travel remains owned by the spatial camera director. Do not force either onto the generic UI tokens.

## Spatial navigation composition

The Spatial screen is two-tone: night geography above, light real controls below. The stage's own background matches the renderer's clear colour exactly, so the canvas fading in has nothing to flash against, and the globe carries a single procedural atmosphere rim at the limb. That rim is the one lit element in the scene; there are still no textures, no terrain, no photographic Earth and no starfield.

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

At Home:

- the whole Earth owns the Spatial viewport rather than yielding a permanent command band;
- one bounded, centred chooser contains `Atlas`, Profile, an earned World Crown when present and all four learning modes;
- ordinary phone portrait uses an icon-led 2 × 2 mode grid; short landscape adapts compactly so all four modes remain visible in one viewport;
- each mode carries its short learner-facing name and quiet `cleared / total` progress;
- the chooser may use one neutral translucent surface with a thin structural edge and modest depth so the globe remains recognisable around it;
- it is bounded to the width its four modes need, and its fill is roughly 82% rather than near-opaque: against the near-white space it used to sit on, opacity was a texture choice; against a planet it decides whether there is a planet behind the chooser at all. Text stays far clear of 4.5:1 at that value even over the deepest ocean;
- do not nest translucent cards, add colourful gradients/glow or depend on decorative blur; a sufficiently opaque treatment without `backdrop-filter` is preferred when it is clearer or cheaper;
- forced-colours mode uses a solid real-DOM presentation;
- the globe is geographic context until a domain exists: it may be rotated deliberately, but country selection cannot navigate from Home.

This is the sole translucency exception in the navigation system. It is page content, not a modal dialog: no `aria-modal`, focus trap or parallel open/close state is introduced.

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

Outside the documented Home exception, the command surface is label, proximity, rules and a small control group — not a dashboard/card stack or translucent panel.

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

## Game feel

Momentum and arrival are felt as well as read. Every rule in this layer decorates a state the DOM already states in words and in shape, so the whole layer can be removed and the round stays correct. That is what makes it compatible with reduced motion and forced colours rather than merely tolerated by them.

- **Streak.** A running streak surfaces from two correct answers and escalates through three tiers at 3, 6 and 10. Each tier carries its own count of marks as well as its own colour. Nothing about it is stored, spent or accumulated, and a missed answer takes the tier with the streak.
- **Answering.** The correct option lifts; a chosen wrong one refuses. One short gesture each, on `transform` only.
- **Haptics.** A short pulse confirms a resolved Play answer where the platform supports it. `navigator.vibrate` is an Android/Chromium feature and is absent on iOS Safari, so this is a no-op on iPhone and nothing may be built on top of it. It is suppressed under reduced motion.
- **Round rank.** One word for how a completed Play round went. Transient result feedback in the same family as the Perfect round badge: never stored, never accumulated, never a rank the learner holds. Learn takes no rank, because Learn is not scored against a bar.
- **Arrival.** The earned Perfect round badge takes a single sheen, once. It is the accepted brushed-metal gold treatment moving, not a repeating celebration.

Reduced motion removes the movement rather than shortening it. Nothing is lost but the gesture.

## Progress and achievement presentation

Ordinary progress is low-prestige: the quiet successful-retrieval strip, in the mode's own accent. It has two segments — cleared, then seen but not yet cleared — because a scope half-met and a scope never opened used to draw the same empty track. Its accessible name still reports cleared alone, the figure the rest of the product quotes. Individual countries remain learning evidence, not purple prestige objects.

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

No default glassmorphism, bento/dashboard grids, ornamental structural gradients, decorative illustration competing with geography, fantasy ranks, XP/coin economies, currencies, levels, daily-streak obligations, constant crowns/medals/confetti, continent/region colour branding, large floating-card stacks, or exaggerated spring motion. The only translucent navigation surface is the single neutral Spatial Home chooser documented above; that exception must not propagate into nested glass cards or other screens.

Saturated colour stays on the geography. Panels, cards, page backgrounds and chrome remain neutral: the break recorded here gives the Earth its colour back, it does not licence a colourful interface around it.

Gamification stays inside the round. A streak that is only alive while a round is, and a word describing the round that just ended, are the whole of it. Anything a learner could accumulate, hold, lose overnight or be asked to protect is out of scope by construction.

## Historical design work

#104's map-first exploration is historical input, not an active alternative product direction. #119 proved the continuous spatial interaction; #166 made it the default. The #118 audit remains valuable historical evidence and its surviving concrete follow-ups are #146–#152. See [`docs/history.md`](docs/history.md).
