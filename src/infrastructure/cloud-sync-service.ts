import type { User } from 'firebase/auth';
import { deleteSignedInUser, onAuthChange, signOutUser } from './firebase.js';
import {
  CLOUD_STATE_KEYS,
  deleteCloudState,
  loadState,
  saveState,
  type CloudStateKey,
} from './firestore-sync.js';
import { LEARNER_STORAGE_WRITE_EVENT, type LearnerStorageWriteDetail } from './learner-storage-events.js';
import { remoteAccountServicesEnabled } from './runtime-environment.js';
import { mergeCloudState } from '../state/cloud-progress.js';

export const AUTHORISED_CLOUD_UID = '7jSCG8qg6PN5IhibC7zAKblll8m2';
export const CLOUD_STATE_RESTORED_EVENT = 'atlas:cloud-state-restored';

const PENDING_KEY = 'flag-atlas:cloud-sync-pending:v1';
const WRITE_DEBOUNCE_MS = 750;
const RETRY_MS = 5_000;

export type CloudSyncStatus =
  | 'signed-out'
  | 'reconciling'
  | 'saving'
  | 'synced'
  | 'degraded'
  | 'unauthorised';

type StatusListener = (status: CloudSyncStatus) => void;

interface PendingState {
  uid: string;
  keys: CloudStateKey[];
}

let status: CloudSyncStatus = 'signed-out';
let activeUser: User | null = null;
let generation = 0;
let started = false;
let reconciled = false;
let writeTimer: number | null = null;
let retryTimer: number | null = null;
let flushPromise: Promise<void> | null = null;
const listeners = new Set<StatusListener>();
const dirty = new Set<CloudStateKey>();

const cloudKeys = new Set<string>(CLOUD_STATE_KEYS);

export function cloudAccountIsAuthorised(user: Pick<User, 'uid'> | null | undefined): boolean {
  return user?.uid === AUTHORISED_CLOUD_UID;
}

function setStatus(next: CloudSyncStatus): void {
  if (status === next) return;
  status = next;
  for (const listener of listeners) listener(next);
}

export function getCloudSyncStatus(): CloudSyncStatus {
  return status;
}

export function subscribeCloudSyncStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

function clearTimer(which: 'write' | 'retry'): void {
  const handle = which === 'write' ? writeTimer : retryTimer;
  if (handle !== null) window.clearTimeout(handle);
  if (which === 'write') writeTimer = null;
  else retryTimer = null;
}

function readPending(uid: string): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<PendingState>;
    if (parsed.uid !== uid || !Array.isArray(parsed.keys)) return;
    for (const key of parsed.keys) if (cloudKeys.has(key)) dirty.add(key as CloudStateKey);
  } catch {
    // Sync metadata must never affect learning or local learner-state persistence.
  }
}

function persistPending(): void {
  try {
    if (!activeUser || dirty.size === 0) {
      localStorage.removeItem(PENDING_KEY);
      return;
    }
    const pending: PendingState = { uid: activeUser.uid, keys: [...dirty].sort() };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // The in-memory queue still covers the current page lifetime.
  }
}

function localValue(key: CloudStateKey): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalValue(key: CloudStateKey, value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    if (localStorage.getItem(key) === serialized) return false;
    localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

function scheduleRetry(): void {
  if (!activeUser || !cloudAccountIsAuthorised(activeUser) || retryTimer !== null) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    if (!reconciled) void reconcile(activeUser, generation);
    else void flush();
  }, RETRY_MS);
}

function scheduleWrite(): void {
  if (!activeUser || !reconciled || !cloudAccountIsAuthorised(activeUser)) return;
  clearTimer('write');
  writeTimer = window.setTimeout(() => {
    writeTimer = null;
    void flush();
  }, WRITE_DEBOUNCE_MS);
}

async function flush(): Promise<void> {
  if (flushPromise) {
    await flushPromise;
    if (!activeUser || !cloudAccountIsAuthorised(activeUser) || !reconciled || dirty.size === 0) return;
  }

  const user = activeUser;
  if (!user || !cloudAccountIsAuthorised(user) || !reconciled || dirty.size === 0) return;
  const token = generation;
  const operation = (async () => {
    setStatus('saving');
    for (const key of [...dirty]) {
      if (token !== generation || activeUser?.uid !== user.uid) return;
      const ok = await saveState(user.uid, key, localValue(key));
      if (token !== generation || activeUser?.uid !== user.uid) return;
      if (!ok) {
        setStatus('degraded');
        scheduleRetry();
        return;
      }
      dirty.delete(key);
      persistPending();
    }
    if (token === generation && activeUser?.uid === user.uid) setStatus('synced');
  })();
  const tracked = operation.finally(() => {
    if (flushPromise === tracked) flushPromise = null;
  });
  flushPromise = tracked;
  await tracked;
}

