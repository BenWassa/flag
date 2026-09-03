/**
 * Issue #119 — the bridge from Atlas curriculum scopes to spherical geography.
 *
 * Country membership comes from the canonical learning-scope tables. Geometry
 * only supplies bounding boxes. The renderer never decides which countries are
 * in West Africa, and geography never decides what is on the curriculum.
 */

import { CONTINENTS } from '../data/continents.js';
import { COUNTRY_BY_ID } from '../data/countries.js';
import {
  countryIdsForLearningScope,
  parentContinentIdForLearningScope,
} from '../data/learning-scopes.js';
import type { ContinentId, StudyScope } from '../domain/models.js';
import { DEG, distanceForSpan, framingFor, type Framing } from './geo.js';
import type { GlobeAsset, GlobeBounds } from './globe-asset.js';

const CONTINENT_IDS = new Set(CONTINENTS.map((continent) => continent.id));

export function isContinentId(value: string | undefined): value is ContinentId {
  return value !== undefined && CONTINENT_IDS.has(value as ContinentId);
}

/** The continent whose detail LOD a scope needs, if any. */
export function continentForScope(scope: StudyScope | undefined): ContinentId | null {
  if (!scope) return null;
  if (scope.kind === 'continent' && isContinentId(scope.id)) return scope.id;
  const parent = parentContinentIdForLearningScope(scope);
  return isContinentId(parent) ? parent : null;
}

export function countryIdsForScope(scope: StudyScope | undefined): readonly string[] {
  if (!scope) return [];
  return countryIdsForLearningScope(scope);
}

/** The continent a country belongs to, straight from the canonical country table. */
export function continentForCountry(countryId: string): ContinentId | null {
  const continent = COUNTRY_BY_ID.get(countryId)?.continentId;
  return isContinentId(continent) ? continent : null;
}

export function regionForCountry(countryId: string): string | null {
  return COUNTRY_BY_ID.get(countryId)?.regionId ?? null;
}

/**
 * Framing boxes for a set of countries.
 *
 * Each box is the country's MAINLAND under its continent's declared framing
 * policy, not its full extent: framing "Western Europe" must not be dragged into
 * the Atlantic by French Guiana, and framing "Europe" must not be dragged to the
 * Bering Strait by Russia. Excluded and distant geography stays drawn and
 * selectable; it just does not aim the camera.
 *
 * A scope made entirely of excluded countries falls back to their mainlands, so
 * the policy can never leave a scope unframeable.
 */
export function framingBoxes(asset: GlobeAsset, countryIds: readonly string[]): GlobeBounds[] {
  const index = new Map(asset.countries.map((country) => [country.id, country]));
  const boxes: GlobeBounds[] = [];
  const fallback: GlobeBounds[] = [];
  for (const id of countryIds) {
    const country = index.get(id);
    if (!country) continue;
    fallback.push(country.mainland);
    if (country.framing) boxes.push(country.framing);
  }
  return boxes.length ? boxes : fallback;
}

export interface Pose { lon: number; lat: number; distance: number }

/** Whole-Earth frame used by ordinary world-level domain selection. */
export const WORLD_FRAMING: Framing = { lon: 12, lat: 12, spanLon: 150, spanLat: 150 };

export function poseForFraming(framing: Framing, fovDeg: number, aspect: number): Pose {
  return {
    lon: framing.lon,
    lat: framing.lat,
    distance: distanceForSpan(framing.spanLat, framing.spanLon, fovDeg, aspect),
  };
}

/**
 * Issue #187 — Home promises the whole globe, not merely a world-level frame.
 *
 * Scope framing is intentionally based on geographic spans and is allowed to
 * crop the far edge of the sphere. Home is different: the sphere itself is the
 * first impression, so its projected silhouette must fit the limiting viewport
 * dimension on portrait phones as well as landscape/desktop.
 *
 * The renderer's Earth is a unit sphere. From camera distance d its apparent
 * angular radius is asin(1 / d). Solve that against the smaller horizontal or
 * vertical half-FOV and leave 6% breathing room so rasterisation never clips the
 * limb. This changes only Home composition; domain/continent/scope framing keeps
 * the canonical span-derived policy above.
 */
const HOME_GLOBE_VIEWPORT_FILL = 0.94;

export function poseForWholeGlobe(fovDeg: number, aspect: number): Pose {
  const verticalHalfFov = (fovDeg * DEG) / 2;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * Math.max(aspect, 0.01));
  const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
  const globeHalfAngle = Math.atan(Math.tan(limitingHalfFov) * HOME_GLOBE_VIEWPORT_FILL);
  return {
    lon: WORLD_FRAMING.lon,
    lat: WORLD_FRAMING.lat,
    distance: 1 / Math.sin(globeHalfAngle),
  };
}

export function framingForScope(asset: GlobeAsset, scope: StudyScope | undefined): Framing {
  const boxes = framingBoxes(asset, countryIdsForScope(scope));
  return framingFor(boxes) ?? WORLD_FRAMING;
}
