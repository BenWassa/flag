import { CONTINENTS } from '../data/continents.js';
import { COUNTRIES } from '../data/countries.js';
import { countryEvidenceState, hasSuccessfulRetrieval, type EvidenceBackedRecord, type CountryEvidenceState } from './evidence.js';
import type { LocationProgressState } from './map-models.js';
import type { LearningDomain, ProgressState, StudyScope } from './models.js';
import type { NeighborProgressState } from './neighbor-models.js';
import { countryIdsForSupportedScope, scopeSupportsDomain } from './scope-support.js';

export type EvidenceState = Exclude<CountryEvidenceState, 'due-for-review'> | 'due';
export type RecommendedProgressAction = 'review' | 'learn' | 'play';

export interface ProgressLedgers {
  flags: ProgressState;
  locations: LocationProgressState;
  outlines: ProgressState;
  neighbors: NeighborProgressState;
}

export interface ProgressSummary {
  domain: LearningDomain;
  label: string;
  scope: StudyScope;
  supported: boolean;
  total: number;
  unseen: number;
  learning: number;
  strong: number;
  due: number;
  cleared: number;
  action: RecommendedProgressAction | null;
  countryIds: string[];
}

export interface ProgressCountryEvidence {
  countryId: string;
  status: EvidenceState;
  due: boolean;
}

const DOMAIN_LABELS: Record<LearningDomain, string> = {
  flags: 'Flags',
  locations: 'Locations',
  outlines: 'Outlines',
  neighbors: 'Neighbours',
};

function recordForCountry(ledgers: ProgressLedgers, domain: LearningDomain, countryId: string): EvidenceBackedRecord | undefined {
  if (domain === 'flags') return ledgers.flags.records[countryId];
  if (domain === 'locations') return ledgers.locations.records[countryId];
  if (domain === 'outlines') return ledgers.outlines.records[countryId];
  return ledgers.neighbors.records[countryId];
}

function isDue(ledgers: ProgressLedgers, domain: LearningDomain, countryId: string, now: Date): boolean {
  if (domain !== 'flags' && domain !== 'outlines') return false;
  const ledger = domain === 'flags' ? ledgers.flags : ledgers.outlines;
  const value = ledger.records[countryId]?.nextReviewAt;
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function evidenceForCountry(
  ledgers: ProgressLedgers,
  domain: LearningDomain,
  countryId: string,
  now = new Date(),
): ProgressCountryEvidence {
  const due = isDue(ledgers, domain, countryId, now);
  const record = recordForCountry(ledgers, domain, countryId);
  const evidenceState = record ? countryEvidenceState(record, due) : 'unseen';
  return { countryId, due, status: evidenceState === 'due-for-review' ? 'due' : evidenceState };
}

export function buildProgressSummary(
  ledgers: ProgressLedgers,
  scope: StudyScope,
  domain: LearningDomain,
  now = new Date(),
): ProgressSummary {
  const supported = scopeSupportsDomain(scope, domain);
  const countryIds = countryIdsForSupportedScope(scope, domain);
  if (!supported) {
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      scope,
      supported: false,
      total: 0,
      unseen: 0,
      learning: 0,
      strong: 0,
      due: 0,
      cleared: 0,
      action: null,
      countryIds: [],
    };
  }

  let unseen = 0;
  let learning = 0;
  let strong = 0;
  let due = 0;
  let cleared = 0;
  for (const countryId of countryIds) {
    const evidence = evidenceForCountry(ledgers, domain, countryId, now);
    if (evidence.status === 'unseen') unseen += 1;
    else if (evidence.status === 'learning') learning += 1;
    else if (evidence.status === 'strong') strong += 1;
    if (evidence.due) due += 1;
    const record = recordForCountry(ledgers, domain, countryId);
    if (record && hasSuccessfulRetrieval(record)) cleared += 1;
  }

  const action: RecommendedProgressAction = due > 0
    ? 'review'
    : unseen > 0
      ? 'learn'
      : 'play';

  return {
    domain,
    label: DOMAIN_LABELS[domain],
    scope,
    supported: true,
    total: countryIds.length,
    unseen,
    learning,
    strong,
    due,
    cleared,
    action,
    countryIds,
  };
}

export function buildScopeProgressSummaries(
  ledgers: ProgressLedgers,
  scope: StudyScope,
  now = new Date(),
): ProgressSummary[] {
  return (['flags', 'locations', 'outlines', 'neighbors'] as const).map((domain) =>
    buildProgressSummary(ledgers, scope, domain, now));
}

export interface DomainProgressSummary {
  domain: LearningDomain;
  label: string;
  total: number;
  unseen: number;
  learning: number;
  strong: number;
  due: number;
  cleared: number;
  supportedContinentIds: string[];
}

/**
 * Everything one domain currently teaches, summed over the continents that
 * domain actually ships. Continent country sets are disjoint, so this is a
 * plain sum — and it deliberately measures shipped curriculum rather than the
 * eventual 195, so an Africa-only domain reads as complete when Africa is.
 */
export function buildDomainProgressSummary(
  ledgers: ProgressLedgers,
  domain: LearningDomain,
  now = new Date(),
): DomainProgressSummary {
  const summary: DomainProgressSummary = {
    domain,
    label: DOMAIN_LABELS[domain],
    total: 0,
    unseen: 0,
    learning: 0,
    strong: 0,
    due: 0,
    cleared: 0,
    supportedContinentIds: [],
  };

  for (const continent of CONTINENTS) {
    const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
    const continentSummary = buildProgressSummary(ledgers, scope, domain, now);
    if (!continentSummary.supported || continentSummary.total === 0) continue;
    summary.supportedContinentIds.push(continent.id);
    summary.total += continentSummary.total;
    summary.unseen += continentSummary.unseen;
    summary.learning += continentSummary.learning;
    summary.strong += continentSummary.strong;
    summary.due += continentSummary.due;
    summary.cleared += continentSummary.cleared;
  }

  return summary;
}
