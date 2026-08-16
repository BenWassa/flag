import { COUNTRIES } from '../../data/countries.js';
import type { LearningStatus, ProgressState } from '../../domain/models.js';
import { masteryGoal } from '../../domain/progress.js';
import { flagImage } from '../components/flag.js';
import { icon } from '../components/icons.js';

export function renderProgress(progress: ProgressState, filter: LearningStatus | 'all' = 'all'): string {
  const counts = COUNTRIES.reduce(
    (acc, country) => {
      acc[progress.records[country.id].status] += 1;
      return acc;
    },
    { unseen: 0, learning: 0, mastered: 0 },
  );

  const rows = COUNTRIES
    .filter((country) => filter === 'all' || progress.records[country.id].status === filter)
    .sort((a, b) => {
      const statusOrder = { learning: 0, unseen: 1, mastered: 2 } as const;
      const aRecord = progress.records[a.id];
      const bRecord = progress.records[b.id];
      return statusOrder[aRecord.status] - statusOrder[bRecord.status] || a.name.localeCompare(b.name);
    });

  const filterCount = (item: LearningStatus | 'all'): number => item === 'all' ? COUNTRIES.length : counts[item];

  return `
    <main class="page ledger-page">
      <header class="topbar topbar--detail">
        <button class="icon-button" data-action="home" aria-label="Back to atlas">${icon('back')}</button>
        <div class="screen-title">
          <h1>Progress</h1>
          <span>${counts.mastered} mastered · ${counts.learning} learning · ${counts.unseen} unseen</span>
        </div>
      </header>

      <div class="filter-tabs" role="group" aria-label="Filter flags by learning status">
        ${(['all', 'unseen', 'learning', 'mastered'] as const).map((item) => `
          <button class="filter-tab ${filter === item ? 'filter-tab--active' : ''}" data-action="filter-progress" data-id="${item}" aria-pressed="${filter === item}">
            <span>${item === 'all' ? 'All' : title(item)}</span><small>${filterCount(item)}</small>
          </button>
        `).join('')}
      </div>

      <div class="ledger-list">
        ${rows.map((country) => {
          const record = progress.records[country.id];
          const detail = record.status === 'learning'
            ? `${record.masteryStreak}/${masteryGoal(record)} toward mastery · ${record.lifetimeIncorrect} missed`
            : record.status === 'mastered'
              ? `${record.lifetimeCorrect} correct · ${record.lapseCount} ${record.lapseCount === 1 ? 'lapse' : 'lapses'}`
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
