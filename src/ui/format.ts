import type { ProgressRecord } from '../domain/models.js';
import { masteryGoal } from '../domain/progress.js';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Views are string builders, so every piece of catalog text is interpolated
 * straight into markup and into `aria-label` attributes. The curriculum already
 * carries `Australia & New Zealand` and `Côte d'Ivoire`; one more entry with a
 * quote would silently truncate an attribute. Escaping at the boundary keeps
 * that a data question rather than a rendering bug.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

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
