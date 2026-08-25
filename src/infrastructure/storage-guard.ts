import { developmentSandboxKey, isLearnerStorageKey } from './persistence-keys.js';
import { isDevelopmentSandbox } from './runtime-environment.js';

/**
 * Persistence is an enhancement, never a precondition for studying. Safari
 * private mode throws on every write, a blocked-cookie policy throws on
 * every read, and a full origin quota throws once a ledger grows. Any of
 * those escaped into an answer handler and froze the round on the question
 * just answered, so every localStorage access for a domain's ledger goes
 * through a guard: reads/writes/removals are caught here, and a thrown
 * access degrades that domain to an in-memory session it can still report.
 *
 * Each learning domain's storage module (`storage.ts`, `map-storage.ts`,
 * `outline-storage.ts`, `neighbor-storage.ts`, `achievement-storage.ts`)
 * creates its own guard instance rather than sharing one, so a domain's
 * blocked/writable state is reported honestly and independently — a quota
 * failure partway through one domain's ledger should not be misreported for
 * a domain that has not written yet. `store.ts` (or a view) combines the
 * domains' independent flags where a surface needs the combined truth, as
 * the cross-domain continent screen does.
 */
export interface StorageGuard {
  isWritable(): boolean;
  readRaw(key: string): string | null;
  writeRaw(key: string, value: string): boolean;
  removeRaw(key: string): void;
}

export function createStorageGuard(): StorageGuard {
  let writable = true;

  const resolveKey = (key: string) =>
    isDevelopmentSandbox && isLearnerStorageKey(key) ? developmentSandboxKey(key) : key;

  return {
    isWritable() {
      return writable;
    },
    readRaw(key) {
      try {
        return localStorage.getItem(resolveKey(key));
      } catch {
        // A read that throws is a policy block, so writes cannot succeed either.
        writable = false;
        return null;
      }
    },
    writeRaw(key, value) {
      try {
        localStorage.setItem(resolveKey(key), value);
        return true;
      } catch {
        writable = false;
        return false;
      }
    },
    removeRaw(key) {
      try {
        localStorage.removeItem(resolveKey(key));
      } catch {
        writable = false;
      }
    },
  };
}
