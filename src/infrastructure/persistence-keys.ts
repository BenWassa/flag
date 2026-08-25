export const LEARNER_STORAGE_KEYS = [
  'flag-atlas:progress:v1',
  'flag-atlas:attempts:v1',
  'flag-atlas:location-progress:v1',
  'flag-atlas:location-attempts:v1',
  'flag-atlas:outline-progress:v1',
  'flag-atlas:outline-attempts:v1',
  'flag-atlas:neighbor-progress:v1',
  'flag-atlas:neighbor-attempts:v1',
  'flag-atlas:earned-achievements:v1',
  'flag-atlas:region-domain-perfect-run-streaks:v1',
] as const;

export type LearnerStorageKey = (typeof LEARNER_STORAGE_KEYS)[number];

export const DEVELOPMENT_SANDBOX_NAMESPACE = 'flag-atlas:dev-sandbox';

const learnerKeys = new Set<string>(LEARNER_STORAGE_KEYS);

export function isLearnerStorageKey(key: string): key is LearnerStorageKey {
  return learnerKeys.has(key);
}
export function developmentSandboxKey(key: LearnerStorageKey): string {
  return `${DEVELOPMENT_SANDBOX_NAMESPACE}:${key.slice('flag-atlas:'.length)}`;
}
