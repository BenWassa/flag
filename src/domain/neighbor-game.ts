import type { Country, EvidenceActivity, EvidenceOutcome, StudyMode, StudyScope } from './models.js';
import {
  activityForMode,
  applyCountryEvidence,
  createEvidenceSummary,
  evidenceStrengthGoal,
  hasSuccessfulRetrieval,
} from './evidence.js';
import type {
  NeighborAttempt,
  NeighborGuessOutcome,
  NeighborProgressRecord,
  NeighborProgressState,
  NeighborScopeStats,
  NeighborSession,
  NeighborSessionResult,
  NeighborTargetState,
} from './neighbor-models.js';

export type LandAdjacency = Readonly<Record<string, readonly string[]>>;

/**
 * Reserved answer id for the learner's explicit `No land neighbours` claim.
 * It is deliberately not an ISO3 shape, so it can never collide with a country,
 * never appears in autocomplete, and never lands in confusion counts.
 */
export const NO_LAND_NEIGHBORS_ID = '#no-land-neighbours';

/** Learner-facing wording for that claim, shared by the view and the announcements. */
export const NO_LAND_NEIGHBORS_LABEL = 'No land neighbours';

export function createNeighborRecord(countryId: string): NeighborProgressRecord {
  return {
    countryId,
    status: 'unseen',
    masteryStreak: 0,
    lifetimeRounds: 0,
    lifetimeCompleted: 0,
    lifetimeCleanCompletions: 0,
    lifetimeWrongGuesses: 0,
    revealCount: 0,
    lapseCount: 0,
    evidence: createEvidenceSummary(),
    confusionCounts: {},
  };
}

export function createInitialNeighborProgress(countryIds: readonly string[]): NeighborProgressState {
  return {
    version: 2,
    records: Object.fromEntries(countryIds.map((countryId) => [countryId, createNeighborRecord(countryId)])),
  };
}

export function getNeighborRecord(state: NeighborProgressState, countryId: string): NeighborProgressRecord {
  return state.records[countryId] ?? createNeighborRecord(countryId);
}

/** Compatibility alias for the internal scheduler threshold. */
export function neighborMasteryGoal(record: NeighborProgressRecord): number {
  return evidenceStrengthGoal(record);
}

export function neighborAttemptBudget(neighborCount: number): number {
  return Math.max(0, Math.floor(neighborCount)) + 2;
}

/**
 * A country is learnable once the topology genuinely knows its land borders,
 * including when that answer is the empty set. Absent adjacency means the
 * curriculum does not cover the country yet and must never be treated as an
 * answerable — or completable — target.
 */
export function eligibleNeighborTargets(
  countryIds: readonly string[],
  adjacency: LandAdjacency,
): string[] {
  return countryIds.filter((countryId) => adjacency[countryId] !== undefined);
}

export function getNeighborScopeStats(
  state: NeighborProgressState,
  countryIds: readonly string[],
  adjacency: LandAdjacency,
): NeighborScopeStats {
  return eligibleNeighborTargets(countryIds, adjacency).reduce<NeighborScopeStats>((stats, countryId) => {
    const record = getNeighborRecord(state, countryId);
    stats.total += 1;
    stats[record.status] += 1;
    if (hasSuccessfulRetrieval(record)) stats.cleared += 1;
    return stats;
  }, { total: 0, unseen: 0, learning: 0, mastered: 0, cleared: 0 });
}

