import type { ProgressRecord } from '../domain/models.js';
import { countryEvidenceState } from '../domain/evidence.js';

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

/** Keep scheduler internals behind evidence language rather than exposing x/y thresholds. */
export function statusLabel(record: ProgressRecord, dueForReview = false): string {
  switch (countryEvidenceState(record, dueForReview)) {
    case 'strong': return 'Strong evidence';
    case 'due-for-review': return 'Due for review';
    case 'learning': return 'Learning';
    case 'unseen': return 'Unseen';
  }
}

export const EVIDENCE_RULE =
  'Clean retrieval strengthens evidence. Play can calibrate known material faster; misses stay in the learning record.';
