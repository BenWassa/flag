# Flag Atlas Design System

```yaml
colors:
  canvas: "#F5F7FA"
  surface: "#FFFFFF"
  surface-subtle: "#EEF1F5"
  text: "#101318"
  text-muted: "#5A6472"
  line: "#D6DCE4"
  line-strong: "#AAB4C1"
  action: "#1F4FD6"
  action-hover: "#183CA0"
  action-soft: "#E8EEFF"
  mastered: "#137A55"
  mastered-soft: "#E7F4ED"
  learning: "#9A5B00"
  learning-soft: "#FFF1D6"
  unseen: "#6B7480"
  wrong: "#B42318"
  wrong-soft: "#FCE8E6"
typography:
  family: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  body: "16px / 1.45"
  screen-title: "32px / 1.08 / 760"
  section-title: "18px / 1.2 / 700"
  control: "14–16px / 650–700"
rounded:
  small: "6px"
  medium: "9px"
spacing:
  base: "4px"
  scale: [4, 8, 12, 16, 20, 24, 32, 40]
components:
  min-touch-target: "44px"
  standard-control-height: "50px"
  answer-height: "58px"
```

## Overview

Flag Atlas is an Operate surface. Its visual thesis is **the flag is the color system**: national flags are the richest visual objects on screen, while the application behaves like a precise atlas index / international identification desk around them. The interface is quick, neutral, legible, and confident without adding game chrome.

The system rejects the former warm-paper/editorial-card direction. It also avoids generic bento/card grids, decorative map textures, display serifs in operational UI, ornamental labels above headings, glass effects, and reward-style celebration.

## Colors

The application uses cool near-white neutrals and graphite text so flags remain visually dominant. `action` blue is reserved for primary actions, current selection, focus, and round progress. It is not a decorative accent.

Learning semantics remain stable everywhere:

- **Unseen:** neutral gray and an outlined state mark.
- **Learning:** amber.
- **Mastered:** green.
- **Wrong/error:** red.

Every state is also expressed in text; color is reinforcement only. Soft state backgrounds are allowed only where immediate answer feedback benefits from them.

## Typography

Use one system sans-serif family across headings, controls, metadata, and data. This is a task UI: consistency and scan speed outrank display personality.

- Screen titles: 2rem, tight but readable tracking, strong weight.
- Section titles: 1.125rem.
- Operational copy: 0.875–1rem.
- Metadata: 0.6875–0.75rem only when genuinely secondary.
- Numerals that compare across rows use tabular figures.
- Do not introduce a display serif, monospace-as-costume, or fluid heading scale into the core product UI.

## Layout

The core page width is 860px with a 4px spacing base. Related controls group tightly; distinct sections separate by 24–32px.

Home is an **atlas index**, not a grid of cards:

1. compact product top bar;
2. World learning state and direct Learn/Test actions;
3. one scan-friendly continent list with progress encoded inside each row.

Scope pages preserve the same hierarchy: title → status → Learn/Test → regions or country ledger. Lists use rules and proximity rather than individual containers.

Quiz is an immersive task surface. The flag owns the flexible central region; answers remain reachable at the bottom on portrait mobile. At wider widths answers become 2×2. On short landscape screens, the flag and answer column sit side-by-side.

## Elevation & Depth

The product is predominantly flat. Rules, spacing, and surface contrast establish hierarchy.

Flags may use a very light shadow and hairline border to remain legible against the canvas, especially white flags. Ordinary buttons, lists, panels, and navigation do not use shadows.

## Shapes

Corners are modest:

- 6px for compact badges and keycaps.
- 9px for controls.

Pills are reserved for cases where the semantic shape genuinely benefits from them; current core UI does not rely on pills. Large 18–28px card radii are outside the system.

## Components

### Progress strip

A 6px stacked horizontal bar: green Mastered, amber Learning, neutral remainder Unseen. Accompany it with textual counts.

### Primary / secondary buttons

Primary uses action blue with white text. Secondary is white with a stronger neutral border. Tertiary actions are text-forward and visually quiet. All controls provide focus, hover where hover exists, active, and disabled behavior.

### Atlas rows

Continent and region navigation use full-width rows separated by horizontal rules. Identity is left aligned, progress/status is secondary, and the chevron is the only directional icon.

### Answer choices

Four large buttons with numeric 1–4 keycaps. Numeric keys activate choices on desktop keyboards. Learn feedback marks both correct and selected-wrong states with text plus semantic color. Test mode withholds correctness.

### Learning ledger

Flat rows with a lazy-loaded flag thumbnail, country identity, evidence summary, and textual state badge. Filters use an underline-tab treatment rather than a pill container.

## Do’s & Don’ts

### Do

- Let actual flags provide visual richness.
- Prefer rules and proximity over boxes around every group.
- Keep Learn and Test visible and direct.
- Preserve 44px minimum hit areas and mobile safe areas.
- Use state color consistently and pair it with text.
- Keep routine motion within roughly 100–220ms and tied to state.
- Test small-height landscape as well as ordinary portrait widths.

### Don’t

- Add streaks, XP, coins, confetti, mascots, or decorative achievements.
- Reintroduce warm cream + serif editorial styling.
- Add decorative world-map/grid backgrounds.
- Turn continents, statistics, or result summaries into repetitive rounded cards.
- Tint the interface from the active flag.
- Use emoji or Unicode glyphs as interface icons where shared SVG icons exist.
- Make mastered flags dominate ordinary Learn sessions simply to show progress.
