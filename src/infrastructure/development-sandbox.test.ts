import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyDevelopmentSandboxBundle,
  createDevelopmentSandboxPreset,
  exportDevelopmentSandbox,
  parseDevelopmentSandboxImport,
  resetDevelopmentSandbox,
  type DevelopmentSandboxPreset,
} from './development-sandbox.js';
import { createStorageGuard } from './storage-guard.js';
import { LEARNER_STORAGE_KEYS, developmentSandboxKey } from './persistence-keys.js';
import { isDevelopmentSandbox, remoteAccountServicesEnabled } from './runtime-environment.js';
import { hasSuccessfulRetrieval } from '../domain/evidence.js';
import type { ProgressState } from '../domain/models.js';

const presets: DevelopmentSandboxPreset[] = [
  'clean',
  'partial-evidence',
  'review-due',
  'one-perfect-round',
  'regional-mastery',
  'complete-region',
  'complete-continent',
  'world-crown',
];

describe('development sandbox', () => {
  beforeEach(() => localStorage.clear());

  it('maps learner reads, writes and removals away from production keys', () => {
    expect(isDevelopmentSandbox).toBe(true);
    expect(remoteAccountServicesEnabled).toBe(false);
    const key = LEARNER_STORAGE_KEYS[0];
    localStorage.setItem(key, 'production');
    const guard = createStorageGuard();

    expect(guard.readRaw(key)).toBeNull();
    expect(guard.writeRaw(key, 'sandbox')).toBe(true);
    expect(localStorage.getItem(key)).toBe('production');
    expect(localStorage.getItem(developmentSandboxKey(key))).toBe('sandbox');
    guard.removeRaw(key);
    expect(localStorage.getItem(key)).toBe('production');
    expect(localStorage.getItem(developmentSandboxKey(key))).toBeNull();
  });

  it.each(presets)('round-trips the %s preset across all namespaces', (preset) => {
    const bundle = createDevelopmentSandboxPreset(preset);
    applyDevelopmentSandboxBundle(bundle);
    const exported = exportDevelopmentSandbox();

    expect(Object.keys(exported.state)).toHaveLength(10);
    expect(parseDevelopmentSandboxImport(JSON.stringify(exported))).toEqual(exported);
  });

  it('seeds visible progress alongside complete region and continent achievements', () => {
    const completeRegion = createDevelopmentSandboxPreset('complete-region');
    const completeContinent = createDevelopmentSandboxPreset('complete-continent');
    const cleared = (bundle: ReturnType<typeof createDevelopmentSandboxPreset>, key: 'flag-atlas:progress:v1') => {
      const progress = bundle.state[key] as ProgressState;
      return Object.values(progress.records).filter((record) => hasSuccessfulRetrieval(record)).length;
    };

    expect(cleared(completeRegion, 'flag-atlas:progress:v1')).toBe(16);
    expect(cleared(completeContinent, 'flag-atlas:progress:v1')).toBe(54);
  });

  it('resets only sandbox learner data', () => {
    for (const key of LEARNER_STORAGE_KEYS) localStorage.setItem(key, `production:${key}`);
    applyDevelopmentSandboxBundle(createDevelopmentSandboxPreset('partial-evidence'));
    resetDevelopmentSandbox();

    for (const key of LEARNER_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBe(`production:${key}`);
      expect(localStorage.getItem(developmentSandboxKey(key))).toBeNull();
    }
  });

  it('rejects malformed imports without changing existing sandbox state', () => {
    applyDevelopmentSandboxBundle(createDevelopmentSandboxPreset('review-due'));
    const before = LEARNER_STORAGE_KEYS.map((key) => localStorage.getItem(developmentSandboxKey(key)));

    expect(() => parseDevelopmentSandboxImport('{nope')).toThrow('not valid JSON');
    expect(() => parseDevelopmentSandboxImport(JSON.stringify({ version: 1, namespace: 'flag-atlas:dev-sandbox', state: {} }))).toThrow('all ten');
    expect(LEARNER_STORAGE_KEYS.map((key) => localStorage.getItem(developmentSandboxKey(key)))).toEqual(before);
  });
});
