import {
  getMapContinentConfig,
  getMapScopeConfig,
} from '../../data/map-scopes.js';
import { getLocationScopeStats } from '../../domain/map-game.js';
import type { LocationProgressState, MapRegionAsset } from '../../domain/map-models.js';
import type { ScopeStats, StudyScope } from '../../domain/models.js';
import { renderLauncher } from './launcher.js';

function locationStats(progress: LocationProgressState, countryIds: readonly string[]): ScopeStats {
  return { ...getLocationScopeStats(progress, countryIds), due: 0 };
}

export function renderMapHome(
  progress: LocationProgressState,
  scope: StudyScope,
  persisting = true,
  mapAsset?: MapRegionAsset | null,
): string {
  const config = scope.id ? getMapScopeConfig(scope.id) : undefined;
  const continent = config ? getMapContinentConfig(config.continentId) : undefined;
  if (!config || !continent) {
    return '<main class="page"><h1 tabindex="-1" data-autofocus>Location scope unavailable</h1><button class="button" data-action="launcher-parent">Back</button></main>';
  }

  return renderLauncher({
    domain: 'locations',
    continentScope: continent.scope,
    selectedRegion: config.scope.kind === 'region' ? config.scope : undefined,
    stats: locationStats(progress, config.countryIds),
    regions: continent.regions.map((region) => ({
      scope: region.scope,
      stats: locationStats(progress, region.countryIds),
    })),
    unitLabel: 'countries',
    persisting,
    storageNotice: 'This browser is blocking storage, so location progress will last only for this visit.',
    showMap: true,
    mapAsset,
  });
}
