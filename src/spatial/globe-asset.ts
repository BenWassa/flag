/**
 * Issue #119 — decoded shape of a generated spherical geography asset.
 *
 * The encoded form is produced by `scripts/generate-globe-assets.mjs` and is
 * the mirror image of `scripts/lib/globe-encoding.mjs`; `verify-globe-assets.mjs`
 * asserts the two agree. Nothing in this file imports a renderer, so a different
 * F2 decision would not invalidate the geography contract.
 */

/** [west, south, east, north] in degrees, in the asset's unwrapped longitude space. */
export type GlobeBounds = readonly [number, number, number, number];

export interface EncodedGlobeCountry {
  /** Canonical ISO3. Identity is owned by src/data/countries.ts, never by geometry. */
  id: string;
  /** Delta-varint polygons. Empty when the country is locator-only at this LOD. */
  p: string;
  /** Full extent across every polygon, including distant territories. */
  b: GlobeBounds;
  /** Largest polygon only. Absent when identical to `b`. */
  m?: GlobeBounds;
  /** Framing box under the continent's declared policy. Absent when identical to `m`. */
  f?: GlobeBounds;
  /** Set when the continent's declared policy excludes this country from framing. */
  x?: 1;
  /** [lon, lat] when simplification retained no ring for this country. */
  l?: readonly [number, number];
}

export interface EncodedGlobeAsset {
  lod: string;
  /** Quantisation units per degree. */
  precision: number;
  /** topojson-simplify quantile fraction the asset was simplified at. */
  retained: number;
  countries: readonly EncodedGlobeCountry[];
}

export interface GlobeCountry {
  id: string;
  /** Outer ring first, then holes. Empty when the country is locator-only. */
  polygons: number[][][][];
  locator?: readonly [number, number];
  bounds: GlobeBounds;
  /** Largest polygon only. */
  mainland: GlobeBounds;
  /**
   * What this country contributes to a camera frame, or `null` when the
   * continent's declared framing policy excludes it. See the FRAMING POLICY note
   * in `scripts/generate-globe-assets.mjs`.
   */
  framing: GlobeBounds | null;
}

export interface GlobeAsset {
  lod: string;
  retained: number;
  countries: GlobeCountry[];
}

const RING_SEPARATOR = ';';
const POLYGON_SEPARATOR = ',';

/**
 * Mirror of `encodeRing`. Separators are chosen below the encoder's own 63..126
 * character range so they can never collide with encoded vertex data.
 */
export function decodeRing(encoded: string, precision: number): number[][] {
  const ring: number[][] = [];
  let index = 0;
  let lon = 0;
  let lat = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lon += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    ring.push([lon / precision, lat / precision]);
  }
  return ring;
}

export function decodePolygons(encoded: string, precision: number): number[][][][] {
  if (!encoded) return [];
  return encoded
    .split(POLYGON_SEPARATOR)
    .map((polygon) => polygon.split(RING_SEPARATOR).map((ring) => decodeRing(ring, precision)));
}

export function decodeGlobeAsset(asset: EncodedGlobeAsset): GlobeAsset {
  return {
    lod: asset.lod,
    retained: asset.retained,
    countries: asset.countries.map((country) => ({
      id: country.id,
      polygons: decodePolygons(country.p, asset.precision),
      locator: country.l,
      bounds: country.b,
      mainland: country.m ?? country.b,
      framing: country.x ? null : country.f ?? country.m ?? country.b,
    })),
  };
}
