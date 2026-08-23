import type { ScopeStats } from '../../domain/models.js';

export function progressStrip(stats: ScopeStats): string {
  const clearedPct = stats.total ? (stats.cleared / stats.total) * 100 : 0;
  return `
    <div class="status-strip" role="img" aria-label="${stats.cleared} of ${stats.total} cleared">
      <span class="status-strip__cleared" style="width:${clearedPct}%"></span>
    </div>
  `;
}
