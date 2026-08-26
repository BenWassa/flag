# Issue #112 — Africa framing and Togo callout

**Status:** Complete

## Outcome

Whole-Africa Locations Learn now fits the scoring continent rather than the raw
projection canvas, and every wrapper between the map stage and viewport uses
grid stretch so the viewport controller measures the true clip box. The opening
frame includes room for generated locator and callout hit surfaces.

Togo's generated callout offset is now predominantly vertical, approximately
perpendicular to the simplified Gulf of Guinea coastline, and clear of Ghana.
Canonical country polygons, adjacency and the two-callout Africa policy remain
unchanged.

## Closeout

- Implementation commit: `d841584`.
- Merge commit on `main`: `7d9a108`.
- `npm test` passed on merged `main`: TypeScript, 16 Vitest tests, production
  Vite/PWA build and the complete verifier suite.
- `npm run test:browser` passed on merged `main`: 14 tests across desktop and
  mobile Chromium.
- Browser coverage verifies complete scoring geography, viewport fill and a
  minimum 44 CSS px Togo surface at 320 × 568, 390 × 844 and 740 × 360; it also
  verifies the leader line is within 20 degrees of vertical.
- The implementation commit records measured Africa content-area gains of about
  44–45% in portrait and removal of eight clipped southern countries in short
  landscape.
- No physical-device or manual assistive-technology testing is claimed.
