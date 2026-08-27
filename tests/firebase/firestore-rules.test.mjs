import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'atlas-3c48a';
const AUTHORISED_UID = '7jSCG8qg6PN5IhibC7zAKblll8m2';
const PROGRESS_KEYS = [
  'flag-atlas:progress:v1',
  'flag-atlas:location-progress:v1',
  'flag-atlas:outline-progress:v1',
  'flag-atlas:neighbor-progress:v1',
];
const ACHIEVEMENTS_KEY = 'flag-atlas:earned-achievements:v1';
const rules = await readFile(resolve('../../firestore.rules'), 'utf8');
const env = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });

const progressPayload = { version: 2, records: {} };
const achievementPayload = {
  version: 1,
  regionDomainMasteries: [],
  completeRegions: [],
  completeContinents: [],
  worldCrown: false,
};
const envelope = (data, schemaVersion = 1) => ({ data, schemaVersion, updatedAt: serverTimestamp() });
const ownerDb = env.authenticatedContext(AUTHORISED_UID).firestore();
const outsiderDb = env.authenticatedContext('different-user').firestore();
const guestDb = env.unauthenticatedContext().firestore();
const ownerRef = (key = PROGRESS_KEYS[0], uid = AUTHORISED_UID) => doc(ownerDb, 'users', uid, 'state', key);

const cases = [];
async function check(name, fn) {
  try {
    await fn();
    cases.push({ name, ok: true });
  } catch (error) {
    cases.push({ name, ok: false, error });
  }
}

try {
  await check('authorised owner reads and writes every intended cloud state', async () => {
    for (const key of PROGRESS_KEYS) {
      const ref = ownerRef(key);
      await assertSucceeds(setDoc(ref, envelope(progressPayload)));
      await assertSucceeds(getDoc(ref));
    }
    const achievementRef = ownerRef(ACHIEVEMENTS_KEY);
    await assertSucceeds(setDoc(achievementRef, envelope(achievementPayload)));
    await assertSucceeds(getDoc(achievementRef));
  });

  await check('cross-user read is denied', async () => {
    await assertFails(getDoc(doc(ownerDb, 'users', 'different-user', 'state', PROGRESS_KEYS[0])));
  });

  await check('cross-user write is denied', async () => {
    await assertFails(setDoc(doc(ownerDb, 'users', 'different-user', 'state', PROGRESS_KEYS[0]), envelope(progressPayload)));
  });

  await check('cross-user delete is denied', async () => {
    await assertFails(deleteDoc(doc(ownerDb, 'users', 'different-user', 'state', PROGRESS_KEYS[0])));
  });

  await check('non-allowlisted authenticated account is denied even on its own path', async () => {
    const ref = doc(outsiderDb, 'users', 'different-user', 'state', PROGRESS_KEYS[0]);
    await assertFails(setDoc(ref, envelope(progressPayload)));
    await assertFails(getDoc(ref));
    await assertFails(deleteDoc(ref));
  });

  await check('unauthenticated access is denied', async () => {
    const ref = doc(guestDb, 'users', AUTHORISED_UID, 'state', PROGRESS_KEYS[0]);
    await assertFails(getDoc(ref));
    await assertFails(setDoc(ref, envelope(progressPayload)));
    await assertFails(deleteDoc(ref));
  });

  await check('unknown and intentionally local-only state keys are denied', async () => {
    for (const key of [
      'flag-atlas:attempts:v1',
      'flag-atlas:location-attempts:v1',
      'flag-atlas:outline-attempts:v1',
      'flag-atlas:neighbor-attempts:v1',
      'flag-atlas:region-domain-perfect-run-streaks:v1',
      'flag-atlas:unknown:v1',
    ]) {
      await assertFails(setDoc(ownerRef(key), envelope(progressPayload)));
    }
  });

  await check('malformed envelope is denied', async () => {
    await assertFails(setDoc(ownerRef(), { data: progressPayload, schemaVersion: 1 }));
    await assertFails(setDoc(ownerRef(), { ...envelope(progressPayload), extra: true }));
  });

  await check('invalid envelope schema version is denied', async () => {
    await assertFails(setDoc(ownerRef(), envelope(progressPayload, 2)));
    await assertFails(setDoc(ownerRef(), envelope(progressPayload, 0)));
  });

  await check('invalid progress payloads are denied', async () => {
    await assertFails(setDoc(ownerRef(), envelope([])));
    await assertFails(setDoc(ownerRef(), envelope({ version: 999, records: {} })));
    await assertFails(setDoc(ownerRef(), envelope({ version: 2, records: [] })));
  });

  await check('invalid achievement payloads are denied', async () => {
    await assertFails(setDoc(ownerRef(ACHIEVEMENTS_KEY), envelope({ ...achievementPayload, version: 2 })));
    await assertFails(setDoc(ownerRef(ACHIEVEMENTS_KEY), envelope({ ...achievementPayload, worldCrown: 'yes' })));
    await assertFails(setDoc(ownerRef(ACHIEVEMENTS_KEY), envelope({ ...achievementPayload, unexpected: true })));
  });

  await check('owner deletion succeeds only for known state keys', async () => {
    const ref = ownerRef();
    await assertSucceeds(setDoc(ref, envelope(progressPayload)));
    await assertSucceeds(deleteDoc(ref));
    await assertFails(deleteDoc(ownerRef('flag-atlas:attempts:v1')));
  });
} finally {
  await env.cleanup();
}

for (const result of cases) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}`);
  if (!result.ok) console.error(result.error);
}

const failures = cases.filter((result) => !result.ok);
if (failures.length > 0) process.exitCode = 1;
else console.log(`Firestore rules: ${cases.length}/${cases.length} passed`);
