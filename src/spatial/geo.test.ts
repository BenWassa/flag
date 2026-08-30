import { describe, expect, it } from 'vitest';
import {
  ASSIST_INTRUSION_SHARE,
  ASSIST_RADIUS_PX,
  ASSIST_THRESHOLD_PX,
  GeographyIndex,
  mergeForPicking,
} from './geo.js';
import type { GlobeBounds, GlobeCountry } from './globe-asset.js';

/**
 * Issue #166 — the interaction-envelope contract.
 *
 * Synthetic geography, so each rule is stated once and cannot be satisfied by
 * accident. `verify-spatial-touch.mjs` proves the same rules hold against the
 * real generated assets at the frames Atlas actually uses.
 */

const box = (w: number, s: number, e: number, n: number): GlobeBounds => [w, s, e, n];

function square(id: string, lon: number, lat: number, size: number): GlobeCountry {
  const half = size / 2;
  const bounds = box(lon - half, lat - half, lon + half, lat + half);
  return {
    id,
    polygons: [[[
      [lon - half, lat - half], [lon + half, lat - half],
      [lon + half, lat + half], [lon - half, lat + half], [lon - half, lat - half],
    ]]],
    bounds,
    mainland: bounds,
    framing: bounds,
  };
}

function locatorOnly(id: string, lon: number, lat: number): GlobeCountry {
  const bounds = box(lon, lat, lon, lat);
  return { id, polygons: [], locator: [lon, lat], bounds, mainland: bounds, framing: bounds };
}

/** One CSS pixel is this many degrees, so sizes below read directly as pixels. */
const scale = { degreesPerPixel: 0.1 };
const px = (n: number) => n * scale.degreesPerPixel;

describe('GeographyIndex picking', () => {
  it('resolves ordinary geography by containment, with no assistance asked for', () => {
    const index = new GeographyIndex([square('AAA', 0, 0, px(200))]);
    expect(index.resolve(0, 0)).toBe('AAA');
    expect(index.resolve(40, 0)).toBeNull();
  });

  it('lets a speck win a tap on a large neighbour that has area to spare', () => {
    // The reported failure in miniature: a two-pixel country beside a big one.
    const index = new GeographyIndex([
      square('BIG', 0, 0, px(200)),
      square('TINY', px(40), 0, px(2)),
    ]);
    // Without assistance the tap is simply on BIG.
    expect(index.resolve(px(30), 0)).toBe('BIG');
    // With it, a tap inside TINY's envelope resolves to TINY.
    expect(index.resolve(px(30), 0, scale)).toBe('TINY');
    // And BIG keeps everything beyond that envelope.
    expect(index.resolve(px(-60), 0, scale)).toBe('BIG');
  });

  it('never lets a speck take a country\'s own land', () => {
    const index = new GeographyIndex([
      square('SMALL', 0, 0, px(4)),
      square('SPECK', px(6), 0, px(1)),
    ]);
    expect(index.resolve(0, 0, scale)).toBe('SMALL');
    expect(index.resolve(px(6), 0, scale)).toBe('SPECK');
  });

  it('bounds how far an envelope may reach onto another country', () => {
    // MID is 20px across, so its characteristic half-width is 10px and it may
    // lose at most half of that per side.
    const index = new GeographyIndex([
      square('MID', 0, 0, px(20)),
      square('SPECK', px(12), 0, px(1)),
    ]);
    const reach = px(10) * ASSIST_INTRUSION_SHARE;
    expect(index.resolve(px(12) - reach * 0.5, 0, scale)).toBe('SPECK');
    // Beyond the bounded bite, MID keeps its land even though the raw envelope
    // radius would still cover it.
    expect(index.resolve(px(12) - reach * 2, 0, scale)).toBe('MID');
    expect(px(12) - reach * 2).toBeGreaterThan(-px(10));
  });

  it('gives an envelope its full radius over open water', () => {
    const index = new GeographyIndex([locatorOnly('ISL', 0, 0)]);
    expect(index.resolve(px(ASSIST_RADIUS_PX - 1), 0, scale)).toBe('ISL');
    expect(index.resolve(px(ASSIST_RADIUS_PX + 2), 0, scale)).toBeNull();
  });

  it('retires assistance once a country is large enough to aim at', () => {
    const index = new GeographyIndex([
      square('BIG', px(-120), 0, px(200)),
      square('GROWN', px(20), 0, px(ASSIST_THRESHOLD_PX + 2)),
    ]);
    // Above the threshold it is ordinary geography again: a tap beside it
    // belongs to the country it is actually on, and to itself on its own land.
    expect(index.resolve(px(-30), 0, scale)).toBe('BIG');
    expect(index.resolve(px(20), 0, scale)).toBe('GROWN');
    // Zoom out until the same country is a speck and assistance returns.
    const zoomedOut = { degreesPerPixel: scale.degreesPerPixel * 4 };
    expect(index.resolve(px(-25), 0, zoomedOut)).toBe('GROWN');
  });

  it('resolves overlapping open-water envelopes deterministically', () => {
    const countries = [locatorOnly('AAA', 0, 0), locatorOnly('BBB', px(10), 0)];
    const forward = new GeographyIndex(countries);
    const reversed = new GeographyIndex([...countries].reverse());
    for (const at of [px(1), px(4), px(5), px(6), px(9)]) {
      // Nearest anchor wins, and country order in the asset cannot change it.
      expect(forward.resolve(at, 0, scale)).toBe(reversed.resolve(at, 0, scale));
    }
    expect(forward.resolve(px(1), 0, scale)).toBe('AAA');
    expect(forward.resolve(px(9), 0, scale)).toBe('BBB');
  });

  it('does not depend on anything but geometry and the camera', () => {
    // Structural guarantee against answer leakage: the index is constructed from
    // countries alone, so no round, question or progress state can reach it.
    const index = new GeographyIndex([square('AAA', 0, 0, px(2))]);
    expect(index.resolve(px(6), 0, scale)).toBe('AAA');
    expect(index.resolve(px(6), 0, scale)).toBe('AAA');
  });
});

describe('mergeForPicking', () => {
  const world = [square('AAA', 0, 0, px(100)), locatorOnly('TINY', px(20), 0)];
  const detail = [square('AAA', 0, 0, px(100)), square('TINY', px(20), 0, px(1))];

  it('prefers detail geometry for the countries it carries and keeps the rest', () => {
    const merged = mergeForPicking(detail, world);
    expect(merged.map((country) => country.id)).toEqual(['AAA', 'TINY']);
    expect(merged.find((country) => country.id === 'TINY')?.polygons.length).toBe(1);
  });

  it('falls back to the world asset when no detail is mounted', () => {
    expect(mergeForPicking(null, world)).toBe(world);
    expect(mergeForPicking([], world)).toBe(world);
  });

  it('keeps a microstate selectable once its continent detail arrives', () => {
    // The regression: consulting detail then world in sequence let any detail
    // polygon short-circuit the assistance the world asset was providing.
    const before = new GeographyIndex(world);
    const after = new GeographyIndex(mergeForPicking(detail, world));
    expect(before.resolve(px(16), 0, scale)).toBe('TINY');
    expect(after.resolve(px(16), 0, scale)).toBe('TINY');
  });
});
