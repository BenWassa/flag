import type { Country, StudyMode, StudyScope } from './models.js';
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
    confusionCounts: {},
  };
}

export function createInitialNeighborProgress(countryIds: readonly string[]): NeighborProgressState {
  return {
    version: 1,
    records: Object.fromEntries(countryIds.map((countryId) => [countryId, createNeighborRecord(countryId)])),
  };
}

export function getNeighborRecord(state: NeighborProgressState, countryId: string): NeighborProgressRecord {
  return state.records[countryId] ?? createNeighborRecord(countryId);
}

export function neighborMasteryGoal(record: NeighborProgressRecord): number {
  return record.lapseCount > 0 ? 2 : 3;
}

export function neighborAttemptBudget(neighborCount: number): number {
  return Math.max(0, Math.floor(neighborCount)) + 2;
}

export function eligibleNeighborTargets(
  countryIds: readonly string[],
  adjacency: LandAdjacency,
): string[] {
  return countryIds.filter((countryId) => (adjacency[countryId]?.length ?? 0) > 0);
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
    return stats;
  }, { total: 0, unseen: 0, learning: 0, mastered: 0 });
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
  return { ...record, confusionCounts: { ...record.confusionCounts } };
}

function markSeen(record: NeighborProgressRecord, timestamp: string): void {
  record.firstSeenAt ??= timestamp;
  record.lastSeenAt = timestamp;
  if (record.status === 'unseen') record.status = 'learning';
}

function recordWrongGuess(
  record: NeighborProgressRecord,
  selectedCountryId: string,
  firstWrongInRound: boolean,
  timestamp: string,
): void {
  markSeen(record, timestamp);
  record.lifetimeWrongGuesses += 1;
  record.lastMissedAt = timestamp;
  record.confusionCounts[selectedCountryId] = (record.confusionCounts[selectedCountryId] ?? 0) + 1;
  if (firstWrongInRound && record.status === 'mastered') record.lapseCount += 1;
  record.status = 'learning';
  record.masteryStreak = 0;
  record.lastMasteryCreditSessionId = undefined;
}

function recordResolution(
  record: NeighborProgressRecord,
  sessionId: string,
  target: NeighborTargetState,
  timestamp: string,
): void {
  markSeen(record, timestamp);
  record.lifetimeRounds += 1;

  if (target.resolution === 'exhausted') {
    record.revealCount += 1;
    record.status = 'learning';
    return;
  }

  record.lifetimeCompleted += 1;
  record.lastCompletedAt = timestamp;
  if (target.wrongGuesses > 0) {
    record.status = 'learning';
    return;
  }

  record.lifetimeCleanCompletions += 1;
  if (record.status === 'mastered') return;
  if (record.lastMasteryCreditSessionId === sessionId) return;

  record.masteryStreak += 1;
  record.lastMasteryCreditSessionId = sessionId;
  record.status = 'learning';
  if (record.masteryStreak >= neighborMasteryGoal(record)) {
    record.status = 'mastered';
    record.masteredAt = timestamp;
  }
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
  let nextProgress = progress;
  let kind: NeighborAttempt['kind'] = 'duplicate';

  if (!duplicate) {
    target.guessedIds.push(selectedCountryId);
    const record = cloneRecord(getNeighborRecord(progress, target.countryId));
    const correct = target.neighborIds.includes(selectedCountryId);

    if (correct) {
      kind = 'correct';
      target.foundIds.push(selectedCountryId);
      markSeen(record, timestamp);
    } else {
      kind = 'wrong';
      const firstWrongInRound = target.wrongGuesses === 0;
      target.wrongGuesses += 1;
      recordWrongGuess(record, selectedCountryId, firstWrongInRound, timestamp);
    }

    if (target.foundIds.length === target.neighborIds.length) {
      target.resolved = true;
      target.resolution = 'complete';
    } else if (target.guessedIds.length >= target.attemptBudget) {
      target.resolved = true;
      target.resolution = 'exhausted';
      target.revealedIds = target.neighborIds.filter((countryId) => !target.foundIds.includes(countryId));
    }

    if (target.resolved) recordResolution(record, session.id, target, timestamp);
    nextProgress = {
      ...progress,
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