function seedFromString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let value = seed || 0x9e3779b9;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(values: readonly T[], seed: string): T[] {
  const output = [...values];
  const random = seededRandom(seedFromString(seed));
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

function learningPriority(record: NeighborProgressRecord): number {
  if (record.status === 'unseen') return 100;
  let score = record.status === 'learning' ? 50 : 5;
  score += record.lifetimeWrongGuesses * 6;
  score += record.revealCount * 12;
  score -= record.lifetimeCleanCompletions * 2;
  return score;
}

function selectTargets(
  available: readonly string[],
  progress: NeighborProgressState,
  mode: StudyMode,
  sessionId: string,
  size: number,
): string[] {
  const randomized = shuffled(available, `${sessionId}:${mode}`);
  if (mode === 'learn') {
    randomized.sort((left, right) => learningPriority(getNeighborRecord(progress, right)) - learningPriority(getNeighborRecord(progress, left)));
  }
  return randomized.slice(0, Math.max(0, size));
}

export function buildNeighborSession(
  adjacency: LandAdjacency,
  progress: NeighborProgressState,
  scope: StudyScope,
  scopeCountryIds: readonly string[],
  mode: StudyMode,
  sessionId: string,
  size = 10,
  targetCountryIds?: readonly string[],
  now = new Date(),
): NeighborSession {
  const eligible = eligibleNeighborTargets(scopeCountryIds, adjacency);
  const eligibleSet = new Set(eligible);
  const requested = targetCountryIds?.length
    ? [...new Set(targetCountryIds)].filter((countryId) => eligibleSet.has(countryId))
    : eligible;
  const countryIds = selectTargets(requested, progress, mode, sessionId, targetCountryIds?.length ? requested.length : size);
  const targets: Record<string, NeighborTargetState> = {};

  for (const countryId of countryIds) {
    const neighborIds = [...(adjacency[countryId] ?? [])];
    targets[countryId] = {
      countryId,
      neighborIds,
      foundIds: [],
      guessedIds: [],
      wrongGuesses: 0,
      attemptBudget: neighborAttemptBudget(neighborIds.length),
      resolved: false,
      revealedIds: [],
    };
  }

  return {
    id: sessionId,
    mode,
    scope,
    startedAt: now.toISOString(),
    countryIds,
    currentIndex: 0,
    targets,
    attempts: [],
  };
}

export function currentNeighborTarget(session: NeighborSession): NeighborTargetState | null {
  const countryId = session.countryIds[session.currentIndex];
  return countryId ? session.targets[countryId] ?? null : null;
}

function cloneRecord(record: NeighborProgressRecord): NeighborProgressRecord {
  return {
    ...record,
    evidence: { ...record.evidence },
    confusionCounts: { ...record.confusionCounts },
  };
}

function replaceEvidenceRecord(target: NeighborProgressRecord, next: NeighborProgressRecord): void {
  Object.assign(target, next);
  target.evidence = next.evidence;
  target.confusionCounts = next.confusionCounts;
}

function markSeen(record: NeighborProgressRecord, timestamp: string): void {
  record.firstSeenAt ??= timestamp;
  record.lastSeenAt = timestamp;
}

function recordWrongGuess(
  record: NeighborProgressRecord,
  selectedCountryId: string,
  timestamp: string,
  activity: EvidenceActivity,
): void {
  markSeen(record, timestamp);
  record.lifetimeWrongGuesses += 1;
  record.lastMissedAt = timestamp;
  if (selectedCountryId !== NO_LAND_NEIGHBORS_ID) {
    record.confusionCounts[selectedCountryId] = (record.confusionCounts[selectedCountryId] ?? 0) + 1;
  }
  const applied = applyCountryEvidence(record, {
    activity,
    outcome: 'contradictory',
    at: timestamp,
  });
  replaceEvidenceRecord(record, applied.record);
}

function recordResolution(
  record: NeighborProgressRecord,
  sessionId: string,
  target: NeighborTargetState,
  timestamp: string,
  activity: EvidenceActivity,
): { outcome: EvidenceOutcome; credit: number } {
  markSeen(record, timestamp);
  record.lifetimeRounds += 1;

  if (target.resolution === 'exhausted') {
    record.revealCount += 1;
    const applied = applyCountryEvidence(record, {
      activity,
      outcome: 'passive-exposure',
      at: timestamp,
      sessionId,
    });
    replaceEvidenceRecord(record, applied.record);
    return { outcome: 'passive-exposure', credit: 0 };
  }

  record.lifetimeCompleted += 1;
  record.lastCompletedAt = timestamp;
  if (target.wrongGuesses > 0) {
    const applied = applyCountryEvidence(record, {
      activity,
      outcome: 'assisted-retrieval',
      at: timestamp,
      sessionId,
    });
    replaceEvidenceRecord(record, applied.record);
    return { outcome: 'assisted-retrieval', credit: 0 };
  }

  record.lifetimeCleanCompletions += 1;
  const applied = applyCountryEvidence(record, {
    activity,
    outcome: 'clean-retrieval',
    at: timestamp,
    sessionId,
  });
  replaceEvidenceRecord(record, applied.record);
  return { outcome: 'clean-retrieval', credit: applied.credit };
}

export interface ApplyNeighborGuessResult {
  session: NeighborSession;
  progress: NeighborProgressState;
  attempt: NeighborAttempt;
  outcome: NeighborGuessOutcome;
}

export function applyNeighborGuess(
  session: NeighborSession,
  progress: NeighborProgressState,
  selectedCountryId: string,
  responseTimeMs: number,
  now = new Date(),
): ApplyNeighborGuessResult {
  const current = currentNeighborTarget(session);
  if (!current) throw new Error('No active neighbor target.');
  if (current.resolved) throw new Error('Neighbor target is already resolved.');

  const timestamp = now.toISOString();
  const duplicate = current.guessedIds.includes(selectedCountryId);
  const target: NeighborTargetState = {
    ...current,
    neighborIds: [...current.neighborIds],
    foundIds: [...current.foundIds],
    guessedIds: [...current.guessedIds],
    revealedIds: [...current.revealedIds],
  };
  const activity = activityForMode(session.mode);
  let nextProgress = progress;
  let kind: NeighborAttempt['kind'] = 'duplicate';
  let evidenceOutcome: EvidenceOutcome | undefined;
  let evidenceCredit = 0;

  if (!duplicate) {
    target.guessedIds.push(selectedCountryId);
    const record = cloneRecord(getNeighborRecord(progress, target.countryId));
    const claimsEmptySet = selectedCountryId === NO_LAND_NEIGHBORS_ID;
    const correct = claimsEmptySet
      ? target.neighborIds.length === 0
      : target.neighborIds.includes(selectedCountryId);

    if (correct) {
      kind = 'correct';
      if (!claimsEmptySet) target.foundIds.push(selectedCountryId);
      markSeen(record, timestamp);
    } else {
      kind = 'wrong';
      target.wrongGuesses += 1;
      recordWrongGuess(record, selectedCountryId, timestamp, activity);
      evidenceOutcome = 'contradictory';
    }

    // Naming a country can never satisfy an empty neighbour set, so a
    // zero-neighbour target is only completed by claiming the empty set
    // outright. Otherwise `0 === 0` would resolve it on the first wrong guess.
    const setComplete = target.neighborIds.length === 0
      ? claimsEmptySet && correct
      : target.foundIds.length === target.neighborIds.length;

    if (setComplete) {
      target.resolved = true;
      target.resolution = 'complete';
    } else if (target.guessedIds.length >= target.attemptBudget) {
      target.resolved = true;
      target.resolution = 'exhausted';
      target.revealedIds = target.neighborIds.filter((countryId) => !target.foundIds.includes(countryId));
    }

    if (target.resolved) {
      const resolutionEvidence = recordResolution(record, session.id, target, timestamp, activity);
      // A final wrong guess remains contradictory in the per-attempt log; the
      // record also retains the passive reveal generated by exhaustion.
      if (kind === 'correct') evidenceOutcome = resolutionEvidence.outcome;
      evidenceCredit = resolutionEvidence.credit;
    }
    nextProgress = {
      ...progress,
      version: 2,
      records: { ...progress.records, [target.countryId]: record },
    };
  }

  const attemptsUsed = target.guessedIds.length;
  const remainingAttempts = Math.max(0, target.attemptBudget - attemptsUsed);
  const attempt: NeighborAttempt = {
    sessionId: session.id,
    targetCountryId: target.countryId,
    selectedCountryId,
    kind,
    consumedAttempt: !duplicate,
    attemptsUsed,
    remainingAttempts,
    foundCount: target.foundIds.length,
    totalNeighbors: target.neighborIds.length,
    resolved: target.resolved,
    responseTimeMs: Math.max(0, Math.round(responseTimeMs)),
    answeredAt: timestamp,
    evidenceActivity: duplicate ? undefined : activity,
    evidenceOutcome,
    evidenceCredit,
  };
  const nextSession: NeighborSession = {
    ...session,
    targets: { ...session.targets, [target.countryId]: target },
    attempts: [...session.attempts, attempt],
  };

  return {
    session: nextSession,
    progress: nextProgress,
    attempt,
    outcome: {
      targetCountryId: target.countryId,
      selectedCountryId,
      kind,
      consumedAttempt: !duplicate,
      attemptsUsed,
      remainingAttempts,
      foundCount: target.foundIds.length,
      totalNeighbors: target.neighborIds.length,
      resolved: target.resolved,
      resolution: target.resolution,
      revealedIds: [...target.revealedIds],
    },
  };
}

export function advanceNeighborSession(session: NeighborSession): NeighborSession {
  const target = currentNeighborTarget(session);
  if (!target) return session;
  if (!target.resolved) throw new Error('Resolve the current neighbor target before advancing.');
  if (session.currentIndex >= session.countryIds.length - 1) return session;
  return { ...session, currentIndex: session.currentIndex + 1 };
}

export function neighborSessionIsComplete(session: NeighborSession): boolean {
  return session.countryIds.length > 0 && session.countryIds.every((countryId) => session.targets[countryId]?.resolved);
}

export function finishNeighborSession(session: NeighborSession): NeighborSessionResult {
  if (!neighborSessionIsComplete(session)) throw new Error('Neighbor session is not complete.');
  const targets = session.countryIds.map((countryId) => session.targets[countryId]);
  return {
    session,
    cleanCompletions: targets.filter((target) => target?.resolution === 'complete' && target.wrongGuesses === 0).length,
    completed: targets.filter((target) => target?.resolution === 'complete').length,
    exhausted: targets.filter((target) => target?.resolution === 'exhausted').length,
    total: session.countryIds.length,
    missedCountryIds: targets
      .filter((target) => target?.resolution !== 'complete' || (target?.wrongGuesses ?? 0) > 0)
      .map((target) => target?.countryId)
      .filter((countryId): countryId is string => Boolean(countryId)),
  };
}

export function normalizeCountrySearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function searchNames(country: Country): string[] {
  return [country.name, ...(country.aliases ?? [])];
}

export function resolveCountryGuess(
  countries: readonly Country[],
  allowedCountryIds: ReadonlySet<string>,
  query: string,
): Country | null {
  const normalized = normalizeCountrySearch(query);
  if (!normalized) return null;
  return countries.find((country) =>
    allowedCountryIds.has(country.id)
    && searchNames(country).some((name) => normalizeCountrySearch(name) === normalized)
  ) ?? null;
}

export function getCountrySuggestions(
  countries: readonly Country[],
  allowedCountryIds: ReadonlySet<string>,
  query: string,
  excludedCountryIds: ReadonlySet<string>,
  limit = 8,
): Country[] {
  const normalized = normalizeCountrySearch(query);
  const candidates = countries.filter((country) => allowedCountryIds.has(country.id) && !excludedCountryIds.has(country.id));
  const ranked = candidates
    .map((country) => {
      const names = searchNames(country).map(normalizeCountrySearch);
      const exact = normalized ? names.some((name) => name === normalized) : false;
      const prefix = normalized ? names.some((name) => name.startsWith(normalized)) : false;
      const includes = normalized ? names.some((name) => name.includes(normalized)) : true;
      return { country, exact, prefix, includes };
    })
    .filter((item) => item.includes)
    .sort((left, right) => {
      if (left.exact !== right.exact) return left.exact ? -1 : 1;
      if (left.prefix !== right.prefix) return left.prefix ? -1 : 1;
      return left.country.name.localeCompare(right.country.name);
    });
  return ranked.slice(0, Math.max(0, limit)).map((item) => item.country);
}
