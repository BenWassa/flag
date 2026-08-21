import { countryIdsForLearningScope } from '../data/learning-scopes.js';
import { getMapScopeConfig } from '../data/map-scopes.js';
import { getNeighborScopeConfig } from '../data/neighbors/index.js';
import { LEARNING_DOMAIN_IDS, type LearningDomain, type StudyScope } from './models.js';

/**
 * Flags carries the full world curriculum. Geography-domain support is explicit
 * and grows only when canonical generated coverage is registered for the scope.
 */
export function scopeSupportsDomain(scope: StudyScope, domain: LearningDomain): boolean {
  if (domain === 'flags') return countryIdsForLearningScope(scope).length > 0;
  if (!scope.id) return false;
  return domain === 'neighbors'
    ? getNeighborScopeConfig(scope.id) !== undefined
    : getMapScopeConfig(scope.id) !== undefined;
}

export function supportedDomainsForScope(scope: StudyScope): LearningDomain[] {
  return LEARNING_DOMAIN_IDS.filter((domain) => scopeSupportsDomain(scope, domain));
}

/**
 * Canonical country membership for one supported scope/domain pair. Achievement
 * aggregation and progress summaries consume this seam rather than rebuilding
 * geography membership from a second taxonomy.
 */
export function countryIdsForSupportedScope(scope: StudyScope, domain: LearningDomain): string[] {
  if (!scopeSupportsDomain(scope, domain)) return [];

  if (domain === 'locations' || domain === 'outlines') {
    return scope.id ? [...(getMapScopeConfig(scope.id)?.countryIds ?? [])] : [];
  }

  if (domain === 'neighbors') {
    return scope.id ? [...(getNeighborScopeConfig(scope.id)?.countryIds ?? [])] : [];
  }

  return [...countryIdsForLearningScope(scope)];
}

/** Missing or empty curriculum is never treated as completion. */
export function scopeHasCompleteDomainCoverage(scope: StudyScope): boolean {
  return LEARNING_DOMAIN_IDS.every(
    (domain) => scopeSupportsDomain(scope, domain) && countryIdsForSupportedScope(scope, domain).length > 0,
  );
}
