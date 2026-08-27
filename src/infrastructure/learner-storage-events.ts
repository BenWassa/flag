import type { LearnerStorageKey } from './persistence-keys.js';

export const LEARNER_STORAGE_WRITE_EVENT = 'atlas:learner-storage-write';

export interface LearnerStorageWriteDetail {
  key: LearnerStorageKey;
  kind: 'write' | 'remove';
}

/**
 * Cloud-sync notification is deliberately best-effort. A local learner write
 * has already succeeded before this hook runs, so an unavailable DOM event API
 * must never make the persistence layer report that successful write as failed.
 */
export function dispatchLearnerStorageWrite(key: LearnerStorageKey, kind: LearnerStorageWriteDetail['kind']): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function' || typeof CustomEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent<LearnerStorageWriteDetail>(LEARNER_STORAGE_WRITE_EVENT, { detail: { key, kind } }));
}
