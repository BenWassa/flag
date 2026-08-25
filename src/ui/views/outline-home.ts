import { COUNTRY_BY_ID } from '../../data/countries.js';
import {
  getMapContinentConfig,
  getMapScopeConfig,
} from '../../data/map-scopes.js';
import {
  isRegionComplete,
  isRegionDomainMasteryEarned,
  type EarnedAchievementState,
} from '../../domain/achievements.js';
import type { MapRegionAsset } from '../../domain/map-models.js';
import type { ProgressState, ScopeStats, StudyScope } from '../../domain/models.js';
import { hasSuccessfulRetrieval } from '../../domain/evidence.js';
import { getRecord, isDue } from '../../domain/progress.js';
import { renderLauncher } from './launcher.js';

function outlineStats(
  progress: ProgressState,
  countryIds: readonly string[],
  now = new Date(),
): ScopeStats {
  return countryIds.reduce<ScopeStats>((stats, countryId) => {
    if (!COUNTRY_BY_ID.has(countryId)) return stats;
    const record = getRecord(progress, countryId);
    stats.total += 1;
    stats[record.status] += 1;
    if (isDue(record, now)) stats.due += 1;
    if (hasSuccessfulRetrieval(record)) stats.cleared += 1;
    return stats;
  }, { total: 0, unseen: 0, learning: 0, mastered: 0, due: 0, cleared: 0 });
}

export function renderOutlineHome(
  progress: ProgressState,
  scope: StudyScope,
  achievements: EarnedAchievementState,
  persisting = true,
): string {
  const config = scope.id ? getMapScopeConfig(scope.id) : undefined;
  const continent = config ? getMapContinentConfig(config.continentId) : undefined;
  if (!config || !continent) {
    return '<main class="page"><h1 tabindex="-1" data-autofocus>Outline scope unavailable</h1><button class="button" data-action="launcher-parent">Back</button></main>';
  }

  return renderLauncher({
    domain: 'outlines',
    continentScope: continent.scope,
    selectedRegion: config.scope.kind === 'region' ? config.scope : undefined,
    stats: outlineStats(progress, config.countryIds),
    regions: continent.regions.map((region) => ({
      scope: region.scope,
      stats: outlineStats(progress, region.countryIds),
      domainMastered: region.scope.id
        ? isRegionDomainMasteryEarned(achievements, region.scope.id, 'outlines')
        : false,
      complete: region.scope.id ? isRegionComplete(achievements, region.scope.id) : false,
    })),
    unitLabel: 'countries',
    persisting,
    storageNotice: 'This browser is blocking storage, so outline progress will last only for this visit.',
  });
}
