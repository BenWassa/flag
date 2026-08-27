import { beforeEach, describe, expect, it, vi } from 'vitest';

const AUTHORISED_UID = '7jSCG8qg6PN5IhibC7zAKblll8m2';
const KEYS = [
  'flag-atlas:progress:v1',
  'flag-atlas:location-progress:v1',
  'flag-atlas:outline-progress:v1',
  'flag-atlas:neighbor-progress:v1',
  'flag-atlas:earned-achievements:v1',
] as const;
const PENDING_KEY = 'flag-atlas:cloud-sync-pending:v1';

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

  it('degrades on a sign-in read failure and reconciles after reconnect retry', async () => {
    vi.useFakeTimers();
    mocks.loadState.mockResolvedValueOnce({ status: 'error' }).mockResolvedValue({ status: 'missing' });
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(30);
    expect(service.getCloudSyncStatus()).toBe('degraded');
    expect(mocks.saveState).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5_000);
    await settle(50);
    expect(service.getCloudSyncStatus()).toBe('synced');
    expect(mocks.saveState).toHaveBeenCalledTimes(KEYS.length);
    stop();
  });

  it('keeps failed writes pending and converges after retry without duplicate retries', async () => {
    vi.useFakeTimers();
    mocks.saveState.mockResolvedValueOnce(false).mockResolvedValue(true);
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(40);
    expect(service.getCloudSyncStatus()).toBe('degraded');
    expect(localStorage.getItem(PENDING_KEY)).toContain(KEYS[0]);

    await vi.advanceTimersByTimeAsync(5_000);
    await settle(40);
    expect(service.getCloudSyncStatus()).toBe('synced');
    expect(localStorage.getItem(PENDING_KEY)).toBeNull();
    const recoveredCalls = mocks.saveState.mock.calls.length;

    await vi.advanceTimersByTimeAsync(15_000);
    await settle(20);
    expect(mocks.saveState).toHaveBeenCalledTimes(recoveredCalls);
    stop();
  });

  it('does not apply a stale remote read after sign-out', async () => {
    let resolveRead: ((value: unknown) => void) | undefined;
    mocks.loadState.mockImplementationOnce(() => new Promise((resolve) => { resolveRead = resolve; }));
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(10);
    mocks.authCallback?.(null);
    resolveRead?.({ status: 'found', data: flagsState(9), updatedAt: new Date() });
    await settle(30);

    expect(service.getCloudSyncStatus()).toBe('signed-out');
    expect(localStorage.getItem(KEYS[0])).toBeNull();
    expect(mocks.saveState).not.toHaveBeenCalled();
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
    expect(service.getCloudSyncStatus()).toBe('signed-out');
  });

  it('does not delete the Auth account when cloud deletion fails, and a later retry succeeds', async () => {
    localStorage.setItem(KEYS[0], JSON.stringify(flagsState(3)));
    mocks.deleteCloudState.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const service = await import('./cloud-sync-service.js');
    const user = { uid: AUTHORISED_UID } as never;

    await expect(service.deleteCloudAccount(user)).rejects.toThrow('account was not deleted');
    expect(mocks.deleteSignedInUser).not.toHaveBeenCalled();
    expect(service.getCloudSyncStatus()).toBe('degraded');

    await service.deleteCloudAccount(user);
    expect(mocks.deleteCloudState).toHaveBeenCalledTimes(2);
    expect(mocks.deleteSignedInUser).toHaveBeenCalledWith(user);
    expect(JSON.parse(localStorage.getItem(KEYS[0]) ?? '{}').records.gha.lifetimeCorrect).toBe(3);
  });

  it('suspends sync and signs out when account deletion requires a recent login', async () => {
    vi.useFakeTimers();
    localStorage.setItem(KEYS[0], JSON.stringify(flagsState(3)));
    const recentLoginError = Object.assign(new Error('recent login required'), { code: 'auth/requires-recent-login' });
    mocks.deleteSignedInUser.mockRejectedValueOnce(recentLoginError);
    const service = await import('./cloud-sync-service.js');
    const stop = service.startCloudSync();
    mocks.authCallback?.({ uid: AUTHORISED_UID });
    await settle(40);
    mocks.saveState.mockClear();

    await expect(service.deleteCloudAccount({ uid: AUTHORISED_UID } as never)).rejects.toThrow('requires a recent sign-in');
    expect(mocks.deleteCloudState).toHaveBeenCalledWith(AUTHORISED_UID);
    expect(mocks.signOutUser).toHaveBeenCalledOnce();
    expect(service.getCloudSyncStatus()).toBe('signed-out');
    expect(JSON.parse(localStorage.getItem(KEYS[0]) ?? '{}').records.gha.lifetimeCorrect).toBe(3);

    window.dispatchEvent(new CustomEvent('atlas:learner-storage-write', { detail: { key: KEYS[0] } }));
    await vi.advanceTimersByTimeAsync(10_000);
    await settle(20);
    expect(mocks.saveState).not.toHaveBeenCalled();
    stop();
  });

  it('deleting only the cloud copy signs out so it is not immediately backfilled', async () => {
    const service = await import('./cloud-sync-service.js');
    const user = { uid: AUTHORISED_UID } as never;
    await service.deleteCloudCopy(user);
    expect(mocks.deleteCloudState).toHaveBeenCalledWith(AUTHORISED_UID);
    expect(mocks.signOutUser).toHaveBeenCalledOnce();
    expect(service.getCloudSyncStatus()).toBe('signed-out');
  });

  it('reports partial success when cloud-copy deletion succeeds but sign-out fails', async () => {
    mocks.signOutUser.mockRejectedValueOnce(new Error('offline'));
    const service = await import('./cloud-sync-service.js');
    const user = { uid: AUTHORISED_UID } as never;

    await expect(service.deleteCloudCopy(user)).rejects.toThrow('cloud backup was deleted');
    expect(mocks.deleteCloudState).toHaveBeenCalledWith(AUTHORISED_UID);
    expect(service.getCloudSyncStatus()).toBe('signed-out');
  });
});
