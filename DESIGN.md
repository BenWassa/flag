# Atlas Design System

## Status

**The selected visual direction is Tactile Atlas, and it is implemented.**

The design exploration that this document previously deferred to has happened. Shape language, radius scale, elevation, press physics, typography, navigation composition and motion are now decided and shipped in `atlas-theme.css`, which layers over the existing hand-authored sheets rather than replacing them.

The earned-achievement model is also implemented. #34 supplies persistent region × domain Mastery, complete-region, continent-completion and World Crown state; #56 resolves the learner-facing Progress composition for those states. Region/domain competency uses the shared domain glyph with purple + a check cue when earned, complete regions receive restrained gold treatment, complete continents upgrade their source-derived silhouette into a purple/gold crest, and the custom Atlas Crown appears only when world completion is genuinely earned. Concrete one-time milestone ceremony remains optional future polish; the static achievement hierarchy is no longer unresolved.

The previously shipped flat “atlas index” aesthetic is superseded.

### Character

Tactile Atlas is an adult, tactile geography-learning product: more physical and memorable than a flat atlas index, but quieter and more disciplined than reward-driven learning UI or neo-brutalism. Cool near-white canvas, crisp light surfaces, Atlas Blue as the sole ordinary action family, disciplined squircle tiers rather than pill-everything, shallow physical depth on primary controls, and geography left as the dominant visual material.

