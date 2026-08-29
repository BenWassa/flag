/**
 * Issue #119 — pure spherical geography maths.
 *
 * No Three.js import and no DOM. Everything here is arithmetic on lat/lon and
 * plain arrays, so it is unit-testable without a renderer and a different F2
 * decision would not invalidate it.
 */

import type { GlobeBounds, GlobeCountry } from './globe-asset.js';

export const DEG = Math.PI / 180;

export type Vector3 = readonly [number, number, number];

/**
 * Lat/lon to a point on a sphere of the given radius.
 *
 * Convention: +Y is north, longitude 0 faces +Z. Chosen so that a camera placed
 * by the same function looks at the point it names, which keeps the camera
 * director free of sign corrections.
 */
export function toSphere(lonDeg: number, latDeg: number, radius = 1): Vector3 {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const cosLat = Math.cos(lat);
  return [radius * cosLat * Math.sin(lon), radius * Math.sin(lat), radius * cosLat * Math.cos(lon)];
}

/** Inverse of `toSphere`. Longitude comes back normalised to (-180, 180]. */
export function fromSphere(x: number, y: number, z: number): [number, number] {
  const radius = Math.hypot(x, y, z) || 1;
  const lat = Math.asin(Math.max(-1, Math.min(1, y / radius))) / DEG;
  const lon = Math.atan2(x, z) / DEG;
  return [lon, lat];
}

export const wrapLon = (degrees: number): number => ((degrees + 540) % 360) - 180;

/**
 * Great-circle-ish midpoint used when subdividing. Interpolating in lat/lon and
 * re-projecting keeps subdivided vertices ON the sphere, which is the whole
 * point — a straight 3D midpoint would sink beneath the surface.
 */
function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export type Triangle = [[number, number], [number, number], [number, number]];

/**
 * Bends flat triangles onto the sphere without cracking them.
 *
 * A triangle spanning many degrees chords visibly through the sphere, so long
 * edges have to be split and the new vertices re-projected. The subtlety is
 * WHICH edges: splitting a triangle because its longest edge is too long, while
 * its neighbour across a shorter shared edge stays whole, leaves a T-junction —
 * the split side bows outward onto the sphere and the unsplit side stays a
 * chord, so a hairline of ocean shows through the middle of a country. Those
 * seams were visible across Mali, Niger and Algeria.
 *
 * So the decision is made PER EDGE, from the edge alone. Two triangles sharing
 * an edge therefore always agree about it, and the midpoint each computes is
 * bit-identical, which is what removes the cracks rather than hiding them.
 */
export function subdivide(triangles: Triangle[], maxEdgeDeg: number, depth = 0): Triangle[] {
  if (depth > 5) return triangles;
  const out: Triangle[] = [];
  let split = false;

  for (const [a, b, c] of triangles) {
    const longAB = Math.hypot(a[0] - b[0], a[1] - b[1]) > maxEdgeDeg;
    const longBC = Math.hypot(b[0] - c[0], b[1] - c[1]) > maxEdgeDeg;
    const longCA = Math.hypot(c[0] - a[0], c[1] - a[1]) > maxEdgeDeg;
    const count = Number(longAB) + Number(longBC) + Number(longCA);
    if (count === 0) { out.push([a, b, c]); continue; }
    split = true;

    if (count === 3) {
      const mab = midpoint(a, b);
      const mbc = midpoint(b, c);
      const mca = midpoint(c, a);
      out.push([a, mab, mca], [mab, b, mbc], [mca, mbc, c], [mab, mbc, mca]);
      continue;
    }

    if (count === 1) {
      // Bisect the long edge and fan from the opposite vertex.
      if (longAB) { const m = midpoint(a, b); out.push([a, m, c], [m, b, c]); }
      else if (longBC) { const m = midpoint(b, c); out.push([b, m, a], [m, c, a]); }
      else { const m = midpoint(c, a); out.push([c, m, b], [m, a, b]); }
      continue;
    }

    // Two long edges: bisect both and triangulate the resulting quad.
    if (!longCA) {
      const mab = midpoint(a, b);
      const mbc = midpoint(b, c);
      out.push([mab, b, mbc], [a, mab, mbc], [a, mbc, c]);
    } else if (!longAB) {
      const mbc = midpoint(b, c);
      const mca = midpoint(c, a);
      out.push([mbc, c, mca], [b, mbc, mca], [b, mca, a]);
    } else {
      const mca = midpoint(c, a);
      const mab = midpoint(a, b);
      out.push([mca, a, mab], [c, mca, mab], [c, mab, b]);
    }
  }

  return split ? subdivide(out, maxEdgeDeg, depth + 1) : out;
}

export interface Framing { lon: number; lat: number; spanLon: number; spanLat: number }

/**
 * Where to point the camera for a set of bounding boxes, and how much has to fit.
 *
 * Longitude is averaged CIRCULARLY. An arithmetic mean puts a scope spanning the
 * antimeridian at longitude 0 — the exact opposite side of the planet from where
 * it is. The span is then the widest wrapped angular distance from that centre,
 * doubled, so Polynesia and Chukotka still get a sane frame.
 */
