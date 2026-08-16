import { COUNTRIES } from '../../data/countries.js';
import type { LearningStatus, ProgressState } from '../../domain/models.js';
import { masteryGoal } from '../../domain/progress.js';
import { flagImage } from '../components/flag.js';

export function renderProgress(progress: ProgressState, filter: LearningStatus | 'all' = 'all'): string {
  const rows = COUNTRIES
    .filter((country) => filter === 'all' || progress.records[country.id].status === filter)
    .sort((a, b) => {
      const statusOrder = { learning: 0, unseen: 1, mastered: 2 } as const;
      const aRecord = progress.records[a.id];
      const bRecord = progress.records[b.id];
      return statusOrder[aRecord.status] - statusOrder[bRecord.status] || a.name.localeCompare(b.name);
    });

  return `
    <main class="page ledger-page">
      <header class="sub-header">
        <button class="back-button" data-action="home">←</button>
        <div><p class="eyebrow">LEARNING LEDGER</p><h1>Your flags</h1></div>
      </header>

      <div class="filter-tabs">
        ${(['all', 'unseen', 'learning', 'mastered'] as const).map((item) => `
          <button class="filter-tab ${filter === item ? 'filter-tab--active' : ''}" data-action="filter-progress" data-id="${item}">${item === 'all' ? 'All' : title(item)}</button>
        `).join('')}
      </div>

      <div class="ledger-list">
        ${rows.map((country) => {
          const record = progress.records[country.id];
          const detail = record.status === 'learning'
            ? `${record.masteryStreak}/${masteryGoal(record)} · ${record.lifetimeCorrect} correct · ${record.lifetimeIncorrect} missed`
            : record.status === 'mastered'
              ? `${record.lifetimeCorrect} correct · ${record.lapseCount} lapses`
              : 'Never tested';
          return `
            <div class="ledger-row">
              ${flagImage(country, true, 'flag-image--ledger')}
              <span class="ledger-row__country"><strong>${country.name}</strong><small>${detail}</small></span>
              <span class="status-chip status-chip--${record.status}">${title(record.status)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </main>
  `;
}

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
