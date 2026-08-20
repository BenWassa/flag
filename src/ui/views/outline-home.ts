import { COUNTRIES } from '../../data/countries.js';
import {
  AFRICA_MAP_REGION_CONFIGS,
  AFRICA_MAP_SCOPE,
  getAfricaMapScopeConfig,
} from '../../data/map-scopes.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { ProgressState, StudyScope } from '../../domain/models.js';
import { getScopeStats } from '../../domain/progress.js';
import { renderLauncher } from './launcher.js';

export function renderOutlineHome(
  progress: ProgressState,
  scope: StudyScope,
  persisting = true,
  mapAsset?: MapRegionAsset | null,
): string {
  const config = getAfricaMapScopeConfig(scope.id ?? 'africa');
  if (!config) {
    return '<main class="page"><h1 tabindex="-1" data-autofocus>Outline scope unavailable</h1><button class="button" data-action="launcher-parent">Back</button></main>';
  }

  return renderLauncher({
    domain: 'outlines',
    continentScope: AFRICA_MAP_SCOPE,
    selectedRegion: config.scope.kind === 'region' ? config.scope : undefined,
    stats: getScopeStats(COUNTRIES, progress, config.scope),
    regions: AFRICA_MAP_REGION_CONFIGS.map((region) => ({
      scope: region.scope,
      stats: getScopeStats(COUNTRIES, progress, region.scope),
    })),
    unitLabel: 'countries',
    persisting,
    storageNotice: 'This browser is blocking storage, so outline progress will last only for this visit.',
    showMap: true,
    mapAsset,
  });
}
