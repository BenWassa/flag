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
 * PRACTICAL TOUCH GEOMETRY (#166).
 *
 * The screen size below which a country cannot hold an aimable interior at all.
 * It does two separate jobs, against two different measurements of the same
 * canonical geometry:
 *
 *   - a country whose LARGEST dimension is below it is a speck — ordinary
 *     picking cannot reach it, so it is granted an interaction envelope;
 *   - a country's own room — how wide it actually is, not how wide its bounding
 *     box is — bounds how far any envelope may intrude on its land, so no
 *     country can be covered over by a neighbour's assistance.
 *
 * The second rule is what stops small countries being swallowed. Israel is 28 px
 * tall but 5 px wide at the Asia frame, and Belgium is 22 px across next to a
 * Luxembourg-sized speck: a single unbounded 48 px envelope would erase either
 * of them, while removing assistance altogether leaves Singapore untappable.
 *
 * The value is measured, not chosen by taste. Across the 391 (country, scope)
 * pairs Atlas can frame, the countries reported as untappable are specks at
 * 0–8.6 px (MDV 0.0, SGP 2.5, BHR 3.3, BRN 7.9, PSE 8.6) while the ordinary
 * neighbours contesting their taps are 28–378 px (ISR 28.1, MYS 69.8, SAU
 * 137.9, IND 196.9). 16 px sits inside that gap with 1.75x clearance.
 *
 * Countries in the 16–30 px band are small but genuinely aimable and stay
 * ordinary geography; making them easier is a zoom question, which is #137's
 * workstream and deliberately not this one's.
 */
export const ASSIST_THRESHOLD_PX = 16;

/**
 * Radius of the invisible envelope, giving a 48 px practical target — above the
 * 44 px accessibility minimum. Unchanged in magnitude from the locator
 * tolerance the accepted candidate already shipped, so existing reach does not
 * regress; what changed is WHICH countries get one and how it competes.
 */
export const ASSIST_RADIUS_PX = 24;

/**
 * The share of its characteristic half-width a country may lose to a
 * neighbouring speck's envelope, per side, so it always keeps about half its own
 * width wherever it is narrow.
 *
 * The half-width is measured as twice area over perimeter — which is exactly the
 * width of a long thin shape and the radius of a round one — rather than from
 * the bounding box, because a box is a poor proxy for how much room a country
 * actually has. Italy's box is nine degrees across while the peninsula is nowhere
 * near that wide, and a box-derived bound let San Marino and Vatican City claim
 * discs big enough to cover most of it.
 */
export const ASSIST_INTRUSION_SHARE = 0.5;

/** Camera-derived screen scale. Supplied by the stage, never stored here. */
export interface TouchScale {
  /** Degrees of arc per CSS pixel at the current camera distance. */
  degreesPerPixel: number;
}

interface Envelope {
  id: string;
  anchor: readonly [number, number];
  /** Largest latitude-corrected dimension of the country's mainland, in degrees. */
  spanDeg: number;
  /** Characteristic half-width, in degrees: how much room this country has. */
  roomDeg: number;
}

/**
 * Twice area over perimeter for a country's largest polygon, in latitude-
 * corrected degrees. For a long thin shape this is its width; for a round one,
 * its radius. Both come out of one pass over the rings, so it costs no more than
 * the bounding box it replaces.
 */
function characteristicHalfWidth(country: GlobeCountry): number {
  const [, south, , north] = country.mainland;
  const lonScale = Math.cos(((south + north) / 2) * DEG);
  let bestArea = 0;
  let bestPerimeter = 0;
  for (const polygon of country.polygons) {
    let area = 0;
    let perimeter = 0;
    for (let ring = 0; ring < polygon.length; ring += 1) {
      const points = polygon[ring];
      let ringArea = 0;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i];
        const [xj, yj] = points[j];
        ringArea += (xj * lonScale) * yi - (xi * lonScale) * yj;
        // Only the outer ring's perimeter: holes bound the shape from inside and
        // counting them would understate how much room the country has.
        if (ring === 0) perimeter += Math.hypot((xi - xj) * lonScale, yi - yj);
      }
      // Outer ring adds, holes subtract.
      area += ring === 0 ? Math.abs(ringArea) / 2 : -Math.abs(ringArea) / 2;
    }
    if (area > bestArea) { bestArea = area; bestPerimeter = perimeter; }
  }
  return bestPerimeter > 0 ? (2 * bestArea) / bestPerimeter : 0;
}

/**
 * Geographic picking index.
 *
 * PICKING GEOMETRY IS NOT DISPLAY GEOMETRY. The renderer draws tessellated,
 * subdivided triangles; identity is resolved here against the source rings in
 * lat/lon. That separation means picking cannot drift with a tessellation
 * change, works identically for locator-only countries, and stays testable in
 * plain Node.
 *
 * VISIBLE MARKER AND TOUCH TARGET ARE SEPARATE CONCEPTS (#166). Nothing in this
 * file draws anything. The envelopes below are invisible, derived entirely from
 * the canonical generated geometry already in the asset, and depend only on the
 * camera — never on the current question — so they are stable, cannot be
 * enlarged into visible target circles, and cannot leak an answer.
 */
