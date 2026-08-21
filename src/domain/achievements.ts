import { CONTINENTS, REGIONS } from '../data/continents.js';
import {
  LEARNING_DOMAIN_IDS,
  type ContinentId,
  type LearningDomain,
  type StudyScope,
} from './models.js';
import {
  countryIdsForSupportedScope,
  scopeHasCompleteDomainCoverage,
  supportedDomainsForScope,
} from './scope-support.js';

export const ACHIEVEMENT_SCHEMA_VERSION = 1 as const;

export type RegionDomainMasteryKey = `${string}:${LearningDomain}`;

/**
 * Historical achievement state only. Live country evidence remains in the four
 * domain ledgers and may strengthen or lapse without mutating these earned bits.
 */
export interface EarnedAchievementState {
  version: typeof ACHIEVEMENT_SCHEMA_VERSION;
  regionDomainMasteries: RegionDomainMasteryKey[];
  completeRegions: string[];
  completeContinents: ContinentId[];
  worldCrown: boolean;
}

/**
 * Issue #29 owns the implementation of this predicate. Achievement aggregation
 * only asks whether one country's current evidence qualifies for one domain.
 */
export type CountryEvidenceQualification = (domain: LearningDomain, countryId: string) => boolean;

export type NewlyEarnedAchievement =
  | { kind: 'region-domain'; regionId: string; domain: LearningDomain }
  | { kind: 'region'; regionId: string }
  | { kind: 'continent'; continentId: ContinentId }
  | { kind: 'world-crown' };

export interface AchievementAwardResult {
  state: EarnedAchievementState;
  newlyEarned: NewlyEarnedAchievement[];
}

export interface RegionAchievementReadModel {
  kind: 'region';
  regionId: string;
  supportedDomains: LearningDomain[];
  completeCurriculum: boolean;
  domainMastery: Record<LearningDomain, boolean>;
  complete: boolean;
}

export interface ContinentAchievementReadModel {
  kind: 'continent';
  continentId: ContinentId;
  regionIds: string[];
  completeCurriculum: boolean;
  complete: boolean;
  crestEarned: boolean;
}

export interface WorldAchievementReadModel {
  kind: 'world';
  completeCurriculum: boolean;
  crownEarned: boolean;
}

const REGION_IDS = new Set(REGIONS.map((region) => region.id));
const CONTINENT_IDS = new Set<ContinentId>(CONTINENTS.map((continent) => continent.id));
const DOMAIN_IDS = new Set<LearningDomain>(LEARNING_DOMAIN_IDS);
const REGION_ORDER = new Map(REGIONS.map((region, index) => [region.id, index]));
const DOMAIN_ORDER = new Map(LEARNING_DOMAIN_IDS.map((domain, index) => [domain, index]));
const CONTINENT_ORDER = new Map(CONTINENTS.map((continent, index) => [continent.id, index]));

export function createInitialAchievementState(): EarnedAchievementState {
  return {
    version: ACHIEVEMENT_SCHEMA_VERSION,
    regionDomainMasteries: [],
    completeRegions: [],
    completeContinents: [],
    worldCrown: false,
  };
}

export function regionDomainMasteryKey(regionId: string, domain: LearningDomain): RegionDomainMasteryKey {
  return `${regionId}:${domain}`;
}

export function isKnownRegionDomainMasteryKey(value: string): value is RegionDomainMasteryKey {
  const [regionId, domain, extra] = value.split(':');
  return extra === undefined && REGION_IDS.has(regionId) && DOMAIN_IDS.has(domain as LearningDomain);
}

function regionScope(regionId: string): StudyScope | null {
  const region = REGIONS.find((item) => item.id === regionId);
  return region ? { kind: 'region', id: region.id, label: region.name } : null;
}

function continentRegions(continentId: ContinentId): typeof REGIONS {
  return REGIONS.filter((region) => region.continentId === continentId);
}

/** Current evidence eligibility for a single region × domain mastery. */
export function regionDomainQualifies(
  regionId: string,
  domain: LearningDomain,
  qualifiesCountryEvidence: CountryEvidenceQualification,
): boolean {
  const scope = regionScope(regionId);
  if (!scope) return false;
  const countryIds = countryIdsForSupportedScope(scope, domain);
  return countryIds.length > 0 && countryIds.every((countryId) => qualifiesCountryEvidence(domain, countryId));
}

/**
 * A complete region is a four-domain curriculum claim. A Flags-only shell must
 * never become complete merely because every currently supported domain is done.
 */
export function regionHasCompleteCurriculum(regionId: string): boolean {
  const scope = regionScope(regionId);
  return scope ? scopeHasCompleteDomainCoverage(scope) : false;
}

export function continentHasCompleteCurriculum(continentId: ContinentId): boolean {
  if (!CONTINENT_IDS.has(continentId)) return false;
  const regions = continentRegions(continentId);
  return regions.length > 0 && regions.every((region) => regionHasCompleteCurriculum(region.id));
}

export function worldHasCompleteCurriculum(): boolean {
  return CONTINENTS.length > 0 && CONTINENTS.every((continent) => continentHasCompleteCurriculum(continent.id));
}

export function isRegionDomainMasteryEarned(
  state: EarnedAchievementState,
  regionId: string,
  domain: LearningDomain,
): boolean {
  return state.regionDomainMasteries.includes(regionDomainMasteryKey(regionId, domain));
}

export function isRegionComplete(state: EarnedAchievementState, regionId: string): boolean {
  return state.completeRegions.includes(regionId);
}

export function isContinentComplete(state: EarnedAchievementState, continentId: ContinentId): boolean {
  return state.completeContinents.includes(continentId);
}