export function framingFor(list: readonly GlobeBounds[]): Framing | null {
  if (!list.length) return null;

  // A provisional centre, so every edge can be expressed as a signed offset the
  // short way round. Longitude is averaged CIRCULARLY: an arithmetic mean puts a
  // scope spanning the antimeridian at longitude 0, the exact opposite side of
  // the planet from where it is.
  let x = 0;
  let y = 0;
  for (const [west, , east] of list) {
    const centre = west + wrapLon(east - west) / 2;
    const radians = centre * DEG;
    x += Math.cos(radians);
    y += Math.sin(radians);
  }
  const provisional = Math.atan2(y / list.length, x / list.length) / DEG;

  /*
   * The frame is the UNION of what it was given, re-centred on that union.
   *
   * Which countries a scope contributes is decided upstream by the continent's
   * declared framing policy — the same `focusExcludeCountryIds` /
   * `focusCountryBounds` the 2D pipeline uses — so this function does no
   * trimming of its own. The provisional centre alone would not do: it is a mean
   * over countries, so thirteen Caribbean states outvote Canada and put "North
   * America" in the Atlantic. The midpoint of the union does not.
   */
  let westOffset = Infinity;
  let eastOffset = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [west, boxSouth, east, boxNorth] of list) {
    westOffset = Math.min(westOffset, wrapLon(west - provisional));
    eastOffset = Math.max(eastOffset, wrapLon(east - provisional));
    south = Math.min(south, boxSouth);
    north = Math.max(north, boxNorth);
  }

  return {
    lon: wrapLon(provisional + (westOffset + eastOffset) / 2),
    lat: (south + north) / 2,
    spanLon: Math.max(0, eastOffset - westOffset) * FRAMING_PADDING,
    spanLat: Math.max(0, north - south) * FRAMING_PADDING,
  };
}

/** Breathing room so the framed scope is not edge-to-edge in the viewport. */
const FRAMING_PADDING = 1.12;
/** Closest useful frame, in degrees of arc. See `distanceForSpan`. */
const MINIMUM_FRAMED_SPAN_DEG = 18;

/**
 * Camera distance that frames a span of degrees in a viewport of the given
 * vertical field of view. Derived rather than tuned per scope so a new region
 * needs no hand-authored camera entry.
 */
export function distanceForSpan(spanLatDeg: number, spanLonDeg: number, fovDeg: number, aspect: number): number {
  // Chord subtended on a unit sphere by the larger angular span, with the
  // longitude span foreshortened by the aspect ratio it has to fit into.
  const effective = Math.max(spanLatDeg, (spanLonDeg / Math.max(aspect, 0.35)) * 0.75);
  // Floor, not just a clamp. Polynesia is three specks inside nine degrees and
  // the Caucasus is barely wider; framed to their own extent the learner would
  // get a screen of empty ocean with no orienting geography around it. The floor
  // is roughly 2,000 km, which is enough to show the neighbours that make a
  // small scope legible.
  const angle = Math.min(Math.max(effective, MINIMUM_FRAMED_SPAN_DEG), 170) * DEG;
  const chord = 2 * Math.sin(angle / 2);
  const fov = fovDeg * DEG;
  // 1.0 is the sphere radius; the camera must clear the surface as well as fit
  // the chord, which is what the lower bound guarantees at high zoom.
  return Math.max(1.06, 1 + (chord / 2) / Math.tan(fov / 2));
}

/** Standard even-odd ray crossing test in the ring's own unwrapped longitude space. */
export function pointInRing(lon: number, lat: number, ring: readonly number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function withinBounds(lon: number, lat: number, [west, south, east, north]: GlobeBounds): boolean {
  return lat >= south && lat <= north && lon >= west && lon <= east;
}

/**
 * Geographic picking index.
 *
 * PICKING GEOMETRY IS NOT DISPLAY GEOMETRY. The renderer draws tessellated,
 * subdivided triangles; identity is resolved here against the source rings in
 * lat/lon. That separation means picking cannot drift with a tessellation
 * change, works identically for locator-only countries, and stays testable in
 * plain Node.
 */
export class GeographyIndex {
  private readonly countries: readonly GlobeCountry[];

  constructor(countries: readonly GlobeCountry[]) {
    this.countries = countries;
  }

  /**
   * ISO3 at a geographic position, or null over water.
   *
   * `locatorToleranceDeg` is the angular radius within which a locator-only
   * country claims a tap. It is supplied by the caller from the current camera
   * distance so the tolerance is roughly constant in screen space rather than
   * in degrees — a locator must stay tappable at world zoom without swallowing
   * half a continent when the camera is close.
   */
  resolve(lonDeg: number, latDeg: number, locatorToleranceDeg = 0): string | null {
    const lon = wrapLon(lonDeg);
    // Rings live in the asset's unwrapped longitude space, so a query near the
    // antimeridian has to be offered in all three equivalent forms.
    const candidates = [lon, lon + 360, lon - 360];

    for (const country of this.countries) {
      if (!country.polygons.length) continue;
      for (const shifted of candidates) {
        if (!withinBounds(shifted, latDeg, country.bounds)) continue;
        for (const polygon of country.polygons) {
          if (!pointInRing(shifted, latDeg, polygon[0])) continue;
          let inHole = false;
          for (let h = 1; h < polygon.length; h += 1) {
            if (pointInRing(shifted, latDeg, polygon[h])) { inHole = true; break; }
          }
          if (!inHole) return country.id;
        }
      }
    }

    if (locatorToleranceDeg <= 0) return null;
    let best: string | null = null;
    let bestDistance = locatorToleranceDeg;
    for (const country of this.countries) {
      if (!country.locator) continue;
      const [locatorLon, locatorLat] = country.locator;
      const dLat = latDeg - locatorLat;
      // Longitude degrees shrink with latitude; without the cosine a Pacific
      // locator would claim a band far wider than it looks on screen.
      const dLon = wrapLon(lon - locatorLon) * Math.cos(latDeg * DEG);
      const distance = Math.hypot(dLat, dLon);
      if (distance < bestDistance) { bestDistance = distance; best = country.id; }
    }
    return best;
  }
}
