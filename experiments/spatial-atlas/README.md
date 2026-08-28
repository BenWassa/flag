# Issue #119 — spatial Atlas prototype (Africa vertical slice)

**Prototype. Not production, not a renderer decision, not authorised to replace navigation.**

This is the #119 prototype gate built end to end: a persistent 3D Earth that interprets the real
typed routes as camera positions.

```
Mode → World → Africa → West Africa → Play-ready → Back to Africa → Back to World
```

## Run it

```bash
npm run probe:globe
```

- **Globe prototype** — `http://<machine-ip>:5199/experiments/spatial-atlas/index.html#/`
- **2D continuity probe (Stage 1)** — `http://<machine-ip>:5199/experiments/spatial-continuity/probe/index.html#/`
- **Production Atlas** — `http://<machine-ip>:5199/`

All three from one dev server, so a phone comparison needs no rebuild.

Regenerate the geometry (needs network; verifies the pinned hash):

```bash
node scripts/experiments/generate-globe-geometry.mjs
npm run check:experiments     # the experiments are typechecked, separately from the production gate
npm run measure:globe         # writes .experiments-dist/ and reports real payload cost
```

## What the prototype gate asked for, and what it does

| Required | Status | Evidence |
| --- | --- | --- |
| Persistent Earth scene | Yes | One scene, created once; navigation never rebuilds it |
| Canonical generated geography | Yes | Same pinned Natural Earth commit and sha256 as production, same ISO3 candidate order |
| Drag + pinch | Yes | One-finger drag rotates, two-finger pinch dollies, wheel dollies on desktop |
| Continent and region picking | Yes | Raycast against country meshes; a tap at Africa-framing resolved to `#/flags/africa/central-africa` |
| Real DOM labels/buttons | Yes | Every scope has a real `<button>`; geography and button dispatch the same action |
| Smooth interruptible camera | Yes | Retargetable rAF interpolation; a drag cancels travel so the hand always wins |
| Typed route synchronisation | Yes | Production `createHashRouter` and route types; the camera is a pure function of the route |
| Native Back | Yes | `…/test` → `…/west-africa` → `…/africa` → `#/` |
| Reduced motion | Yes | Camera snaps instead of travelling |
| Mobile portrait | Yes | Verified at 412×915 |
| Graceful renderer failure | Yes | WebGL denied → `data-fallback="webgl-unavailable"` and a link to the 2D probe |
| Acceptable mobile performance | **Not established** | Headless SwiftShader is not a phone. See below. |

## Measured cost

Built with `npm run measure:globe`. These replace the stale historical figures in the planning docs.

| Piece | Raw | Gzip |
| --- | --- | --- |
| Prototype JS (three.js + prototype + reused Atlas modules) | 523.60 kB | **135.63 kB** |
| — of which reused Atlas modules (routing, countries, continents), measured separately | 23.46 kB | 8.32 kB |
| — leaving three.js + prototype code | — | **~127 kB** |
| `globe-world.json` (195 countries) | 739 kB | **269.5 kB** |
| `globe-africa.json` (54 countries) | 374 kB | **127.0 kB** |
| CSS | 2.33 kB | 0.77 kB |

For scale, production Atlas's entire core `app.js` is **100.42 kB gzip**. So the renderer alone is
larger than the whole current core bundle, and world geometry alone is larger again. That is the
single most decision-relevant number here and it is not a small one.

## Deliberate technical choices

**Plain Three.js, not React Three Fiber.** R3F is the issue's *preferred* stack, but F2 is reserved
for a principal session and the renderer comparison is still PARKED/AMBER — building on R3F would
read as having taken that decision. Plain Three also sidesteps the open R3F StrictMode context-loss
report (#3863) and keeps the render loop controllable, which is what makes render-on-demand provable.
**Nothing here should be read as selecting a renderer.**

**Geometry is generated upstream, in lat/lon.** The issue is explicit that projected SVG paths
cannot be bent onto a sphere. `scripts/experiments/generate-globe-geometry.mjs` extends the canonical
pipeline: it reuses `fetchPinnedSource`, which refuses bytes whose sha256 does not match the manifest,
and mirrors production's ISO3 candidate order. `geo.ts` holds no renderer import, so the geometry
contract survives a different F2 outcome.

**Microstates become locators, not omissions.** Simplification legitimately erases countries below
the retained detail — 37 at world LOD, including Comoros, Cabo Verde, Mauritius, São Tomé and
Príncipe and Seychelles. Dropping them would make the globe quietly untruthful about the curriculum,
so they keep a locator point computed from unsimplified source geometry, exactly as
`MapCountryGeometry.locator` does in the production 2D assets. **195/195 countries are present at
world LOD and 54/54 at Africa LOD.**

**Production cartography tokens.** `--map-ocean`, `--map-active-land`, `--map-context-land`,
`--map-context-border` — the same values the 2D maps use. No new palette, no region colour taxonomy,
no progress encoded in colour. The page canvas is the backdrop so the planet has a silhouette; there
is no starfield, terrain or photographic Earth.

**Gesture ownership is scoped.** `touch-action: none` is on the globe stage only, never the document,
and a drag starting inside the 28 px edge gutter is left to the browser so the OS back gesture keeps
working.

## Honest limitations

- **Performance is unproven.** Everything was verified in headless Chromium on SwiftShader, which
  says nothing about a real GPU, thermal behaviour, or battery. A phone measurement is required
  before this informs any decision.
- **Play is a stub.** The prototype does not run a round. The point of that screen is how you arrive.
- **Africa only**, in Flags only.
- **Antimeridian rings are unwrapped but not split.** Countries spanning the date line are not a
  concern for the Africa slice; they would need real handling before any wider use.
- **Land is `DoubleSide`.** Natural Earth does not guarantee consistent ring winding, and back-face
  culling was silently deleting whichever countries came out reversed. Correct, but it costs fill.
- **Two LODs, no switching.** The prototype loads world LOD and stays there; `globe-africa.json` is
  generated and measured but the runtime swap is not implemented.
- **No accessibility claim for the globe itself.** The DOM scope controls are real, focusable and
  labelled, and they are the accessible path. The canvas is `role="application"` with a label
  pointing at those controls. That is the honest minimum, not a solved problem.

## What this does not settle

H1 — whether continuity beats screen replacement on a real phone — is still a human verdict, and
still the gate. This prototype makes the 3D side of that comparison real; it does not decide it.
See `docs/open/issue-119-h1-verdict.md`.
