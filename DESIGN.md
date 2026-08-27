# Atlas Design System

**Status:** Tactile Atlas production system for v1.0
**Mode:** operate
**Primary surface:** mobile-first geography learning

## Design thesis

**Geography is the content; the interface is the instrument.**

Atlas should feel tactile and game-like enough to make repeated retrieval satisfying, while remaining visually quiet, information-first and credible as a learning tool. The map, flag or outline should usually carry more visual weight than surrounding chrome.

The system is not decorative arcade UI. Interaction depth is purposeful; prestige is scarce; ordinary progress is understated.

## Locked principles

1. Mobile portrait is the primary composition; short landscape must remain usable.
2. System sans typography; no ornamental display type required for ordinary product UI.
3. Cool near-white canvas and graphite text form the neutral base.
4. Atlas Blue is ordinary action and selection.
5. Green and red are correctness feedback, not navigation identities.
6. Purple is durable region × domain Mastery.
7. Gold is scarce completion/prestige.
8. State must never rely on colour alone.
9. Geography identity comes from shape, label and hierarchy — not a continent, region or hemisphere colour taxonomy.
10. Use spacing, alignment, rules and proximity before adding cards or containers.
11. Modest radii and controlled depth; avoid glassmorphism, bento dashboards, decorative gradients and excessive elevation.
12. Tactile press physics should communicate control activation without toy-like bounce.
13. Progressive disclosure beats explanatory text blocks inside routine learning flows.
14. Achievement treatment must remain subordinate to the learning task until something genuinely scarce has been earned.

## Core palette

| Role | Token | Value | Meaning |
| --- | --- | --- | --- |
| Canvas | `--canvas` | `#F6F8FB` | cool near-white page ground |
| Primary text | `--text` | `#101318` | graphite text / strongest neutral |
| Atlas Blue | action | `#2563EB` | ordinary action, selection, focus family |
| Pressed blue | action pressed | `#1749B8` | physical depth/pressed state |
| Action tint | action soft | `#EAF0FF` | quiet selected/action background |
| Correct | semantic correct | `#137A55` | correct retrieval feedback |
| Wrong | semantic wrong | `#B42318` | incorrect retrieval feedback |
| Mastery | durable mastery | `#6D3FC0` | earned region × domain competency |
| Prestige | completion | `#E0AF2F` | scarce complete-region/continent prestige |

Colour is semantic, not geographic branding. Do not invent continent colours, region colours or hemisphere themes. Do not encode progress only as saturation/fill colour.

## Shape and radius

Current radius tiers remain:

- compact: `8px`;
- controls: `12px`;
- tiles/rows: `18px`;
- hero/large surface: `24px`.

Use the smallest tier that supports the component. Large rounded containers should not become the default page grammar.

## Depth and press physics

### Primary controls

Primary Atlas Blue controls use the established tactile depth and collapse on press with approximately `translateY(3px)`. The motion communicates a physical press rather than a springy bounce.

### Answer controls

Quiz answer controls use the shallower answer-button press treatment, approximately `translateY(2px)`, so the task remains fast and controlled.

### Interactive rows/tiles

Post-mode continent and region navigation uses the softer standing tile depth rather than hard arcade outlines.

### Home exception

Home intentionally has the strongest arcade treatment in the product. The four learning-domain cards may use the harder graphite border/offset-shadow treatment and diagonal press collapse. This is a scoped personality moment at the entry surface, not a licence to spread hard arcade chrome through launchers, quizzes or results.

Respect reduced-motion preferences and never make completion or correctness dependent on motion.

## Information architecture presentation

The current production hierarchy is mode-first:

`Home → domain continent index → continent launcher → Play`

- **Home**: four peer domain cards; no direct Play action.
- **Domain index**: full-width continent rows; supported rows navigate, unsupported rows are inert honest shells.
- **Continent launcher**: full-width whole-continent and region rows; tapping a row starts Play for that scope.
- **Learn**: one subordinate whole-continent action beneath the launcher list. Flags Learn opens the browse/reveal gallery; the other domains start their domain-appropriate Learn activity.

Do not document or restore the retired select-region-then-Play launcher as current behaviour. The richer map-first launcher remains a deferred exploration under #104, not an alternate production path.

## Geography surfaces

### Flags

Preserve true flag aspect ratios. The flag is the primary recognition object. Hidden Flags Learn cards must not leak country names through visible or accessible metadata before reveal.

### Locations

The map is the dominant object. Use canonical production geometry and keep geographic context legible. Pan/zoom controls and feedback must not compete visually with the map.