Explicitly rejected as a general idiom: childlike rounded display faces, emerald or amber as generic action colours, XP/coin/streak economies, giant radii on every container, glassmorphism, bento dashboards, and gesture-only navigation. Thick black borders and hard offset shadows are rejected everywhere except one deliberate, contained exception — the Atlas arcade tier under [Interaction character](#interaction-character), covering Home and the continent/region scope-selection screens — because that journey is the single highest-frequency path through the product and earns a harder tactile signature than ordinary chrome.

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

Earned competency becomes purple. On the Progress mastery surface it uses the shared domain glyph in a compact purple badge with a check cue so the state does not rely on colour alone. Avoid shield-within-shield designs and unnecessary heraldic complexity.

### Complete region

When all required regional domain competencies are complete, use a restrained **gold accent or border**.

Do not add a separate region emblem, medal or crown.

Keep useful scope information such as country count.

Do not show `100%` or `x/x` merely to restate completion.

### Complete continent

Award a **continent crest** based on the source-derived continent silhouette.

The Progress implementation reuses the generated Natural Earth silhouette and promotes it into a mastery-purple field with restrained prestige-gold framing only when canonical `crestEarned` is true. Incomplete continents retain neutral geographic identity rather than showing decorative locked crests.

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
- **tiles, icon buttons and row play controls** — no standing depth; they translate down 1px and darken slightly;
- **Atlas arcade tier** — a scoped exception to the three tiers above: a `2px solid` border in `--text` plus a hard `2px 2px 0` offset shadow (no colour, no blur), collapsing on press by translating diagonally to `(2px, 2px)` rather than dropping vertically. This covers the three scope-first Atlas surfaces (Home's continent list, the continent's region list, and the region's domain-play grid), because together they form one continuous scope-selection journey and a tone shift partway through it would read as a broken transition rather than a hierarchy signal. Every domain launcher and ordinary tile reached *after* a domain is chosen (region rows inside a launcher, the launcher status card) keeps the soft `--depth-tile` shadow described under [Shapes, radius and elevation](#shapes-radius-and-elevation).

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

**Navigation is scope-first, not domain-first.** Home lists the six continents as a single-column stack of tactile cards; choosing one opens that continent's region list. Each region card is itself the cross-domain surface: it names the region, its country count, and carries one direct Play shortcut per learning domain, so choosing a domain starts a round immediately — there is no separate region-detail screen to pass through first. This resolves #35's cross-domain region surface one level higher than the original Tactile Cartographic mock-up (`research/UI_Mockup_Gemini.html`) proposed; the mock-up's dedicated region screen was built, then retired once the region card's own domain-launch row made it redundant. Home does not add a competing World Flags footer action; it stays focused on the six geographic scope choices.

Continent and region cards stack in a single column on phone portrait so identity, country count and (on regions) the four domain-launch shortcuts stay full width and scannable; short landscape (≥700px wide, ≤600px tall) switches the continent/region list to two columns, keeping the same cards rather than introducing a second layout.

Each Home continent card uses a neutral, flat silhouette generated by `scripts/generate-continent-icons.mjs` from the same pinned Natural Earth country source as production cartography. The generator removes island detail that does not survive navigation-icon scale, while small optical transforms compensate for the continents' very different aspect ratios. These routine navigation marks carry no purple, gold, shield or ceremonial treatment. Progress reuses the same recognisable source-derived geography, but only an earned continent completion upgrades it into the materially richer purple/gold crest treatment.

Continents and regions without generated geometry beyond Flags still appear — as honest shells. A continent card shows a muted mark and a "Flags only" note instead of a country-count subtitle; a region card's unsupported domain-launch icons render inert, in canvas grey with a "not available yet" label, never as a launcher.

### Region cross-domain competency

Region cards remain fast scope-selection/game-entry surfaces: region identity, country count, and one Atlas Blue domain launcher per learning domain start rounds directly. They do not need to become achievement dashboards.

Each launcher is an Atlas Blue mark **plus its domain name in visible text**. The label is not optional decoration: it is the condition under which the routine icon set was accepted at all (see [Resolved by Tactile Atlas](#resolved-by-tactile-atlas), item 8), and Outlines and Neighbours are not identifiable from a 22px Polygon or Intersect mark alone. The four launchers sit in an equal four-column grid capped at 340px, so they fill a phone card and still read as one cluster on a wide one. An unsupported domain keeps its label at ordinary metadata contrast and marks its state with a dashed, depthless mark — the same dashed vocabulary Progress uses for unsupported domain badges — plus a "not available yet" accessible label.

The dedicated Progress surface owns the expanded cross-domain achievement reading: each region shows the same four domain identities as one competency set, with neutral supported, purple earned and clearly unavailable states; complete regions receive the restrained gold treatment. This keeps the high-frequency navigation path fast while giving accumulated mastery one deliberate place to carry more visual weight.

### Learning surfaces

In active rounds, the learning object should dominate available space:

- flag;
- map;
- outline;
- neighbour geography.

Answer controls should remain easily reachable, especially on mobile.

### Progress and results

Treat analytics as compact, readable information surfaces.

Progress is specifically **mastery-first**: geographic earned state comes before operational `Practise next` guidance, detailed country evidence is progressively disclosed, and reset/storage utilities come last. Live country evidence remains distinct from persistent earned achievement, including the earned-but-now-due case.

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
- **arcade depth** — a hard-edged exception (`--depth-arcade`: `2px solid` border plus `2px 2px 0` offset shadow, both in `--text`) used exclusively on the scope-first Atlas surfaces, collapsing via diagonal translate rather than vertical drop; deliberately the one place this document's rejection of "thick black borders and hard offset shadows" does not apply, reserved for the product's single highest-frequency journey. On a region card's domain launchers the border and offset belong to the circular mark rather than the button, so the button can also carry its text label; hovering lifts the mark by 1px into a 3px offset before the press collapses it;
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

Tactile Atlas remains centred in `atlas-theme.css`, the override sheet loaded after the hand-authored base/domain styles and responsible for shared semantic tokens and product-wide tactile primitives. Focused surfaces may add a small dedicated sheet when that keeps ownership clear; #56 adds `progress.css` immediately before `atlas-theme.css`, so Progress can own its mastery composition while the global Tactile Atlas layer remains authoritative for tokens and shared controls.

No React, Tailwind or other UI/CSS framework was introduced to build this. The existing framework-free TypeScript view layer, routing, and `data-action` interaction model are unchanged — this remains an extension of the existing architecture, not a framework migration.

## Resolved by Tactile Atlas

The items this document previously deferred are resolved and shipped through the Tactile Atlas system and focused follow-up surfaces:

1. overall visual personality and reference family — Tactile Atlas, see [Character](#character);
2. shape/radius language — four-tier squircle scale, see [Shapes, radius and elevation](#shapes-radius-and-elevation);
3. control depth and press physics — collapsing bottom-shadow depth, plus a scoped hard-offset arcade tier for the Home/continent/region journey, see [Interaction character](#interaction-character);
4. navigation composition — scope-first Home → continent → region card with direct domain-launch shortcuts, see [Primary selection](#primary-selection);
5. typography — system sans retained, personality via weight/tracking, see [Typography](#typography);
6. motion intensity — short `ease` transitions, no springs, full reduced-motion coverage, see [Motion](#motion);
7. **region cross-domain composition** — implemented per #35, see [Region cross-domain competency](#region-cross-domain-competency).

Selected and implemented in #40:

8. **ordinary icon style** — Phosphor Bold is the routine family for navigation, controls, utilities and domain identity. `src/ui/components/icons.ts` remains Atlas's semantic adapter and vendors only the selected paths from pinned `@phosphor-icons/core` assets, so the production build does not ship the catalogue. The domain mapping is Flags → `Flag`, Locations → `MapPin`, Outlines → `Polygon`, and Neighbours → `Intersect`. At 24px, `FlagBannerFold` read as a ribbon, `MapPinArea` added unnecessary detail, `Island` depicted a tropical palm-tree scene, and `Intersection` reduced to an ambiguous ∩. `Intersect`, paired with the visible Neighbours label, communicates two geographic areas meeting clearly enough that no Atlas-specific modification is needed. That pairing is a requirement of the choice, not an incidental fact about one surface: any routine surface repeating the four domain glyphs owes the learner their names. Region cards label each launcher directly; the Progress mastery surface, which repeats the same four glyphs on every region, names them once in a legend above the list rather than labelling roughly a hundred badges. Fill may express a real state change in future, but is not a second decorative style. Do not mix Phosphor with Lucide or a parallel custom routine set. Custom artwork remains reserved for the Atlas brand mark and prestige.

Implemented through #34 and #56:

9. **region mastery treatment** — the shared domain glyph is neutral when supported/unearned, purple with a check cue when earned, and clearly unavailable when curriculum is unsupported;
10. **complete-region prestige** — restrained gold framing only, with no region emblem or crown;
11. **continent crest** — source-derived continent silhouette promoted into a rare purple/gold treatment only for canonical continent completion;
12. **World Crown** — custom Atlas Crown artwork rendered only when canonical world completion is earned; no locked-Crown decoration.

Still open by choice rather than missing semantics:

13. **milestone ceremony** — the three-tier feedback-intensity model in [Feedback intensity](#feedback-intensity) is decided, but Atlas does not yet persist a presentation-only “seen” state for one-time mastery/crest/Crown reveals. Static earned-state presentation is the production baseline until a focused ceremony issue demonstrates value without reward spam.
