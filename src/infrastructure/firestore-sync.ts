import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { firestore } from './firebase.js';
import { CLOUD_STATE_KEYS, type CloudStateKey } from '../state/cloud-progress.js';

const SCHEMA_VERSION = 1;

export type CloudLoadResult =
  | { status: 'found'; data: unknown; updatedAt: Date | null }
  | { status: 'missing' }
  | { status: 'error' };

function stateDoc(uid: string, key: CloudStateKey) {
  return doc(firestore, 'users', uid, 'state', key);
}

export async function saveState(uid: string, key: CloudStateKey, data: unknown): Promise<boolean> {
  try {
    await setDoc(stateDoc(uid, key), { data, schemaVersion: SCHEMA_VERSION, updatedAt: serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}

export async function loadState(uid: string, key: CloudStateKey): Promise<CloudLoadResult> {
  try {
    const snapshot = await getDoc(stateDoc(uid, key));
    if (!snapshot.exists()) return { status: 'missing' };
    const raw = snapshot.data();
    const timestamp = raw.updatedAt instanceof Timestamp ? raw.updatedAt.toDate() : null;
    if (raw.schemaVersion !== SCHEMA_VERSION || !Object.prototype.hasOwnProperty.call(raw, 'data')) return { status: 'error' };
    return { status: 'found', data: raw.data, updatedAt: timestamp };
  } catch {
    return { status: 'error' };
  }
}

export async function deleteCloudState(uid: string): Promise<boolean> {
  try {
    await Promise.all(CLOUD_STATE_KEYS.map((key) => deleteDoc(stateDoc(uid, key))));
    return true;
  } catch {
    return false;
  }
}
