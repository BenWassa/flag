import type { ScopeStats } from '../../domain/models.js';

export function progressStrip(stats: ScopeStats): string {
  const masteredPct = stats.total ? (stats.mastered / stats.total) * 100 : 0;
  const learningPct = stats.total ? (stats.learning / stats.total) * 100 : 0;
  return `
    <div class="status-strip" role="img" aria-label="${stats.mastered} mastered, ${stats.learning} learning, ${stats.unseen} unseen">
      <span class="status-strip__mastered" style="width:${masteredPct}%"></span>
      <span class="status-strip__learning" style="width:${learningPct}%"></span>
    </div>
  `;
}
