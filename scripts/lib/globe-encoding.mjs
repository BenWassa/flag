/**
 * Issue #119 — compact spherical-ring encoding shared by the generator and the
 * verifiers.
 *
 * Rings are quantised to a fixed grid, delta-encoded and written as a
 * base-64-ish varint string (the encoding Google's polyline format uses). The
 * runtime decoder in `src/spatial/globe-asset.ts` is the mirror image of this
 * file and both are asserted against each other by `verify-globe-assets.mjs`.
 *
 * Why not plain JSON coordinate arrays: at world level the experiment measured
 * 269.5 kB gzip for exactly the geometry this format carries. Most of those
 * bytes were decimal exponents and separators, not geography.
 */

/**
 * Separators must sit OUTSIDE the encoder's own character range. Varint output
 * uses char codes 63..126 inclusive, so `;` (59) and `,` (44) can never appear
 * in encoded geometry and cannot be mistaken for a vertex.
 */
/** Ring separator inside one polygon. First ring is the outer ring. */
export const RING_SEPARATOR = ';';
/** Polygon separator inside one country. */
export const POLYGON_SEPARATOR = ',';

export function encodeSignedValue(value) {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>>= 5;
  }
  return out + String.fromCharCode(v + 63);
}

/**
 * `ring` is an array of [lon, lat] in degrees. Both axes are quantised with the
 * same `precision` (units per degree) and delta-encoded against the previous
 * vertex, which is what makes the output compressible: a simplified coastline
 * is a long run of small numbers.
 */
export function encodeRing(ring, precision) {
  let previousLon = 0;
  let previousLat = 0;
  let out = '';
  for (const [lon, lat] of ring) {
    const x = Math.round(lon * precision);
    const y = Math.round(lat * precision);
    out += encodeSignedValue(x - previousLon);
    out += encodeSignedValue(y - previousLat);
    previousLon = x;
    previousLat = y;
  }
  return out;
}

export function decodeRing(encoded, precision) {
  const ring = [];
  let index = 0;
  let lon = 0;
  let lat = 0;
  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
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

export function encodePolygons(polygons, precision) {
  return polygons
    .map((polygon) => polygon.map((ring) => encodeRing(ring, precision)).join(RING_SEPARATOR))
    .join(POLYGON_SEPARATOR);
}

export function decodePolygons(encoded, precision) {
  if (!encoded) return [];
  return encoded
    .split(POLYGON_SEPARATOR)
    .map((polygon) => polygon.split(RING_SEPARATOR).map((ring) => decodeRing(ring, precision)));
}
