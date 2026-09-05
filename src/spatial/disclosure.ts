/**
 * Issue #197 — progressive disclosure geometry.
 *
 * Political detail on the Earth follows the decision the learner is currently
 * making: continents at world level, a continent's areas once one is framed,
 * and country outlines only where an activity genuinely needs them.
 *
 * ARCHITECTURE DECISION: continent and region shells are DERIVED FROM THE
 * CANONICAL COUNTRY GEOMETRY ALREADY SHIPPED, not baked as a second geography
 * source. The generated assets come from one pinned Natural Earth topology, so
 * two neighbouring countries share their common boundary vertex for vertex. A
 * segment carried twice inside the same group is therefore an interior border by
 * construction, and dropping it leaves exactly the group's outline.
 *
 * That is why there is no second topology, no handwritten shell, no mask and no
 * extra download: a "continent" here is the canonical countries of that
 * continent with their shared edges cancelled, and which countries those are is
 * still decided by the curriculum tables alone. `verify-spatial-disclosure.mjs`
 * proves the cancellation actually happens, against the canonical land-adjacency
 * tables, rather than trusting that it does.
 *
 * Nothing in this file imports a renderer, a taxonomy or the DOM.
 */

import { DEG, wrapLon, type Framing } from './geo.js';
import type { GlobeCountry } from './globe-asset.js';

/** Which group a country's geometry belongs to. Groups are opaque strings. */
export type GroupOf = (countryId: string) => string | null;

/**
 * Vertices are compared on a fixed grid rather than by float identity. The
 * generated assets are quantised, so a shared arc decodes to bit-identical
 * numbers; rounding here simply makes that independent of how the decoder
 * happens to divide.
 *
 * Longitude is wrapped for the key only. Rings arrive in the asset's own
 * unwrapped longitude space, and two countries meeting near the antimeridian can
 * legitimately carry the same real boundary at longitudes 360 degrees apart.
 * Wrapping the key — never the emitted coordinate — makes them cancel while the
 * geometry the renderer receives stays continuous.
 */
const KEY_PRECISION = 1e5;
const LAT_KEYS = 1 << 25;
const LON_OFFSET = 180 * KEY_PRECISION;
const LAT_OFFSET = 90 * KEY_PRECISION;

/** One vertex as a single exact integer, so keys are numbers rather than strings. */
function vertexKey(lon: number, lat: number): number {
  const x = Math.round(wrapLon(lon) * KEY_PRECISION) + LON_OFFSET;
  const y = Math.round(lat * KEY_PRECISION) + LAT_OFFSET;
  return x * LAT_KEYS + y;
}

/**
 * Every boundary segment in an asset, with the country or countries that carry
 * it.
 *
 * This is the whole of the shell derivation, and it is computed ONCE PER ASSET
 * rather than once per navigation. A segment two countries share is an interior
 * border whenever those two countries are in the same group, so re-grouping the
 * geography — world to continent, continent to areas, areas to countries — is
 * then a linear scan with two lookups per segment and no geometry analysis at
 * all. Which is what lets the level of detail follow the learner's decision
 * without a hitch in the camera.
 */
export interface BoundaryTopology {
  /** Flat `[lonA, latA, lonB, latB, ...]`, one quad per segment. */
  readonly coords: Float64Array;
  /** The country carrying each segment. */
  readonly owner: readonly string[];
  /** The country on the other side, or null for a coastline. */
  readonly neighbour: readonly (string | null)[];
}

export function buildBoundaryTopology(countries: readonly GlobeCountry[]): BoundaryTopology {
  const coords: number[] = [];
  const owner: string[] = [];
  const neighbour: (string | null)[] = [];
  // Nested numeric maps: a shared arc is found by two integer lookups, which is
  // what keeps a whole-world pass to a handful of milliseconds.
  const index = new Map<number, Map<number, number>>();

  for (const country of countries) {
    for (const polygon of country.polygons) {
      for (const ring of polygon) {
        for (let i = 0; i < ring.length; i += 1) {
          const from = ring[i];
          const to = ring[(i + 1) % ring.length];
          const a = vertexKey(from[0], from[1]);
          const b = vertexKey(to[0], to[1]);
          if (a === b) continue;
          const low = a < b ? a : b;
          const high = a < b ? b : a;
          const bucket = index.get(low);
          const existing = bucket?.get(high);
          if (existing !== undefined && neighbour[existing] === null && owner[existing] !== country.id) {
            neighbour[existing] = country.id;
            continue;
          }
          const segment = owner.length;
          coords.push(from[0], from[1], to[0], to[1]);
          owner.push(country.id);
          neighbour.push(null);
          if (bucket) { if (existing === undefined) bucket.set(high, segment); }
          else index.set(low, new Map([[high, segment]]));
        }
      }
    }
  }

  return { coords: Float64Array.from(coords), owner, neighbour };
}

