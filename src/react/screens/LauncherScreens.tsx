import type { EarnedAchievementState } from '../../domain/achievements.js';
import type { LearningDomain, StudyScope } from '../../domain/models.js';
import type { ProgressLedgers } from '../../domain/progress-summary.js';
import { Launcher } from '../components/Launcher.js';
import { scopeModelFor, storageNoticeFor } from '../scope-model.js';

/**
 * The conventional launcher, which is the renderer-failure fallback for the
 * spatial navigation surface. Both are built from `scopeModelFor`, so the two
 * presentations cannot offer different scopes, counts or labels.
 */
export function LauncherScreen({ domain, scope, ledgers, achievements, persisting }: {
  domain: LearningDomain;
  scope: StudyScope;
  ledgers: ProgressLedgers;
  achievements: EarnedAchievementState;
  persisting: boolean;
}) {
  const model = scopeModelFor(domain, scope, ledgers, achievements);
  if (!model) return <Unavailable domain={domain} />;
  return <Launcher model={{ ...model, persisting, storageNotice: storageNoticeFor(domain) }} />;
}

const UNAVAILABLE_LABEL: Record<LearningDomain, string> = {
  flags: 'Flag',
  locations: 'Location',
  outlines: 'Outline',
  neighbors: 'Neighbour',
};

function Unavailable({ domain }: { domain: LearningDomain }) {
  return <main className="page"><h1 tabIndex={-1} data-autofocus>{UNAVAILABLE_LABEL[domain]} scope unavailable</h1></main>;
}
