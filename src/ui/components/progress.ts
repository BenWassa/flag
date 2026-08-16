import type { ScopeStats } from '../../domain/models.js';

export function progressStrip(stats: ScopeStats): string {
  const masteredPct = stats.total ? (stats.mastered / stats.total) * 100 : 0;
  const learningPct = stats.total ? (stats.learning / stats.total) * 100 : 0;
  return `
    <div class="status-strip" aria-label="${stats.mastered} mastered, ${stats.learning} learning, ${stats.unseen} unseen">
      <span class="status-strip__mastered" style="width:${masteredPct}%"></span>
      <span class="status-strip__learning" style="width:${learningPct}%"></span>
    </div>
  `;
}

export function statPills(stats: ScopeStats): string {
  return `
    <div class="stat-pills">
      <span><i class="dot dot--unseen"></i>${stats.unseen} Unseen</span>
      <span><i class="dot dot--learning"></i>${stats.learning} Learning</span>
      <span><i class="dot dot--mastered"></i>${stats.mastered} Mastered</span>
    </div>
  `;
}