async function reconcile(user: User | null, token: number): Promise<void> {
  if (!user || !cloudAccountIsAuthorised(user) || token !== generation) return;
  setStatus('reconciling');
  let localChanged = false;
  const merged = new Map<CloudStateKey, unknown>();

  for (const key of CLOUD_STATE_KEYS) {
    const remote = await loadState(user.uid, key);
    if (token !== generation || activeUser?.uid !== user.uid) return;
    if (remote.status === 'error') {
      reconciled = false;
      setStatus('degraded');
      scheduleRetry();
      return;
    }
    const next = mergeCloudState(key, localValue(key), remote.status === 'found' ? remote.data : null);
    merged.set(key, next);
  }

  for (const key of CLOUD_STATE_KEYS) {
    localChanged = writeLocalValue(key, merged.get(key)) || localChanged;
    dirty.add(key);
  }
  reconciled = true;
  persistPending();
  if (localChanged) window.dispatchEvent(new Event(CLOUD_STATE_RESTORED_EVENT));
  await flush();
}

function handleLearnerWrite(event: Event): void {
  if (!activeUser || !cloudAccountIsAuthorised(activeUser)) return;
  const detail = (event as CustomEvent<LearnerStorageWriteDetail>).detail;
  if (!detail || !cloudKeys.has(detail.key)) return;
  dirty.add(detail.key as CloudStateKey);
  persistPending();
  scheduleWrite();
}

function handleOnline(): void {
  if (!activeUser || !cloudAccountIsAuthorised(activeUser)) return;
  clearTimer('retry');
  if (!reconciled) void reconcile(activeUser, generation);
  else void flush();
}

function transitionUser(user: User | null): void {
  generation += 1;
  clearTimer('write');
  clearTimer('retry');
  activeUser = user;
  reconciled = false;
  dirty.clear();

  if (!user) {
    setStatus('signed-out');
    return;
  }
  if (!cloudAccountIsAuthorised(user)) {
    setStatus('unauthorised');
    return;
  }
  readPending(user.uid);
  void reconcile(user, generation);
}

export function startCloudSync(): () => void {
  if (!remoteAccountServicesEnabled || started) return () => undefined;
  started = true;
  const unsubscribeAuth = onAuthChange(transitionUser);
  window.addEventListener(LEARNER_STORAGE_WRITE_EVENT, handleLearnerWrite);
  window.addEventListener('online', handleOnline);
  return () => {
    started = false;
    generation += 1;
    unsubscribeAuth();
    window.removeEventListener(LEARNER_STORAGE_WRITE_EVENT, handleLearnerWrite);
    window.removeEventListener('online', handleOnline);
    clearTimer('write');
    clearTimer('retry');
  };
}

async function beginDeletion(user: User): Promise<void> {
  if (!cloudAccountIsAuthorised(user)) throw new Error('Account is not authorised for cloud backup.');
  generation += 1;
  clearTimer('write');
  clearTimer('retry');
  reconciled = false;
  setStatus('saving');
  if (flushPromise) await flushPromise;
}

function suspendAfterCloudDeletion(): void {
  generation += 1;
  clearTimer('write');
  clearTimer('retry');
  activeUser = null;
  reconciled = false;
  dirty.clear();
  persistPending();
  setStatus('signed-out');
}

function requiresRecentLogin(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error
    && (error as { code?: unknown }).code === 'auth/requires-recent-login');
}

export async function deleteCloudCopy(user: User): Promise<void> {
  await beginDeletion(user);
  if (!await deleteCloudState(user.uid)) {
    setStatus('degraded');
    scheduleRetry();
    throw new Error("Couldn't delete the cloud backup. Progress on this device is unchanged; try again when you're online.");
  }
  suspendAfterCloudDeletion();
  try {
    await signOutUser();
  } catch {
    throw new Error('The cloud backup was deleted, but Atlas could not sign out. Your progress on this device is unchanged; try signing out again.');
  }
}

export async function deleteCloudAccount(user: User): Promise<void> {
  await beginDeletion(user);
  if (!await deleteCloudState(user.uid)) {
    setStatus('degraded');
    scheduleRetry();
    throw new Error("Couldn't delete the cloud backup, so the account was not deleted. Progress on this device is unchanged; try again when you're online.");
  }

  // Once the cloud copy is gone, stop this page from recreating it even if the
  // Auth deletion needs a fresh Google sign-in. Local learner state is retained.
  suspendAfterCloudDeletion();
  try {
    await deleteSignedInUser(user);
  } catch (error) {
    try {
      await signOutUser();
    } catch {
      // Sync is already suspended, so a sign-out failure cannot recreate data.
    }
    if (requiresRecentLogin(error)) {
      throw new Error('Cloud progress was deleted, but Google requires a recent sign-in before Atlas can delete the account. Sign in again, then retry account deletion.');
    }
    throw new Error('Cloud progress was deleted, but the sign-in account could not be deleted. Sign in again to retry account deletion.');
  }
}
