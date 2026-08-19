import {
  AFRICA_MAP_COUNTRY_IDS,
  getAfricaMapScopeConfig,
} from '../map-scopes.js';
import type {
  MapCountryCallout,
  MapCountryGeometry,
  MapRegionAsset,
} from '../../domain/map-models.js';
import {
  AFRICA_EXTRA_CONTEXT_PATHS,
  AFRICA_GEOMETRY,
  AFRICA_SCOPE_FOCUS,
  AFRICA_VIEWBOX,
} from './africa.js';

/**
 * Visible mainland callouts are intentionally exceptional. The country itself
 * remains the taught geography; the nearby target only solves a phone-scale
 * motor problem. Island nations use a single locator dot instead.
 */
const AFRICA_MAINLAND_CALLOUTS: Readonly<Record<string, MapCountryCallout>> = {
  GMB: {
    anchor: { cx: 98.2, cy: 244.0 },
    target: { cx: 65, cy: 235, r: 12 },
  },
  TGO: {
    anchor: { cx: 270.0, cy: 314.5 },
    target: { cx: 250, cy: 350, r: 12 },
  },
};

function cloneGeometry(countryId: string): MapCountryGeometry {
  const geometry = AFRICA_GEOMETRY[countryId];
  if (!geometry) throw new Error(`Africa geometry missing for ${countryId}.`);
  return {
    ...geometry,
    locator: geometry.locator ? { ...geometry.locator } : undefined,
  };
}

function activeGeometry(countryId: string): MapCountryGeometry {
  const geometry = cloneGeometry(countryId);
  const callout = AFRICA_MAINLAND_CALLOUTS[countryId];
  return callout ? { ...geometry, callout } : geometry;
}

export async function loadMapAsset(scopeId: string): Promise<MapRegionAsset | null> {
  const config = getAfricaMapScopeConfig(scopeId);
  if (!config) return null;

  const activeIds = new Set(config.countryIds);
  const countries = config.countryIds.map(activeGeometry);
  const contextCountries = AFRICA_MAP_COUNTRY_IDS
    .filter((countryId) => !activeIds.has(countryId))
    .map(cloneGeometry);

  return {
    scope: config.scope,
    viewBox: AFRICA_VIEWBOX,
    countries,
    contextCountries,
    contextPaths: [...AFRICA_EXTRA_CONTEXT_PATHS],
    initialFocus: AFRICA_SCOPE_FOCUS[scopeId],
  };
}
