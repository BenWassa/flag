import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from './firebase.js';

// Must match the allow-list in firestore.rules exactly.
export type SyncStateKey =
  | 'flag-atlas:progress:v1'
  | 'flag-atlas:attempts:v1'
  | 'flag-atlas:location-progress:v1'
  | 'flag-atlas:location-attempts:v1'
  | 'flag-atlas:outline-progress:v1'
  | 'flag-atlas:outline-attempts:v1'
  | 'flag-atlas:neighbor-progress:v1'
  | 'flag-atlas:neighbor-attempts:v1'
  | 'flag-atlas:earned-achievements:v1'
  | 'flag-atlas:region-domain-perfect-run-streaks:v1';

const SCHEMA_VERSION = 1;

function stateDoc(uid: string, key: SyncStateKey) {
  return doc(firestore, 'users', uid, 'state', key);
}

export async function saveState(uid: string, key: SyncStateKey, data: unknown): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, key), { data, schemaVersion: SCHEMA_VERSION, updatedAt: serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}

export async function loadState(uid: string, key: SyncStateKey): Promise<unknown | null> {
  try {
    const snapshot = await getDoc(stateDoc(uid, key));
    if (!snapshot.exists()) return null;
    return snapshot.data().data ?? null;
  } catch {
    return null;
  }
}