export function isWorldCrownEarned(state: EarnedAchievementState): boolean {
  return state.worldCrown;
}

export function regionCompletionEligible(state: EarnedAchievementState, regionId: string): boolean {
  return regionHasCompleteCurriculum(regionId)
    && LEARNING_DOMAIN_IDS.every((domain) => isRegionDomainMasteryEarned(state, regionId, domain));
}

export function continentCompletionEligible(state: EarnedAchievementState, continentId: ContinentId): boolean {
  const regions = continentRegions(continentId);
  return continentHasCompleteCurriculum(continentId)
    && regions.every((region) => isRegionComplete(state, region.id));
}

export function worldCompletionEligible(state: EarnedAchievementState): boolean {
  return worldHasCompleteCurriculum()
    && CONTINENTS.every((continent) => isContinentComplete(state, continent.id));
}

/**
 * Monotonic, idempotent award pass. Existing earned state is never re-evaluated
 * against live evidence, so a later country lapse cannot silently revoke it.
 */
export function awardEligibleAchievements(
  state: EarnedAchievementState,
  qualifiesCountryEvidence: CountryEvidenceQualification,
): AchievementAwardResult {
  const regionDomainMasteries = new Set(state.regionDomainMasteries);
  const completeRegions = new Set(state.completeRegions);
  const completeContinents = new Set(state.completeContinents);
  let worldCrown = state.worldCrown;
  const newlyEarned: NewlyEarnedAchievement[] = [];

  for (const region of REGIONS) {
    for (const domain of LEARNING_DOMAIN_IDS) {
      const key = regionDomainMasteryKey(region.id, domain);
      if (regionDomainMasteries.has(key)) continue;
      if (!regionDomainQualifies(region.id, domain, qualifiesCountryEvidence)) continue;
      regionDomainMasteries.add(key);
      newlyEarned.push({ kind: 'region-domain', regionId: region.id, domain });
    }
  }

  for (const region of REGIONS) {
    if (completeRegions.has(region.id) || !regionHasCompleteCurriculum(region.id)) continue;
    if (!LEARNING_DOMAIN_IDS.every((domain) => regionDomainMasteries.has(regionDomainMasteryKey(region.id, domain)))) continue;
    completeRegions.add(region.id);
    newlyEarned.push({ kind: 'region', regionId: region.id });
  }

  for (const continent of CONTINENTS) {
    if (completeContinents.has(continent.id) || !continentHasCompleteCurriculum(continent.id)) continue;
    if (!continentRegions(continent.id).every((region) => completeRegions.has(region.id))) continue;
    completeContinents.add(continent.id);
    newlyEarned.push({ kind: 'continent', continentId: continent.id });
  }

  if (!worldCrown && worldHasCompleteCurriculum() && CONTINENTS.every((continent) => completeContinents.has(continent.id))) {
    worldCrown = true;
    newlyEarned.push({ kind: 'world-crown' });
  }

  return {
    state: {
      version: ACHIEVEMENT_SCHEMA_VERSION,
      regionDomainMasteries: [...regionDomainMasteries].sort(compareRegionDomainMasteryKeys),
      completeRegions: [...completeRegions].sort(compareRegionIds),
      completeContinents: [...completeContinents].sort(compareContinentIds),
      worldCrown,
    },
    newlyEarned,
  };
}

export function getRegionAchievementReadModel(
  state: EarnedAchievementState,
  regionId: string,
): RegionAchievementReadModel | null {
  const scope = regionScope(regionId);
  if (!scope) return null;
  const domainMastery = {} as Record<LearningDomain, boolean>;
  for (const domain of LEARNING_DOMAIN_IDS) {
    domainMastery[domain] = isRegionDomainMasteryEarned(state, regionId, domain);
  }
  return {
    kind: 'region',
    regionId,
    supportedDomains: supportedDomainsForScope(scope),
    completeCurriculum: regionHasCompleteCurriculum(regionId),
    domainMastery,
    complete: isRegionComplete(state, regionId),
  };
}

export function getContinentAchievementReadModel(
  state: EarnedAchievementState,
  continentId: ContinentId,
): ContinentAchievementReadModel | null {
  if (!CONTINENT_IDS.has(continentId)) return null;
  const regionIds = continentRegions(continentId).map((region) => region.id);
  const complete = isContinentComplete(state, continentId);
  return {
    kind: 'continent',
    continentId,
    regionIds,
    completeCurriculum: continentHasCompleteCurriculum(continentId),
    complete,
    crestEarned: complete,
  };
}

export function getWorldAchievementReadModel(state: EarnedAchievementState): WorldAchievementReadModel {
  return {
    kind: 'world',
    completeCurriculum: worldHasCompleteCurriculum(),
    crownEarned: isWorldCrownEarned(state),
  };
}

function compareRegionIds(left: string, right: string): number {
  return (REGION_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) - (REGION_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER)
    || left.localeCompare(right);
}

function compareContinentIds(left: ContinentId, right: ContinentId): number {
  return (CONTINENT_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) - (CONTINENT_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER)
    || left.localeCompare(right);
}

function compareRegionDomainMasteryKeys(left: RegionDomainMasteryKey, right: RegionDomainMasteryKey): number {
  const [leftRegion, leftDomain] = left.split(':') as [string, LearningDomain];
  const [rightRegion, rightDomain] = right.split(':') as [string, LearningDomain];
  return compareRegionIds(leftRegion, rightRegion)
    || (DOMAIN_ORDER.get(leftDomain) ?? Number.MAX_SAFE_INTEGER) - (DOMAIN_ORDER.get(rightDomain) ?? Number.MAX_SAFE_INTEGER)
    || left.localeCompare(right);
}
