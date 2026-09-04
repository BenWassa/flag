import type { ScopeStats } from '../../domain/models.js';

/** Markup twin of the React `ProgressStrip`; the two must stay identical. */
export function progressStrip(stats: ScopeStats): string {
  const clearedPct = stats.total ? (stats.cleared / stats.total) * 100 : 0;
  const seen = Math.max(0, stats.total - stats.unseen - stats.cleared);
  const seenPct = stats.total ? (seen / stats.total) * 100 : 0;
  return `
    <div class="status-strip" role="img" aria-label="${stats.cleared} of ${stats.total} cleared">
      <span class="status-strip__cleared" style="width:${clearedPct}%"></span>
      <span class="status-strip__seen" style="width:${seenPct}%"></span>
    </div>
  `;
}
