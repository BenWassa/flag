# Atlas Design System

## Status

**The selected visual direction is Tactile Atlas, and it is implemented.**

The design exploration that this document previously deferred to has happened. Shape language, radius scale, elevation, press physics, typography, navigation composition and motion are now decided and shipped in `atlas-theme.css`, which layers over the existing hand-authored sheets rather than replacing them.

The earned-achievement model is also implemented and now has a first, lighter-weight learner-facing surface (a small purple mark and a restrained gold row outline attached directly to the existing region/continent launcher rows), rather than a revived Progress screen. #34 supplies persistent region × domain Mastery, complete-region, continent-completion and World Crown state, still tracked and persisted — but mastery is now earned by two consecutive 100%-correct full-region Play rounds in a domain, not by accumulated per-country evidence (see `docs/architecture/earned-achievements.md`). #56's fuller learner-facing Progress composition for these states — the shared four-domain glyph competency row per region, purple/gold crest continent silhouettes, and the custom Atlas Crown for world completion — remains retired along with the Progress screen and has no replacement; a one-off "Perfect round" result-screen ceremony ships instead for a single clean Play round. Concrete continent-crest/world-Crown artwork and any richer milestone ceremony remain optional future polish.

The previously shipped flat “atlas index” aesthetic is superseded.

### Character

Tactile Atlas is an adult, tactile geography-learning product: more physical and memorable than a flat atlas index, but quieter and more disciplined than reward-driven learning UI or neo-brutalism. Cool near-white canvas, crisp light surfaces, Atlas Blue as the sole ordinary action family, disciplined squircle tiers rather than pill-everything, shallow physical depth on primary controls, and geography left as the dominant visual material.

