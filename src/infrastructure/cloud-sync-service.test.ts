import { beforeEach, describe, expect, it, vi } from 'vitest';

const AUTHORISED_UID = '7jSCG8qg6PN5IhibC7zAKblll8m2';
const KEYS = [
  'flag-atlas:progress:v1',
  'flag-atlas:location-progress:v1',
  'flag-atlas:outline-progress:v1',
  'flag-atlas:neighbor-progress:v1',
  'flag-atlas:earned-achievements:v1',
] as const;

const mocks = vi.hoisted(() => ({
  authCallback: null as ((user: { uid: string } | null) => void) | null,
  loadState: vi.fn(),
  saveState: vi.fn(),
  deleteCloudState: vi.fn(),
  signOutUser: vi.fn(),
  deleteSignedInUser: vi.fn(),
}));

vi.mock('./runtime-environment.js', () => ({ remoteAccountServicesEnabled: true }));
vi.mock('./firebase.js', () => ({
  onAuthChange: vi.fn((callback: (user: { uid: string } | null) => void) => {
    mocks.authCallback = callback;
    return vi.fn();
  }),
  signOutUser: mocks.signOutUser,
  deleteSignedInUser: mocks.deleteSignedInUser,
}));
vi.mock('./firestore-sync.js', () => ({
  CLOUD_STATE_KEYS: KEYS,
  loadState: mocks.loadState,
  saveState: mocks.saveState,
  deleteCloudState: mocks.deleteCloudState,
}));

async function settle(turns = 20) {
  for (let index = 0; index < turns; index += 1) await Promise.resolve();
}

function flagsState(correct: number) {
  return {
    version: 2,
    records: {
      gha: {
        status: 'learning',
        masteryStreak: 0,
        lifetimeCorrect: correct,
        lifetimeIncorrect: 0,
        currentCorrectStreak: 0,
        lapseCount: 0,
        retentionLevel: 0,
        evidence: {
          version: 1,
          passiveExposures: 0,
          assistedRetrievals: 0,
          cleanLearnRetrievals: 0,
          cleanPlayRetrievals: correct,
          cleanReviewRetrievals: 0,
          legacyScoredRetrievals: 0,
          contradictions: 0,
          retentionSuccesses: 0,
        },
        confusionCounts: {},
      },
    },
  };
}

beforeEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  localStorage.clear();
  mocks.authCallback = null;
  mocks.loadState.mockReset().mockResolvedValue({ status: 'missing' });
  mocks.saveState.mockReset().mockResolvedValue(true);
  mocks.deleteCloudState.mockReset().mockResolvedValue(true);
  mocks.signOutUser.mockReset().mockResolvedValue(undefined);
  mocks.deleteSignedInUser.mockReset().mockResolvedValue(undefined);
});

describe('cloud sync service', () => {
  it('backfills all canonical states on first authorised sign-in', async () => {
    localStorage.setItem(KEYS[0], JSON.stringify(flagsState(2)));
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(40);

    expect(mocks.loadState).toHaveBeenCalledTimes(KEYS.length);
    expect(mocks.saveState).toHaveBeenCalledTimes(KEYS.length);
    expect(service.getCloudSyncStatus()).toBe('synced');
    expect(JSON.parse(localStorage.getItem(KEYS[0]) ?? '{}').records.gha.lifetimeCorrect).toBe(2);
    stop();
  });

  it('restores stronger cloud state through local storage and emits one restore signal', async () => {
    localStorage.setItem(KEYS[0], JSON.stringify(flagsState(1)));
    mocks.loadState.mockImplementation(async (_uid: string, key: string) =>
      key === KEYS[0] ? { status: 'found', data: flagsState(4), updatedAt: new Date() } : { status: 'missing' });
    const service = await import('./cloud-sync-service.js');
    let restored = 0;
    window.addEventListener(service.CLOUD_STATE_RESTORED_EVENT, () => { restored += 1; }, { once: true });
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(40);

    expect(JSON.parse(localStorage.getItem(KEYS[0]) ?? '{}').records.gha.lifetimeCorrect).toBe(4);
    expect(restored).toBe(1);
    expect(service.getCloudSyncStatus()).toBe('synced');
    stop();
  });

  it('keeps failed writes pending and converges after retry', async () => {
    vi.useFakeTimers();
    mocks.saveState.mockResolvedValueOnce(false).mockResolvedValue(true);
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(40);
    expect(service.getCloudSyncStatus()).toBe('degraded');
    expect(localStorage.getItem('flag-atlas:cloud-sync-pending:v1')).toContain(KEYS[0]);

    await vi.advanceTimersByTimeAsync(5_000);
    await settle(40);
    expect(service.getCloudSyncStatus()).toBe('synced');
    expect(localStorage.getItem('flag-atlas:cloud-sync-pending:v1')).toBeNull();
    stop();
  });

  it('does not let an in-flight write change status after sign-out', async () => {
    let resolveWrite: ((value: boolean) => void) | undefined;
    mocks.saveState.mockImplementationOnce(() => new Promise<boolean>((resolve) => { resolveWrite = resolve; }));
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(30);
    expect(mocks.saveState).toHaveBeenCalledTimes(1);

    mocks.authCallback?.(null);
    resolveWrite?.(true);
    await settle(20);
    expect(service.getCloudSyncStatus()).toBe('signed-out');
    expect(mocks.saveState).toHaveBeenCalledTimes(1);
    stop();
  });

  it('does not touch Firestore for a Google account outside the allow-list', async () => {
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: 'different-user' });
    await settle();
    expect(service.getCloudSyncStatus()).toBe('unauthorised');
    expect(mocks.loadState).not.toHaveBeenCalled();
    expect(mocks.saveState).not.toHaveBeenCalled();
    stop();
  });

  it('deletes cloud data and the Firebase account while retaining local progress', async () => {
    localStorage.setItem(KEYS[0], JSON.stringify(flagsState(3)));
    const service = await import('./cloud-sync-service.js');
    const user = { uid: AUTHORISED_UID } as never;
    await service.deleteCloudAccount(user);

    expect(mocks.deleteCloudState).toHaveBeenCalledWith(AUTHORISED_UID);
    expect(mocks.deleteSignedInUser).toHaveBeenCalledWith(user);
    expect(JSON.parse(localStorage.getItem(KEYS[0]) ?? '{}').records.gha.lifetimeCorrect).toBe(3);
  });

  it('deleting only the cloud copy signs out so it is not immediately backfilled', async () => {
    const service = await import('./cloud-sync-service.js');
    const user = { uid: AUTHORISED_UID } as never;
    await service.deleteCloudCopy(user);
    expect(mocks.deleteCloudState).toHaveBeenCalledWith(AUTHORISED_UID);
    expect(mocks.signOutUser).toHaveBeenCalledOnce();
  });
});