export interface BoundarySelection {
  groupOf: GroupOf;
  /** Countries whose geometry another layer already draws. */
  exclude?: ReadonlySet<string>;
  /** Groups drawn as the emphasised outline rather than the ordinary one. */
  emphasis?: ReadonlySet<string>;
  /** Which half of that split to return. */
  emphasised?: boolean;
}

/**
 * Boundary segments for one grouping, as a flat `[lonA, latA, lonB, latB, ...]`
 * list.
 *
 * A segment both of whose countries fall in the same group is interior and is
 * dropped; everything else survives. With every country in a group of its own
 * nothing cancels, so ordinary country borders are the same call with the
 * identity grouping rather than a separate code path.
 */
export function boundarySegments(
  topology: BoundaryTopology,
  { groupOf, exclude, emphasis, emphasised = false }: BoundarySelection,
): number[] {
  const flat: number[] = [];
  const { coords, owner, neighbour } = topology;
  for (let i = 0; i < owner.length; i += 1) {
    const a = owner[i];
    const b = neighbour[i];
    // A country another layer already draws is not on this one at all, so a
    // border it shares becomes the surviving side's coastline rather than
    // vanishing with it.
    const groupA = exclude?.has(a) ? null : groupOf(a);
    const groupB = b !== null && !exclude?.has(b) ? groupOf(b) : null;
    if (groupA === null && groupB === null) continue;
    if (groupA !== null && groupB !== null && groupA === groupB) continue;
    const selected = (groupA !== null && emphasis?.has(groupA) === true)
      || (groupB !== null && emphasis?.has(groupB) === true);
    if (selected !== emphasised) continue;
    const at = i * 4;
    flat.push(coords[at], coords[at + 1], coords[at + 2], coords[at + 3]);
  }
  return flat;
}

/** Convenience for checks and tests: derive the topology and select in one call. */
export function groupBoundarySegments(
  countries: readonly GlobeCountry[],
  groupOf: GroupOf,
  exclude?: ReadonlySet<string>,
): number[] {
  return boundarySegments(buildBoundaryTopology(countries), { groupOf, exclude });
}

/**
 * How finely a scope's framing box is sampled when placing its label. Small
 * enough to run over a whole continent's geometry in a few milliseconds, fine
 * enough that the chosen cell is well inside the land it names.
 */
const ANCHOR_CELLS = 48;
/** Below this much clearance the scope has no interior worth writing on. */
const ANCHOR_MIN_CELLS = 1.5;

interface RowRing {
  points: readonly number[][];
  /** Offsets from the framing centre, unwrapped along the ring. */
  offsets: number[];
  minLat: number;
  maxLat: number;
}

/**
 * Ring offsets, unwrapped ALONG THE RING rather than per vertex.
 *
 * Wrapping each vertex independently would cut a ring that straddles the
 * framing centre's antipode into two halves half a planet apart, and the
 * scanline below would then count a crossing that does not exist.
 */
function offsetsFor(ring: readonly number[][], centreLon: number): number[] {
  const offsets: number[] = [wrapLon(ring[0][0] - centreLon)];
  for (let i = 1; i < ring.length; i += 1) {
    const previous = offsets[i - 1];
    offsets.push(previous + wrapLon(ring[i][0] - centreLon - previous));
  }
  return offsets;
}

/**
 * Where to write a scope's name: the most interior point of its own geography
 * inside its own camera frame.
 *
 * Both halves of that matter. A centroid falls outside a concave region and into
 * the sea for an arc of islands, and geometry alone would put "Europe" deep in
 * Siberia because Atlas files Russia under Eastern Europe. So the search is
 * bounded by the SAME framing the camera uses — which already carries the
 * declared continent framing policy — and maximises clearance from the scope's
 * own coast inside it.
 *
 * A scope with no interior at this scale is an archipelago, and there is nowhere
 * on land to write its name at all: those fall back to the centre of the frame,
 * which is where an atlas writes "Polynesia" too.
 */
