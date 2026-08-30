import { CONTINENTS } from '../data/continents.js';
import { COUNTRIES, COUNTRY_BY_ID } from '../data/countries.js';
import { parentContinentIdForLearningScope, regionLearningScopes } from '../data/learning-scopes.js';
import { getMapContinentConfig, getMapScopeConfig } from '../data/map-scopes.js';
import { getNeighborScopeConfig, landAdjacencyForScope } from '../data/neighbors/index.js';
import {
  isRegionComplete,
  isRegionDomainMasteryEarned,
  type EarnedAchievementState,
} from '../domain/achievements.js';
import { hasSuccessfulRetrieval } from '../domain/evidence.js';
import { getLocationScopeStats } from '../domain/map-game.js';
import type { LocationProgressState } from '../domain/map-models.js';
import type { LearningDomain, ProgressState, ScopeStats, StudyScope } from '../domain/models.js';
import { getNeighborScopeStats } from '../domain/neighbor-game.js';
import type { NeighborProgressState } from '../domain/neighbor-models.js';
import { getRecord, getScopeStats, isDue } from '../domain/progress.js';
import type { ProgressLedgers } from '../domain/progress-summary.js';

/**
 * Issue #166 — the one description of a continent/region launcher.
 *
 * The spatial command surface and the conventional `Launcher` are two
 * presentations of the same choice, and the conventional one is the
 * renderer-failure fallback. Building both from this single model is what stops
 * them drifting apart in what they offer, what they count or what they call it.
 */

export interface ScopeRegion {
  scope: StudyScope;
  stats: ScopeStats;
  domainMastered: boolean;
  complete: boolean;
}

export interface ScopeModel {
  domain: LearningDomain;
  continentScope: StudyScope;
  /** Absent when the whole continent is the active scope. */
  selectedRegion?: StudyScope;
  /** The region if one is selected, otherwise the continent. */
  activeScope: StudyScope;
  stats: ScopeStats;
  regions: readonly ScopeRegion[];
  unitLabel: string;
}

function status(id: string | undefined, domain: LearningDomain, achievements: EarnedAchievementState) {
  return {
    domainMastered: id ? isRegionDomainMasteryEarned(achievements, id, domain) : false,
    complete: id ? isRegionComplete(achievements, id) : false,
  };
}

const locationStats = (progress: LocationProgressState, ids: readonly string[]): ScopeStats =>
  ({ ...getLocationScopeStats(progress, ids), due: 0 });

const neighborStats = (progress: NeighborProgressState, ids: readonly string[], scopeId: string): ScopeStats =>
  ({ ...getNeighborScopeStats(progress, ids, landAdjacencyForScope(scopeId) ?? {}), due: 0 });

function outlineStats(progress: ProgressState, ids: readonly string[], now = new Date()): ScopeStats {
  return ids.reduce<ScopeStats>((stats, id) => {
    if (!COUNTRY_BY_ID.has(id)) return stats;
    const record = getRecord(progress, id);
    stats.total += 1;
    stats[record.status] += 1;
    if (isDue(record, now)) stats.due += 1;
    if (hasSuccessfulRetrieval(record)) stats.cleared += 1;
    return stats;
  }, { total: 0, unseen: 0, learning: 0, mastered: 0, due: 0, cleared: 0 });
}

function flagsModel(scope: StudyScope, ledgers: ProgressLedgers, achievements: EarnedAchievementState): ScopeModel | null {
  const continentId = scope.kind === 'continent' ? scope.id : parentContinentIdForLearningScope(scope);
  const continent = CONTINENTS.find((item) => item.id === continentId);
  if (!continent) return null;
  const continentScope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  const selectedRegion = scope.kind === 'region' ? scope : undefined;
  return {
    domain: 'flags',
    continentScope,
    selectedRegion,
    activeScope: selectedRegion ?? continentScope,
    stats: getScopeStats(COUNTRIES, ledgers.flags, selectedRegion ?? continentScope),
    regions: regionLearningScopes(continent.id).map((definition) => ({
      scope: definition.scope,
      stats: getScopeStats(COUNTRIES, ledgers.flags, definition.scope),
      ...status(definition.scope.id, 'flags', achievements),
    })),
    unitLabel: 'flags',
  };
}

function geographyModel(
  domain: 'locations' | 'outlines' | 'neighbors',
  scope: StudyScope,
  ledgers: ProgressLedgers,
  achievements: EarnedAchievementState,
): ScopeModel | null {
  const config = domain === 'neighbors'
    ? (scope.id ? getNeighborScopeConfig(scope.id) : undefined)
    : (scope.id ? getMapScopeConfig(scope.id) : undefined);
  const continent = config ? getMapContinentConfig(config.continentId) : undefined;
  if (!config || !continent || !scope.id) return null;

  const statsFor = (ids: readonly string[], id: string): ScopeStats => domain === 'locations'
    ? locationStats(ledgers.locations, ids)
    : domain === 'outlines'
      ? outlineStats(ledgers.outlines, ids)
      : neighborStats(ledgers.neighbors, ids, id);

  const selectedRegion = config.scope.kind === 'region' ? config.scope : undefined;
  return {
    domain,
    continentScope: continent.scope,
    selectedRegion,
    activeScope: selectedRegion ?? continent.scope,
    stats: statsFor(config.countryIds, scope.id),
    regions: continent.regions.map((region) => {
      const id = region.scope.id ?? '';
      const ids = domain === 'neighbors' ? getNeighborScopeConfig(id)?.countryIds ?? [] : region.countryIds;
      return { scope: region.scope, stats: statsFor(ids, id), ...status(id, domain, achievements) };
    }),
    unitLabel: domain === 'neighbors' ? 'targets' : 'countries',
  };
}

export function scopeModelFor(
  domain: LearningDomain,
  scope: StudyScope,
  ledgers: ProgressLedgers,
  achievements: EarnedAchievementState,
): ScopeModel | null {
  return domain === 'flags'
    ? flagsModel(scope, ledgers, achievements)
    : geographyModel(domain, scope, ledgers, achievements);
}

/** What a domain calls its units when storage is unavailable. */
export function storageNoticeFor(domain: LearningDomain): string {
  if (domain === 'flags') return "This browser is blocking storage, so today's flag progress will be lost when you close the tab.";
  const noun = domain === 'neighbors' ? 'neighbour' : domain === 'locations' ? 'location' : 'outline';
  return `This browser is blocking storage, so ${noun} progress will last only for this visit.`;
}
