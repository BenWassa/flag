# Flag Atlas Design System

```yaml
colors:
  canvas: "#F5F7FA"
  surface: "#FDFEFF"
  surface-subtle: "#EEF1F5"
  track: "#E2E6EC"
  text: "#101318"
  text-muted: "#5A6472"
  line: "#D6DCE4"
  line-strong: "#AAB4C1"
  action: "#1F4FD6"
  action-hover: "#183CA0"
  action-soft: "#E8EEFF"
  on-action: "#F7F9FF"
  on-action-muted: "rgba(247,249,255,.8)"
  focus-ring: "rgba(31,79,214,.34)"
  mastered: "#137A55"
  mastered-soft: "#E7F4ED"
  mastered-line: "#82BCA3"
  learning: "#9A5B00"
  learning-soft: "#FFF1D6"
  unseen: "#626B78"
  wrong: "#B42318"
  wrong-soft: "#FCE8E6"
  wrong-line: "#DCA7A2"
  flag-line: "rgba(16,19,24,.10)"
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

Flag Atlas is an Operate surface. Its visual thesis is **the flag is the colour system**: national flags are the richest visual objects on screen, while the application behaves like a precise atlas index / international identification desk around them. The interface is quick, neutral, legible, and confident without adding game chrome.

The system rejects the former warm-paper/editorial-card direction. It also avoids generic bento/card grids, decorative map textures, display serifs in operational UI, ornamental labels above headings, glass effects, and reward-style celebration.

## Product language

All learner-facing copy uses modern British English (`en-GB`), including visible text, document titles, metadata, accessible names and live-region announcements. The learner-facing domain name is **Neighbours**. Stable technical identifiers such as `neighbors`, `/neighbors`, `neighbors.css`, CSS/API property names such as `color`, and existing persistence keys retain their required implementation spelling.

Use **practice** as a noun and **practise** as a verb. Country display names are governed separately by `docs/COUNTRY_NAMING.md`.

## Colours

The application uses cool near-white neutrals and graphite text so flags remain visually dominant. `action` blue is reserved for primary actions, current selection, focus, and round progress. It is not a decorative accent.

Learning semantics remain stable everywhere:

- **Unseen:** neutral grey and an outlined state mark.
- **Learning:** amber.
- **Mastered:** green.
- **Wrong/error:** red.

Every state is also expressed in text; colour is reinforcement only. Soft state backgrounds are allowed only where immediate answer feedback benefits from them.

No colour is written as a literal outside the token block at the top of `styles.css`. Neutrals are tinted rather than pure: `surface` is a near-white carrying a trace of the action hue, and `on-action` is an off-white rather than `#FFF`. Every text colour meets WCAG AA against the surface it sits on; `unseen` in particular is set at `#626B78` rather than a lighter grey because it must clear 4.5:1 on `canvas`.

## Typography

Use one system sans-serif family across headings, controls, metadata, and data. This is a task UI: consistency and scan speed outrank display personality.

- Screen titles: 2rem, tight but readable tracking, strong weight.
- Section titles: 1.125rem.
- Operational copy: 0.875–1rem.
- Metadata: 0.6875–0.75rem only when genuinely secondary. 11px is a hard floor; nothing in the product renders text below it, including on small screens. Where a label will not fit at 11px, the label is replaced by a mark plus visually hidden text.
- Numerals that compare across rows use tabular figures.
- Do not introduce a display serif, monospace-as-costume, or fluid heading scale into the core product UI.

## Layout

The core page width is 860px with a 4px spacing base. Related controls group tightly; distinct sections separate by 24–32px.

Home is an **atlas index**, not a grid of cards:

1. compact product top bar;
2. learning-domain index and direct entry points;
3. scan-friendly domain/scope lists with progress encoded inside each row.

Scope pages preserve the same hierarchy: title → status → Learn/Test → regions or country ledger. Lists use rules and proximity rather than individual containers.

Quiz is an immersive task surface. The geography task owns the flexible central region; answers or entry controls remain reachable at the bottom on portrait mobile. At wider widths multiple-choice answers become 2×2. On short landscape screens, the learning visual and answer controls can sit side-by-side where the domain calls for it.

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

