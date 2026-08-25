import {
  getMapContinentConfig,
} from '../../data/map-scopes.js';
import {
  getNeighborScopeConfig,
  landAdjacencyForScope,
} from '../../data/neighbors/index.js';
import {
  isRegionComplete,
  isRegionDomainMasteryEarned,
  type EarnedAchievementState,
} from '../../domain/achievements.js';
import { getNeighborScopeStats } from '../../domain/neighbor-game.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { ScopeStats, StudyScope } from '../../domain/models.js';
import { renderLauncher } from './launcher.js';

function neighborStats(
  progress: NeighborProgressState,
  countryIds: readonly string[],
  scopeId: string,
): ScopeStats {
  const adjacency = landAdjacencyForScope(scopeId) ?? {};
  return { ...getNeighborScopeStats(progress, countryIds, adjacency), due: 0 };
}

export function renderNeighborHome(
  progress: NeighborProgressState,
  scope: StudyScope,
  achievements: EarnedAchievementState,
  persisting = true,
): string {
  const config = scope.id ? getNeighborScopeConfig(scope.id) : undefined;
  const continent = config ? getMapContinentConfig(config.continentId) : undefined;
  if (!config || !continent || !scope.id) {
    return '<main class="page"><h1 tabindex="-1" data-autofocus>Neighbour scope unavailable</h1><button class="button" data-action="launcher-parent">Back</button></main>';
  }

  return renderLauncher({
    domain: 'neighbors',
    continentScope: continent.scope,
    selectedRegion: config.scope.kind === 'region' ? config.scope : undefined,
    stats: neighborStats(progress, config.countryIds, scope.id),
    regions: continent.regions.map((region) => {
      const regionId = region.scope.id ?? '';
      const neighborConfig = getNeighborScopeConfig(regionId);
      return {
        scope: region.scope,
        stats: neighborStats(progress, neighborConfig?.countryIds ?? [], regionId),
        domainMastered: regionId ? isRegionDomainMasteryEarned(achievements, regionId, 'neighbors') : false,
        complete: regionId ? isRegionComplete(achievements, regionId) : false,
      };
    }),
    unitLabel: 'targets',
    persisting,
    storageNotice: 'This browser is blocking storage, so neighbour progress will last only for this visit.',
  });
}
