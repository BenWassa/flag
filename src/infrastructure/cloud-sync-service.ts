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
let flushing = false;
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
  const user = activeUser;
  if (!user || !cloudAccountIsAuthorised(user) || !reconciled || flushing || dirty.size === 0) return;
  const token = generation;
  flushing = true;
  setStatus('saving');
  try {
    for (const key of [...dirty]) {
      if (token !== generation || activeUser?.uid !== user.uid) return;
      const ok = await saveState(user.uid, key, localValue(key));
      if (!ok) {
        setStatus('degraded');
        scheduleRetry();
        return;
      }
      if (token === generation && activeUser?.uid === user.uid) dirty.delete(key);
      persistPending();
    }
    if (token === generation && activeUser?.uid === user.uid) setStatus('synced');
  } finally {
    flushing = false;
  }
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
  flushing = false;
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

export async function deleteCloudCopy(user: User): Promise<void> {
  if (!cloudAccountIsAuthorised(user)) throw new Error('Account is not authorised for cloud backup.');
  const token = ++generation;
  clearTimer('write');
  clearTimer('retry');
  if (!await deleteCloudState(user.uid)) throw new Error('Cloud progress could not be deleted.');
  dirty.clear();
  persistPending();
  if (token === generation) await signOutUser();
}

export async function deleteCloudAccount(user: User): Promise<void> {
  if (!cloudAccountIsAuthorised(user)) throw new Error('Account is not authorised for cloud backup.');
  ++generation;
  clearTimer('write');
  clearTimer('retry');
  if (!await deleteCloudState(user.uid)) throw new Error('Cloud progress could not be deleted.');
  dirty.clear();
  persistPending();
  await deleteSignedInUser(user);
}
