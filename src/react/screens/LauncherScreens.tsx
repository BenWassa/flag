import { CONTINENTS } from '../../data/continents.js';
import { COUNTRIES, COUNTRY_BY_ID } from '../../data/countries.js';
import { parentContinentIdForLearningScope, regionLearningScopes } from '../../data/learning-scopes.js';
import { getMapContinentConfig, getMapScopeConfig } from '../../data/map-scopes.js';
import { getNeighborScopeConfig, landAdjacencyForScope } from '../../data/neighbors/index.js';
import { isRegionComplete, isRegionDomainMasteryEarned, type EarnedAchievementState } from '../../domain/achievements.js';
import { hasSuccessfulRetrieval } from '../../domain/evidence.js';
import { getLocationScopeStats } from '../../domain/map-game.js';
import type { LocationProgressState, MapRegionAsset } from '../../domain/map-models.js';
import type { NeighborProgressState } from '../../domain/neighbor-models.js';
import { getNeighborScopeStats } from '../../domain/neighbor-game.js';
import type { ProgressState, ScopeStats, StudyScope } from '../../domain/models.js';
import { getRecord, getScopeStats, isDue } from '../../domain/progress.js';
import { Launcher, type LauncherModel } from '../components/Launcher.js';

function status(id: string | undefined, domain: 'flags' | 'locations' | 'outlines' | 'neighbors', achievements: EarnedAchievementState) {
  return { domainMastered: id ? isRegionDomainMasteryEarned(achievements, id, domain) : false, complete: id ? isRegionComplete(achievements, id) : false };
}

export function FlagsLauncherScreen({ progress, scope, achievements, persisting }: { progress: ProgressState; scope: StudyScope; achievements: EarnedAchievementState; persisting: boolean }) {
  const continentId = scope.kind === 'continent' ? scope.id : parentContinentIdForLearningScope(scope);
  const continent = CONTINENTS.find((item) => item.id === continentId);
  if (!continent) return <Unavailable label="Flag" />;
  const continentScope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  const selectedRegion = scope.kind === 'region' ? scope : undefined;
  const model: LauncherModel = { domain: 'flags', continentScope, selectedRegion, stats: getScopeStats(COUNTRIES, progress, selectedRegion ?? continentScope), regions: regionLearningScopes(continent.id).map((definition) => ({ scope: definition.scope, stats: getScopeStats(COUNTRIES, progress, definition.scope), ...status(definition.scope.id, 'flags', achievements) })), unitLabel: 'flags', persisting, storageNotice: "This browser is blocking storage, so today's flag progress will be lost when you close the tab.", showMap: false };
  return <Launcher model={model} />;
}

const locationStats = (progress: LocationProgressState, ids: readonly string[]): ScopeStats => ({ ...getLocationScopeStats(progress, ids), due: 0 });
const neighborStats = (progress: NeighborProgressState, ids: readonly string[], scopeId: string): ScopeStats => ({ ...getNeighborScopeStats(progress, ids, landAdjacencyForScope(scopeId) ?? {}), due: 0 });
function outlineStats(progress: ProgressState, ids: readonly string[], now = new Date()): ScopeStats {
  return ids.reduce<ScopeStats>((stats, id) => { if (!COUNTRY_BY_ID.has(id)) return stats; const record = getRecord(progress, id); stats.total += 1; stats[record.status] += 1; if (isDue(record, now)) stats.due += 1; if (hasSuccessfulRetrieval(record)) stats.cleared += 1; return stats; }, { total: 0, unseen: 0, learning: 0, mastered: 0, due: 0, cleared: 0 });
}

export function GeographyLauncherScreen({ domain, scope, achievements, persisting, mapAsset, progress, mapFailed = false }: {
  domain: 'locations' | 'outlines' | 'neighbors';
  scope: StudyScope;
  achievements: EarnedAchievementState;
  persisting: boolean;
  mapAsset: MapRegionAsset | null;
  progress: LocationProgressState | ProgressState | NeighborProgressState;
  mapFailed?: boolean;
}) {
  const config = domain === 'neighbors' ? (scope.id ? getNeighborScopeConfig(scope.id) : undefined) : (scope.id ? getMapScopeConfig(scope.id) : undefined);
  const continent = config ? getMapContinentConfig(config.continentId) : undefined;
  if (!config || !continent || !scope.id) return <Unavailable label={domain === 'locations' ? 'Location' : domain === 'outlines' ? 'Outline' : 'Neighbour'} />;
  const statsFor = (ids: readonly string[], id: string): ScopeStats => domain === 'locations' ? locationStats(progress as LocationProgressState, ids) : domain === 'outlines' ? outlineStats(progress as ProgressState, ids) : neighborStats(progress as NeighborProgressState, ids, id);
  const regions = continent.regions.map((region) => {
    const id = region.scope.id ?? '';
    const ids = domain === 'neighbors' ? getNeighborScopeConfig(id)?.countryIds ?? [] : region.countryIds;
    return { scope: region.scope, stats: statsFor(ids, id), ...status(id, domain, achievements) };
  });
  const model: LauncherModel = { domain, continentScope: continent.scope, selectedRegion: config.scope.kind === 'region' ? config.scope : undefined, stats: statsFor(config.countryIds, scope.id), regions, unitLabel: domain === 'neighbors' ? 'targets' : 'countries', persisting, storageNotice: `This browser is blocking storage, so ${domain === 'neighbors' ? 'neighbour' : domain === 'locations' ? 'location' : 'outline'} progress will last only for this visit.`, showMap: true, mapAsset, mapFailed };
  return <Launcher model={model} />;
}

function Unavailable({ label }: { label: string }) {
  return <main className="page"><h1 tabIndex={-1} data-autofocus>{label} scope unavailable</h1></main>;
}
