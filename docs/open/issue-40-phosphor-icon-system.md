# Issue #40 — Adopt Phosphor for routine Atlas iconography

GitHub: https://github.com/BenWassa/flag/issues/40

## Status

**Implemented locally; repository closeout pending.**

## Goal

Replace Atlas's provisional hand-authored routine UI glyphs with one coherent Phosphor-based icon system that fits the tactile product character without competing with geography or prestige artwork.

Use **Phosphor Bold** as the default weight. Allow **Fill** only where a filled state communicates a real state change, such as selected or mastered, rather than as decoration.

## Product boundary

Phosphor owns routine product iconography: navigation, controls, domain identity and utility actions.

Custom Atlas artwork remains reserved for the identity and achievement elements that need to be distinctive:

- the Atlas brand mark;
- region mastery badge composition where #34 requires it;
- continent crests;
- the World Crown;
- a minimal derivative of one Phosphor glyph only if no catalogue icon communicates shared geographic borders clearly at production size.

Do not mix Phosphor with Lucide or retain a visually competing general-purpose custom icon family.

## Domain-icon audition

Compare the following candidates at **24px in the real region domain grid**, plus the smaller indicator and launcher-header contexts where the same identity is reused:

| Domain | Candidates | Decision test |
| --- | --- | --- |
| Flags | `flag`, `flag-banner-fold` | Reads instantly as national flags, not a generic marker. |
| Locations | `map-pin`, `map-pin-area` | Reads as geographic location without obscuring the map metaphor. |
| Outlines | `island`, `polygon` | Reads as a country silhouette, not an abstract editing tool. |
| Neighbours | `intersect`, `intersection` | Reads as shared land border or adjacency, not merely overlap. |

Judge the set as a family, not as four isolated favourites. Test optical weight, silhouette distinction, legibility, alignment and meaning in neutral, Atlas Blue and mastery-purple states.

If the Neighbours candidates remain ambiguous, make the smallest possible MIT-permitted modification to the closest Phosphor glyph and document the changed path and rationale. Do not expand that exception into a second icon system.

## Implementation approach

- keep `src/ui/components/icons.ts` as Atlas's semantic adapter so views request meanings such as `back`, `play` and `adjacency`, not library-specific component names;
- source only the selected SVG paths or use a tree-shakeable package workflow that demonstrably avoids shipping the full catalogue;
- pin the dependency version and preserve Phosphor's MIT licence notice as required;
- render decorative icons with `aria-hidden="true"`; keep the accessible name on the surrounding control;
- do not bake circles, squircles, colour or mastery decoration into routine glyphs; their UI context owns those treatments;
- keep the brand mark and achievement artwork outside the routine icon adapter unless a separate semantic boundary is explicit;
- remove superseded provisional paths after every call site has migrated, with no mixed-family intermediate state on `main`.

## Acceptance criteria

- [x] A side-by-side production-size audition records the chosen four domain glyphs and why the rejected candidates were weaker.
- [x] Phosphor Bold is the default for routine icons; any Fill usage has a documented semantic purpose.
- [x] All routine icons currently exposed through `src/ui/components/icons.ts` are migrated or explicitly documented as intentional Atlas artwork.
- [x] The four domain meanings remain distinguishable at 24px, at their smallest shipped size, and without relying on colour.
- [x] Neutral, Atlas Blue and purple mastery treatments inherit from context and meet existing contrast requirements.
- [x] Icon-only controls retain accurate accessible names, visible focus and at least the existing touch-target size.
- [x] Icons remain crisp under browser zoom and across phone portrait and short-landscape layouts.
- [x] The production bundle does not include the full Phosphor catalogue; record before/after build-size evidence.
- [x] No Lucide dependency, emoji/Unicode fallback set or second routine icon family is introduced.
- [x] `DESIGN.md` records the final glyph mapping, weight/state rules and the boundary between routine icons and prestige artwork.
- [x] `npm run check` and `npm test` pass.

## Implementation evidence

- Selected domain mapping: Flags → `flag`, Locations → `map-pin`, Outlines → `polygon`, Neighbours → `intersect`, all Bold at source.
- `@phosphor-icons/core` is pinned at `2.1.1` as a development-only source of truth. The production build vendors 14 selected paths through the existing semantic adapter and contains no Phosphor catalogue, font or runtime import.
- The generated `dist/ui/components/icons.js` is 6,432 bytes raw / 2,707 bytes gzip. The previous source adapter was 2,726 bytes raw / 1,153 bytes gzip; the curated migration therefore adds roughly 1.55KB gzip rather than the package's full catalogue.
- `scripts/verify-icons.mjs` compares each rendered path against the pinned official Bold SVG, and verifies inherited colour, decorative semantics, focus exclusion and removal of the provisional stroke family.
- Automated gates: `npm run check` and `npm test` passed on 2026-08-21.
- Browser gate: 390×844 phone portrait and 844×390 short landscape. All four domain glyphs were distinct in the region grid, icon-only controls retained accessible labels, interactive targets were at least 44px, unsupported-domain icons remained visibly neutral, and neither viewport had horizontal overflow.

## Relationships and deferred work

- This resolves the ordinary-icon-style item left open by #32.
- #34 consumes these domain glyphs inside mastery presentation but still owns badge, crest and Crown art direction.
- This issue does not redesign cartography, the Atlas brand mark or achievement artwork.
