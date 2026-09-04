import type { LearningDomain, ScopeStats } from '../../domain/models.js';

/**
 * Ordinary progress, in two segments.
 *
 * `cleared` is the figure the strip has always reported and stays the headline.
 * The second segment is the geography that has been seen but not yet cleared,
 * which the strip used to throw away: a scope half-met and a scope untouched
 * drew the same empty track. The accessible name still reports cleared alone,
 * because that is the number the rest of the product quotes.
 */
export function ProgressStrip({ stats, id, domain }: { stats: ScopeStats; id?: string; domain?: LearningDomain }) {
  const clearedPct = stats.total ? (stats.cleared / stats.total) * 100 : 0;
  const seen = Math.max(0, stats.total - stats.unseen - stats.cleared);
  const seenPct = stats.total ? (seen / stats.total) * 100 : 0;
  return (
    <div className="status-strip" id={id} data-domain={domain} role="img" aria-label={`${stats.cleared} of ${stats.total} cleared`}>
      <span className="status-strip__cleared" style={{ width: `${clearedPct}%` }} />
      <span className="status-strip__seen" style={{ width: `${seenPct}%` }} />
    </div>
  );
}
