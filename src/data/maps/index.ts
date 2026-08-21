import {
  getMapContinentConfig,
  getMapScopeConfig,
} from '../map-scopes.js';
import type {
  ContinentId,
} from '../../domain/models.js';
import type {
  MapCountryGeometry,
  MapNamedPath,
  MapRegionAsset,
  MapViewportFocus,
  MapWaterLayers,
} from '../../domain/map-models.js';

interface ContinentMapData {
  viewBox: string;
  geometry: Readonly<Record<string, MapCountryGeometry>>;
  contextPaths: readonly string[];
  sharedBoundaryPaths: readonly string[];
  coastlinePaths: readonly string[];
  water: Readonly<MapWaterLayers>;
  scopeFocus: Readonly<Record<string, MapViewportFocus>>;
}

type ContinentMapLoader = () => Promise<ContinentMapData>;

const continentLoaders: Partial<Record<ContinentId, ContinentMapLoader>> = {
  africa: async () => {
    const data = await import('./africa.js');
    return {
      viewBox: data.AFRICA_VIEWBOX,
      geometry: data.AFRICA_GEOMETRY,
      contextPaths: data.AFRICA_EXTRA_CONTEXT_PATHS,
      sharedBoundaryPaths: data.AFRICA_SHARED_BOUNDARY_PATHS,
      coastlinePaths: data.AFRICA_COASTLINE_PATHS,
      water: data.AFRICA_WATER,
      scopeFocus: data.AFRICA_SCOPE_FOCUS,
    };
  },
};

const continentDataPromises = new Map<ContinentId, Promise<ContinentMapData>>();

function loadContinentData(continentId: ContinentId): Promise<ContinentMapData> | null {
  const loader = continentLoaders[continentId];
  if (!loader) return null;

  const cached = continentDataPromises.get(continentId);
  if (cached) return cached;

  const promise = loader().catch((error: unknown) => {
    // A transient offline or chunk-load failure must not poison every later
    // attempt for the lifetime of the page.
    continentDataPromises.delete(continentId);
    throw error;
  });
  continentDataPromises.set(continentId, promise);
  return promise;
}

function cloneNamedPath(item: MapNamedPath): MapNamedPath {
  return { ...item };
}

function cloneGeometry(data: ContinentMapData, countryId: string, continentId: ContinentId): MapCountryGeometry {
  const geometry = data.geometry[countryId];
  if (!geometry) throw new Error(`${continentId} geometry missing for ${countryId}.`);
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
  const config = getMapScopeConfig(scopeId);
  if (!config) return null;
  const continent = getMapContinentConfig(config.continentId);
  if (!continent) return null;

  // Continent geometry is intentionally loaded only when a supported map scope
  // is opened. Each emitted ES module is then cached by the service worker.
  const dataPromise = loadContinentData(config.continentId);
  if (!dataPromise) return null;
  const data = await dataPromise;

  const activeIds = new Set(config.countryIds);
  const countries = config.countryIds.map((countryId) => cloneGeometry(data, countryId, config.continentId));
  const contextCountries = continent.countryIds
    .filter((countryId) => !activeIds.has(countryId))
    .map((countryId) => cloneGeometry(data, countryId, config.continentId));

  return {
    scope: config.scope,
    viewBox: data.viewBox,
    countries,
    contextCountries,
    contextPaths: [...data.contextPaths],
    sharedBoundaryPaths: [...data.sharedBoundaryPaths],
    coastlinePaths: [...data.coastlinePaths],
    water: {
      oceanPath: data.water.oceanPath,
      lakes: (data.water.lakes ?? []).map(cloneNamedPath),
    },
    initialFocus: data.scopeFocus[scopeId],
  };
}
