import type { LocationProgressState } from '../domain/map-models.js';
import type { LearningDomain, ProgressState } from '../domain/models.js';
import type { NeighborProgressState } from '../domain/neighbor-models.js';
import type { CountryEvidenceQualification } from '../domain/achievements.js';

export interface AchievementEvidenceLedgers {
  flags: ProgressState;
  locations: LocationProgressState;
  outlines: ProgressState;
  neighbors: NeighborProgressState;
}

/**
 * Temporary pre-#29 compatibility adapter.
 *
 * The achievement domain deliberately knows nothing about `LearningStatus`,
 * mastery streaks, scheduler thresholds, or any domain ledger shape. Once #29
 * merges, replace this implementation with #29's canonical country-evidence
 * qualification selector without changing `domain/achievements.ts`.
 */
export function createLegacyCountryEvidenceQualification(
  ledgers: AchievementEvidenceLedgers,
): CountryEvidenceQualification {
  return (domain, countryId) => legacyCountryEvidenceQualifies(ledgers, domain, countryId);
}

export function legacyCountryEvidenceQualifies(
  ledgers: AchievementEvidenceLedgers,
  domain: LearningDomain,
  countryId: string,
): boolean {
  if (domain === 'flags') return ledgers.flags.records[countryId]?.status === 'mastered';
  if (domain === 'locations') return ledgers.locations.records[countryId]?.status === 'mastered';
  if (domain === 'outlines') return ledgers.outlines.records[countryId]?.status === 'mastered';
  return ledgers.neighbors.records[countryId]?.status === 'mastered';
}
