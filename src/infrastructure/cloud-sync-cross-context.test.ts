import { beforeEach, expect, it, vi } from 'vitest';

const UID = '7jSCG8qg6PN5IhibC7zAKblll8m2';
const FLAGS_KEY = 'flag-atlas:progress:v1';
const KEYS = [
  FLAGS_KEY,
  'flag-atlas:location-progress:v1',
  'flag-atlas:outline-progress:v1',
  'flag-atlas:neighbor-progress:v1',
  'flag-atlas:earned-achievements:v1',
] as const;

const harness = vi.hoisted(() => ({
  authCallback: null as ((user: { uid: string } | null) => void) | null,
  cloud: new Map<string, unknown>(),
  writesEnabled: true,
}));

vi.mock('./runtime-environment.js', () => ({ remoteAccountServicesEnabled: true }));
vi.mock('./firebase.js', () => ({
  onAuthChange: vi.fn((callback: (user: { uid: string } | null) => void) => {
    harness.authCallback = callback;
    return vi.fn();
  }),
  signOutUser: vi.fn().mockResolvedValue(undefined),
  deleteSignedInUser: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./firestore-sync.js', () => ({
  CLOUD_STATE_KEYS: KEYS,
  loadState: vi.fn(async (uid: string, key: string) => {
    const cloudKey = `${uid}:${key}`;
    return harness.cloud.has(cloudKey)
      ? { status: 'found', data: harness.cloud.get(cloudKey), updatedAt: new Date() }
      : { status: 'missing' };
  }),
  saveState: vi.fn(async (uid: string, key: string, data: unknown) => {
    if (!harness.writesEnabled) return false;
    harness.cloud.set(`${uid}:${key}`, structuredClone(data));
    return true;
  }),
  deleteCloudState: vi.fn().mockResolvedValue(true),
}));

function legacyFlagsPayload(correct: number) {
  return {
    version: 1,
    records: {
      gha: {
        status: 'learning',
        masteryStreak: 0,
        lifetimeCorrect: correct,
        lifetimeIncorrect: 1,
        currentCorrectStreak: 1,
        lapseCount: 0,
        retentionLevel: 0,
        lastSeenAt: '2026-08-27T12:00:00Z',
        lastCorrectAt: '2026-08-27T12:00:00Z',
        confusionCounts: { civ: 1 },
      },
    },
  };
}

async function settle(turns = 50) {
  for (let index = 0; index < turns; index += 1) await Promise.resolve();
}

beforeEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  localStorage.clear();
  harness.authCallback = null;
  harness.cloud.clear();
  harness.writesEnabled = true;
});

it('backfills one profile, restores into a clean profile, sanitises migration, and stays local if cloud later fails', async () => {
  // Context A starts with existing local v1 progress before first sign-in.
  localStorage.setItem(FLAGS_KEY, JSON.stringify(legacyFlagsPayload(3)));
  const first = await import('./cloud-sync-service.js');
  const stopFirst = first.startCloudSync();
  harness.authCallback?.({ uid: UID });
  await settle();

  const backedUp = harness.cloud.get(`${UID}:${FLAGS_KEY}`) as { version: number; records: Record<string, unknown> };
  expect(backedUp.version).toBe(2);
  expect(backedUp.records.gha).toBeTruthy();
  stopFirst();

  // Context B is a genuinely clean local persistence context for the same UID.
  vi.resetModules();
  localStorage.clear();
  harness.authCallback = null;
  const second = await import('./cloud-sync-service.js');
  const stopSecond = second.startCloudSync();
  harness.authCallback?.({ uid: UID });
  await settle();

  const restored = JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}');
  expect(restored.version).toBe(2);
  expect(restored.records.gha.countryId).toBe('gha');
  expect(restored.records.gha.lifetimeCorrect).toBe(3);
  expect(restored.records.gha.lifetimeIncorrect).toBe(1);
  expect(restored.records.gha.confusionCounts.civ).toBe(1);

  // Once restored, a cloud outage cannot remove or block the local learner state.
  harness.writesEnabled = false;
  window.dispatchEvent(new CustomEvent('atlas:learner-storage-write', { detail: { key: FLAGS_KEY } }));
  await new Promise((resolve) => window.setTimeout(resolve, 800));
  await settle();
  expect(second.getCloudSyncStatus()).toBe('degraded');
  expect(JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}').records.gha.lifetimeCorrect).toBe(3);
  stopSecond();
});
