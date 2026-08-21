import { geoOrthographic, geoPath } from 'd3-geo';
import { merge } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, quantile, simplify } from 'topojson-simplify';

/**
 * Pure globe geometry. Takes source country geometry plus a rotation and
 * returns a projected land path. It knows nothing about files, icons or the
 * PWA, so a future splash generator can reproject the same source at many
 * rotations to produce geographically valid frames.
 */

export const CANVAS = 1024;

/** Fraction of the icon width the globe occupies. */
export const GLOBE_WIDTH_RATIO = 0.74;

/**
 * Borderless global land, built by merging every country polygon so political
 * boundaries dissolve while the coastline stays source-derived.
 */
/**
 * Note on `retainedPointFraction`: topojson-simplify's `quantile(topology, p)`
 * returns the weight that retains fraction `p` of points, so a *smaller* p
 * simplifies more. `1.0` is a no-op.
 */
export function buildGlobalLand(countriesGeoJson, retainedPointFraction) {
  const sourceTopology = topology({ countries: countriesGeoJson });
  const weighted = presimplify(sourceTopology);
  const simplified = simplify(weighted, quantile(weighted, retainedPointFraction));
  const geometries = simplified.objects.countries.geometries.filter(
    (geometry) => geometry.type === 'Polygon' || geometry.type === 'MultiPolygon',
  );
  if (!geometries.length) throw new Error('Natural Earth countries contain no polygon geometry.');

  return { type: 'Feature', properties: {}, geometry: merge(simplified, geometries) };
}

/**
 * A true fixed-radius orthographic globe. The radius is a constant, never
 * fitted to whichever land happens to be visible, so the disc is the same size
 * at every rotation — which is what makes a rotating splash possible later.
 */
export function globeProjection({ centre, canvas = CANVAS, widthRatio = GLOBE_WIDTH_RATIO }) {
  const [longitude, latitude] = centre;
  return geoOrthographic()
    .scale((canvas * widthRatio) / 2)
    .translate([canvas / 2, canvas / 2])
    .rotate([-longitude, -latitude])
    .clipAngle(90)
    .precision(0.2);
}

export function projectGlobeLand(land, options) {
  const path = geoPath(globeProjection(options)).digits(options.digits ?? 1)(land) ?? '';
  return dropTinyRings(decimateProjected(path, options.minimumStep ?? 0), options.minimumRingArea ?? 0);
}

/**
 * Drops projected points closer together than `minimumStep` canvas units.
 * Coastline detail matters in screen space, not source space, so the icon's
 * level of detail is controlled here in the unit the reader actually sees.
 */
export function decimateProjected(path, minimumStep) {
  if (minimumStep <= 0) return path;
  const rings = path.match(/M[^MZ]*Z/g) ?? [];
  const kept = [];

  for (const ring of rings) {
    const points = [...ring.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
      .map((match) => [Number(match[1]), Number(match[2])]);
    const thinned = points.reduce((acc, point) => {
      const previous = acc.at(-1);
      if (!previous || Math.hypot(point[0] - previous[0], point[1] - previous[1]) >= minimumStep) acc.push(point);
      return acc;
    }, []);
    if (thinned.length < 3) continue;
    kept.push(`${thinned.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join('')}Z`);
  }

  return kept.join('');
}

/**
 * Removes sub-pixel islands and inland specks by projected area alone. This is
 * a deterministic size rule, never manual path surgery: the same source and
 * the same threshold always produce the same output.
 */
export function dropTinyRings(path, minimumArea) {
  if (minimumArea <= 0) return path;
  const rings = path.match(/M[^MZ]*Z/g) ?? [];
  return rings.filter((ring) => ringArea(ring) >= minimumArea).join('');
}

export function ringArea(ring) {
  const points = [...ring.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)]
    .map((match) => [Number(match[1]), Number(match[2])]);
  if (points.length < 3) return 0;
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2);
}

export function countRings(path) {
  return (path.match(/M[^MZ]*Z/g) ?? []).length;
}