### Outlines

The silhouette is the dominant object. Normalisation may remove absolute scale/location cues but must preserve canonical shape and aspect ratio.

### Neighbours

The target geography and land-neighbour context remain primary. Input/suggestions are instruments for set retrieval, not the visual centre of the screen.

## Progress and learning evidence

Ordinary progress is intentionally low-prestige.

The current shared progress strip is a single Atlas Blue cleared bar representing countries/targets with successful retrieval evidence. It is not a segmented Mastery gauge and does not expose scheduler `x/y` counters.

Country-level states are learning/scheduling evidence. Routine UI may communicate unseen/learning/strong/due concepts where useful, but individual countries do not receive learner-facing Mastered prestige treatment.

The dedicated Progress screen is retired. Do not treat its former hierarchy, evidence browser or reset utility as current production composition. Progress now appears in Home, domain indexes, launchers and Results.

## Achievement presentation

Achievement hierarchy:

`country evidence → region × domain Mastery → complete region → complete continent → World Crown`

### Perfect round

A single miss-free Play result receives transient **Perfect round** treatment on Results. It is performance feedback, not persistent prestige and not equivalent to Mastery.

### Region × domain Mastery

Earned Mastery is purple and must include a non-colour cue. Compact launcher rows use accessible Mastered labelling without adding a purple star merely to repeat state inside navigation.

The qualification engine counts two consecutive perfect complete-region Play
results. It verifies exact supported-target coverage in every domain; sampled
rounds do not affect the qualification streak. Issue #108 closed the earlier
v1 defect.

### Complete region

A complete region receives a restrained brushed-metal gold edge while preserving the region name, trailing useful count, progress strip and accessible Mastery labelling. The material effect uses subtle light and shadow tones rather than a flat saturated yellow stripe. There is no separate region badge, medal, shield or Crown.

### Complete continent

A completed continent uses the dedicated continent trophy/crest artwork on the **domain continent index**, replacing the normal neutral continent silhouette for that completed row. The trophy assets are shipped and production-rendered.

Do not imply that a separate full-screen trophy ceremony ships today; it does not.

### World Crown

The World Crown is the highest and final prestige tier. The domain/state model supports and persists `worldCrown`, but v1 has no React learner-facing Crown renderer and the state cannot currently be earned because global four-domain curriculum is incomplete.

Do not show locked/decorative Crowns in routine states, and do not introduce a prestige tier above the Crown.

## Results and feedback

Results should answer what happened and what to do next, not become a reward dashboard.

- green: correct outcome;
- red: wrong outcome;
- domain-specific assisted/reveal states may use additional restrained feedback already established by that mechanic;
- Play can show live score/feedback where production currently does so;
- Perfect round is the one-off gold result treatment for a miss-free Play result;
- repeat and mistake review remain practical next actions.

Avoid confetti or repeated celebration for ordinary correct answers.

## Accessibility

- visible keyboard focus;
- keyboard operation where the mechanic permits it;
- no colour-only state;
- reduced-motion support;
- mobile safe-area awareness;
- readable zoomed text;
- no horizontal scrolling for primary selection flows;
- answer-safe accessible labels that do not leak solutions;
- stable focus restoration after route/question transitions;
- honest unavailable and asset-failure states.

Spatial geography exercises may have inherent accessibility limits; do not solve those by exposing the answer in accessible metadata.

## Product language

Learner-facing copy uses modern British English:

- **Neighbours**;
- **colour**;
- **centre**;
- **behaviour**;
- **practise** as a verb / **practice** as a noun.

Stable technical identifiers may retain American spelling or legacy naming where changing them would break routing/storage/API compatibility.

## Intentionally excluded aesthetics

Do not introduce by default:

- glassmorphism;
- bento/dashboard card grids;
- ornamental gradients as structure;
- decorative UI illustration that competes with geography;
- fantasy badges/ranks;
- XP/coin economies;
- constant crowns, medals or confetti;
- continent/region colour branding;
- large floating-card stacks when spacing/rules can establish hierarchy;
- exaggerated spring/bounce motion.

## Deferred design work

- #104 remains a **deferred product exploration** of a map-first launcher. Any region-colour or geography-encoded progress approach must explicitly reconcile current semantic-colour and non-colour accessibility rules before implementation.
- A richer earned-milestone ceremony is optional future work, not current production behaviour.
- A new dedicated Progress screen is not currently promised.
- World Crown learner-facing artwork/surface remains future work tied to a genuine world-completion product state.
