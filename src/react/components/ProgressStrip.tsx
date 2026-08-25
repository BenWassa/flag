import type { ScopeStats } from '../../domain/models.js';

export function ProgressStrip({ stats }: { stats: ScopeStats }) {
  const clearedPct = stats.total ? (stats.cleared / stats.total) * 100 : 0;
  return (
    <div className="status-strip" role="img" aria-label={`${stats.cleared} of ${stats.total} cleared`}>
      <span className="status-strip__cleared" style={{ width: `${clearedPct}%` }} />
    </div>
  );
}
