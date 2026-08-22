# Issue 74 — Full-continent Play entry in the continent view

## Status

Evaluation complete. **Recommended: add it**, as a distinct first row above the
region cards. No implementation shipped in this issue; the implementation notes
and verification expectations below are ready for a delivery issue.

---

# The finding that decides this

**Full-continent Play already exists and already works. It is simply not
reachable from the continent surface.**

Verified against the production `dist/` build in Chromium 151 (Playwright
1.62.1) at 390×844:

| path | result |
|---|---|
| `#/flags/africa` → the launcher's Play control | labelled "Play Africa", routes to `#/flags/africa/test` |
| `#/atlas/africa` (the continent surface) | 5 region cards, **0 continent-scoped controls** |

A continent-scoped `quick-play` control injected into the continent surface —
`data-action="quick-play" data-domain="flags" data-id="africa"` — routes to
`#/flags/africa/test` and renders the heading "Africa" with **no other change**.
`scopeForQuickPlay` → `routeForScopeId` → `scopeForId` already resolves continent
ids, because `scopeForId` checks `CONTINENTS` before `REGIONS`.

So this is an information-architecture gap, not a capability gap. The delivery is
additive markup on one surface: no routing change, no new session or state shape,
no new persistence, no new action vocabulary.

---

# Recommended IA pattern

```
Atlas continent surface  (#/atlas/{continent})

  ← Africa                                    ← topbar, unchanged

  ┌────────────────────────────────────────┐
  │  All of Africa                         │  ← continent row, first, distinct
  │  54 countries · 5 regions              │
  │  [Flags] [Locations] [Outlines] [Neighbours] │
  └────────────────────────────────────────┘

  ┌────────────────────────────────────────┐
  │  North Africa            6 countries   │  ← region cards, unchanged
  │  [Flags] [Locations] [Outlines] [Neighbours] │
  └────────────────────────────────────────┘
  … four more region cards
```

One continent row, above the regions, using the **same four-domain launch row**
as every region card, in a **visually distinct container**.

## Decision 1 — placement: first row, above the regions

Recommended, over the alternatives:

- **Above the regions (recommended).** Scope-first navigation is the documented
  model in `CLAUDE.md` and `DESIGN.md`: the broader scope reads before the
  narrower one. It also matches what is already on screen — the `h1` is already
  the continent name, so the widest scope is named at the top and then made
  actionable directly beneath it.
- **Below the regions.** Rejected. It buries the widest scope behind a
  variable-length list (3–5 cards depending on continent), and puts the "play
  everything" action in the position learners scan last.
- **In the topbar.** Rejected. It fights `#71`'s chrome-minimal direction, and
  the topbar's three-slot layout (back / title / balance) has no room for a
  four-domain row.
- **A separate screen.** Rejected outright. `#35` retired the region-detail
  screen as redundant once the card carried its own competency; adding a
  continent-detail screen would reintroduce exactly that mistake.

## Decision 2 — visual treatment: intentionally distinct, shared action row

Recommended: **a distinct container with an identical action row.**

The card list is homogeneous today — every card is a region. Dropping a card
labelled "Africa" into that list, styled identically, invites the reading that
Africa is a sixth region alongside North Africa and West Africa. That ambiguity
is the main risk in this change, and visual distinction is what removes it.

What should differ:

- full-width emphasis and a heavier identity line;
- a scope subtitle that names the breadth — `54 countries · 5 regions` — where a
  region card says only `6 countries`;
- a label that reads as an aggregate: **"All of Africa"**, not "Africa". This is
  the single cheapest disambiguator, and it is copy, not styling.

What must **not** differ:

- the four `domain-launch` buttons, their order, their icons and their labels.
  The domain vocabulary has to read identically at every scope, or the four
  domains stop being a stable mental model.

What must **not** be used:

- **gold** — reserved for scarce prestige (complete region/continent/world);
- **purple** — reserved for earned mastery.

Per `docs/product/colour-system.md` and `docs/product/gamification.md`, a
navigation affordance must not borrow either. Distinction here should come from
weight, size and copy — the existing `atlas-card` chassis plus a modifier — not
from the achievement palette. Atlas Blue remains the action colour.

---

# Risks and trade-offs

