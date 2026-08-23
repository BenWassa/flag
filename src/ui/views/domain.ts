import { CONTINENTS } from '../../data/continents.js';
import { regionLearningScopes } from '../../data/learning-scopes.js';
import { domainDisplayName } from '../../domain/display.js';
import type { LearningDomain, ScopeStats, StudyScope } from '../../domain/models.js';
import {
  buildDomainProgressSummary,
  buildProgressSummary,
  type ProgressLedgers,
  type ProgressSummary,
} from '../../domain/progress-summary.js';
import { scopeSupportsDomain } from '../../domain/scope-support.js';
import { continentIcon } from '../components/continent-icons.js';
import { domainIcon, icon } from '../components/icons.js';
import { progressStrip } from '../components/progress.js';
import { escapeHtml } from '../format.js';
import { domainCoverageLabel } from './home.js';

function statsFor(summary: ProgressSummary): ScopeStats {
  return {
    total: summary.total,
    unseen: summary.unseen,
    learning: summary.learning,
    mastered: summary.strong,
    due: summary.due,
  };
}

function shellCard(continent: { id: string; name: string }): string {
  return `
    <div class="continent-row continent-row--shell">
      <span class="continent-row__open">
        <span class="continent-row__identity">
          <strong>${escapeHtml(continent.name)}</strong>
          <small>Coming soon</small>
        </span>
        <span class="continent-row__mark" aria-hidden="true">${continentIcon(continent.id)}</span>
      </span>
    </div>
  `;
}

function continentCard(
  domain: LearningDomain,
  continent: (typeof CONTINENTS)[number],
  ledgers: ProgressLedgers,
): string {
  const scope: StudyScope = { kind: 'continent', id: continent.id, label: continent.name };
  if (!scopeSupportsDomain(scope, domain)) return shellCard(continent);

  const summary = buildProgressSummary(ledgers, scope, domain);
  if (summary.total === 0) return shellCard(continent);

  const stats = statsFor(summary);
  const regions = regionLearningScopes(continent.id).length;
  const name = escapeHtml(continent.name);
  const domainName = escapeHtml(domainDisplayName(domain).toLowerCase());

  return `
    <div class="continent-row">
      <button
        class="continent-row__open"
        type="button"
        data-action="open-scope"
        data-domain="${domain}"
        data-id="${escapeHtml(continent.id)}"
      >
        <span class="continent-row__identity">
          <strong>${name}</strong>
          <small>${summary.total} countries · ${regions} regions</small>
        </span>
        <span class="continent-row__mark" aria-hidden="true">${continentIcon(continent.id)}</span>
        <span class="continent-row__progress">${progressStrip(stats)}</span>
        <span class="continent-row__score" aria-label="${summary.strong} of ${summary.total} strong"><strong>${summary.strong}</strong><small>/${summary.total}</small></span>
        ${icon('chevron')}
      </button>
      <button
        class="continent-row__play"
        type="button"
        data-action="quick-play"
        data-domain="${domain}"
        data-id="${escapeHtml(continent.id)}"
        aria-label="Play ${name} ${domainName}"
      >${icon('play')}</button>
    </div>
  `;
}

function worldSection(ledgers: ProgressLedgers): string {
  const worldScope: StudyScope = { kind: 'world', label: 'World' };
  const summary = buildProgressSummary(ledgers, worldScope, 'flags');
  const stats = statsFor(summary);

  return `
    <section class="world-overview" aria-labelledby="world-heading">
      <div class="overview-heading">
        <div>
          <h2 id="world-heading">World</h2>
          <p>Every flag at once, or pick a continent below.</p>
        </div>
        <div class="mastery-total" aria-label="${summary.strong} of ${summary.total} flags have strong evidence">
          <strong>${summary.strong}</strong><span>/ ${summary.total}</span>
          <small>strong</small>
        </div>
      </div>
      ${progressStrip(stats)}
      <div class="primary-actions">
        <button class="button button--primary" type="button" data-action="start-test">Play world</button>
        <button class="button button--secondary" type="button" data-action="start-learn">Learn world</button>
      </div>
    </section>
  `;
}

export function renderDomainIndex(
  domain: LearningDomain,
  ledgers: ProgressLedgers,
  persisting = true,
): string {
  const title = escapeHtml(domainDisplayName(domain));
  const summary = buildDomainProgressSummary(ledgers, domain);
  const coverage = escapeHtml(domainCoverageLabel(summary));

  return `
    <main class="page page--tile-index page--domain-index" data-domain="${domain}">
      <header class="topbar topbar--detail">
        <button class="icon-button" type="button" data-action="route-parent" aria-label="Back to modes">${icon('back')}</button>
        <span class="launcher-header__icon" aria-hidden="true">${domainIcon(domain)}</span>
        <div class="screen-title">
          <h1 tabindex="-1" data-autofocus>${title}</h1>
          <span>${coverage} · ${summary.total} countries</span>
        </div>
      </header>

      ${persisting ? '' : `
        <p class="storage-notice">
          This browser is blocking storage, so today's progress will be lost when you close the tab.
        </p>
      `}

      ${domain === 'flags' ? worldSection(ledgers) : ''}

      <section class="atlas-section" aria-labelledby="continents-heading">
        <div class="list-heading">
          <h2 id="continents-heading">Continents</h2>
          <span>${CONTINENTS.length}</span>
        </div>
        <div class="continent-list">
          ${CONTINENTS.map((continent) => continentCard(domain, continent, ledgers)).join('')}
        </div>
      </section>
    </main>
  `;
}
