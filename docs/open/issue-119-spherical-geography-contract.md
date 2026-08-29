# Issue #119 — F3: Spherical geography and LOD contract

**Status:** DECIDED AND IMPLEMENTED on the full-candidate branch.
**Generator:** `scripts/generate-globe-assets.mjs` (`npm run globe:generate`)
**Output:** `src/data/globe/{world,africa,asia,europe,north-america,south-america,oceania}.ts` plus `provenance.{json,ts}`
**Verifier:** `scripts/verify-spatial-atlas.mjs`

---

## 1. One source, one identity

The generator is an **extension of the existing pinned Natural Earth pipeline**,
not a second cartography system. It calls the same `fetchPinnedSource`, which
refuses to return bytes whose sha256 does not match
`scripts/map-sources/natural-earth.json`, so an upstream change fails loudly here
exactly as it does in production generation.

- source: `ne_10m_admin_0_countries.geojson` at the pinned commit;
- identity: the documented ISO3 candidate order, resolved against the canonical
  set parsed from `src/data/countries.ts`;
- membership: continents come from `src/data/continents.ts`.

The renderer owns no taxonomy; a verifier asserts `globe-scene.ts` imports no
curriculum table. Output is latitude and longitude only — nothing here assumes
Three.js or any projection, so an F2 change would not invalidate it.

## 2. Two levels, seven assets

| Asset | Contents | Simplification | Precision | Gzip |
| --- | --- | ---: | ---: | ---: |
| `world` | all 195 canonical countries | 0.08 | 32 /° | 53.0 kB |
| `africa` | its 54 | 0.42 | 128 /° | 31.1 kB |
| `asia` | its 48 | 0.42 | 128 /° | 58.1 kB |
| `europe` | its 44 | 0.42 | 128 /° | 67.4 kB |
| `north-america` | its 23 | 0.42 | 128 /° | 67.7 kB |
| `south-america` | its 12 | 0.42 | 128 /° | 26.0 kB |
| `oceania` | its 14 | 0.42 | 128 /° | 13.8 kB |

Continent assets carry **no context geography**. The world asset stays mounted
underneath, so context is free and cannot drift between levels — the same
coastline is never drawn twice from two different simplifications of itself.

There is no third level. World → continent → region traverses two camera scales,
and region detail beyond the continent asset has no question attached to it.

## 3. Runtime LOD switching

Implemented in `stage-controller.ts` and `globe-scene.ts`, and exercised by the
browser matrix rather than merely generated:

- entering any continent triggers a dynamic import of that continent's asset;
- the detail layer is built **above** the base meshes at a fractionally larger
  radius and hides the base meshes for its own countries;
- leaving disposes the detail layer's geometries; the base layer is untouched;
- a superseded load is discarded by token, so fast traversal cannot mount stale
  detail;
- a failed detail load is **not** an error state: the world LOD stays mounted and
  every scope remains navigable, framed and selectable without it.

The radius offset is load-bearing, not cosmetic. Two independently simplified
coastlines of New Guinea genuinely overlap, and coplanar land z-fights: Indonesia
would flicker over Papua New Guinea in an Oceania frame.

## 4. Encoding

Rings are quantised to a fixed grid, delta-encoded, and written as a base-64-ish
varint string — the encoding Google's polyline format uses. Separators are `;`
and `,`, both below the encoder's own 63–126 character range, so they can never
collide with vertex data; the verifier sweeps 800,000 values to prove it.

This is the single largest payload decision on the branch. The prototype's plain
JSON coordinate arrays measured **269.5 kB gzip** for the world level; the same
geography in this format is **53.0 kB gzip** — a 5.1× reduction, from removing
decimal exponents and separators rather than from removing geography. World
precision of 32 units per degree is roughly 3.5 km, an order of magnitude finer
than a device pixel at any camera distance the world LOD survives to.

Round-tripping is verified per country: re-encoding what the runtime decoded
reproduces the stored bytes exactly, which also proves the files were not
hand-edited.

## 5. Framing policy — reused, not reinvented

A naive frame is captured by its most extreme member. Atlas files Russia under
Eastern Europe, so a union frame for "Europe" has to reach the Bering Strait.

`scripts/map-continent-configs.mjs` **already declares the answer** for the
projected maps: `focusExcludeCountryIds` for Europe (`RUS`, `FRA`, `NOR`, `NLD`)
and Asia (`RUS`), and `focusCountryBounds` clamping `USA` for North America. The
globe generator reads that same declaration, so there is one framing policy
rather than two that can silently diverge.

Each country therefore carries three boxes:

- `b` — its **true full extent**, used to pre-filter picking. Never clipped.
- `m` — its **mainland**: the largest polygon only. France's full bounds reach
  54° W because Natural Earth's `FRA` includes French Guiana, and a naive union
  puts "Western Europe" in the mid-Atlantic.
- `f` / `x` — its **framing contribution** under the declared policy: the
  mainland clipped to any declared bounds, or omitted entirely when the continent
  excludes it.

