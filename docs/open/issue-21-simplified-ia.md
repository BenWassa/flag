# Issue #21 — Simplified IA implementation brief

**Status:** Implementation-ready. Every decision listed in §3 is settled; do not reopen them without a new observation.
**Issue:** [#21 — Simplify learning IA and progressively reveal only the next decision](https://github.com/BenWassa/flag/issues/21)
**Register:** Product UI (per `PRODUCT.md`; design laws in `DESIGN.md` are binding)
**Supersedes:** [`docs/closed/issue-21-ia-exploration.md`](../closed/issue-21-ia-exploration.md)
**Primary context:** One hand, a phone, a spare three minutes, no appetite for reading. The learner wants to be answering a question, not configuring one.

---

## 1. How to use this document

This is a build brief, not an exploration. Work the slices in §11 in order; each is independently shippable and independently verifiable. §10 is the exact content-removal table with current line references. §12 lists the assertions that must pass before the issue closes.

Where this brief says **settled**, the decision has been made and the rationale is recorded. Where it says **deferred**, the work is explicitly out of scope and belongs to a follow-up issue.

---

## 2. Assessment of the prior plan

The exploration was right about the disease and wrong about one part of the cure.

**Right, and carried forward unchanged:** the diagnosis that pre-round screens are doing six jobs at once; the scope-launcher concept; direct Play from continent rows; the Test → Play migration; the accessibility and motion requirements.

**Wrong, and corrected here:**

1. **The launcher map was specified for six continents that do not exist.** `src/data/maps/africa.ts` is the only continent geometry in the repository: 930 KB of generated source, 248 KB gzipped, lazy-loaded. There is no Europe, Asia, Americas, or Oceania geometry. A map-first launcher therefore covers one continent in the three Africa-only domains and zero of the six continents in Flags, which is the only domain where continent choice is a real decision.

   *Correction:* the map is a **layer**, not the surface. The region list is the selection model and is always present. The map hydrates on top of it wherever geometry exists. One launcher, not two.

2. **The 24-region colour taxonomy was downstream of that map.** Eight acceptance gates and a flag-spectrum-versus-atlas palette debate were being run for regions that will never be rendered. Only five Africa regions can appear on a map today.

   *Correction:* deferred entirely (§8). The interim rule needs zero new tokens.

3. **The modal direction contradicted the exploration's own pressure test.** Its §9 table gave the routed page the win on deep-link clarity, mobile map space, keyboard model, and Back predictability. `DESIGN.md` independently requires that every view have a history entry, and lists "modal as first thought" behaviour as something to exhaust alternatives against.

   *Correction:* routed page (§3.2).

4. **The region-scope screen was left in place.** The exploration removed the null continent screens but kept a separate view for `/#/flags/africa/west-africa`. That screen asks nothing either: the region is already chosen by the time you arrive.

   *Correction:* a region deep link renders the **same launcher** with that region preselected (§6). This collapses four views into one and is the single largest simplification in the brief.

---

## 3. Settled decisions

### 3.1 Home keeps four lanes

Flags, Locations, Outlines and Neighbours remain the top-level choice.

Four options is one small decision. Folding three of them behind a "Geography" lane trades a screen for a choice that was never expensive, and the grouping is semantically shaky in a product whose Home already says *Learn geography* — flags are geography too. The problem the issue identified, that Locations/Outlines/Neighbours read as three equal products, is real; it is fixed with visual weight and honest subtitles inside a four-row list, not with depth.

### 3.2 The launcher is a routed page, never a dialog

Settles exploration open decision 2. Rationale in §2.3. Consequences: no focus trap, no inertness management, no nested-modal rule, no bespoke Escape handling. Back behaves because the URL is real.

### 3.3 The region list is always present and always programmatic

Settles open decisions 3 and 5. The list is the selection model. The map, where it exists, reflects and drives that same model. No disclosure, no geometry-conditional composition, no A/B/C prototyping matrix.

### 3.4 Continent and domain rows carry a compact Play icon

Settles open decision 1. The row body navigates; a trailing icon button starts Play at that scope. The icon is acceptable only with the mitigations in §7.2 — a real 44px target, a visible separating rule, an accessible name that states both scope and domain, and independent focus treatment. If this tests poorly with a real learner, the documented fallback is select-then-reveal (exploration §6.3), not a labelled button on every row.

### 3.5 Quick Play changes nothing about the round

Settles open decision 7. Quick Play is a shortcut into the existing Play activity at the existing full-scope round size. It is not a mode, not a scoring variant, and not a new round length. If a round-size change is wanted, that is a separate issue.

### 3.6 Flags Quick Play targets World

Settles open decision 6. The Flags row's Play icon starts World Play, which is the already-routable `/#/flags/test`. No recommendation engine, no first-use heuristic, no new concept.

### 3.7 Region selection replaces history, it does not push

Settles open decision 8. Selecting a region inside an open launcher calls `router.navigate(route, { replace: true })`. Back from a launcher always returns to its parent, never to a chain of abandoned region selections.

### 3.8 Test becomes Play in learner-facing copy only

Internal `test` identifiers are compatibility contracts and do not migrate: the `LearningActivity`/`StudyMode` value `'test'`, the `/test` route segment, `data-action` names such as `start-test` and `start-map-test`, storage namespaces, and verification-script identifiers.

---

## 4. Thesis

> The product does not have too many choices. It has too many screens that ask nothing, and too much explanation on the screens that ask something.

Every change in this brief follows from that sentence. Depth is removed where a screen has no question on it. Content is removed where it explains a system the learner will understand faster by touching it. Nothing is re-nested.

Three tests for any element under review:

1. **Does this screen ask a question?** If its only content is one row, it is not a screen. Canonicalise past it.
2. **Does this element inform the decision being made *here*?** A mastery legend, a feedback key and a topology-exclusion note do not inform "which region shall I practise?". They belong after the round or in `/progress`.
3. **Can interaction teach this faster than prose?** Country colours during a round teach the learning states in one round. A permanent legend teaches them never, because nobody reads it.

---

## 5. Information architecture

```text
Home  (four domain rows, each with direct Play)
│
├── Flags ──────────► Continent list ──────► Launcher (continent, region optional)
│                     six continents         /#/flags/africa
│                     /#/flags               /#/flags/africa/west-africa
│
├── Locations ──────► Launcher (Africa)      /#/locations/africa
├── Outlines ───────► Launcher (Africa)      /#/outlines/africa
└── Neighbours ─────► Launcher (Africa)      /#/neighbors/africa
```

Flags is one level deeper than the Africa-only domains because it genuinely has a six-way choice. The Africa-only domains do not, so `/#/locations`, `/#/outlines` and `/#/neighbors` canonicalise to their Africa launcher.

### Tap budget from Home

| Goal | Taps | Path |
|---|---:|---|
| Play World flags | 1 | Flags row Play icon |
| Play Africa locations | 1 | Locations row Play icon |
| Play Africa flags | 2 | Flags row body → Africa row Play icon |
| Play West Africa locations | 2 | Locations row body → West Africa row Play icon |
| Learn West Africa locations | 3 | Locations row body → West Africa row body → Learn |

Product principle 1 ("reach useful practice in one or two taps") holds for every Play path in the product. Learn costs one more tap by design; it is the deliberate choice, not the spontaneous one.

---

## 6. The launcher

One component, parameterised by `(domain, continentScope, selectedRegion | null)`. It replaces the pre-round surfaces of `scope.ts`, `map-home.ts`, `outline-home.ts` and `neighbor-home.ts`.

A region route does not render a different screen. `/#/locations/africa/west-africa` renders the Africa launcher with West Africa selected. This is why the region-level country ledger disappears: there is no longer a region screen for it to sit on.

### Composition, top to bottom

```text
‹   Africa · Locations                      ← back to parent, scope + domain named

        Play Africa                         ← primary. Always names the scope.

    ┌──────────────────────────┐
    │  map layer, if geometry  │            ← optional; see §6.2
    │  exists for this scope   │
    └──────────────────────────┘

  Regions
    North Africa      6 · 2 mastered    ▶
    West Africa      16 · 0 mastered    ▶   ← body selects, ▶ plays
    Central Africa    9 · 0 mastered    ▶
    East Africa      18 · 4 mastered    ▶
    Southern Africa   5 · 0 mastered    ▶

        Learn Africa                        ← quiet, text-forward, still 44px
```

### 6.1 Rules

- **The primary action always names its scope.** `Play Africa`, then `Play West Africa` once a region is selected. Never a context-free "Quick Play".
- **The primary and the Learn action always target the same scope**, and both update together on selection.
- **Selecting a region never starts a round.** Only the two action controls and the row Play icons do.
- **A visible "All Africa" control returns to continent scope** whenever a region is selected. It is not the back button.
- **Learn is quieter but never incidental.** Text-forward treatment, restrained styling, real 44px target, never styled in a way that reads as disabled.
- **Nothing else lives on this surface.** No mastery legend, no feedback key, no country ledger, no round-rules prose, no topology notes. §10 is exhaustive.

The only status permitted is the per-row `n · m mastered` metadata and the existing `scope-status-line` counts, both of which are decision-relevant: they tell the learner where the work is.

### 6.2 The map layer

Applies to Locations, Outlines and Neighbours at Africa continent scope. Flags renders the launcher without it at every scope, and that is a complete, shippable surface, not a degraded one.

Hard requirements:

- **The launcher renders complete and fully usable with zero geometry loaded.** List, Play, and Learn are all present and pressable on first paint. The map is appended when `loadMapAsset` resolves.
- **Never gate the launcher on the map.** No spinner over the surface, no disabled Play, no layout that reserves map space it may not fill in a way that pushes Learn off-screen.
- **The map is not a second selection model.** It reflects and drives the region list. One selected-region state, one source of truth.
- **Selection is never carried by colour alone.** The selected region takes a strong boundary, a direct label, and the selected-state text in the list row.

The 248 KB gzipped Africa module is acceptable *here specifically* because the learner opening a Locations launcher is one tap from a round that loads the identical module — `loadAfricaData()` memoises the promise at module scope, so the launcher warms exactly the asset the round needs. It would not be acceptable on Home, and it is not acceptable as a blocking dependency of the launcher's own usability. Both constraints are load-bearing.

### 6.3 Responsive

- **Portrait mobile:** single column. Play stays above the map. If the map plus list would push Learn below the fold, the map shrinks; Learn does not move below the list.
- **Short landscape:** map left, actions and list right. Reaching Play must never require scrolling.
- **Desktop:** the existing 860px page width. No new elevation, no glass, no dialog chrome.

---

## 7. Components

### 7.1 Split row

Both Home domain rows and Flags continent rows become split rows.

**This is a structural change, not a styling one.** `.continent-row` is currently a `<button>` element ([`styles.css:236`](../../styles.css)); a button cannot contain a button. Restructure to a container element holding two sibling controls:

```text
<div class="continent-row">
  <button class="continent-row__open" data-action="open-domain" data-id="locations"> … identity, progress, score, chevron … </button>
  <button class="continent-row__play" data-action="quick-play" data-id="locations" aria-label="Play Africa locations"> ▶ </button>
</div>
```

The existing single-`[data-action]` delegation in `src/app.ts` (`closest('[data-action]')`) handles this without change, and the focus-restore selector pattern `[data-action="…"][data-id="…"]` continues to work. Verify both after restructuring.

### 7.2 Play icon

- Add a `play` glyph to `src/ui/components/icons.ts`. It is the fifth icon, joining `back`, `close`, `chevron`, `ledger`. `DESIGN.md` forbids Unicode glyphs, emoji, and CSS-drawn shapes as interface icons; this is not negotiable.
- Minimum 44px hit area, independent of the icon's drawn size.
- Accessible name states scope and domain: `Play Africa locations`, `Play World flags`, `Play West Africa flags`.
- A visible separating rule or gap between the two hit areas, and independently visible focus rings.

### 7.3 Deleted components

`statLegend` in [`src/ui/components/progress.ts:14`](../../src/ui/components/progress.ts#L14) has five call sites, all of them pre-round. After §10 it has none. Delete the export and the `.stat-legend` rules at [`styles.css:181-191`](../../styles.css). Nothing is lost: the adjacent `scope-status-line` already states the same counts in prose, which is what `DESIGN.md` actually requires.

`.map-guide` and `.map-legend` at [`map.css:35-50`](../../map.css) become unused. Delete them with their markup.

---

## 8. Region colour — deferred

**Do not build a region palette in this issue.**

The interim rule, which needs zero new tokens and passes every gate the exploration proposed:

- Unselected regions render in neutral cartographic fills already available in the map tokens, separated by boundaries.
- The **selected** region takes emphasis: a strong boundary, a direct label, and selected-state text in its list row.
- No region fill may resemble `mastered` green, `learning` amber, `wrong` red, or `action` blue. Those four carry learning and interaction semantics everywhere else in the product, and a scope map that looks like feedback is worse than a scope map with no colour.

If categorical region colour is wanted later, it is a separate issue and it needs only the **five** Africa regions, not twenty-four, because no other continent has geometry. Carry the exploration's acceptance gates into that issue.

---

## 9. Routing contract

Extends [`docs/architecture/routing.md`](../architecture/routing.md). Update that document as part of slice 2.

| State | URL | Notes |
|---|---|---|
| Home | `/#/` | |
| Flags continent list | `/#/flags` | Genuine six-way choice; kept |
| Flags launcher, Africa | `/#/flags/africa` | |
| Flags launcher, West Africa selected | `/#/flags/africa/west-africa` | Same view, region preselected |
| Locations launcher | `/#/locations/africa` | `/#/locations` canonicalises here |
| Outlines launcher | `/#/outlines/africa` | `/#/outlines` canonicalises here |
| Neighbours launcher | `/#/neighbors/africa` | `/#/neighbors` canonicalises here |
| Any round | unchanged | `/test`, `/learn`, `/review` segments unchanged |

### Required changes

1. **`normalizeRoute` in `src/app.ts`** — for `locations`, `outlines` and `neighbors` with no scope, return the Africa continent scope. The existing mechanism already re-navigates with `{ replace: true }` when the normalised route differs, so no new machinery is needed.

2. **`parentRoute` in `src/routing/routes.ts` — this is a trap, handle it deliberately.** It currently returns `{ name: 'learning', domain }` for a continent scope. For the Africa-only domains that target now canonicalises straight back to the Africa launcher, producing a back button that cannot leave. `parentRoute` for a continent scope in `locations`/`outlines`/`neighbors` must return `{ name: 'home' }`. Flags is unaffected and still returns to its continent list.

3. **Region selection uses `replace`** (§3.7). Starting a round still pushes.

4. **Back from a round** returns to the exact launcher scope it started from, including the selected region. The existing `stableRoute` behaviour already provides this; confirm it survives the region-selection change.

---

## 10. Content removal table

Exhaustive. Every line below is deleted or replaced; nothing here is "reduced".

| File | Lines | Content | Action |
|---|---|---|---|
| `src/ui/views/home.ts` | 58 | "Choose a skill, then choose where to practise it." | Delete. The four rows say it. |
| `src/ui/views/home.ts` | 71–72 | `Learning domains` heading + `4 available` | Delete. The list is the page. |
| `src/ui/views/home.ts` | 74–113 | Domain rows | Restructure to split rows (§7.1) |
| `src/ui/views/domain.ts` | 64 | `statLegend(world)` | Delete |
| `src/ui/views/domain.ts` | 67 | `Test world` | → `Play world` |
| `src/ui/views/domain.ts` | 105–209 | `renderLocationsHome`, `renderOutlinesHome`, `renderNeighborsHome` | **Delete all three.** Unreachable after canonicalisation. `renderDomainHome` handles Flags only. |
| `src/ui/views/domain.ts` | 122, 159, 193 | `1 available` | Deleted with the above |
| `src/ui/views/scope.ts` | 31 | `statLegend(stats)` | Delete |
| `src/ui/views/scope.ts` | 39 | `Test` | → `Play` |
| `src/ui/views/scope.ts` | 45, 79–97 | `renderCountryLedger` | Delete. Lives in `/progress`. |
| `src/ui/views/map-home.ts` | 43 | `statLegend(progressStats)` | Delete |
| `src/ui/views/map-home.ts` | 51 | `Test` | → `Play` |
| `src/ui/views/map-home.ts` | 59–71 | `map-guide` section: "Learn feedback" heading, four-swatch legend, explanatory paragraph | **Delete.** Named explicitly in the issue. One round teaches it. |
| `src/ui/views/map-home.ts` | 57, 106–128 | `renderCountryLedger` | Delete |
| `src/ui/views/outline-home.ts` | 38 | `statLegend(stats)` | Delete |
| `src/ui/views/outline-home.ts` | 46 | `Test` | → `Play` |
| `src/ui/views/outline-home.ts` | 52, 86–104 | `renderCountryLedger` | Delete |
| `src/ui/views/neighbor-home.ts` | 47 | `statLegend(progressStats)` | Delete |
| `src/ui/views/neighbor-home.ts` | 55 | `Test` | → `Play` |
| `src/ui/views/neighbor-home.ts` | 63–68 | "Round rules" section, `n + 2 attempts`, three `neighbor-policy` paragraphs | **Delete.** Round rules belong in the round. Topology-exclusion notes are engineering provenance, not a learner's concern. |
| `src/ui/views/neighbor-home.ts` | 61, 107–128 | `renderCountryLedger` | Delete |
| `src/ui/components/progress.ts` | 14–24 | `statLegend` | Delete export (now unused) |
| `styles.css` | 181–191 | `.stat-legend` rules | Delete |
| `map.css` | 35–50 | `.map-guide`, `.map-legend` rules | Delete |

Retained deliberately: the `storage-notice` in every view (`DESIGN.md` requires the honest degraded state), `progressStrip` everywhere it appears, and the `scope-status-line` counts.

Neighbours keeps a real exclusion behaviour even after the prose goes: excluded countries must still be absent from the round. The prose was explaining a correctly implemented rule to someone who had not yet asked a question.

---

## 11. Work slices

Ship in order. Each slice leaves `npm test` green.

### Slice 1 — Play terminology

Isolated, mechanical, zero IA risk. Do it first so later diffs are legible.

Learner-facing surfaces: `scope.ts:39`, `map-home.ts:51`, `outline-home.ts:46`, `neighbor-home.ts:55`, `domain.ts:67`, `quiz.ts:45`, `map-quiz.ts:33`, `outline-quiz.ts:45`, `neighbor-quiz.ts:33`, `results.ts:25`, `map-results.ts:20` and `:34`, `outline-results.ts:23`, and `routeTitle` in `routes.ts:157`.

Also: `README.md`, `PRODUCT.md`, `DESIGN.md`, `docs/architecture/routing.md`, `docs/product/requirements.md`. Add a line to `docs/architecture/routing.md` stating that `test` is the internal identifier for learner-facing Play.

Do **not** touch: `LearningActivity`/`StudyMode` `'test'`, the `/test` route segment, `data-action` names, storage keys, or `scripts/` identifiers.

`scripts/verify-british-english.mjs:34` currently asserts `routeTitle(neighborRoute) === 'Test West Africa neighbours · Flag Atlas'`. Update to `Play …`.

### Slice 2 — Collapse depth

Routing changes from §9 items 1, 2 and 4. Delete the three `render*Home` functions in `domain.ts`.

`scripts/verify-domain-integration.mjs:43` asserts `home.includes('4 available')`. That string is deleted in slice 3; either update the assertion now to something durable (four `data-action="open-domain"` rows) or sequence it with slice 3. Do not leave it failing between slices.

### Slice 3 — Strip content

The whole of §10 except the row restructuring. Largest deletion, smallest risk, most of the issue's stated value.

### Slice 4 — Direct Play

Split rows (§7.1), the `play` icon (§7.2), the `quick-play` action in `src/app.ts` dispatch. Home rows and Flags continent rows.

`quick-play` must resolve domain + scope from `data-id` and begin the existing Play session at the existing round size (§3.5). Reuse the existing `beginSession` / `beginMapSession` / `beginOutlineSession` / `beginNeighborSession` entry points; do not add a parallel start path.

### Slice 5 — The launcher

Unify the four pre-round surfaces into one component (§6). Region rows gain the same split-row treatment. Region selection uses `replace` semantics (§3.7).

This is where the four views collapse into one. Expect `scope.ts`, `map-home.ts`, `outline-home.ts` and `neighbor-home.ts` to shrink to thin domain adapters over a shared launcher, or to disappear into it.

### Slice 6 — Map layer

Africa geometry into the launcher as a progressive layer (§6.2). Ship only after slice 5 is complete and usable without it, so the "renders complete with zero geometry" requirement is proven rather than asserted.

### Every slice

Bump `VERSION` in `public/sw.js:3` (currently `flag-atlas-v13`) and the matching literal in `scripts/verify-domain-integration.mjs:31` whenever shell assets change. Any new stylesheet must be added to both the `index.html` shell and the service-worker `SHELL` list; `verify-domain-integration.mjs` already enforces that pattern for existing stylesheets.

---

## 12. Verification gates

Extend the existing `npm run verify` scripts; do not introduce a new test framework.

**`scripts/verify-routing.mjs`**

- `/#/locations`, `/#/outlines`, `/#/neighbors` each canonicalise to their `/africa` launcher.
- `parentRoute` of `locations/africa` is `home`. Same for outlines and neighbors. **Explicitly assert this is not the domain route** — this is the back-button trap in §9.2.
- `parentRoute` of `flags/africa` is still `flags`.
- Region selection replaces rather than pushes: after selecting two regions in sequence, one `back()` returns to the parent, not to the first region.
- Back from a round returns to the launcher scope it started from, region selection included.

**`scripts/verify-domain-integration.mjs`** (or a new `verify-ia.mjs`)

- No rendered pre-round view contains `stat-legend`.
- `renderMapHome` output contains neither `map-legend` nor `map-guide`.
- Neighbours pre-round output contains no `neighbor-policy`.
- No pre-round view contains `mini-ledger`.
- Every rendered launcher's primary action label contains its scope label — assert for Africa and for West Africa, in every domain.
- Every `quick-play` control has an `aria-label` containing both a scope name and a domain name.
- Neighbours rounds still exclude `EGY` and `MAR` after the prose is deleted (the existing assertions cover this; keep them).

**`scripts/verify-british-english.mjs`**

- No learner-facing `Test` in any rendered view output. Allow the `/test` route segment and internal identifiers explicitly rather than by loose matching.
- `routeTitle` for a `/test` route reads `Play …`.

**Manual, before closing**

Walk the §5 tap budget on a real phone in portrait, then in short landscape, then by keyboard alone, then with a screen reader. Confirm Play is reachable without scrolling in every launcher. Confirm the Africa launcher is fully usable before the map appears — throttle the network to force the gap rather than trusting a warm cache.

---

## 13. Success criteria

From the issue, made testable:

1. Continent-level Play is one or two taps from Home in every domain (§5 table).
2. No screen in the product has a single choice on it.
3. No pre-round surface contains a learning-state legend, a feedback key, a country ledger, or a rules paragraph.
4. Every launcher has exactly one visually dominant action and one subordinate action.
5. The selected scope is named in text on every action that acts on it.
6. A learner can tell a row from its Play icon without instruction.
7. No existing domain, region, route, deep link, or stored progress becomes unreachable.
8. `npm test` passes, including every assertion in §12.

---

## 14. Out of scope

Do not do these in this issue, even if tempting while in the files:

- Categorical region colour (§8) — separate issue, five regions, gates carried over.
- Geometry for any continent other than Africa.
- Round-size, scoring, or mastery-rule changes (§3.5).
- Any migration of internal `test` identifiers (§3.8).
- Settings. The issue mentions a "quiet secondary settings affordance *if/when settings become useful*". They are not yet. Home keeps the existing Progress affordance and gains nothing.
- Redesigning quiz or results surfaces. This issue ends where the round begins.

---

## 15. Open questions for the implementer

Resolve during the build; none of them blocks starting.

1. Do the four launcher domain adapters collapse fully into one function, or does Neighbours keep a thin adapter for its target-count metadata? Decide from the code once slice 5 is underway; prefer full collapse.
2. Does the Flags continent list also want the launcher's Play-primary treatment at World scope, or is the Flags row's Play icon on Home sufficient? Ship the icon first, then judge.
3. Where exactly the map layer sits in short landscape when the region list is long. §6.3 sets the constraint (Play reachable without scrolling); the composition is yours.
