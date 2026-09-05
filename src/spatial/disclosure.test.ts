import { describe, expect, it } from 'vitest';
import { boundarySegments, buildBoundaryTopology, groupBoundarySegments, scopeAnchor } from './disclosure.js';
import type { GlobeBounds, GlobeCountry } from './globe-asset.js';

/**
 * Issue #197 — the two derivations progressive disclosure rests on, tested
 * against geometry small enough to reason about by hand. The same properties
 * are asserted against the real production assets by
 * `scripts/verify-spatial-disclosure.mjs`.
 */

function country(id: string, rings: number[][][][]): GlobeCountry {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const polygon of rings) {
    for (const [lon, lat] of polygon[0]) {
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    }
  }
  const bounds: GlobeBounds = [west, south, east, north];
  return { id, polygons: rings, bounds, mainland: bounds, framing: bounds };
}

/** Two unit squares meeting along longitude 1: `left | right`. */
const LEFT = country('LFT', [[[[0, 0], [1, 0], [1, 1], [0, 1]]]]);
const RIGHT = country('RGT', [[[[1, 0], [2, 0], [2, 1], [1, 1]]]]);
const segmentCount = (flat: number[]) => flat.length / 4;

describe('boundary derivation', () => {
  it('keeps every edge when each country is its own group', () => {
    const flat = groupBoundarySegments([LEFT, RIGHT], (id) => id);
    // Four edges each, with the shared one carried once rather than twice.
    expect(segmentCount(flat)).toBe(7);
  });

  it('drops the border two countries of the same group share', () => {
    const flat = groupBoundarySegments([LEFT, RIGHT], () => 'group');
    expect(segmentCount(flat)).toBe(6);
    // The surviving outline is the union's own rectangle: nothing at longitude 1
    // runs between the two, and its outer corners are still there.
    for (let i = 0; i < flat.length; i += 4) {
      expect(flat[i] === 1 && flat[i + 2] === 1).toBe(false);
    }
  });

  it('keeps the border when the two countries are in different groups', () => {
    const flat = groupBoundarySegments([LEFT, RIGHT], (id) => (id === 'LFT' ? 'a' : 'b'));
    expect(segmentCount(flat)).toBe(7);
  });

  it('cancels a shared edge expressed on both sides of the antimeridian', () => {
    // The asset's unwrapped longitude space can carry the same real boundary at
    // 180 and at -180. It is still one border and must still cancel.
    const west = country('WST', [[[[179, 0], [180, 0], [180, 1], [179, 1]]]]);
    const east = country('EST', [[[[-180, 0], [-179, 0], [-179, 1], [-180, 1]]]]);
    expect(segmentCount(groupBoundarySegments([west, east], () => 'one'))).toBe(6);
    expect(segmentCount(groupBoundarySegments([west, east], (id) => id))).toBe(7);
  });

  it('leaves the surviving side drawn when the other is excluded', () => {
    const topology = buildBoundaryTopology([LEFT, RIGHT]);
    const flat = boundarySegments(topology, { groupOf: () => 'one', exclude: new Set(['LFT']) });
    // The right square keeps its whole outline, shared edge included: the left
    // one is being drawn by another layer, not merged into this one.
    expect(segmentCount(flat)).toBe(4);
  });

  it('splits emphasis and ordinary boundaries without drawing either twice', () => {
    const topology = buildBoundaryTopology([LEFT, RIGHT]);
    const groupOf = (id: string) => (id === 'LFT' ? 'a' : 'b');
    const emphasis = new Set(['a']);
    const ordinary = boundarySegments(topology, { groupOf, emphasis, emphasised: false });
    const selected = boundarySegments(topology, { groupOf, emphasis, emphasised: true });
    expect(segmentCount(ordinary) + segmentCount(selected)).toBe(7);
    // The shared edge belongs to the emphasised outline, which is the one being
    // drawn a step stronger; it is not also drawn as an ordinary boundary.
    expect(segmentCount(selected)).toBe(4);
  });

  it('is deterministic, so the same asset always builds the same buffer', () => {
    const once = groupBoundarySegments([LEFT, RIGHT], () => 'one');
    const twice = groupBoundarySegments([LEFT, RIGHT], () => 'one');
    expect(once).toEqual(twice);
  });
});

describe('label anchors', () => {
  const framing = { lon: 1, lat: 0.5, spanLon: 4, spanLat: 4 };

  it('places a name inside the land it names', () => {
    const [lon, lat] = scopeAnchor([LEFT.polygons[0], RIGHT.polygons[0]], framing);
    expect(lon).toBeGreaterThan(0);
    expect(lon).toBeLessThan(2);
    expect(lat).toBeGreaterThan(0);
    expect(lat).toBeLessThan(1);
  });

  it('avoids the hollow of a concave scope', () => {
    // A C shape open to the east. A centroid would land in the gap; the anchor
    // has to stay on the land.
    const shape = country('CEE', [[[
      [0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [3, 2], [3, 3], [0, 3],
    ]]]);
    const [lon, lat] = scopeAnchor(shape.polygons, { lon: 1.5, lat: 1.5, spanLon: 4, spanLat: 4 });
    const inGap = lon > 1 && lon < 3 && lat > 1 && lat < 2;
    expect(inGap).toBe(false);
    expect(lon).toBeGreaterThan(0);
    expect(lon).toBeLessThan(3);
  });

  it('falls back to the centre of the frame for an archipelago', () => {
    // Specks scattered across a wide frame: there is nowhere on land to write
    // the name, so it goes where an atlas writes it — across the water.
    const islands = [
      [[[-30, -2], [-29.9, -2], [-29.9, -1.9], [-30, -1.9]]],
      [[[30, 2], [30.1, 2], [30.1, 2.1], [30, 2.1]]],
    ];
    const wide = { lon: 0, lat: 0, spanLon: 80, spanLat: 40 };
    expect(scopeAnchor(islands, wide)).toEqual([0, 0]);
  });

  it('falls back to the centre of the frame when a scope has no geometry', () => {
    expect(scopeAnchor([], framing)).toEqual([1, 0.5]);
  });

  it('holds an anchor inside a scope framed across the antimeridian', () => {
    const island = country('PAC', [[[[178, -5], [-178, -5], [-178, -3], [178, -3]]]]);
    const [lon, lat] = scopeAnchor(island.polygons, { lon: 180, lat: -4, spanLon: 8, spanLat: 6 });
    expect(Math.abs(lon)).toBeGreaterThan(175);
    expect(lat).toBeGreaterThan(-5);
    expect(lat).toBeLessThan(-3);
  });
});
