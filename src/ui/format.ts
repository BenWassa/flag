import type { ProgressRecord } from '../domain/models.js';
import { masteryGoal } from '../domain/progress.js';

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * The one place a learning record turns into a short status phrase. Every
 * surface reads the mastery goal from `masteryGoal` so the rule has a single
 * source of truth.
 */
export function statusLabel(record: ProgressRecord): string {
  if (record.status === 'learning') return `Learning ${record.masteryStreak}/${masteryGoal(record)}`;
  return titleCase(record.status);
}

export const MASTERY_RULE =
  'A flag is mastered after 3 correct answers in separate rounds. After a miss it returns to Learning and needs 2.';
