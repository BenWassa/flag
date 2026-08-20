import { AFRICA_MAP_REGION_CONFIGS, AFRICA_MAP_SCOPE } from '../../data/map-scopes.js';
import {
  AFRICA_LAND_ADJACENCY,
  getAfricaNeighborScopeConfig,
} from '../../data/neighbors/index.js';
import { getNeighborScopeStats } from '../../domain/neighbor-game.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { ScopeStats, StudyScope } from '../../domain/models.js';
import { renderLauncher } from './launcher.js';

function neighborStats(progress: NeighborProgressState, countryIds: readonly string[]): ScopeStats {
  return { ...getNeighborScopeStats(progress, countryIds, AFRICA_LAND_ADJACENCY), due: 0 };
}

export function renderNeighborHome(
  progress: NeighborProgressState,
  scope: StudyScope,
  persisting = true,
  mapAsset?: MapRegionAsset | null,
): string {
  const config = getAfricaNeighborScopeConfig(scope.id ?? 'africa');
  if (!config) {
    return '<main class="page"><h1 tabindex="-1" data-autofocus>Neighbour scope unavailable</h1><button class="button" data-action="launcher-parent">Back</button></main>';
  }

  return renderLauncher({
    domain: 'neighbors',
    continentScope: AFRICA_MAP_SCOPE,
    selectedRegion: config.scope.kind === 'region' ? config.scope : undefined,
    stats: neighborStats(progress, config.countryIds),
    regions: AFRICA_MAP_REGION_CONFIGS.map((region) => {
      const neighborConfig = getAfricaNeighborScopeConfig(region.scope.id ?? '');
      return {
        scope: region.scope,
        stats: neighborStats(progress, neighborConfig?.countryIds ?? []),
      };
    }),
    unitLabel: 'targets',
    persisting,
    storageNotice: 'This browser is blocking storage, so neighbour progress will last only for this visit.',
    showMap: true,
    mapAsset,
  });
}
