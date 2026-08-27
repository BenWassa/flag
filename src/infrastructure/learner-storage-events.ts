import type { LearnerStorageKey } from './persistence-keys.js';

export const LEARNER_STORAGE_WRITE_EVENT = 'atlas:learner-storage-write';

export interface LearnerStorageWriteDetail {
  key: LearnerStorageKey;
  kind: 'write' | 'remove';
}

export function dispatchLearnerStorageWrite(key: LearnerStorageKey, kind: LearnerStorageWriteDetail['kind']): void {
  window.dispatchEvent(new CustomEvent<LearnerStorageWriteDetail>(LEARNER_STORAGE_WRITE_EVENT, { detail: { key, kind } }));
}