Primary uses action blue with white text. Secondary is white with a stronger neutral border. Tertiary actions are text-forward and visually quiet. All controls provide focus, hover where hover exists, active, and disabled behaviour.

### Atlas rows

Continent and region navigation use full-width rows separated by horizontal rules. Identity is left aligned, progress/status is secondary, and the chevron is the only directional icon.

### Answer choices

Four large buttons with numeric 1–4 keycaps. Numeric keys activate choices on desktop keyboards. Learn feedback marks both correct and selected-wrong states with text plus semantic colour. Test mode withholds correctness.

### Learning ledger

Flat rows with a lazy-loaded flag thumbnail, country identity, evidence summary, and textual state badge. Filters use an underline-tab treatment rather than a pill container. Every filter has an empty state that names the condition and says what produces rows, because three of the four filters are empty on a first run. The ledger is also where the mastery rule is stated in plain language, and where progress can be erased through a two-step inline confirmation rather than a modal.

### Flag frame

Flags come from a CDN, so every flag is wrapped in a frame that reserves its space and carries a fallback. When an image fails, the frame swaps to a dashed placeholder that says the image is unavailable, so a missing flag never becomes an unanswerable question with no explanation. Thumbnails show a mark plus visually hidden wording instead of shrinking the message below the type floor.

### Empty and degraded states

Every list that can be empty says why it is empty and what fills it. Every remote asset has a labelled failure state. Neither is left to render as blank space.

A scope with nothing to ask never opens a round. The learner stays on the screen they were on and the live region says why, because a quiz with no question in it is a dead end dressed as a task surface.

### Storage notice

Persistence is an enhancement, never a precondition for studying. When the browser refuses to store, the app keeps working from memory and says so once: a quiet rule and a sentence under the relevant overview, plus honest wording in the ledger footer, which otherwise claims a ledger is saved on the device that is refusing to save it. It is not an alert box and not a modal, because nothing is broken; the session simply will not outlive the tab.

### Data boundaries

Two boundaries do the defensive work so no view has to. A persisted ledger is rebuilt field by field on load, so a truncated write or a hand-edited record cannot reach a view as a thrown exception or a rendered `NaN`. All catalogue text is escaped on the way into markup, because the curriculum already carries `Australia & New Zealand` and `Côte d'Ivoire`. Inside those boundaries the views stay written against well-formed data.

## Do’s & Don’ts

### Do

- Let actual geography provide visual richness.
- Prefer rules and proximity over boxes around every group.
- Keep Learn and Test visible and direct.
- Preserve 44px minimum hit areas and mobile safe areas.
- Use state colour consistently and pair it with text.
- Keep routine motion within roughly 100–220ms and tied to state.
- Animate transform and opacity only. The round-progress bar scales on the X axis rather than animating its width.
- Test small-height landscape as well as ordinary portrait widths.
- Move focus deliberately after every re-render, and announce state changes through the persistent live region in `index.html` rather than through nodes that are themselves replaced.
- Give every view a history entry so the platform Back gesture moves within the app instead of leaving it.
- Size task visuals in `dvh` where a visible mobile URL bar could otherwise push controls below the fold.
- Read learning records through their domain helpers and resolve catalogue IDs before the template, never with `!` inside it.

### Don’t

- Add streaks, XP, coins, confetti, mascots, or decorative achievements.
- Reintroduce warm cream + serif editorial styling.
- Add decorative world-map/grid backgrounds.
- Turn continents, statistics, or result summaries into repetitive rounded cards.
- Tint the interface from the active flag.
- Use emoji, Unicode glyphs, or CSS-drawn shapes as interface icons. All marks, including the product mark, come from the shared SVG primitives in `src/ui/components/icons.ts`.
- Write a colour literal anywhere but the token block, or duplicate a domain rule such as the mastery goal in a view.
- Make mastered items dominate ordinary Learn sessions simply to show progress.
- Let a storage write escape into an interaction handler. Studying continues when persistence fails.
- Serve the app shell cache-first. The network decides which build runs; the cache is what makes it work offline.
