import type { LocationProgressState } from '../domain/map-models.js';
import type { LearningDomain, ProgressState } from '../domain/models.js';
import type { NeighborProgressState } from '../domain/neighbor-models.js';
import { qualifiesForRegionMastery } from '../domain/evidence.js';
import type { CountryEvidenceQualification } from '../domain/achievements.js';

export interface AchievementEvidenceLedgers {
  flags: ProgressState;
  locations: LocationProgressState;
  outlines: ProgressState;
  neighbors: NeighborProgressState;
}

/**
 * Issue #29 owns country-evidence qualification. The achievement layer selects
 * the relevant domain record, then delegates the actual qualification rule to
 * the canonical evidence selector rather than inspecting scheduler fields.
 */
export function createCountryEvidenceQualification(
  ledgers: AchievementEvidenceLedgers,
): CountryEvidenceQualification {
  return (domain, countryId) => countryEvidenceQualifies(ledgers, domain, countryId);
}

export function countryEvidenceQualifies(
  ledgers: AchievementEvidenceLedgers,
  domain: LearningDomain,
  countryId: string,
): boolean {
  const record = domain === 'flags'
    ? ledgers.flags.records[countryId]
    : domain === 'locations'
      ? ledgers.locations.records[countryId]
      : domain === 'outlines'
        ? ledgers.outlines.records[countryId]
        : ledgers.neighbors.records[countryId];

  return record ? qualifiesForRegionMastery(record) : false;
}