export function scopeAnchor(
  polygons: readonly number[][][][],
  framing: Framing,
  cells = ANCHOR_CELLS,
): readonly [number, number] {
  const centre: readonly [number, number] = [wrapLon(framing.lon), framing.lat];
  const halfLon = framing.spanLon / 2;
  const halfLat = framing.spanLat / 2;
  if (!(halfLon > 0) || !(halfLat > 0) || !polygons.length) return centre;

  const cellLon = (2 * halfLon) / cells;
  const cellLat = (2 * halfLat) / cells;
  // Latitude-corrected, so clearance is measured in ground distance rather than
  // in degrees that shrink toward the poles.
  const widthDeg = cellLon * Math.max(0.1, Math.cos(framing.lat * DEG));
  const heightDeg = cellLat;
  const diagonalDeg = Math.hypot(widthDeg, heightDeg);

  const prepared: RowRing[][] = [];
  for (const polygon of polygons) {
    const rings: RowRing[] = [];
    for (const ring of polygon) {
      if (ring.length < 3) continue;
      let minLat = Infinity;
      let maxLat = -Infinity;
      for (const point of ring) {
        if (point[1] < minLat) minLat = point[1];
        if (point[1] > maxLat) maxLat = point[1];
      }
      rings.push({ points: ring, offsets: offsetsFor(ring, centre[0]), minLat, maxLat });
    }
    if (rings.length) prepared.push(rings);
  }
  if (!prepared.length) return centre;

  const inside = new Uint8Array(cells * cells);
  const crossings: number[] = [];
  for (let row = 0; row < cells; row += 1) {
    const lat = framing.lat - halfLat + (row + 0.5) * cellLat;
    for (const rings of prepared) {
      crossings.length = 0;
      for (const ring of rings) {
        if (lat < ring.minLat || lat > ring.maxLat) continue;
        const { points, offsets } = ring;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const yi = points[i][1];
          const yj = points[j][1];
          if ((yi > lat) === (yj > lat)) continue;
          crossings.push(offsets[j] + ((offsets[i] - offsets[j]) * (lat - yj)) / (yi - yj));
        }
      }
      if (crossings.length < 2) continue;
      // Even-odd across every ring of the polygon at once, so holes stay outside.
      crossings.sort((a, b) => a - b);
      for (let pair = 0; pair + 1 < crossings.length; pair += 2) {
        const start = Math.max(0, Math.ceil((crossings[pair] + halfLon) / cellLon - 0.5));
        const end = Math.min(cells - 1, Math.floor((crossings[pair + 1] + halfLon) / cellLon - 0.5));
        for (let column = start; column <= end; column += 1) inside[row * cells + column] = 1;
      }
    }
  }

  // Two-pass chamfer distance to the nearest cell that is not this scope's land.
  // The grid border counts as outside, so a scope filling its own frame still
  // resolves to the middle of it rather than to an arbitrary edge.
  const distance = new Float32Array(cells * cells);
  for (let index = 0; index < distance.length; index += 1) distance[index] = inside[index] ? 1e6 : 0;
  const relax = (index: number, from: number, cost: number) => {
    const candidate = distance[from] + cost;
    if (candidate < distance[index]) distance[index] = candidate;
  };
  const edgeCost = Math.min(widthDeg, heightDeg);
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const index = row * cells + column;
      if (!inside[index]) continue;
      if (row === 0 || column === 0 || row === cells - 1 || column === cells - 1) {
        if (distance[index] > edgeCost) distance[index] = edgeCost;
      }
      if (column > 0) relax(index, index - 1, widthDeg);
      if (row > 0) relax(index, index - cells, heightDeg);
      if (row > 0 && column > 0) relax(index, index - cells - 1, diagonalDeg);
      if (row > 0 && column < cells - 1) relax(index, index - cells + 1, diagonalDeg);
    }
  }
  for (let row = cells - 1; row >= 0; row -= 1) {
    for (let column = cells - 1; column >= 0; column -= 1) {
      const index = row * cells + column;
      if (!inside[index]) continue;
      if (column < cells - 1) relax(index, index + 1, widthDeg);
      if (row < cells - 1) relax(index, index + cells, heightDeg);
      if (row < cells - 1 && column < cells - 1) relax(index, index + cells + 1, diagonalDeg);
      if (row < cells - 1 && column > 0) relax(index, index + cells - 1, diagonalDeg);
    }
  }

  let best = -1;
  let bestIndex = -1;
  for (let index = 0; index < distance.length; index += 1) {
    if (inside[index] && distance[index] > best) { best = distance[index]; bestIndex = index; }
  }
  if (bestIndex < 0 || best < ANCHOR_MIN_CELLS * Math.max(widthDeg, heightDeg)) return centre;

  return [
    wrapLon(framing.lon - halfLon + ((bestIndex % cells) + 0.5) * cellLon),
    framing.lat - halfLat + (Math.floor(bestIndex / cells) + 0.5) * cellLat,
  ];
}