export class GeographyIndex {
  private readonly countries: readonly GlobeCountry[];
  private readonly envelopes: readonly Envelope[];
  private readonly byId: ReadonlyMap<string, Envelope>;

  constructor(countries: readonly GlobeCountry[]) {
    this.countries = countries;
    this.envelopes = countries.map((country) => {
      const [west, south, east, north] = country.mainland;
      const midLat = (south + north) / 2;
      const height = north - south;
      const width = (east - west) * Math.cos(midLat * DEG);
      return {
        id: country.id,
        // The locator when simplification retained no ring, otherwise the centre
        // of the country's own largest polygon. Source-derived either way: no
        // country is ever moved, and nothing here is hand-authored.
        anchor: country.locator ?? [(west + east) / 2, midLat],
        spanDeg: Math.max(height, width),
        roomDeg: characteristicHalfWidth(country),
      };
    });
    this.byId = new Map(this.envelopes.map((envelope) => [envelope.id, envelope]));
  }

  /**
   * Which country's polygon covers a position. Ordinary geography, unassisted.
   */
  private containing(lon: number, latDeg: number): string | null {
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
    return null;
  }

  /**
   * ISO3 at a geographic position, or null over water.
   *
   * Without a `TouchScale` this is pure polygon containment — the honest answer
   * about what geography is under a point, which is what generated-data checks
   * want. With one, sub-threshold countries additionally compete for the tap:
   *
   *   1. a speck always owns its own land outright;
   *   2. otherwise every speck whose envelope covers the point competes, and the
   *      nearest anchor wins, ties broken by smaller span then by ISO3, so
   *      overlapping open-water envelopes resolve deterministically. An envelope
   *      reaching onto another country's land is bounded by that country's own
   *      narrow dimension, so it can never cover a neighbour over;
   *   3. with no such candidate, the containing polygon wins unchanged.
   *
   * This is what #117's "real polygons beat assisted surfaces" means once the
   * assist is a practical touch surface rather than a visible mark. A country a
   * learner can actually aim at is never displaced; a country that is a
   * two-pixel speck is no longer shadowed by the large neighbour it happens to
   * sit beside, which has all of its own remaining area to be tapped on.
   * Assistance retires itself, too — zoom in until Singapore is 70 px wide and
   * it competes as ordinary geography again.
   */
  resolve(lonDeg: number, latDeg: number, touch?: TouchScale): string | null {
    const lon = wrapLon(lonDeg);
    const contained = this.containing(lon, latDeg);

    const scale = touch?.degreesPerPixel ?? 0;
    if (scale <= 0) return contained;

    const threshold = scale * ASSIST_THRESHOLD_PX;
    const standing = contained ? this.byId.get(contained) : undefined;

    // Rule 1. A speck owns its own land outright — nothing may take it.
    if (standing && standing.spanDeg < threshold) return contained;

    // Rule 2's bound: over water an envelope keeps its full radius; over land it
    // reaches no further than the country beneath it can spare.
    const radius = standing
      ? Math.min(scale * ASSIST_RADIUS_PX, standing.roomDeg * ASSIST_INTRUSION_SHARE)
      : scale * ASSIST_RADIUS_PX;
    // Longitude degrees shrink with latitude; without the cosine a Pacific
    // envelope would claim a band far wider than it looks on screen.
    const lonScale = Math.cos(latDeg * DEG);

    let best: Envelope | null = null;
    let bestDistance = Infinity;
    for (const envelope of this.envelopes) {
      if (envelope.spanDeg >= threshold) continue;
      const dLat = latDeg - envelope.anchor[1];
      const dLon = wrapLon(lon - envelope.anchor[0]) * lonScale;
      const distance = Math.hypot(dLat, dLon);
      if (distance > radius || distance > bestDistance) continue;
      if (distance === bestDistance && best) {
        if (envelope.spanDeg > best.spanDeg) continue;
        if (envelope.spanDeg === best.spanDeg && envelope.id >= best.id) continue;
      }
      best = envelope;
      bestDistance = distance;
    }
    return best?.id ?? contained;
  }
}

/**
 * One picking surface across a mounted continent and the world LOD.
 *
 * Consulting the two indices in sequence would let any polygon in the detail
 * asset short-circuit assistance the world asset was offering — which is
 * precisely how a locator-assisted microstate became untappable the moment its
 * continent's higher-detail geometry arrived. Detail geometry wins for the
 * countries it carries; the world asset supplies the rest; one competition
 * decides.
 */
export function mergeForPicking(
  detail: readonly GlobeCountry[] | null,
  world: readonly GlobeCountry[],
): readonly GlobeCountry[] {
  if (!detail?.length) return world;
  const covered = new Set(detail.map((country) => country.id));
  return [...detail, ...world.filter((country) => !covered.has(country.id))];
}
