import { CONTINENTS } from '../../data/continents.js';
import {
  LEARNING_DOMAIN_IDS,
  type LearningDomain,
  type ScopeStats,
} from '../../domain/models.js';
import {
  buildDomainProgressSummary,
  type DomainProgressSummary,
  type ProgressLedgers,
} from '../../domain/progress-summary.js';
import { domainIcon, icon } from '../components/icons.js';
import { progressStrip } from '../components/progress.js';
import { coverageLabel, escapeHtml } from '../format.js';

export function domainCoverageLabel(summary: DomainProgressSummary): string {
  const names = summary.supportedContinentIds.map(
    (id) => CONTINENTS.find((continent) => continent.id === id)?.name ?? id,
  );
  return coverageLabel(names, CONTINENTS.length);
}

function statsFor(summary: DomainProgressSummary): ScopeStats {
  return {
    total: summary.total,
    unseen: summary.unseen,
    learning: summary.learning,
    mastered: summary.strong,
    due: summary.due,
    cleared: summary.cleared,
  };
}

function modeCard(domain: LearningDomain, ledgers: ProgressLedgers): string {
  const summary = buildDomainProgressSummary(ledgers, domain);
  const stats = statsFor(summary);
  const label = escapeHtml(summary.label);
  const coverage = escapeHtml(domainCoverageLabel(summary));

  return `
    <button
      class="atlas-card"
      type="button"
      data-action="open-domain"
      data-id="${domain}"
    >
      <span class="atlas-card__mark" aria-hidden="true">${domainIcon(domain)}</span>
      <span class="atlas-card__body">
        <span class="atlas-card__identity">
          <strong>${label}</strong>
          <small>${coverage}</small>
        </span>
        ${progressStrip(stats)}
      </span>
      <span class="atlas-card__chevron" aria-hidden="true">${icon('chevron')}</span>
    </button>
  `;
}

export function renderHome(ledgers: ProgressLedgers, persisting = true): string {
  return `
    <main class="page page--home page--atlas">
      <header class="topbar topbar--atlas">
        <div class="brand-block">
          <h1 class="brand-name" tabindex="-1" data-autofocus>Atlas</h1>
        </div>
      </header>

      ${persisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
        </p>
      `}

      <h2 class="atlas-eyebrow">Modes</h2>
      <div class="atlas-card-list">
        ${LEARNING_DOMAIN_IDS.map((domain) => modeCard(domain, ledgers)).join('')}
      </div>
    </main>
  `;
}
