import { getAfricaMapScopeConfig } from '../data/map-scopes.js';
import { getAfricaNeighborScopeConfig } from '../data/neighbors/index.js';
import { LEARNING_DOMAIN_IDS, type LearningDomain, type StudyScope } from './models.js';

/**
 * Flags carries the full world curriculum; the other three domains only have
 * generated Africa geometry. Unsupported scopes must render as honest shells
 * rather than counting towards completion.
 */
export function scopeSupportsDomain(scope: StudyScope, domain: LearningDomain): boolean {
  if (domain === 'flags') return true;
  if (!scope.id) return false;
  return domain === 'neighbors'
    ? getAfricaNeighborScopeConfig(scope.id) !== undefined
    : getAfricaMapScopeConfig(scope.id) !== undefined;
}

export function supportedDomainsForScope(scope: StudyScope): LearningDomain[] {
  return LEARNING_DOMAIN_IDS.filter((domain) => scopeSupportsDomain(scope, domain));
}
