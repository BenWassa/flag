# Issue #21: Simplified IA and scope launcher planning

**Status:** Direction exploration, not implementation-ready
**Issue:** [#21 — Simplify learning IA and progressively reveal only the next decision](https://github.com/BenWassa/flag/issues/21)
**Register:** Product UI
**Primary context:** A learner using one hand on a phone for a short, spontaneous practice session, wanting to start without reading instructions.

## 1. Decisions already made

These decisions should be treated as constraints for the remaining design work:

1. The learner chooses the **game mode first**. Flags, Locations, Outlines, and Neighbours remain the primary entry points.
2. Learner-facing **Test** terminology becomes **Play** throughout the product.
3. Internal identifiers such as `test`, `/test`, `StudyMode = 'test'`, test commands, and stored data contracts remain stable unless a separate technical reason requires migration.
4. A direct continent-level Play path is required. Choosing a region must not be mandatory before starting.
5. Learn remains available but is visually quieter than Play.
6. Geography remains the dominant visual material. The launcher must not become a generic card dashboard or a miniature settings panel.

“Quick Play” is a shortcut into the existing Play activity, not a fifth learning domain or a new scoring mode.

## 2. Current problem

The current sequence is logically understandable:

```text
Home → game mode → continent → optional region → Learn / Test
```

Its weakness is not the ordering. It is the repeated transition and the amount of content shown at each stop. Scope pages currently combine several different jobs:

- navigation to regions;
- Learn/Test selection;
- mastery totals and progress legends;
- country ledgers;
- explanations of feedback and mastery;
- domain-specific rules and technical coverage details.

For an Africa-only mode, the learner also visits a screen containing a single “Africa” choice. That is not a meaningful decision.

## 3. Working IA

Keep the game-mode-first model, but turn scope choice and activity launch into one focused scope-launcher surface.

```text
Home
└── Game mode
    └── Scope launcher
        ├── Play the whole continent immediately
        ├── Select a region on the map
        │   ├── Play the selected region
        │   └── Learn the selected region
        └── Learn the whole continent
```

For Africa-only modes, selecting the game mode should open the Africa launcher directly. There should be no intermediate “1 continent available” screen.

For Flags, selecting the game mode should show the continent list. Each continent needs a clean direct-launch affordance. Selecting the body of a continent row opens its scope launcher; a compact Play icon may start continent-level Play directly.

## 4. Scope launcher concept

The working concept is an adaptive **scope launcher**, presented as:

- a centred dialog on sufficiently wide desktop screens;
- a near-full-screen dialog on portrait mobile;
- a two-column or side-by-side surface in short landscape;
- a normal routed page if usability testing shows that the overlay adds more complexity than it removes.

The launcher is one surface with three zones. The fractions below express hierarchy, not rigid CSS heights.

### Zone A: Quick Play, approximately 1/6

The visually strongest action starts Play for the currently selected scope.

Initial state:

```text
Quick Play Africa
```

After selecting West Africa on the map:

```text
Quick Play West Africa
```

Requirements:

- The scope name must always be present. Never show a context-free “Quick Play” button.
- The button must have an accessible name such as “Play West Africa locations”.
- A compact play icon can support the label, but the icon must not replace the label inside the launcher.
- Quick Play remains the existing Play rules: correctness is withheld until the round ends.

### Zone B: Interactive continent map, approximately 4/6

The continent silhouette is the main selection control. Countries are grouped and shaded by region.

Default state:

- the whole continent is selected;
- all regional divisions are visible;
- the top action targets the continent;
- the bottom Learn action also targets the continent.

Region selection:

- tapping or clicking a region selects it;
- the selected region receives more than a colour change, such as a strong boundary, direct label, and selected-state text;
- the top and bottom actions update to the selected region;
- a visible “All Africa” or equivalent control returns to continent scope;
- selecting a region does not immediately start a round.

The map is an orientation and selection control, but must not be the only available representation of regions. Small, fragmented, or geographically ambiguous regions require a labelled companion control.

### Zone C: Learn, approximately 1/6

Learn is a quieter text-forward action at the bottom:

```text
Learn Africa
```

or, after selection:

```text
Learn West Africa
```

It must remain a real 44px minimum target even if its visual styling is restrained. It should not look disabled or incidental.

## 5. Region-list alternatives inside the launcher

The map alone will not be sufficient for every continent. Three treatments should be prototyped.

### A. Map with direct labels

Region names sit on or immediately beside sufficiently large shapes.

Best for:

- Africa;
- South America, if labels remain legible;
- desktop layouts with adequate map size.

Risk: labels and touch targets become crowded in Europe, the Caribbean, and island-heavy Oceania.

### B. Map plus compact region rail

The map remains dominant, with a short labelled list beside it on wide layouts and below it on narrow layouts. Map and list selection are synchronised.

Best for:

- Europe and Asia;
- keyboard navigation;
- screen-reader equivalence;
- regions whose shapes are too small for reliable touch input.

Risk: the launcher can grow into a dense two-panel interface unless progress and metadata are aggressively limited.

### C. Map plus expandable region list

A “Choose a region” disclosure opens a simple list below the map. The map remains visible and reflects list selection.

Best for:

- mobile portrait;
- keeping the initial launcher visually calm;
- maintaining large touch targets.

Risk: expanding the list can push Learn below the viewport. The action zones may need to remain sticky within the dialog.

**Working recommendation:** use direct labels where they fit, backed by an always-programmatic region list. Visually expose the compact list or disclosure when continent geometry makes the map insufficient. Do not force one identical composition on every continent.

## 6. Continent-row Quick Play options

Option 2 from the IA exploration remains the selected family: continent rows provide direct Play access. Three executions need comparison.

### 6.1 Labelled trailing button

```text
[ Africa silhouette  Africa  12/54 ] [ Play ]
```

- Clearest behaviour.
- Visually heaviest when repeated six times.
- Best accessibility with the least explanation.

### 6.2 Compact play-icon button

```text
[ Africa silhouette  Africa  12/54 ] [ ▶ ]
```

- Cleaner scan and smaller visual footprint.
- Must retain a 44px target and an accessible name such as “Play Africa flags”.
- The icon should come from `src/ui/components/icons.ts`, not a Unicode glyph.
- The main row opens the scope launcher; the icon starts continent-level Play.
- The two actions must have clearly separated hit areas and focus states.

### 6.3 One row, select then reveal

```text
[ Africa silhouette  Africa  12/54 ]
                         ↓ selected
[ Africa silhouette  Africa  12/54 ] [ Learn ] [ Play ]
```

- Calmest resting state.
- Adds a tap and does not fully satisfy the fastest quick-play goal.
- Still useful as a fallback if split row interactions test poorly.

**Working recommendation:** prototype 6.2 against 6.1. The icon execution is preferred only if users consistently understand that the row and icon do different things.

## 7. Regional colour system: major open decision

Persistent regional colours would become geography semantics, not decoration. They would affect continent selectors, region feedback, legends, focus/selection treatment, future maps, and possibly learning materials.

The current product already reserves:

- blue for action, focus, and current selection;
- green for Mastered and correct;
- amber for Learning and partial feedback;
- red for wrong and error.

Reusing saturated blue, green, amber, and red as regional fills would create semantic collisions. A region map could accidentally look like progress or correctness feedback.

### Candidate palette strategy A: flag-spectrum cartography

Use familiar flag-colour families, but create separate, softened cartographic tokens:

| Geography role | Candidate family | Intent |
|---|---|---|
| North | blue | cool, upper-map anchor |
| East | crimson | strong distinction from North |
| South | green | lower-map anchor |
| West | gold | warm western counterweight |
| Central | violet | distinct fifth categorical role |

This is memorable and relates to the visual material of flags. It also carries the highest collision risk with action and learning-state colours.

### Candidate palette strategy B: atlas categorical palette

Use muted cartographic hues selected for equal visual weight rather than familiar semantic names, for example indigo, teal, ochre, terracotta, and mauve. These would feel more like an atlas and less like status feedback.

This is safer functionally, but less directly connected to typical flag colours.

### Composite and non-cardinal regions

The production taxonomy cannot be expressed by North/East/South/West alone:

- Southeast Asia;
- Caribbean;
- Andean;
- Atlantic;
- Southern Cone;
- Australia & New Zealand;
- Melanesia, Micronesia, and Polynesia.

Composite directions should not be represented by gradients or blended fills. Every canonical region needs one solid categorical token. The mapping should be explicit data, not inferred from its English name.

### Palette acceptance gates

Before selecting colours:

1. Build all 24 canonical regions into a token-mapping table.
2. Render Africa, Europe, Asia, North America, South America, and Oceania at actual mobile launcher size.
3. Check common colour-vision deficiencies.
4. Check greyscale and low-contrast viewing.
5. Ensure neighbouring regions remain distinguishable with boundaries even when their fills converge.
6. Ensure selected state is visible without colour.
7. Ensure regional fills cannot be mistaken for correct, wrong, Learning, or Mastered states.
8. Define separate light fill, strong edge, and optional label treatments for each geography role.

No region palette should enter `DESIGN.md` until these gates pass.

## 8. Responsive composition

### Portrait mobile

- Near-full-screen dialog rather than a small floating card.
- Header and dismiss/back control remain visible.
- Quick Play remains near the top.
- Map uses the largest practical central area.
- Learn remains reachable without precision tapping.
- If the region list expands, actions remain in context and safe-area padding is preserved.

### Short landscape

- Map on the left, current scope and actions on the right.
- Avoid forcing the map between fixed top and bottom sixth-height bands.
- The design must fit without requiring the learner to scroll merely to reach Play.

### Desktop

- Centred dialog with restrained elevation and no glass treatment.
- Width responds to continent aspect ratio within a sensible maximum.
- Portrait and landscape continents may use different internal grid arrangements.
- The background remains recognisable but inert.

## 9. Modal pressure test

A dialog is justified only if it makes scope selection feel faster while preserving context. It fails if it becomes a second application shell.

Required comparison:

| Criterion | Adaptive dialog | Routed full page | Inline row expansion |
|---|---:|---:|---:|
| Fast return to continent list | Strong | Moderate | Strong |
| Deep-link clarity | Requires route integration | Strong | Moderate |
| Mobile map space | Moderate/strong if near-full-screen | Strong | Weak |
| Keyboard and focus model | Manageable with native dialog | Straightforward | Complex with nested controls |
| Back-button predictability | Must be designed | Strong | Must be designed |
| Risk of UI density | High | Moderate | High |

Use a native `<dialog>` if the modal direction wins. The page behind it must be inert, focus must move into the launcher and return to its triggering continent, Escape must close it, and no nested modal may be introduced.

## 10. Routing model

The scope launcher must integrate with the typed routes from Issue #10 rather than existing only as ad hoc component state.

Questions to settle in the prototype:

- Does opening the Africa launcher push `/#/flags/africa`, allowing Back to close it?
- Does selecting West Africa push `/#/flags/africa/west-africa`, or remain local until Learn/Play starts?
- Should changing region create history entries, or replace the current launcher route to avoid a long Back sequence?
- For Africa-only modes, does `/#/locations` render the Africa launcher directly, or canonicalise to `/#/locations/africa`?

Working route recommendation:

- opening a continent is addressable and pushes its scope route;
- changing region within an already-open launcher replaces the current scope route;
- starting Learn or Play pushes the activity route;
- Back from a round returns to the exact selected launcher scope;
- Back from the launcher returns to the game-mode list;
- learner-facing Play continues to serialise as the stable internal `/test` activity.

## 11. Terminology migration

Change learner-facing “Test” to “Play” in:

- Home, domain, scope, quiz, and result views;
- document titles and route-title helpers;
- live-region announcements;
- accessible names and descriptions;
- empty, loading, degraded, and error states;
- README, PRD, and current routing documentation;
- copy-verification assertions.

Retain technical use of “test” where it describes automated tests, an internal activity identifier, a TypeScript mode value, an action name, a URL compatibility contract, or historical worklog text. Technical documentation should explain that `test` is the internal identifier for learner-facing Play.

## 12. Accessibility requirements

- The visual map and labelled region controls expose one synchronised selection model.
- Every region has a programmatic name and selected state.
- Colour never carries region selection or identity alone.
- Tiny geographic shapes receive alternative 44px controls; SVG geometry is not inflated misleadingly merely to create hit targets.
- Opening and closing the launcher manages focus deliberately.
- Play-icon buttons have explicit accessible names including game mode and scope.
- Reduced motion removes map zooming or sweeping transitions; state changes remain immediate.
- Browser Back, Escape, close, and the visible back affordance behave consistently.
- The background is inert while a modal launcher is open.

## 13. Motion direction

Motion should explain selection, not decorate the map:

- dialog entrance: short opacity and transform transition;
- region selection: boundary/fill emphasis within approximately 100–180ms;
- action-label update: subtle cross-fade, no width bounce;
- map reframing, if needed: short and fully disabled under reduced motion;
- no elastic, bouncing, spinning, or path-drawing spectacle.

## 14. Prototype sequence

Prototype the interaction as a sequence, not isolated screens:

1. Home → Flags.
2. Use the trailing Play icon to begin continent-level Play.
3. Return → open Africa launcher from the row body.
4. Play all Africa.
5. Select West Africa on the map → Play West Africa.
6. Select West Africa → Learn West Africa.
7. Open Locations → arrive directly in the Africa launcher.
8. Exercise Back/Forward and active-round refresh.
9. Repeat with Europe, Asia, North America, South America, and Oceania geometry.
10. Repeat via keyboard, screen reader semantics, portrait mobile, and short landscape.

## 15. Success measures

- Continent-level Play takes no more than two intentional taps from Home.
- Africa-only modes contain no one-choice continent screen.
- A new learner can distinguish row navigation from direct Play without instruction.
- The launcher contains one visually dominant action and one subordinate action.
- Region selection is understandable without a permanent explanatory paragraph.
- The selected scope is always named in text.
- No persistent learning-state legend appears in pre-round navigation.
- No existing domain, region, route, or stored progress becomes inaccessible.
- The design works for the hardest geometry, not only portrait-shaped Africa.

## 16. Decisions still required

1. Labelled Play button or compact Play icon on continent rows.
2. Whether the scope launcher is a dialog or routed full page on mobile.
3. Whether the region list is visible, disclosed, or only exposed when geometry requires it.
4. Flag-spectrum palette or independent atlas categorical palette.
5. Exact fixed mapping for all 24 canonical regions.
6. First-use Flags quick scope: World, a recommended continent, or no recommendation.
7. Whether Quick Play uses a fixed round size or the existing full-scope Play size.
8. Whether the region selection updates browser history with push or replace semantics.

## 17. Next design deliverables

Before implementation:

1. Low-fidelity interaction wireframes for the three launcher layouts.
2. A continent-row comparison: labelled Play versus icon Play.
3. Region-colour studies rendered on all six continents.
4. Mobile portrait and short-landscape prototypes.
5. Keyboard/focus and Back-button state diagrams.
6. A content-removal table for every affected pre-round view.
7. A confirmed design brief and implementation breakdown.
