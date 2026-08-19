import type {
  LocationProgressRecord,
  LocationProgressState,
  LocationScopeStats,
  MapAttempt,
  MapGuessOutcome,
  MapMode,
  MapRegionAsset,
  MapResolution,
  MapSession,
  MapSessionResult,
} from './map-models.js';

export function createLocationRecord(countryId: string): LocationProgressRecord {
  return {
    countryId,
    status: 'unseen',
    masteryStreak: 0,
    lifetimeResolved: 0,
    lifetimeFirstTryCorrect: 0,
    lifetimeIncorrectGuesses: 0,
    revealCount: 0,
    lapseCount: 0,
    confusionCounts: {},
  };
}

export function createInitialLocationProgress(countryIds: readonly string[]): LocationProgressState {
  return {
    version: 1,
    records: Object.fromEntries(countryIds.map((countryId) => [countryId, createLocationRecord(countryId)])),
  };
}

export function getLocationRecord(state: LocationProgressState, countryId: string): LocationProgressRecord {
  return state.records[countryId] ?? createLocationRecord(countryId);
}

export function locationMasteryGoal(record: LocationProgressRecord): number {
  return record.lapseCount > 0 ? 2 : 3;
}

export function getLocationScopeStats(
  state: LocationProgressState,
  countryIds: readonly string[],
): LocationScopeStats {
  return countryIds.reduce<LocationScopeStats>((stats, countryId) => {
    const record = getLocationRecord(state, countryId);
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

export function buildMapSession(
  asset: MapRegionAsset,
  mode: MapMode,
  sessionId: string,
  targetCountryIds?: readonly string[],
  now = new Date(),
): MapSession {
  const available = new Set(asset.countries.map((country) => country.countryId));
  const requested = targetCountryIds?.length ? targetCountryIds : [...available];
  const countryIds = shuffled(
    [...new Set(requested)].filter((countryId) => available.has(countryId)),
    `${sessionId}:${mode}:${asset.scope.id ?? asset.scope.label}`,
  );

  return {
    id: sessionId,
    mode,
    scope: asset.scope,
    startedAt: now.toISOString(),
    countryIds,
    currentIndex: 0,
    targets: Object.fromEntries(countryIds.map((countryId) => [countryId, {
      countryId,
      misses: 0,
      resolved: false,
    }])),
    attempts: [],
  };
}

export function currentMapTarget(session: MapSession): string | null {
  return session.countryIds[session.currentIndex] ?? null;
}

function cloneProgressRecord(record: LocationProgressRecord): LocationProgressRecord {
  return { ...record, confusionCounts: { ...record.confusionCounts } };
}

function recordWrongGuess(
  record: LocationProgressRecord,
  selectedCountryId: string,
  timestamp: string,
): void {
  record.firstSeenAt ??= timestamp;
  record.lastSeenAt = timestamp;
  record.lastMissedAt = timestamp;
  record.lifetimeIncorrectGuesses += 1;
  record.masteryStreak = 0;
  record.lastMasteryCreditSessionId = undefined;
  record.confusionCounts[selectedCountryId] = (record.confusionCounts[selectedCountryId] ?? 0) + 1;

  if (record.status === 'mastered') record.lapseCount += 1;
  record.status = 'learning';
}

function recordResolution(
  record: LocationProgressRecord,
  sessionId: string,
  resolution: MapResolution,
  timestamp: string,
): void {
  record.firstSeenAt ??= timestamp;
  record.lastSeenAt = timestamp;
  record.lifetimeResolved += 1;

  if (resolution === 'first-try') {
    record.lifetimeFirstTryCorrect += 1;
    record.lastCorrectAt = timestamp;
    if (record.status === 'mastered') return;

    record.status = 'learning';
    if (record.lastMasteryCreditSessionId !== sessionId) {
      record.masteryStreak += 1;
      record.lastMasteryCreditSessionId = sessionId;
      if (record.masteryStreak >= locationMasteryGoal(record)) {
        record.status = 'mastered';
        record.masteredAt = timestamp;
      }
    }
    return;
  }

  if (resolution === 'revealed') record.revealCount += 1;
  if (record.status === 'unseen') record.status = 'learning';
}

export interface ApplyMapGuessResult {
  session: MapSession;
  progress: LocationProgressState;
  attempt: MapAttempt;
  outcome: MapGuessOutcome;
}

export function applyMapGuess(
  session: MapSession,
  progress: LocationProgressState,
  selectedCountryId: string,
  responseTimeMs: number,
  now = new Date(),
): ApplyMapGuessResult {
  const targetCountryId = currentMapTarget(session);
  if (!targetCountryId) throw new Error('No active map target.');
  const current = session.targets[targetCountryId];
  if (!current || current.resolved) throw new Error('Map target is already resolved.');

  const timestamp = now.toISOString();
  const correct = selectedCountryId === targetCountryId;
  const target = { ...current };
  const record = cloneProgressRecord(getLocationRecord(progress, targetCountryId));

  let resolution: MapResolution | undefined;
  let revealed = false;

  if (correct) {
    resolution = target.misses === 0 ? 'first-try' : target.misses === 1 ? 'one-miss' : 'two-miss';
    target.resolved = true;
    target.resolution = resolution;
    target.selectedCountryId = selectedCountryId;
    recordResolution(record, session.id, resolution, timestamp);
  } else {
    target.misses += 1;
    target.selectedCountryId = selectedCountryId;
    recordWrongGuess(record, selectedCountryId, timestamp);

    if (session.mode === 'test') {
      target.resolved = true;
      target.resolution = 'incorrect';
      resolution = 'incorrect';
      recordResolution(record, session.id, resolution, timestamp);
    } else if (target.misses >= 3) {
      target.resolved = true;
      target.resolution = 'revealed';
      resolution = 'revealed';
      revealed = true;
      recordResolution(record, session.id, resolution, timestamp);
    }
  }

  const attempt: MapAttempt = {
    sessionId: session.id,
    targetCountryId,
    selectedCountryId,
    correct,
    missNumber: target.misses,
    resolved: target.resolved,
    revealed,
    responseTimeMs: Math.max(0, Math.round(responseTimeMs)),
    answeredAt: timestamp,
  };

  const nextSession: MapSession = {
    ...session,
    targets: { ...session.targets, [targetCountryId]: target },
    attempts: [...session.attempts, attempt],
  };
  const nextProgress: LocationProgressState = {
    ...progress,
    records: { ...progress.records, [targetCountryId]: record },
  };

  return {
    session: nextSession,
    progress: nextProgress,
    attempt,
    outcome: {
      correct,
      resolved: target.resolved,
      revealed,
      targetCountryId,
      selectedCountryId,
      misses: target.misses,
      resolution,
    },
  };
}

export function advanceMapSession(session: MapSession): MapSession {
  const targetCountryId = currentMapTarget(session);
  if (!targetCountryId) return session;
  if (!session.targets[targetCountryId]?.resolved) throw new Error('Resolve the current map target before advancing.');
  if (session.currentIndex >= session.countryIds.length - 1) return session;
  return { ...session, currentIndex: session.currentIndex + 1 };
}

export function mapSessionIsComplete(session: MapSession): boolean {
  return session.countryIds.length > 0 && session.countryIds.every((countryId) => session.targets[countryId]?.resolved);
}

export function finishMapSession(session: MapSession): MapSessionResult {
  if (!mapSessionIsComplete(session)) throw new Error('Map session is not complete.');
  const states = session.countryIds.map((countryId) => session.targets[countryId]);
  return {
    session,
    firstTryCorrect: states.filter((state) => state?.resolution === 'first-try').length,
    total: session.countryIds.length,
    revealed: states.filter((state) => state?.resolution === 'revealed').length,
    missedCountryIds: states
      .filter((state) => state?.resolution !== 'first-try')
      .map((state) => state?.countryId)
      .filter((countryId): countryId is string => Boolean(countryId)),
  };
}