Explicitly rejected as a general idiom: childlike rounded display faces, emerald or amber as generic action colours, XP/coin/streak economies, giant radii on every container, glassmorphism, bento dashboards, and gesture-only navigation. Thick black borders and hard offset shadows are rejected everywhere except one deliberate, contained exception — the Atlas arcade tier under [Interaction character](#interaction-character), covering Home's mode cards — because choosing a mode is the single highest-frequency decision in the product and earns a harder tactile signature than ordinary chrome.

## Core principle

**Geography is the content. Interface is the instrument. Prestige is scarce.**

Flags, maps, outlines and geographic context should remain the richest and most important visual objects. Product chrome may become more tactile and playful, but it should not visually overpower the geography.

Gamification should concentrate around meaningful learning milestones rather than decorate every interaction.

## Locked colour system

```yaml
colors:
  canvas: "#F6F8FB"
  text: "#101318"
  action: "#2563EB"
  action-pressed: "#1749B8"
  action-soft: "#EAF0FF"
  correct: "#137A55"
  wrong: "#B42318"
  mastery: "#6D3FC0"
  prestige: "#E0AF2F"
```

These roles are semantic.

### Atlas Blue — action

`#2563EB`

Use for ordinary primary action, navigation emphasis, selection, focus and active controls.

Pressed/depth state: `#1749B8`.

Light selected/action surface: `#EAF0FF`.

Blue was selected from the world-flag colour study because it is a major flag-derived colour family while remaining semantically available after reserving green and red for answer feedback.

### Green — correct

`#137A55`

Use for immediate correct-answer feedback and positive resolution of the current task.

Green is transient. It should not become the general brand colour or the durable mastery colour.

### Red — wrong

`#B42318`

Use for immediate wrong-answer feedback, genuine error states and destructive actions where appropriate.

Avoid routine decorative red so it retains immediate meaning.

### Purple — mastery

`#6D3FC0`

Use for durable region × domain mastery.

Purple is intentionally distinct from ordinary flag imagery and from the action/correct/wrong loop.

### Gold — prestige / completeness

`#E0AF2F`

Gold is deliberately scarce.

Use for:

- complete-region accents;
- continent-crest prestige detail;
- the world Crown;
- exceptional milestone treatment.

Do not use gold for ordinary navigation, generic highlights, progress bars, routine active states or decorative trim.

### Neutral base

Canvas: `#F6F8FB`.

Primary text: `#101318`.

The supporting neutral scale may be refined during the visual-style pass, but it should stay cool, legible and subordinate to flags/maps.

## Colour-study rule

The global palette is derived from the aggregate visual vocabulary of national flags.

Do **not** create separate continent, region or hemisphere theme colours from the research. Geographic identity should primarily come from maps, silhouettes, names and grouping rather than a parallel rainbow taxonomy.

See `docs/product/colour-system.md`.

## Achievement visual hierarchy

### Country

Country records are learning evidence, not prestigious mastery objects.

Do not give individual countries crowns, medals or high-status mastery treatment.

Country-level evidence may still need neutral/learning/review cues where operationally useful, but those should not compete with earned regional achievements.

### Region × domain mastery

The first learner-facing mastery state is one full learning domain across a region.

Use a compact domain icon:

- Flags — flag icon;
- Outlines — country-outline icon;
- Locations — map-pin/location icon;
- Neighbours — adjacency/shared-border icon.

Incomplete supported competency is neutral. Unsupported curriculum is a separate unavailable state and must not look like failed learner progress.

Earned competency becomes purple. The shipped surface is a small purple mark beside the region's name on its existing region row, scoped to whichever single domain that launcher is currently showing, rather than the fuller shared-glyph competency badge described above — that fuller composition (all four domain glyphs together, with a check cue so the state does not rely on colour alone, avoiding shield-within-shield designs and unnecessary heraldic complexity) remains a design rule for if/when a cross-domain region surface exists again, not a description of shipped behaviour.

### Complete region

When all required regional domain competencies are complete, use a restrained **gold accent or border**.

Do not add a separate region emblem, medal or crown.

Keep useful scope information such as country count.

Do not show `100%` or `x/x` merely to restate completion.

This ships today as a restrained gold left-edge accent and border tint on the region's existing row (`.region-row--complete`), reusing the same treatment pattern as the row-selected state rather than a separate emblem.

### Complete continent

Award a **continent crest** based on the source-derived continent silhouette.

The retired Progress implementation reused the generated Natural Earth silhouette and promoted it into a mastery-purple field with restrained prestige-gold framing only when canonical `crestEarned` was true. That richer silhouette-crest artwork still has no live surface; today, a complete continent instead gets the same restrained gold row-accent treatment as a complete region, applied to its continent row (`.continent-row--complete`), pending the dedicated crest artwork under #34's remaining scope.

Continents do not need completion quantities.

### Complete world

Reserve the **Crown** for world completion alone.

The Crown is the highest visual status in the product. The custom Atlas Crown SVG is absent from routine locked states and renders only when canonical `crownEarned` is true. Do not add a higher tier above it.

No `195/195` or percentage is required once the Crown has been earned.

## Scarcity rule

Visual prestige must scale inversely with frequency.

**Purple competence → gold-complete region → continent crest → world Crown.**

The higher the achievement, the less frequently its visual language should appear elsewhere.

Do not dilute gold or Crown imagery through decorative reuse.

## Interaction character

Ordinary controls feel responsive and satisfying through **depth that collapses under the press**, not through bounce or scale.

The mechanism is a solid bottom shadow standing in for physical thickness, removed as the control translates down by the same distance:

- **primary button** — rests on a solid `0 4px 0` pressed-blue depth with no ambient glow; on `:active` drops to `0 1px 0` and translates down 3px;
- **answer button** — rests on `0 3px 0` in its semantic colour; on `:active` drops to `0 1px 0` and translates down 2px;
- **tiles, icon buttons and geographic selection rows** — no standing depth; they translate down 1px and darken slightly;
- **Atlas arcade tier** — a scoped exception to the three tiers above: a `2px solid` border in `--text` plus a hard `2px 2px 0` offset shadow (no colour, no blur), collapsing on press by translating diagonally to `(2px, 2px)` rather than dropping vertically. This covers **Home's mode cards only**. Home is the one screen every session starts on and the product's single highest-frequency decision, so it earns a harder tactile signature; everything reached after a mode is chosen — the domain's continent tiles, its region rows, the launcher status card — keeps the soft `--depth-tile` shadow described under [Shapes, radius and elevation](#shapes-radius-and-elevation). The tier narrowed from three surfaces to one when navigation became mode-first: the continent and region surfaces are now per-domain rather than a shared scope-selection journey, so the arcade treatment marks the choice above them instead of running through all of them.

Press travel stays within 2–4px. Anything larger reads as a toy.

Depth is a hierarchy signal, not a texture: primary actions and high-value interactive tiles carry it, ordinary rows and chrome do not.

This supersedes the earlier instruction to treat the “Juicy Squircle” exploration as unresolved. What survived from it is thumb-friendly hit targets, satisfying press physics, soft geometry and compact mobile grids. What was rejected is giant radii everywhere, novelty type and reward-economy ornament. No CSS framework was introduced to implement any of it — see [Implementation constraints](#implementation-constraints).

### Feedback intensity

Use three broad intensity levels:

1. **ordinary interaction** — responsive/tactile;
2. **correct/wrong** — crisp, immediate semantic feedback;
3. **earned milestone** — stronger but still controlled ceremony.

Constant celebration makes meaningful milestones cheaper.

### Reporting that an action did not happen

Atlas has two live regions, and the split between them is a design decision, not an implementation detail.

- `#live-status` is visually hidden and carries routine progress narration: selection changes, answer outcomes, round transitions.
- `#app-notice` is **visible**, and carries anything telling the learner an action did not complete: geometry that failed to load, a scope with nothing to practise, a country name the Neighbours field cannot resolve.

Reporting a failure only through the hidden region is a silent dead tap for every learner not using a screen reader. The notice is a bottom-anchored status strip in the wrong-answer colour family, never a modal: it does not block the surface it is reporting on, it carries its meaning in words rather than colour, it can be dismissed, and it clears itself on navigation.

Launching a round behind a lazy geometry import also shows a busy state on the control that was pressed, and releases it again if the launch fails.

## Layout foundations

### Mobile first

Phone portrait is the primary design context.

Short landscape must be deliberately supported rather than treated as an afterthought.

### Primary selection

Do not use horizontal scrolling for primary navigation or scope selection.

Navigation should be immediately scannable and support large touch targets.

**Navigation is mode-first, not scope-first.** The learner chooses *what they are practising* before *where*, because the mode is the durable intent and geography is the parameter. Three screens:

1. **Home** — a single-column stack of four tactile mode cards: Flags, Locations, Outlines, Neighbours. Each names the mode, states the coverage it currently teaches (`World · 195 countries`, `Africa · 54 countries`), and carries its evidence strip, so accumulated progress is visible the moment the app opens. Home starts no round: it commits to a mode and nothing else.
2. **Domain continent index** (`/{domain}`) — the six continents *for that mode* as full-width stacked geography rows carrying the continent silhouette, country and region counts, and live evidence. A supported row opens that continent's launcher; it does not start a round. Flags additionally offers deliberate world Learn/Play actions above the list because Flags is the only mode whose curriculum is the world.
3. **Continent launcher** (`/{domain}/{continent}`) — the shared launcher: one deliberate Play action for the active scope, a full-width region list with visible progress, and Learn. Selecting a region retargets the same screen and the same Play/Learn actions rather than opening another page or bypassing the launcher.

This supersedes the scope-first Home → continent → region-card journey, and with it the region card's four-domain launch row: once the mode is already chosen, a region only needs one Play. The mode-first order also lets an Africa-only mode state its own coverage honestly instead of being discovered continent by continent.

Mode cards and post-mode geography selection both favour vertical scanability on phone portrait. Mode cards stack in one column, and continent/region selection remains a single full-width stack at ordinary phone widths. Short landscape (≥700px wide, ≤600px tall) may reflow constrained surfaces deliberately where it improves fit, but desktop density is not the phone default.

Each continent tile uses a neutral, flat silhouette generated by `scripts/generate-continent-icons.mjs` from the same pinned Natural Earth country source as production cartography. The generator removes island detail that does not survive navigation-icon scale, while small optical transforms compensate for the continents' very different aspect ratios. These routine navigation marks carry no purple, gold, shield or ceremonial treatment. The retired Progress screen reused the same recognisable source-derived geography, upgrading it into the materially richer purple/gold crest treatment only for an earned continent completion; that treatment currently has no live surface.

A continent a mode has not shipped still appears — as an honest shell: dashed border, muted silhouette, a "Coming soon" note, no Play control and no action of any kind. Shells are deliberately **shorter** than shipped tiles. An Africa-only mode lists one continent it can teach and five it cannot, and at equal height the absent curriculum would own the screen; demoting them keeps the list honest without letting what is missing outweigh what the learner came to play.

### Region cross-domain competency

Region cards are full-width scope-selection surfaces inside one mode's launcher: region identity, country count, a single-colour progress strip, a purple mark once that region's mastery in the launcher's current domain is earned, and an explicit selected state. They do not start a round themselves and do not need to become achievement dashboards; the launcher's normal Play/Learn actions operate on whichever scope is selected. The strip is a plain Atlas Blue fill against a neutral track — no segmented brown "learning" state, no printed strong/learning/unseen counts; a country counts toward the fill the moment it has been answered correctly once.

The four-domain launch row that region cards carried under scope-first navigation is retired. The later row-level Quick Play experiment is also retired: once a mode is chosen, continent and region rows answer only the geographic-selection question, while deliberate Play/Learn remains on the active launcher. This keeps each surface responsible for one decision and avoids tiny trailing action cells. The routine icon set's labelling requirement (see [Resolved by Tactile Atlas](#resolved-by-tactile-atlas), item 8) is unchanged and still binding: Home names all four modes in visible text beside their glyphs.

The dedicated Progress surface that used to own the expanded cross-domain achievement reading — each region's four domain identities as one competency set, with neutral supported, purple earned and clearly unavailable states — has been retired with no replacement; a region card only ever shows its own launcher's single domain, not all four side by side. What the region row now shows instead: a purple mark for that one domain's earned mastery, and a restrained gold row outline once the region is complete across every domain it supports (read via the existing achievement state, not a new domain concept).

### Learning surfaces

In active rounds, the learning object should dominate available space:

- flag;
- map;
- outline;
- neighbour geography.

Answer controls should remain easily reachable, especially on mobile.

### Results

Treat analytics as compact, readable information surfaces.

The dedicated Progress screen (mastery-first: geographic earned state as the whole surface, with reset/storage utilities last) has been retired entirely, including its reset-all-progress control. There is no dedicated learner-facing surface for earned mastery as its own screen; the active launcher's normal Play/Learn actions remain the way to start a session, and earned mastery is instead read directly off the region/continent rows it already lists. Live country evidence remains distinct from persistent earned achievement, including the earned-but-now-due case.

A single 100%-correct Play round also earns a one-off "Perfect round" result-screen ceremony — a restrained gold accent on the score card, not the permanent purple/gold row treatment above. It takes a second consecutive perfect round in the same region × domain to earn that durable mark; see `docs/architecture/earned-achievements.md`.

Prefer stacked/grouped information over spreadsheet-like tables.

Avoid turning every statistic into a separate promotional card.

## Maps and cartography

The visual redesign must not create a second cartographic system.

Production maps continue to use canonical geometry/topology and the existing projection/data pipeline.

App chrome and map styling can evolve together, but cartography has distinct functional needs for:

- land/water differentiation;
- context geography;
- targets;
- solved/revealed states;
- borders/coastlines;
- lakes/rivers;
- labels/callouts.

Issue #20 owns the shared cartographic colour/contrast refinement.

Do not theme maps by continent flag palette.

## Typography

Typography must remain highly legible, mobile-safe and compatible with British-English product copy.

The system sans stack ships unchanged from the pre-Atlas shell — no display or novelty face was introduced. Personality comes from weight and tracking, not a font swap: screen titles and the brand name sit at 800 weight with tight negative letter-spacing (`-.03em` to `-.045em`), scaling with `clamp()` so they hold hierarchy from narrow phones up. Body copy and list labels stay at the existing weight; the contrast is deliberately concentrated at the top of the hierarchy rather than spread everywhere.

Requirements that remain:

- body text must remain comfortable at phone scale;
- metadata must not shrink into unreadability;
- comparative numerals should use tabular figures where useful;
- headings should create clear hierarchy without dominating the geography;
- avoid novelty type that makes the product feel themed rather than durable.

## Shapes, radius and elevation

A tiered radius system, not one universal value:

```yaml
radius:
  compact: 8px   # badges, keycaps, answer-key chips
  control: 12px  # buttons, inputs, list rows
  tile:    18px  # domain/region interactive tiles, launcher status card
  hero:    24px  # the results score card
```

This replaces the pre-Atlas 6px/9px pair outright: `--radius-sm` and `--radius-md` are redefined to 8px/12px rather than kept at their old values, so anything still reading those custom properties picks up the new scale automatically.

Elevation is restrained and functional, not decorative:

- **standing depth** — a soft two-layer shadow (`--depth-tile`) on interactive tiles and the launcher status card, distinguishing "this is a surface you can act on" from flat chrome;
- **press depth** — the solid bottom-shadow-that-collapses model described under [Interaction character](#interaction-character), reserved for primary buttons and answer buttons;
- **arcade depth** — a hard-edged exception (`--depth-arcade`: `2px solid` border plus `2px 2px 0` offset shadow, both in `--text`) used exclusively on Home's mode cards, collapsing via diagonal translate rather than vertical drop; deliberately the one place this document's rejection of "thick black borders and hard offset shadows" does not apply, reserved for the product's single highest-frequency decision. Hovering lifts the card by 1px into a 3px offset before the press collapses it;
- **flat** — rows, lists and ordinary chrome carry a hairline border and no shadow.

Selected state (a region row) is a tint fill plus an inset accent bar, not elevation — selection and elevation answer different questions and should not be conflated.

Achievement presentation is intentionally distinct from ordinary elevation: purple competency badges use colour + check state rather than extra shadow; complete regions use restrained gold framing; continent crests promote the source-derived silhouette into a rare purple/gold object; the World Crown is singular and absent until earned.

## Motion

Motion should explain state and improve physicality, not become ambient decoration.

Requirements:

- transform/opacity are preferred for routine motion;
- interactions should feel immediate;
- milestone animation may be stronger than routine feedback;
- avoid long blocking celebrations;
- respect `prefers-reduced-motion`;
- keep focus and page position stable through rerenders;
- never let animation interfere with answer timing or accessibility announcements.

Routine transitions use short `ease` timing rather than springs: 90–160ms depending on the property, colour and border changes slightly slower than shadow and transform. There is no bounce or overshoot anywhere in the shipped interaction set — physicality comes from the press-and-collapse depth model, not from spring easing. `prefers-reduced-motion: reduce` zeroes every transform-based press state and all transition/animation durations globally, rather than leaving individual components to opt out.

## Accessibility

Every visual state must remain understandable without colour alone.

Preserve:

- visible keyboard focus;
- 44px minimum practical touch targets where controls require it;
- non-colour state cues;
- answer-safe accessible names;
- screen-reader announcements through stable live regions;
- reduced-motion alternatives;
- readable zoomed text;
- mobile safe areas;
- stable focus after state changes;
- deliberate short-landscape behaviour.

Gold should generally be treated as an accent rather than small text. Use dark text on gold surfaces where text is necessary and contrast supports it.

## Product language

All learner-facing copy uses modern British English (`en-GB`).

The learner-facing product name is **Atlas**.

The learner-facing domain is **Neighbours** and the assessment action is **Play**.

Stable technical identifiers may retain legacy spelling/naming for compatibility.

## Design anti-patterns

Do not introduce:

- XP/coin/reward economies;
- arbitrary streak rewards;
- achievement spam;
- crowns on ordinary objects;
- gold as generic decoration;
- continent/region colour themes;
- decorative geography backgrounds that compete with real maps;
- glassmorphism for its own sake;
- bento/dashboard styling that fragments the learning hierarchy;
- a parallel icon system of emoji/Unicode symbols;
- framework/tooling changes justified only by fashion.

## Implementation constraints

Tactile Atlas remains centred in `atlas-theme.css`, the override sheet loaded after the hand-authored base/domain styles and responsible for shared semantic tokens and product-wide tactile primitives. Focused surfaces may add a small dedicated sheet when that keeps ownership clear; #56 added `progress.css` immediately before `atlas-theme.css` on that principle, but it was removed along with the Progress screen it styled.

No React, Tailwind or other UI/CSS framework was introduced to build this. The existing framework-free TypeScript view layer, routing, and `data-action` interaction model are unchanged — this remains an extension of the existing architecture, not a framework migration.

## Resolved by Tactile Atlas

The items this document previously deferred are resolved and shipped through the Tactile Atlas system and focused follow-up surfaces:

1. overall visual personality and reference family — Tactile Atlas, see [Character](#character);
2. shape/radius language — four-tier squircle scale, see [Shapes, radius and elevation](#shapes-radius-and-elevation);
3. control depth and press physics — collapsing bottom-shadow depth, plus a scoped hard-offset arcade tier for the Home/continent/region journey, see [Interaction character](#interaction-character);
4. navigation composition — mode-first Home → per-domain continent index → continent launcher, see [Primary selection](#primary-selection);
5. typography — system sans retained, personality via weight/tracking, see [Typography](#typography);
6. motion intensity — short `ease` transitions, no springs, full reduced-motion coverage, see [Motion](#motion);
7. **region cross-domain composition** — implemented per #35, see [Region cross-domain competency](#region-cross-domain-competency).

Selected and implemented in #40:

8. **ordinary icon style** — Phosphor Bold is the routine family for navigation, controls, utilities and domain identity. `src/ui/components/icons.ts` remains Atlas's semantic adapter and vendors only the selected paths from pinned `@phosphor-icons/core` assets, so the production build does not ship the catalogue. The domain mapping is Flags → `Flag`, Locations → `MapPin`, Outlines → `Polygon`, and Neighbours → `Intersect`. At 24px, `FlagBannerFold` read as a ribbon, `MapPinArea` added unnecessary detail, `Island` depicted a tropical palm-tree scene, and `Intersection` reduced to an ambiguous ∩. `Intersect`, paired with the visible Neighbours label, communicates two geographic areas meeting clearly enough that no Atlas-specific modification is needed. That pairing is a requirement of the choice, not an incidental fact about one surface: any routine surface repeating the four domain glyphs owes the learner their names. Home labels each mode card directly; the retired Progress mastery surface, which repeated the same four glyphs on every region, named them once in a legend above the list rather than labelling roughly a hundred badges — the same rule should apply to any future surface with the same repetition. Fill may express a real state change in future, but is not a second decorative style. Do not mix Phosphor with Lucide or a parallel custom routine set. Custom artwork remains reserved for the Atlas brand mark and prestige.

Implemented through #34 and #56, then retired along with the Progress screen (historical record of that composition, not current behaviour):

9. **region mastery treatment** — the shared domain glyph is neutral when supported/unearned, purple with a check cue when earned, and clearly unavailable when curriculum is unsupported;
10. **complete-region prestige** — restrained gold framing only, with no region emblem or crown;
11. **continent crest** — source-derived continent silhouette promoted into a rare purple/gold treatment only for canonical continent completion;
12. **World Crown** — custom Atlas Crown artwork rendered only when canonical world completion is earned; no locked-Crown decoration.

What actually ships today, on the existing region/continent launcher rows rather than a dedicated Progress screen:

13. **region mastery mark** — a small purple mark beside the region's name, scoped to the launcher's one active domain, once that region × domain has earned two consecutive perfect full-region Play rounds (not per-country evidence accumulation);
14. **complete-region / complete-continent prestige** — the same restrained gold row-outline treatment (`.region-row--complete` / `.continent-row--complete`) for both tiers; no separate crest artwork yet;
15. **Perfect round ceremony** — a single 100%-correct Play round (any scope) earns a one-off restrained gold accent plus a "Perfect round" label on that round's results screen, independent of the durable mastery mark above.

Still open by choice rather than missing semantics:

16. **milestone ceremony** — the three-tier feedback-intensity model in [Feedback intensity](#feedback-intensity) is decided, but Atlas does not yet persist a presentation-only “seen” state for one-time mastery/crest/Crown reveals. Static earned-state presentation is the production baseline until a focused ceremony issue demonstrates value without reward spam.
17. **continent crest / World Crown artwork** — the source-derived silhouette-crest and custom Atlas Crown treatments described in 11–12 have no live surface; item 14's flat gold outline is the current stand-in.