Excluded countries are still drawn, still selectable, still fully on the
curriculum, and still reachable by rotating. They just do not aim the camera.
A scope made entirely of excluded countries falls back to their mainlands, so the
policy can never leave a scope unframeable.

A statistical alternative — percentile-trimming the outermost edges — was built
and measured first. It fixed Europe and broke North America, whose thirteen
Caribbean states outvoted Canada and framed the continent in the Atlantic. The
declared policy is both more accurate and more honest, because it is the same
judgement a person already made for the maps.

## 6. Locator policy

Simplification legitimately erases countries smaller than the retained detail.
Dropping them would make the globe quietly untruthful and part of the curriculum
unselectable, so **any canonical country left with no retained ring keeps a
locator point** — computed from the unsimplified source, so the point is where
the country actually is, and taken from its largest landmass.

- world: 37 locators (European microstates, Gulf and island states, Singapore,
  Brunei, Palestine, the small-island Pacific and Caribbean);
- continent detail: `MDV`; `MCO`, `SMR`, `VAT`; `MHL`, `NRU`, `TUV` — seven
  countries that are genuinely sub-kilometre or atoll-scale at 1:10m.

Every one of the 195 canonical countries is present at every level, as geometry
or as a locator. The verifier asserts it exhaustively.

### Hit precedence

Issue #117 settled this for the projected maps and the globe follows it: **real
geography wins a contested tap**, and a locator only claims a point no polygon
covers. So an enclaved microstate — Monaco inside France, San Marino inside
Italy — is not separately tappable, while an island state over open water is.

That costs nothing navigationally, because tapping geography selects a **scope**,
never a country: Monaco and France both resolve to Western Europe. Measured on
this branch: 27 island locators stay selectable, 10 enclaved ones defer to their
neighbour.

Locator tolerance is derived from the camera each time, so a locator keeps
roughly a 24 CSS px touch radius on screen. A fixed tolerance in degrees would be
unusable at world zoom or would swallow half a continent close in.

### Scope markers

Distinct from locators and owned by F1: countries narrower than 1.5 % of the
framed span get an Atlas Blue disc while their scope is focused, so choosing
Polynesia does not present three specks in an empty ocean.

## 7. Antimeridian and multipart countries

Rings arrive from Natural Earth with longitudes that jump ~360° across the date
line; left alone they produce a country smeared across the planet.

- rings are **unwrapped** per ring into one continuous range. `sin`/`cos` of the
  unwrapped value are identical, so the renderer needs no seam case and framing
  reads a coherent box. The verifier asserts no ring spans 180°.
- picking offers a query longitude in all three equivalent forms (`lon`,
  `lon ± 360`) against the asset's unwrapped space, so a point resolves
  identically whether it is expressed as −175, 185, or −535.
- framing averages longitude **circularly**. An arithmetic mean would put a
  Pacific scope at longitude 0 — the opposite side of the planet.
- multipart countries keep every part. Only framing uses the mainland.

Audited cases, all asserted: Russian Chukotka on both sides of the date line;
Fiji; New Zealand; the United States with Alaska and Hawaii; France with French
Guiana; Kiribati, whose largest landmass is Kiritimati at 157° W while Tarawa
sits at 173° E — its locator follows the documented largest-landmass rule, and
its full extent still spans the date line correctly for picking.

## 8. Determinism and provenance

- countries are sorted by ISO3; simplification runs once per retained level and
  is shared across the six continent assets, so a country's geometry never
  depends on which asset it lands in;
- no timestamp is written into any asset;
- `provenance.ts` travels with the built artifact and records the upstream, the
  pinned commit, the source path and digest, the identity policy, the encoding
  and the framing policy source plus its exclusions and clamps;
- the verifier cross-checks all of it against `scripts/map-sources/natural-earth.json`
  and `scripts/map-continent-configs.mjs`, so a drift fails a check rather than
  silently producing different geography.

## 9. Payload budget

Spatial entry is renderer (125.6 kB gzip) plus world geography (53.0 kB gzip) =
**178.6 kB gzip**, against the plan's ≤ 250 kB direction. Continent detail is
13.6–68.8 kB gzip and lazy. For comparison, the existing projected 2D continent
assets this branch does not touch are 185–519 kB gzip each.

`verify-spatial-atlas.mjs` asserts the budget against the built artifact, so it
cannot drift unnoticed.

## 10. Known limits

- **Microstate detail.** `MCO`, `SMR`, `VAT`, `MDV`, `MHL`, `NRU`, `TUV` are
  locator-only even at continent detail. At 1:10m they are a handful of
  coordinates; drawing them would be a dot either way. Documented, not hidden.
- **Kiribati's locator** marks its largest landmass, not its population centre.
  The rule is deterministic and stated; a "principal settlement" rule would need
  a second data source.
- **No callouts or insets.** The projected maps use leader lines and inset panels
  for dense archipelagos. The globe uses scope markers plus dolly instead. That
  is a smaller toolkit, and whether it is sufficient for a Caribbean Locations
  round is a question for hardware testing, not for automation.