| risk | assessment |
|---|---|
| Read as a sixth region | The real risk. Mitigated by the distinct container plus "All of Africa" copy. |
| Implies a new mastery unit | Must not. `#35`/`#29` keep **region × domain** as the first learner-facing mastery unit; complete continent earns a crest. Continent Play feeds ordinary country evidence which rolls up through the existing seam. No new persisted state. |
| Unsupported domains on shell continents | **Not a new risk.** Continent support exactly mirrors its regions' support (measured below), so the continent row can never offer a domain that no region offers, or withhold one they all have. It uses the same `domain-launch--absent` treatment. |
| Cognitive load | One extra row on a 4–6 row surface. Acceptable, and it replaces a navigation detour (continent surface → domain launcher → Play). |
| Round length | None. Round size is a fixed 10 (`store.startSession`, `size = 10`) at every scope. Continent Play is **wider, not longer** — the same round shape drawn from a larger pool. |
| Thin value on small continents | Genuine. South America has 12 flag countries across 3 regions, so a 10-question continent round is barely wider than a region round. The entry is still correct for consistency, but its value is concentrated in Africa (54) and Asia (48). |

## Measured scope support

Continent-level support mirrors region-level support exactly:

| continent | regions | continent domains | flags countries |
|---|---|---|---|
| Africa | 5 | flags, locations, outlines, neighbours | 54 |
| Asia | 5 | flags | 48 |
| Europe | 4 | flags | 44 |
| North America | 3 | flags | 23 |
| South America | 3 | flags | 12 |
| Oceania | 4 | flags | 14 |

Africa's continent scope reports 54 countries for Flags, Locations and Outlines,
and 52 for Neighbours (two countries have no qualifying land border in the
generated adjacency set — see `#58`).

---

# Implementation notes for a delivery issue

Scope is one view plus one style block. `src/ui/views/atlas.ts` already contains
everything needed.

1. **`src/ui/views/atlas.ts`** — add a `continentCard(scope, progress)` beside
   the existing `regionCard`, and render it before `regions.map(...)` inside
   `.atlas-card-list`. It reuses `domainLaunchRow(scope)` unchanged, passing the
   **continent** scope (`{ kind: 'continent', id, label }`). The subtitle needs
   the region count alongside `getScopeStats(...).total`.
2. **Copy** — "All of {Continent}". Modern British English, and **Neighbours**
   stays the learner-facing domain label.
3. **Styling** — a `.atlas-card--continent` modifier on the existing
   `atlas-card` chassis, in `atlas-theme.css`. That sheet is the confirmed owner
   of component appearance after `#72`'s ownership pass, so the modifier belongs
   there and nowhere else. No gold, no purple.
4. **Accessibility** — keep the existing `aria-label` pattern,
   `Play {scope} {domain}`, which yields "Play Africa flags". The absent state
   keeps its `visually-hidden` "not available yet".
5. **No changes** to routing, `scopeForQuickPlay`, session state, storage keys,
   or achievement aggregation. If a delivery PR touches any of those, the design
   has drifted.

## Verification expectations

- `npm test` green, including `verify-ia.mjs` and `verify-continent-contract.mjs`.
- A new assertion that the continent surface exposes exactly one
  continent-scoped launch row, and that its `data-id` is the continent id.
- A new assertion that clicking a continent-scoped `quick-play` lands on
  `#/{domain}/{continent}/test`.
- An assertion that unsupported domains render `domain-launch--absent` on shell
  continents (Asia should show one live domain and three absent).
- An assertion that continent Play creates **no** new persisted achievement key.
- No horizontal overflow at 390×844, 844×390, 320×568 and 768×1024 — the
  `#71` contract.
- Touch targets on the new row ≥ 44 px.

---

# Acceptance criteria

- [x] A recommended IA pattern is documented — continent row, first, above regions.
- [x] Placement decision recorded — first row above regions, with the three
      rejected alternatives and why.
- [x] Visual treatment decision recorded — intentionally distinct container,
      shared four-domain action row, no prestige colours.
- [x] Risks/trade-offs captured — sixth-region ambiguity, mastery semantics,
      shell continents, cognitive load, round length, thin value on small
      continents.
- [x] Implementation notes and verification expectations recorded for follow-up.
