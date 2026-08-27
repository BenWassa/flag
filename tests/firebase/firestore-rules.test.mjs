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
const FLAGS_KEY = 'flag-atlas:progress:v1';
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
const ownerRef = (key = FLAGS_KEY, uid = AUTHORISED_UID) => doc(ownerDb, 'users', uid, 'state', key);

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
  await check('authorised owner writes and reads progress', async () => {
    const ref = ownerRef();
    await assertSucceeds(setDoc(ref, envelope(progressPayload)));
    await assertSucceeds(getDoc(ref));
  });

  await check('authorised owner writes achievements', async () => {
    await assertSucceeds(setDoc(ownerRef(ACHIEVEMENTS_KEY), envelope(achievementPayload)));
  });

  await check('cross-user read is denied', async () => {
    await assertFails(getDoc(doc(ownerDb, 'users', 'different-user', 'state', FLAGS_KEY)));
  });

  await check('cross-user write is denied', async () => {
    await assertFails(setDoc(doc(ownerDb, 'users', 'different-user', 'state', FLAGS_KEY), envelope(progressPayload)));
  });

  await check('non-allowlisted authenticated account is denied even on its own path', async () => {
    await assertFails(setDoc(doc(outsiderDb, 'users', 'different-user', 'state', FLAGS_KEY), envelope(progressPayload)));
  });

  await check('unauthenticated access is denied', async () => {
    await assertFails(getDoc(doc(guestDb, 'users', AUTHORISED_UID, 'state', FLAGS_KEY)));
  });

  await check('unknown state key is denied', async () => {
    await assertFails(setDoc(ownerRef('flag-atlas:attempts:v1'), envelope(progressPayload)));
  });

  await check('malformed envelope is denied', async () => {
    await assertFails(setDoc(ownerRef(), { data: progressPayload, schemaVersion: 1 }));
  });

  await check('invalid envelope schema version is denied', async () => {
    await assertFails(setDoc(ownerRef(), envelope(progressPayload, 2)));
  });

  await check('invalid payload type is denied', async () => {
    await assertFails(setDoc(ownerRef(), envelope([])));
  });

  await check('invalid progress payload schema is denied', async () => {
    await assertFails(setDoc(ownerRef(), envelope({ version: 999, records: {} })));
  });

  await check('owner deletion succeeds', async () => {
    const ref = ownerRef();
    await assertSucceeds(setDoc(ref, envelope(progressPayload)));
    await assertSucceeds(deleteDoc(ref));
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
