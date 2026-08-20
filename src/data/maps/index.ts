import {
  AFRICA_MAP_COUNTRY_IDS,
  getAfricaMapScopeConfig,
} from '../map-scopes.js';
import type {
  MapCountryGeometry,
  MapRegionAsset,
} from '../../domain/map-models.js';

type AfricaDataModule = typeof import('./africa.js');

let africaDataPromise: Promise<AfricaDataModule> | null = null;

function loadAfricaData(): Promise<AfricaDataModule> {
  africaDataPromise ??= import('./africa.js').catch((error: unknown) => {
    // A transient offline or chunk-load failure must not poison every later
    // attempt for the lifetime of the page.
    africaDataPromise = null;
    throw error;
  });
  return africaDataPromise;
}

function cloneGeometry(data: AfricaDataModule, countryId: string): MapCountryGeometry {
  const geometry = data.AFRICA_GEOMETRY[countryId];
  if (!geometry) throw new Error(`Africa geometry missing for ${countryId}.`);
  return {
    ...geometry,
    locator: geometry.locator ? { ...geometry.locator } : undefined,
    hitAssist: geometry.hitAssist ? { ...geometry.hitAssist } : undefined,
    callout: geometry.callout
      ? {
          anchor: { ...geometry.callout.anchor },
          target: { ...geometry.callout.target },
        }
      : undefined,
  };
}

export async function loadMapAsset(scopeId: string): Promise<MapRegionAsset | null> {
  const config = getAfricaMapScopeConfig(scopeId);
  if (!config) return null;

  // Continent geometry is intentionally loaded only when a map scope is opened.
  // The emitted ES module is then cached by the service worker after first use.
  const data = await loadAfricaData();
  const activeIds = new Set(config.countryIds);
  const countries = config.countryIds.map((countryId) => cloneGeometry(data, countryId));
  const contextCountries = AFRICA_MAP_COUNTRY_IDS
    .filter((countryId) => !activeIds.has(countryId))
    .map((countryId) => cloneGeometry(data, countryId));

  return {
    scope: config.scope,
    viewBox: data.AFRICA_VIEWBOX,
    countries,
    contextCountries,
    contextPaths: [...data.AFRICA_EXTRA_CONTEXT_PATHS],
    sharedBoundaryPaths: [...data.AFRICA_SHARED_BOUNDARY_PATHS],
    coastlinePaths: [...data.AFRICA_COASTLINE_PATHS],
    water: {
      oceanPath: data.AFRICA_WATER.oceanPath,
      lakes: (data.AFRICA_WATER.lakes ?? []).map((item) => ({ ...item })),
      rivers: (data.AFRICA_WATER.rivers ?? []).map((item) => ({ ...item })),
    },
    initialFocus: data.AFRICA_SCOPE_FOCUS[scopeId],
  };
}
