/**
 * Issue #119 spatial prototype — pure spherical geometry maths.
 *
 * No Three.js import and no DOM. Everything here is arithmetic on lat/lon and
 * plain arrays, so it can be reasoned about and tested without a renderer, and
 * so a different F2 renderer decision would not invalidate it.
 */

export interface GlobeCountry {
  id: string;
  /** Outer ring first, then holes. Empty when the country is locator-only. */
  polygons: number[][][][];
  locator?: [number, number];
  bounds: { west: number; east: number; south: number; north: number };
}

export interface GlobeAsset {
  lod: string;
  retained: number;
  countries: GlobeCountry[];
}

export const DEG = Math.PI / 180;

/**
 * Lat/lon to a point on a sphere of the given radius.
 *
 * Convention: +Y is north, longitude 0 faces +Z. Chosen so that a camera placed
 * by the same function looks at the point it names, which keeps the camera
 * director free of sign corrections.
 */
export function toSphere(lonDeg: number, latDeg: number, radius = 1): [number, number, number] {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const cosLat = Math.cos(lat);
  return [radius * cosLat * Math.sin(lon), radius * Math.sin(lat), radius * cosLat * Math.cos(lon)];
}

/**
 * Great-circle-ish midpoint used when subdividing. Interpolating in lat/lon and
 * re-projecting keeps subdivided vertices ON the sphere, which is the whole
 * point — a straight 3D midpoint would sink beneath the surface.
 */
function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/**
 * A triangle spanning many degrees chords visibly through the sphere. Rather
 * than tessellating the whole globe, only triangles whose longest edge exceeds
 * `maxEdgeDeg` are split, recursively. Most country triangles are already small
 * because the source rings are dense, so this touches very few of them.
 */
export function subdivide(
  triangles: Array<[[number, number], [number, number], [number, number]]>,
  maxEdgeDeg: number,
  depth = 0,
): Array<[[number, number], [number, number], [number, number]]> {
  if (depth > 4) return triangles;
  const out: Array<[[number, number], [number, number], [number, number]]> = [];
  let split = false;
  for (const [a, b, c] of triangles) {
    const ab = Math.hypot(a[0] - b[0], a[1] - b[1]);
    const bc = Math.hypot(b[0] - c[0], b[1] - c[1]);
    const ca = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const longest = Math.max(ab, bc, ca);
    if (longest <= maxEdgeDeg) { out.push([a, b, c]); continue; }
    split = true;
    const mab = midpoint(a, b);
    const mbc = midpoint(b, c);
    const mca = midpoint(c, a);
    out.push([a, mab, mca], [mab, b, mbc], [mca, mbc, c], [mab, mbc, mca]);
  }
  return split ? subdivide(out, maxEdgeDeg, depth + 1) : out;
}

/** Degrees of longitude/latitude spanned by a scope, used to choose a camera distance. */
export function boundsSpan(bounds: GlobeCountry['bounds']): { lon: number; lat: number } {
  return { lon: Math.abs(bounds.east - bounds.west), lat: Math.abs(bounds.north - bounds.south) };
}

export function unionBounds(list: GlobeCountry['bounds'][]): GlobeCountry['bounds'] {
  return {
    west: Math.min(...list.map((b) => b.west)),
    east: Math.max(...list.map((b) => b.east)),
    south: Math.min(...list.map((b) => b.south)),
    north: Math.max(...list.map((b) => b.north)),
  };
}

export function boundsCentre(bounds: GlobeCountry['bounds']): [number, number] {
  return [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2];
}

/**
 * Camera distance that frames a span of degrees in a viewport of the given
 * vertical field of view. Derived rather than tuned per scope so a new region
 * needs no hand-authored camera entry.
 */
export function distanceForSpan(spanLatDeg: number, spanLonDeg: number, fovDeg: number, aspect: number): number {
  // Chord subtended on a unit sphere by the larger angular span, with the
  // longitude span foreshortened by the aspect ratio it has to fit into.
  const effective = Math.max(spanLatDeg, (spanLonDeg / Math.max(aspect, 0.35)) * 0.75);
  const angle = Math.min(Math.max(effective, 6), 170) * DEG;
  const chord = 2 * Math.sin(angle / 2);
  const fov = fovDeg * DEG;
  // 1.0 is the sphere radius; the camera must clear the surface as well as fit
  // the chord, which is what the trailing term guarantees at high zoom.
  return Math.max(1.06, 1 + (chord / 2) / Math.tan(fov / 2));
}
